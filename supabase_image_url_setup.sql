-- ============================================================
-- SQL SCRIPT FOR IMAGE OPTIMIZATION SETUP
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Add image_url columns to clubs and profiles
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS image_url TEXT;

-- ============================================================
-- STORAGE BUCKET SETUP INSTRUCTIONS
-- ============================================================
-- Follow these steps in the Supabase Dashboard:
--
-- 1. Go to "Storage" in the left sidebar.
-- 2. Click "New bucket".
-- 3. Name the bucket: "club_images".
-- 4. Toggle "Public" to ON (Allowed to read files without token).
-- 5. Click "Save".
--
-- 6. Add policies for the "club_images" bucket:
--    A. Public Read Access:
--       - Policy Name: "Allow public read access"
--       - Allowed Operations: SELECT
--       - Target: club_images bucket
--       - USING expression: true
--
--    B. Authenticated Upload/Insert Access:
--       - Policy Name: "Allow authenticated uploads"
--       - Allowed Operations: INSERT, UPDATE
--       - Target: club_images bucket
--       - Check expression: auth.role() = 'authenticated'
--
--    C. Delete Access (Optional):
--       - Policy Name: "Allow users to delete their own images"
--       - Allowed Operations: DELETE
--       - Target: club_images bucket
--       - USING expression: auth.role() = 'authenticated'
-- ============================================================
