-- ============================================================
-- PICKLEPOCK - SOCIAL V2 (NOTIFICATIONS, REACTIONS & CHAT)
-- Exécutez ce script dans Supabase > SQL Editor
-- ============================================================

-- 1. EXTENSIONS SUR LA TABLE notifications EXISTANTE
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS post_id UUID REFERENCES public.player_posts(id) ON DELETE CASCADE;

-- 2. EXTENSIONS SUR LA TABLE player_posts EXISTANTE
ALTER TABLE public.player_posts ADD COLUMN IF NOT EXISTS reactions JSONB DEFAULT '{}'::jsonb;

-- 3. TRIGGER : NOTIFICATION DES ABONNES LORS D'UN POST
CREATE OR REPLACE FUNCTION public.notify_followers_on_post()
RETURNS TRIGGER AS $$
DECLARE
    follower_record RECORD;
    author_username TEXT;
BEGIN
    -- Récupérer le pseudo de l'auteur
    SELECT username INTO author_username FROM public.profiles WHERE id = NEW.author_id;
    IF author_username IS NULL THEN
        author_username := 'Un joueur';
    END IF;

    -- Parcourir tous les abonnés de l'auteur
    FOR follower_record IN 
        SELECT follower_id FROM public.profiles_followers WHERE following_id = NEW.author_id
    Loop
        INSERT INTO public.notifications (user_id, type, title, content, actor_id, post_id, is_read)
        VALUES (
            follower_record.follower_id,
            'new_post',
            'Nouvelle publication',
            author_username || ' a publié : "' || LEFT(NEW.content, 50) || (CASE WHEN LENGTH(NEW.content) > 50 THEN '...' ELSE '' END) || '"',
            NEW.author_id,
            NEW.id,
            FALSE
        );
    END Loop;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS post_created_trigger ON public.player_posts;
CREATE TRIGGER post_created_trigger
    AFTER INSERT ON public.player_posts
    FOR EACH ROW
    EXECUTE FUNCTION public.notify_followers_on_post();


-- 4. MESSAGERIE PRIVÉE ÉPHÉMÈRE
CREATE TABLE IF NOT EXISTS public.direct_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    message VARCHAR(500) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index pour optimiser les performances des requêtes de messagerie privée
CREATE INDEX IF NOT EXISTS idx_direct_messages_users ON public.direct_messages(sender_id, receiver_id);

-- RLS pour direct_messages
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lecture des messages pour expediteur et destinataire" ON public.direct_messages;
CREATE POLICY "Lecture des messages pour expediteur et destinataire" ON public.direct_messages
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "Envoi de messages pour expediteur" ON public.direct_messages;
CREATE POLICY "Envoi de messages pour expediteur" ON public.direct_messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);


-- 5. ROBOT DE NETTOYAGE CRON (Détruit les messages de plus de 7 jours)
-- Activation de l'extension pg_cron (nécessaire sur Supabase)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Planification du nettoyage quotidien à minuit
-- (Nous ignorons l'erreur si la tâche n'existe pas encore lors du unschedule)
DO $$
BEGIN
    PERFORM cron.unschedule('delete-old-direct-messages');
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END;
$$;

SELECT cron.schedule(
    'delete-old-direct-messages',
    '0 0 * * *', -- Tous les jours à minuit
    $$ DELETE FROM public.direct_messages WHERE created_at < NOW() - INTERVAL '7 days' $$
);
