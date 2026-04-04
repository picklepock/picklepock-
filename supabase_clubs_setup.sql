-- ============================================================
-- PICKLEPOCK - Setup Tables Clubs & Club Requests
-- Coller et executer dans l'editeur SQL de Supabase
-- ============================================================

-- 1. Table principale des clubs (approuves par admin)
CREATE TABLE IF NOT EXISTS public.clubs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    address TEXT,
    city TEXT,
    country TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    logo_url TEXT,
    cover_url TEXT,
    courts_count INTEGER DEFAULT 0,
    website TEXT,
    contact_email TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    approved_by UUID REFERENCES auth.users(id)
);

-- 2. Table des demandes d'enregistrement de club
CREATE TABLE IF NOT EXISTS public.club_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    club_name TEXT NOT NULL,
    club_description TEXT,
    contact_email TEXT NOT NULL,
    address TEXT,
    city TEXT,
    country TEXT,
    website TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_note TEXT
);

-- ============================================================
-- RLS POLICIES - Securite
-- ============================================================

-- Clubs: tout le monde peut lire les clubs actifs
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clubs visibles par tous"
    ON public.clubs FOR SELECT
    USING (is_active = TRUE);

CREATE POLICY "Seuls les admins peuvent inserer des clubs"
    ON public.clubs FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

CREATE POLICY "Seuls les admins peuvent modifier des clubs"
    ON public.clubs FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

CREATE POLICY "Seuls les admins peuvent supprimer des clubs"
    ON public.clubs FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- Club Requests: les utilisateurs peuvent soumettre et voir leurs propres demandes
ALTER TABLE public.club_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs peuvent creer une demande"
    ON public.club_requests FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Les utilisateurs voient leurs propres demandes"
    ON public.club_requests FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Les admins voient toutes les demandes"
    ON public.club_requests FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

CREATE POLICY "Les admins peuvent modifier le statut des demandes"
    ON public.club_requests FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );
