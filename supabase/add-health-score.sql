-- Migration : ajout du score santé capillaire initial (issu du scan onboarding)
-- À exécuter dans le SQL Editor du dashboard Supabase.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS health_score integer
  CHECK (health_score IS NULL OR (health_score >= 0 AND health_score <= 100));

COMMENT ON COLUMN profiles.health_score IS
  'Score santé capillaire 0-100 détecté par le scan IA lors de l''onboarding. NULL si pas de scan effectué.';
