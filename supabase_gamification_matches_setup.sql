-- ============================================================
-- PICKLEPOCK - GAMIFICATION, SCORE VALIDATION & FAIR-PLAY SETUP
-- Exécutez ce script dans Supabase > SQL Editor
-- ============================================================

-- 1. EXTENSIONS SUR LA TABLE PROFILES (XP, Niveaux, Fair-Play)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1 NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS fair_play_score NUMERIC(5,2) DEFAULT 100.00 NOT NULL; -- de 0.00 à 100.00%
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS matches_played INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS matches_won INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS win_streak INTEGER DEFAULT 0 NOT NULL;

-- 2. EXTENSIONS SUR LA TABLE MATCHES (Statuts & Validation)
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS score_team_a INTEGER;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS score_team_b INTEGER;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS winner_team TEXT CHECK (winner_team IN ('A', 'B', 'draw'));
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS score_submitted_by UUID REFERENCES public.profiles(id);
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS score_submitted_at TIMESTAMPTZ;
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS auto_validation_at TIMESTAMPTZ;

-- Mettre à jour la contrainte de statut si nécessaire
ALTER TABLE public.matches DROP CONSTRAINT IF EXISTS matches_status_check;
ALTER TABLE public.matches ADD CONSTRAINT matches_status_check 
    CHECK (status IN ('open', 'full', 'scheduled', 'pending_validation', 'validated', 'disputed', 'cancelled'));

-- 3. TABLE DES CONFIRMATIONS DE SCORE PAR PARTICIPANT
CREATE TABLE IF NOT EXISTS public.match_confirmations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    match_id BIGINT REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'disputed')),
    dispute_reason TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(match_id, user_id)
);

ALTER TABLE public.match_confirmations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lecture des confirmations par tous" ON public.match_confirmations;
CREATE POLICY "Lecture des confirmations par tous" ON public.match_confirmations
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Modification confirmation par le joueur concerné" ON public.match_confirmations;
CREATE POLICY "Modification confirmation par le joueur concerné" ON public.match_confirmations
    FOR ALL USING (auth.uid() = user_id);

-- 4. TABLE HISTORIQUE D'XP (Pour l'anti-spam & plafonds)
CREATE TABLE IF NOT EXISTS public.xp_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    match_id BIGINT REFERENCES public.matches(id) ON DELETE CASCADE,
    xp_amount INTEGER NOT NULL,
    reason TEXT NOT NULL
);

ALTER TABLE public.xp_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lecture de son propre historique XP" ON public.xp_history;
CREATE POLICY "Lecture de son propre historique XP" ON public.xp_history
    FOR SELECT USING (auth.uid() = user_id);

-- 5. FONCTION DU CALCUL DE NIVEAU EN FONCTION DE L'XP
-- Formule : Niveau 1 = 0 XP, chaque niveau requiert (niveau * 200) XP
CREATE OR REPLACE FUNCTION public.calculate_level(p_xp INTEGER) 
RETURNS INTEGER AS $$
DECLARE
    v_level INTEGER := 1;
    v_req_xp INTEGER := 0;
BEGIN
    WHILE p_xp >= v_req_xp LOOP
        v_level := v_level + 1;
        v_req_xp := v_req_xp + (v_level * 200);
    END LOOP;
    RETURN GREATEST(1, v_level - 1);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 6. FONCTION DE SOUMISSION DE SCORE (Par le gagnant ou perdant)
CREATE OR REPLACE FUNCTION public.submit_match_score(
    p_match_id BIGINT,
    p_score_team_a INTEGER,
    p_score_team_b INTEGER
)
RETURNS VOID AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_winner_team TEXT;
    v_auto_val_time TIMESTAMPTZ := NOW() + INTERVAL '24 hours';
BEGIN
    -- Déterminer l'équipe gagnante
    IF p_score_team_a > p_score_team_b THEN
        v_winner_team := 'A';
    ELSIF p_score_team_b > p_score_team_a THEN
        v_winner_team := 'B';
    ELSE
        v_winner_team := 'draw';
    END IF;

    -- Mettre à jour le match
    UPDATE public.matches
    SET score_team_a = p_score_team_a,
        score_team_b = p_score_team_b,
        winner_team = v_winner_team,
        score_submitted_by = v_user_id,
        score_submitted_at = NOW(),
        auto_validation_at = v_auto_val_time,
        status = 'pending_validation'
    WHERE id = p_match_id;

    -- Réinitialiser/Créer les demandes de confirmation pour tous les participants
    DELETE FROM public.match_confirmations WHERE match_id = p_match_id;
    
    INSERT INTO public.match_confirmations (match_id, user_id, status)
    SELECT p_match_id, mp.user_id, 
           CASE WHEN mp.user_id = v_user_id THEN 'confirmed' ELSE 'pending' END
    FROM public.match_participants mp
    WHERE mp.match_id = p_match_id AND mp.status = 'confirmed';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. FONCTION DE VALIDATION DÉFINITIVE & ATTRIBUTION D'XP
