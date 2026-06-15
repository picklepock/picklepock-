-- ============================================================
-- PICKLEPOCK - Tables Terrains (courts) & Réservations (bookings)
-- ============================================================

-- 1. Table des terrains (courts)
CREATE TABLE IF NOT EXISTS public.courts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    club_id BIGINT REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    sport TEXT DEFAULT 'Pickleball' NOT NULL, -- Pickleball, Padel, Tennis, Squash
    type TEXT CHECK (type IN ('Indoor', 'Outdoor')) DEFAULT 'Outdoor',
    hourly_rate DECIMAL(10,2) DEFAULT 20.00,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table des réservations (bookings)
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    court_id UUID REFERENCES public.courts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    client_name TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status TEXT CHECK (status IN ('confirmed', 'pending', 'cancelled', 'completed')) DEFAULT 'confirmed',
    payment_status TEXT CHECK (payment_status IN ('paid', 'pending', 'refunded')) DEFAULT 'pending',
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RLS POLICIES - Sécurité
-- ============================================================

-- Terrains (courts)
ALTER TABLE public.courts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tout le monde peut voir les terrains actifs" ON public.courts;
CREATE POLICY "Tout le monde peut voir les terrains actifs"
    ON public.courts FOR SELECT
    USING (is_active = TRUE);

DROP POLICY IF EXISTS "Les gérants peuvent gérer leurs terrains" ON public.courts;
CREATE POLICY "Les gérants peuvent gérer leurs terrains"
    ON public.courts FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.clubs
            WHERE id = courts.club_id AND manager_id = auth.uid()
        )
    );

-- Réservations (bookings)
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Les gérants peuvent voir et modifier toutes les réservations" ON public.bookings;
CREATE POLICY "Les gérants peuvent voir et modifier toutes les réservations"
    ON public.bookings FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.courts
            JOIN public.clubs ON clubs.id = courts.club_id
            WHERE courts.id = bookings.court_id AND clubs.manager_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Les utilisateurs voient leurs propres réservations" ON public.bookings;
CREATE POLICY "Les utilisateurs voient leurs propres réservations"
    ON public.bookings FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Les utilisateurs peuvent créer des réservations" ON public.bookings;
CREATE POLICY "Les utilisateurs peuvent créer des réservations"
    ON public.bookings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- SEED MOCK DATA (Optional setup check)
-- ============================================================
-- Ce script insère par défaut des terrains pour les clubs existants s'ils n'en ont pas.
DO $$
DECLARE
    club_record RECORD;
    court_id_1 UUID;
    court_id_2 UUID;
BEGIN
    FOR club_record IN SELECT id, name FROM public.clubs LOOP
        -- S'assurer qu'au moins 2 terrains existent par club
        IF NOT EXISTS (SELECT 1 FROM public.courts WHERE club_id = club_record.id) THEN
            INSERT INTO public.courts (club_id, name, sport, type, hourly_rate)
            VALUES (club_record.id, 'Court A (Viticole)', 'Pickleball', 'Outdoor', 15.00)
            RETURNING id INTO court_id_1;

            INSERT INTO public.courts (club_id, name, sport, type, hourly_rate)
            VALUES (club_record.id, 'Court B (VIP)', 'Pickleball', 'Indoor', 25.00)
            RETURNING id INTO court_id_2;

            -- Mettre à jour le courts_count sur le club
            UPDATE public.clubs SET courts_count = 2 WHERE id = club_record.id;

            -- Ajouter une réservation fictive aujourd'hui (de 14h à 15h)
            INSERT INTO public.bookings (court_id, client_name, start_time, end_time, status, payment_status, total_price)
            VALUES (court_id_1, 'Jean Dupont', NOW() - INTERVAL '10 minutes', NOW() + INTERVAL '50 minutes', 'confirmed', 'paid', 15.00);

            INSERT INTO public.bookings (court_id, client_name, start_time, end_time, status, payment_status, total_price)
            VALUES (court_id_2, 'Paul Martin', NOW() + INTERVAL '2 hours', NOW() + INTERVAL '3 hours', 'confirmed', 'pending', 25.00);
        END IF;
    END LOOP;
END $$;

-- ============================================================
-- MIGRATION - Nouvelles options clubs & réservations
-- ============================================================

-- 1. Options d'équipements pour les clubs
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS has_racket_rental BOOLEAN DEFAULT TRUE;
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS has_ball_sale BOOLEAN DEFAULT TRUE;
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS racket_rental_price DECIMAL(10,2) DEFAULT 5.00;
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS ball_sale_price DECIMAL(10,2) DEFAULT 6.00;

-- 2. Options de réservation clients
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS players_count INTEGER DEFAULT 2;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS rented_rackets_count INTEGER DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS rented_balls_count INTEGER DEFAULT 0;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS publish_announcement BOOLEAN DEFAULT FALSE;

