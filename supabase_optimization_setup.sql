-- ============================================================
-- PICKLEPOCK - PERFORMANCE DATABASE & CLEANUP OPTIMIZATIONS
-- Exécutez ce script dans Supabase > SQL Editor
-- ============================================================

-- 1. INDEXATION INTELLIGENTE (Indexations B-Tree)
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender_id ON public.direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_receiver_id ON public.direct_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_followers_follower_id ON public.profiles_followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_followers_following_id ON public.profiles_followers(following_id);
CREATE INDEX IF NOT EXISTS idx_player_posts_author_id ON public.player_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_actor_id ON public.notifications(actor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- 2. AJUSTEMENTS DES TYPES DE DONNÉES ULTRA-COMPACTES
-- Limitation à 280 caractères pour les publications (sécurise le stockage)
ALTER TABLE public.player_posts ALTER COLUMN content TYPE VARCHAR(280);

-- Limitation à 500 caractères pour les messages privés
ALTER TABLE public.direct_messages ALTER COLUMN message TYPE VARCHAR(500);

-- 3. ROBOT DE NETTOYAGE CRON DES NOTIFICATIONS
-- Planification du nettoyage quotidien à 1h du matin
-- Supprime les notifications de plus de 14 jours, OU les notifications lues de plus de 3 jours
DO $$
BEGIN
    PERFORM cron.unschedule('delete-old-notifications');
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END;
$$;

SELECT cron.schedule(
    'delete-old-notifications',
    '0 1 * * *', -- Tous les jours à 01:00 AM
    $$ DELETE FROM public.notifications 
       WHERE created_at < NOW() - INTERVAL '14 days' 
          OR (is_read = TRUE AND created_at < NOW() - INTERVAL '3 days') $$
);