CREATE OR REPLACE FUNCTION public.process_match_validation(p_match_id BIGINT)
RETURNS VOID AS $$
DECLARE
    r_match RECORD;
    r_part RECORD;
    v_xp_to_add INTEGER;
    v_today_xp INTEGER;
    v_same_opponent_count INTEGER;
    v_is_winner BOOLEAN;
    v_user_team TEXT;
    v_daily_cap INTEGER := 400; -- Plafond max XP par jour
    v_new_xp INTEGER;
    v_new_level INTEGER;
BEGIN
    -- Récupérer le match
    SELECT * INTO r_match FROM public.matches WHERE id = p_match_id;
    IF r_match.status = 'validated' THEN
        RETURN; -- Déjà validé
    END IF;

    -- Passer le statut du match en validé
    UPDATE public.matches SET status = 'validated' WHERE id = p_match_id;

    -- Pour chaque participant confirmé au match
    FOR r_part IN SELECT * FROM public.match_participants WHERE match_id = p_match_id AND status = 'confirmed' LOOP
        v_user_team := r_part.team;
        v_is_winner := (r_match.winner_team = v_user_team);

        -- XP de base : 50 pour participation, +50 bonus si victoire
        IF v_is_winner THEN
            v_xp_to_add := 100;
        ELSE
            v_xp_to_add := 50;
        END IF;

        -- Vérification anti-spam 1 : Cap d'XP quotidien (Max 400 XP par jour)
        SELECT COALESCE(SUM(xp_amount), 0) INTO v_today_xp
        FROM public.xp_history
        WHERE user_id = r_part.user_id AND created_at >= CURRENT_DATE;

        IF (v_today_xp + v_xp_to_add) > v_daily_cap THEN
            v_xp_to_add := GREATEST(0, v_daily_cap - v_today_xp);
        END IF;

        -- Si XP attribuable > 0, enregistrer et mettre à jour le profil
        IF v_xp_to_add > 0 THEN
            INSERT INTO public.xp_history (user_id, match_id, xp_amount, reason)
            VALUES (
                r_part.user_id, 
                p_match_id, 
                v_xp_to_add, 
                CASE WHEN v_is_winner THEN 'Victoire de match' ELSE 'Participation au match' END
            );

            -- Mettre à jour l'XP total et recalculer le niveau
            UPDATE public.profiles
            SET xp = xp + v_xp_to_add,
                matches_played = matches_played + 1,
                matches_won = CASE WHEN v_is_winner THEN matches_won + 1 ELSE matches_won END,
                win_streak = CASE WHEN v_is_winner THEN win_streak + 1 ELSE 0 END,
                level = public.calculate_level(xp + v_xp_to_add)
            WHERE id = r_part.user_id;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. FONCTION POUR CONFIRMER UN SCORE PAR UN ADVERSAIRE
CREATE OR REPLACE FUNCTION public.confirm_match_score(p_match_id BIGINT)
RETURNS VOID AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_pending_count INTEGER;
BEGIN
    UPDATE public.match_confirmations
    SET status = 'confirmed', updated_at = NOW()
    WHERE match_id = p_match_id AND user_id = v_user_id;

    -- Augmenter légèrement le score de Fair-Play pour confirmation rapide (+0.5% max 100%)
    UPDATE public.profiles
    SET fair_play_score = LEAST(100.00, fair_play_score + 0.50)
    WHERE id = v_user_id;

    -- Vérifier s'il reste des confirmations en attente pour ce match
    SELECT COUNT(*) INTO v_pending_count
    FROM public.match_confirmations
    WHERE match_id = p_match_id AND status != 'confirmed';

    -- Si tous ont confirmé, traiter la validation du match
    IF v_pending_count = 0 THEN
        PERFORM public.process_match_validation(p_match_id);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. FONCTION D'AUTO-VALIDATION (Pour les matchs en attente depuis > 24h)
CREATE OR REPLACE FUNCTION public.auto_validate_expired_matches()
RETURNS INTEGER AS $$
DECLARE
    r_match RECORD;
    v_count INTEGER := 0;
BEGIN
    FOR r_match IN 
        SELECT id FROM public.matches 
        WHERE status = 'pending_validation' 
        AND auto_validation_at <= NOW()
    LOOP
        -- Marquer les réfractaires qui n'ont pas validé (baisse de Fair-Play de -2%)
        UPDATE public.profiles
        SET fair_play_score = GREATEST(0.00, fair_play_score - 2.00)
        WHERE id IN (
            SELECT user_id FROM public.match_confirmations
            WHERE match_id = r_match.id AND status = 'pending'
        );

        -- Valider automatiquement le match
        PERFORM public.process_match_validation(r_match.id);
        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
