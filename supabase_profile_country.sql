-- ============================================================
-- SQL SCRIPT FOR PROFILE COUNTRY OF ORIGIN
-- Run this in your Supabase SQL Editor
-- ============================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country TEXT;
