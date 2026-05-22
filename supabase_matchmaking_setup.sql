-- ============================================================
-- PICKLEPOCK - EXTENSION MATCHMAKING, CHAT & NOTIFICATIONS
-- Exécutez ce script dans Supabase > SQL Editor
-- ============================================================

-- 1. EXTENSIONS SUR LA TABLE matches
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT FALSE;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS score_team_a INTEGER;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS score_team_b INTEGER;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS score_reporter_id UUID REFERENCES public.profiles(id);
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS score_status TEXT CHECK (score_status IN ('pending', 'validated', 'rejected'));

-- Remplacer ou ajouter la contrainte check sur le statut des matchs
ALTER TABLE public.matches DROP CONSTRAINT IF EXISTS matches_status_check;
ALTER TABLE public.matches ADD CONSTRAINT matches_status_check CHECK (status IN ('open', 'full', 'played', 'validated'));


-- 2. TABLE DES PARTICIPANTS AUX MATCHS
CREATE TABLE IF NOT EXISTS public.match_participants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed')),
    team TEXT CHECK (team IN ('A', 'B')),
    UNIQUE(match_id, user_id)
);

-- RLS pour match_participants
ALTER TABLE public.match_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Visibilité publique des participants" ON public.match_participants;
CREATE POLICY "Visibilité publique des participants" ON public.match_participants
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Inscription par l'utilisateur connecté" ON public.match_participants;
CREATE POLICY "Inscription par l'utilisateur connecté" ON public.match_participants
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Désinscription par l'utilisateur connecté" ON public.match_participants;
CREATE POLICY "Désinscription par l'utilisateur connecté" ON public.match_participants
    FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Modération par le créateur du match" ON public.match_participants;
CREATE POLICY "Modération par le créateur du match" ON public.match_participants
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.matches
            WHERE matches.id = match_participants.match_id
            AND matches.creator_id = auth.uid()
        )
    );


-- 3. TABLE DES MESSAGES DE CHAT DE MATCH
CREATE TABLE IF NOT EXISTS public.match_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL
);

-- RLS pour match_messages
ALTER TABLE public.match_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lecture des messages pour les participants" ON public.match_messages;
CREATE POLICY "Lecture des messages pour les participants" ON public.match_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.match_participants
            WHERE match_participants.match_id = match_messages.match_id
            AND match_participants.user_id = auth.uid()
            AND match_participants.status = 'confirmed'
        )
    );

DROP POLICY IF EXISTS "Envoi de messages pour les participants" ON public.match_messages;
CREATE POLICY "Envoi de messages pour les participants" ON public.match_messages
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        AND (
            EXISTS (
                SELECT 1 FROM public.match_participants
                WHERE match_participants.match_id = match_messages.match_id
                AND match_participants.user_id = auth.uid()
                AND match_participants.status = 'confirmed'
            )
        )
    );


-- 4. TABLE DES NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT FALSE NOT NULL
);

