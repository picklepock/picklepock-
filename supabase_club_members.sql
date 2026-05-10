-- Table pour les membres des clubs
CREATE TABLE IF NOT EXISTS public.club_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
    role TEXT DEFAULT 'member' CHECK (role IN ('member', 'admin', 'manager')),
    UNIQUE(user_id, club_id)
);

-- RLS pour club_members
ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tout le monde peut voir les membres" ON public.club_members;
CREATE POLICY "Tout le monde peut voir les membres"
    ON public.club_members FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Les utilisateurs peuvent rejoindre un club" ON public.club_members;
CREATE POLICY "Les utilisateurs peuvent rejoindre un club"
    ON public.club_members FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Les utilisateurs peuvent quitter un club" ON public.club_members;
CREATE POLICY "Les utilisateurs peuvent quitter un club"
    ON public.club_members FOR DELETE
    USING (auth.uid() = user_id);

-- S'assurer que la table clubs a manager_id
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='clubs' AND column_name='manager_id') THEN
        ALTER TABLE public.clubs ADD COLUMN manager_id UUID REFERENCES auth.users(id);
    END IF;
END $$;
