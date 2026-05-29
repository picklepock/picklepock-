-- ============================================================
-- PICKLEPOCK - SOCIAL FEATURES (FOLLOWERS & TEXT POSTS)
-- Exécutez ce script dans Supabase > SQL Editor
-- ============================================================

-- 1. TABLE: profiles_followers
CREATE TABLE IF NOT EXISTS public.profiles_followers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_follower_following UNIQUE (follower_id, following_id),
    CONSTRAINT cannot_follow_self CHECK (follower_id <> following_id)
);

-- Index pour accélérer la recherche des abonnés
CREATE INDEX IF NOT EXISTS idx_followers_following_id ON public.profiles_followers(following_id);
CREATE INDEX IF NOT EXISTS idx_followers_follower_id ON public.profiles_followers(follower_id);

-- RLS pour profiles_followers
ALTER TABLE public.profiles_followers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Visibilité publique des abonnements" ON public.profiles_followers;
CREATE POLICY "Visibilité publique des abonnements" ON public.profiles_followers
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "S'abonner soi-même" ON public.profiles_followers;
CREATE POLICY "S'abonner soi-même" ON public.profiles_followers
    FOR INSERT WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Se désabonner soi-même" ON public.profiles_followers;
CREATE POLICY "Se désabonner soi-même" ON public.profiles_followers
    FOR DELETE USING (auth.uid() = follower_id);


-- 2. TABLE: player_posts
CREATE TABLE IF NOT EXISTS public.player_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    is_channel BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index pour accélérer la recherche par auteur
CREATE INDEX IF NOT EXISTS idx_player_posts_author_id ON public.player_posts(author_id);

-- RLS pour player_posts
ALTER TABLE public.player_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Visibilité publique des publications" ON public.player_posts;
CREATE POLICY "Visibilité publique des publications" ON public.player_posts
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Créer ses propres publications" ON public.player_posts;
CREATE POLICY "Créer ses propres publications" ON public.player_posts
    FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Supprimer ses propres publications" ON public.player_posts;
CREATE POLICY "Supprimer ses propres publications" ON public.player_posts
    FOR DELETE USING (auth.uid() = author_id);