-- RLS pour notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lecture de ses propres notifications" ON public.notifications;
CREATE POLICY "Lecture de ses propres notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Création de notifications" ON public.notifications;
CREATE POLICY "Création de notifications" ON public.notifications
    FOR INSERT WITH CHECK (auth.uid() = actor_id OR auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Mise à jour de ses propres notifications" ON public.notifications;
CREATE POLICY "Mise à jour de ses propres notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);


-- 5. TRIGGER POUR INSERER LE CREATEUR COMME PARTICIPANT CONFIRME
CREATE OR REPLACE FUNCTION public.on_match_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.match_participants (match_id, user_id, status, team)
    VALUES (NEW.id, NEW.creator_id, 'confirmed', 'A')
    ON CONFLICT (match_id, user_id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS match_created_trigger ON public.matches;
CREATE TRIGGER match_created_trigger
    AFTER INSERT ON public.matches
    FOR EACH ROW
    EXECUTE FUNCTION public.on_match_created();

-- Rétrocompatibilité : ajouter le créateur pour tous les matchs existants
INSERT INTO public.match_participants (match_id, user_id, status, team)
SELECT id, creator_id, 'confirmed', 'A'
FROM public.matches
ON CONFLICT (match_id, user_id) DO NOTHING;


-- 6. RPC : REPORT MATCH SCORE
CREATE OR REPLACE FUNCTION public.report_match_score(
    match_uuid UUID,
    reporter_uuid UUID,
    score_a INT,
    score_b INT,
    team_a_players UUID[],
    team_b_players UUID[]
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    player_id UUID;
    m_creator_id UUID;
    p_username TEXT;
BEGIN
    -- 1. Récupérer les détails du match
    SELECT creator_id INTO m_creator_id
    FROM public.matches WHERE id = match_uuid;

    -- 2. Vérifier que le reporter est bien participant
    IF NOT EXISTS (
        SELECT 1 FROM public.match_participants 
        WHERE match_id = match_uuid AND user_id = reporter_uuid AND status = 'confirmed'
    ) THEN
        RAISE EXCEPTION 'Vous devez être participant confirmé de ce match pour saisir le score.';
    END IF;

    -- 3. Mettre à jour le match
    UPDATE public.matches
    SET 
        score_team_a = score_a,
        score_team_b = score_b,
        score_reporter_id = reporter_uuid,
        score_status = 'pending',
        status = 'played'
    WHERE id = match_uuid;

    -- 4. Assigner les équipes pour la Team A
    FOREACH player_id IN ARRAY team_a_players LOOP
        UPDATE public.match_participants
        SET team = 'A'
        WHERE match_id = match_uuid AND user_id = player_id;
    END LOOP;

    -- 5. Assigner les équipes pour la Team B
    FOREACH player_id IN ARRAY team_b_players LOOP
        UPDATE public.match_participants
        SET team = 'B'
        WHERE match_id = match_uuid AND user_id = player_id;
    END LOOP;

    -- 6. Créer les notifications pour les AUTRES joueurs du match
    SELECT username INTO p_username FROM public.profiles WHERE id = reporter_uuid;
    
    INSERT INTO public.notifications (user_id, type, title, content, match_id, actor_id)
    SELECT 
        user_id,
        'score_validation',
        'Score à valider 🎾',
        p_username || ' a saisi un score de ' || score_a || '-' || score_b || '. Veuillez le valider.',
        match_uuid,
        reporter_uuid
    FROM public.match_participants
    WHERE match_id = match_uuid 
      AND user_id != reporter_uuid 
      AND status = 'confirmed';
END;
$$;


-- 7. RPC : VALIDATE MATCH SCORE
CREATE OR REPLACE FUNCTION public.validate_match_score(
    match_uuid UUID,
    validator_uuid UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    m_score_team_a INT;
    m_score_team_b INT;
    m_score_reporter_id UUID;
    p_record RECORD;
    winner_team TEXT;
    points_to_add INT;
    is_win BOOLEAN;
    v_username TEXT;
BEGIN
    -- 1. Récupérer les détails du match
    SELECT score_team_a, score_team_b, score_reporter_id 
    INTO m_score_team_a, m_score_team_b, m_score_reporter_id
    FROM public.matches 
    WHERE id = match_uuid AND score_status = 'pending';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Match non trouvé ou score non en attente de validation.';
    END IF;

    -- 2. Vérifier que le validateur est participant et n'est pas le reporter
    IF NOT EXISTS (
        SELECT 1 FROM public.match_participants 
        WHERE match_id = match_uuid AND user_id = validator_uuid AND status = 'confirmed'
    ) THEN
        RAISE EXCEPTION 'Vous devez être participant de ce match pour le valider.';
    END IF;

    IF validator_uuid = m_score_reporter_id THEN
        RAISE EXCEPTION 'Le reporter du score ne peut pas être le validateur.';
    END IF;

    -- 3. Mettre à jour le match
    UPDATE public.matches
    SET 
        score_status = 'validated',
        status = 'validated'
    WHERE id = match_uuid;

    -- 4. Déterminer l'équipe gagnante
    IF m_score_team_a > m_score_team_b THEN
        winner_team := 'A';
    ELSIF m_score_team_b > m_score_team_a THEN
        winner_team := 'B';
    ELSE
        winner_team := 'draw';
    END IF;

    -- 5. Mettre à jour les profils de tous les participants du match
    FOR p_record IN 
        SELECT user_id, team 
        FROM public.match_participants 
        WHERE match_id = match_uuid AND status = 'confirmed'
    LOOP
        IF p_record.team = 'A' THEN
            points_to_add := m_score_team_a;
            is_win := (winner_team = 'A');
        ELSIF p_record.team = 'B' THEN
            points_to_add := m_score_team_b;
            is_win := (winner_team = 'B');
        ELSE
            points_to_add := 0;
            is_win := FALSE;
        END IF;

        UPDATE public.profiles
        SET 
            matches_played = COALESCE(matches_played, 0) + 1,
            wins = COALESCE(wins, 0) + CASE WHEN is_win THEN 1 ELSE 0 END,
            points = COALESCE(points, 0) + points_to_add
        WHERE id = p_record.user_id;
    END LOOP;

    -- 6. Créer les notifications de validation
    SELECT username INTO v_username FROM public.profiles WHERE id = validator_uuid;

    INSERT INTO public.notifications (user_id, type, title, content, match_id, actor_id)
    SELECT 
        user_id,
        'score_validated',
        'Score validé ! 🏆',
        'Le score du match (' || m_score_team_a || '-' || m_score_team_b || ') a été validé par ' || v_username || '.',
        match_uuid,
        validator_uuid
    FROM public.match_participants
    WHERE match_id = match_uuid AND status = 'confirmed';
END;
$$;


-- 8. RPC : REJECT MATCH SCORE
CREATE OR REPLACE FUNCTION public.reject_match_score(
    match_uuid UUID,
    rejecter_uuid UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    m_score_reporter_id UUID;
    m_score_team_a INT;
    m_score_team_b INT;
    r_username TEXT;
BEGIN
    SELECT score_reporter_id, score_team_a, score_team_b INTO m_score_reporter_id, m_score_team_a, m_score_team_b
    FROM public.matches WHERE id = match_uuid AND score_status = 'pending';

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Match non trouvé ou score non en attente de validation.';
    END IF;

    -- Vérifier que celui qui rejette est participant et n'est pas le reporter
    IF NOT EXISTS (
        SELECT 1 FROM public.match_participants 
        WHERE match_id = match_uuid AND user_id = rejecter_uuid AND status = 'confirmed'
    ) THEN
        RAISE EXCEPTION 'Vous devez être participant de ce match pour contester le score.';
    END IF;

    IF rejecter_uuid = m_score_reporter_id THEN
        RAISE EXCEPTION 'Le reporter du score ne peut pas rejeter son propre score.';
    END IF;

    -- Mettre à jour le match
    UPDATE public.matches
    SET 
        score_status = 'rejected',
        status = 'open' -- repasse en open pour pouvoir modifier
    WHERE id = match_uuid;

    SELECT username INTO r_username FROM public.profiles WHERE id = rejecter_uuid;

    -- Notifier le reporter
    INSERT INTO public.notifications (user_id, type, title, content, match_id, actor_id)
    VALUES (
        m_score_reporter_id,
        'score_rejected',
        'Score contesté ⚠️',
        r_username || ' a rejeté le score de ' || m_score_team_a || '-' || m_score_team_b || '. Veuillez ressaisir le score.',
        match_uuid,
        rejecter_uuid
    );
END;
$$;
