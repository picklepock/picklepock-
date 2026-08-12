-- PICKLEPOCK — durcissement de sécurité (à exécuter UNE fois dans Supabase SQL Editor)
-- Prérequis : les scripts de création existants ont déjà été exécutés.
-- Ce fichier modifie les droits de manière intentionnelle : tester d'abord sur un projet Supabase de préproduction.

BEGIN;

-- 1. Un compte ne peut plus s'accorder les droits administrateur ni modifier son classement.
-- Les RPC SECURITY DEFINER de matchmaking conservent les droits nécessaires côté serveur.
REVOKE INSERT, UPDATE ON public.profiles FROM anon, authenticated;
GRANT INSERT (id, username, level, gender, region, bio, avatar_url, country, updated_at)
    ON public.profiles TO authenticated;
GRANT UPDATE (username, level, gender, region, bio, avatar_url, country, updated_at)
    ON public.profiles TO authenticated;

-- 2. Les champs de score ne sont plus modifiables directement depuis le navigateur.
REVOKE UPDATE ON public.matches FROM anon, authenticated;
GRANT UPDATE (status) ON public.matches TO authenticated;

DROP POLICY IF EXISTS "Createur ou admin modifie le match" ON public.matches;
CREATE POLICY "Createur gere seulement l ouverture de son match"
    ON public.matches FOR UPDATE
    USING (auth.uid() = creator_id)
    WITH CHECK (auth.uid() = creator_id AND status IN ('open', 'full'));

-- 3. Inscription aux matchs : identité, état et équipe sont vérifiés côté base.
DROP POLICY IF EXISTS "Inscription par l'utilisateur connecté" ON public.match_participants;
CREATE POLICY "Inscription securisee au match" ON public.match_participants
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM public.matches m
            WHERE m.id = match_participants.match_id
              AND m.status = 'open'
              AND (
                (m.creator_id = auth.uid() AND match_participants.status = 'confirmed' AND match_participants.team = 'A')
                OR (m.creator_id <> auth.uid() AND m.requires_approval = TRUE AND match_participants.status = 'pending' AND match_participants.team IS NULL)
                OR (m.creator_id <> auth.uid() AND m.requires_approval = FALSE AND match_participants.status = 'confirmed'
                    AND ((m.type = 'Simple' AND match_participants.team = 'B') OR (m.type <> 'Simple' AND match_participants.team IS NULL)))
              )
        )
    );

-- 4. Les rôles de club sont attribués par un administrateur ; un membre ne peut rejoindre
-- qu'avec le rôle le moins privilégié.
DROP POLICY IF EXISTS "Les utilisateurs peuvent rejoindre un club" ON public.club_members;
CREATE POLICY "Adhesion club securisee" ON public.club_members
    FOR INSERT WITH CHECK (
        (auth.uid() = user_id AND role = 'member')
        OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = TRUE)
    );

-- 5. Un membre peut créer une réservation en attente uniquement. Le paiement confirmé
-- doit venir d'un webhook de paiement ou d'un espace gérant protégé, jamais du client.
DROP POLICY IF EXISTS "Les utilisateurs peuvent créer des réservations" ON public.bookings;
CREATE POLICY "Creation de reservation en attente" ON public.bookings
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        AND status = 'pending'
        AND payment_status = 'pending'
        AND start_time > NOW()
        AND end_time > start_time
        AND total_price >= 0
    );

-- 6. Publications : aucun utilisateur ne peut publier dans un canal privilégié.
DROP POLICY IF EXISTS "Créer ses propres publications" ON public.player_posts;
CREATE POLICY "Creer ses publications ordinaires" ON public.player_posts
    FOR INSERT WITH CHECK (auth.uid() = author_id AND is_channel = FALSE);

-- 7. Notifications : pas d'envoi arbitraire à d'autres comptes.
DROP POLICY IF EXISTS "Création de notifications" ON public.notifications;
CREATE POLICY "Creation de notifications liee a un match" ON public.notifications
    FOR INSERT WITH CHECK (
        auth.uid() = actor_id
        AND (
            (
                type IN ('join_request', 'join_confirmed')
                AND EXISTS (SELECT 1 FROM public.matches m WHERE m.id = notifications.match_id AND m.creator_id = notifications.user_id)
                AND EXISTS (SELECT 1 FROM public.match_participants p WHERE p.match_id = notifications.match_id AND p.user_id = auth.uid())
            )
            OR (type = 'leave_match' AND EXISTS (SELECT 1 FROM public.matches m WHERE m.id = notifications.match_id AND m.creator_id = notifications.user_id))
            OR (type IN ('request_approved', 'request_rejected') AND EXISTS (SELECT 1 FROM public.matches m WHERE m.id = notifications.match_id AND m.creator_id = auth.uid()))
        )
    );

-- 8. Storage public, mais écriture cantonnée au dossier de son propriétaire et aux vraies images.
UPDATE storage.buckets
SET public = TRUE,
    file_size_limit = 3145728,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE id IN ('avatars', 'clubs', 'club_images');

DROP POLICY IF EXISTS "avatars_write_own_folder" ON storage.objects;
CREATE POLICY "avatars_write_own_folder" ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "avatars_update_own_folder" ON storage.objects;
CREATE POLICY "avatars_update_own_folder" ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text)
    WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "avatars_delete_own_folder" ON storage.objects;
CREATE POLICY "avatars_delete_own_folder" ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "club_requests_write_own_folder" ON storage.objects;
CREATE POLICY "club_requests_write_own_folder" ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'clubs' AND (storage.foldername(name))[1] = 'requests' AND (storage.foldername(name))[2] = auth.uid()::text);

COMMIT;

-- Contrôle à exécuter ensuite : il doit retourner rowsecurity = true pour chaque table applicative.
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
