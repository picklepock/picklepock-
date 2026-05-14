-- ============================================================
-- PICKLEPOCK - SÉCURISATION COMPLÈTE RLS
-- Exécutez ce script dans Supabase > SQL Editor
-- ============================================================

-- ============================================================
-- 1. TABLE: profiles
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut VOIR les profils (classement, membres club, etc.)
DROP POLICY IF EXISTS "Profils visibles par tous" ON public.profiles;
CREATE POLICY "Profils visibles par tous"
    ON public.profiles FOR SELECT
    USING (true);

-- Un utilisateur ne peut modifier que SON propre profil
DROP POLICY IF EXISTS "Utilisateur modifie son propre profil" ON public.profiles;
CREATE POLICY "Utilisateur modifie son propre profil"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Un utilisateur ne peut créer que SON propre profil
DROP POLICY IF EXISTS "Utilisateur cree son propre profil" ON public.profiles;
CREATE POLICY "Utilisateur cree son propre profil"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Personne ne peut supprimer un profil (sauf via cascade auth)
DROP POLICY IF EXISTS "Suppression de profil interdite" ON public.profiles;
CREATE POLICY "Suppression de profil interdite"
    ON public.profiles FOR DELETE
    USING (false);


-- ============================================================
-- 2. TABLE: matches
-- ============================================================
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut voir les matchs (page Circuit)
DROP POLICY IF EXISTS "Matchs visibles par tous" ON public.matches;
CREATE POLICY "Matchs visibles par tous"
    ON public.matches FOR SELECT
    USING (true);

-- Seul un utilisateur connecté peut créer un match (en son nom)
DROP POLICY IF EXISTS "Utilisateur cree ses propres matchs" ON public.matches;
CREATE POLICY "Utilisateur cree ses propres matchs"
    ON public.matches FOR INSERT
    WITH CHECK (auth.uid() = creator_id);

-- Le créateur peut modifier son match OU un admin
DROP POLICY IF EXISTS "Createur ou admin modifie le match" ON public.matches;
CREATE POLICY "Createur ou admin modifie le match"
    ON public.matches FOR UPDATE
    USING (
        auth.uid() = creator_id
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- Le créateur peut supprimer son match OU un admin
DROP POLICY IF EXISTS "Createur ou admin supprime le match" ON public.matches;
CREATE POLICY "Createur ou admin supprime le match"
    ON public.matches FOR DELETE
    USING (
        auth.uid() = creator_id
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );


-- ============================================================
-- 3. TABLE: support_messages (CRITIQUE - données sensibles)
-- ============================================================
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- Un utilisateur voit SES propres messages, un admin voit TOUT
DROP POLICY IF EXISTS "Utilisateur voit ses messages ou admin voit tout" ON public.support_messages;
CREATE POLICY "Utilisateur voit ses messages ou admin voit tout"
    ON public.support_messages FOR SELECT
    USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- Un utilisateur peut créer un message en son nom
DROP POLICY IF EXISTS "Utilisateur cree ses messages" ON public.support_messages;
CREATE POLICY "Utilisateur cree ses messages"
    ON public.support_messages FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Seul un admin peut modifier le statut d'un message
DROP POLICY IF EXISTS "Admin modifie les messages" ON public.support_messages;
CREATE POLICY "Admin modifie les messages"
    ON public.support_messages FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- Seul un admin peut supprimer un message
DROP POLICY IF EXISTS "Admin supprime les messages" ON public.support_messages;
CREATE POLICY "Admin supprime les messages"
    ON public.support_messages FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );


-- ============================================================
-- 4. TABLE: support_replies (CRITIQUE)
-- ============================================================
ALTER TABLE public.support_replies ENABLE ROW LEVEL SECURITY;

-- L'utilisateur du ticket OU un admin peut voir les réponses
DROP POLICY IF EXISTS "Voir les reponses de ses tickets ou admin" ON public.support_replies;
CREATE POLICY "Voir les reponses de ses tickets ou admin"
    ON public.support_replies FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.support_messages
            WHERE support_messages.id = support_replies.message_id
            AND support_messages.user_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- Seul un admin peut répondre
DROP POLICY IF EXISTS "Admin cree les reponses" ON public.support_replies;
CREATE POLICY "Admin cree les reponses"
    ON public.support_replies FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- Seul un admin peut supprimer une réponse
DROP POLICY IF EXISTS "Admin supprime les reponses" ON public.support_replies;
CREATE POLICY "Admin supprime les reponses"
    ON public.support_replies FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );


-- ============================================================
-- 5. TABLE: reports (CRITIQUE - signalements privés)
-- ============================================================
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Seul un admin peut voir les signalements
DROP POLICY IF EXISTS "Admin voit les rapports" ON public.reports;
CREATE POLICY "Admin voit les rapports"
    ON public.reports FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- Un utilisateur connecté peut créer un signalement
DROP POLICY IF EXISTS "Utilisateur cree un signalement" ON public.reports;
CREATE POLICY "Utilisateur cree un signalement"
    ON public.reports FOR INSERT
    WITH CHECK (auth.uid() = reporter_id);

-- Seul un admin peut modifier/supprimer
DROP POLICY IF EXISTS "Admin modifie les rapports" ON public.reports;
CREATE POLICY "Admin modifie les rapports"
    ON public.reports FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

DROP POLICY IF EXISTS "Admin supprime les rapports" ON public.reports;
CREATE POLICY "Admin supprime les rapports"
    ON public.reports FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );


-- ============================================================
-- 6. TABLE: club_photos
-- ============================================================
ALTER TABLE public.club_photos ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut voir les photos des clubs
DROP POLICY IF EXISTS "Photos visibles par tous" ON public.club_photos;
CREATE POLICY "Photos visibles par tous"
    ON public.club_photos FOR SELECT
    USING (true);

-- Seul un admin peut ajouter/modifier/supprimer des photos
DROP POLICY IF EXISTS "Admin gere les photos" ON public.club_photos;
CREATE POLICY "Admin gere les photos"
    ON public.club_photos FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

DROP POLICY IF EXISTS "Admin modifie les photos" ON public.club_photos;
CREATE POLICY "Admin modifie les photos"
    ON public.club_photos FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

DROP POLICY IF EXISTS "Admin supprime les photos" ON public.club_photos;
CREATE POLICY "Admin supprime les photos"
    ON public.club_photos FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );


-- ============================================================
-- VÉRIFICATION FINALE
-- Exécutez cette requête pour confirmer que RLS est activé partout
-- ============================================================
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Si "rowsecurity" = true pour TOUTES vos tables, vous êtes sécurisé ✅
