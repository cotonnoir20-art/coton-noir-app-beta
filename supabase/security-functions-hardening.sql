-- ═══════════════════════════════════════════════════════════════════════════
-- Migration sécurité : search_path + SECURITY DEFINER + storage listing
-- À exécuter dans le SQL Editor du dashboard Supabase.
-- Résout les 103 warnings du Security Advisor Supabase.
-- ═══════════════════════════════════════════════════════════════════════════


-- ── 1. Fixer search_path sur toutes les fonctions du schema public ────────
--
-- Risque : sans search_path fixé, un attaquant ayant accès à un schema
-- peut créer des objets homonymes et détourner les appels de fonctions.
-- Fix : SET search_path = public force chaque fonction à résoudre
-- les identifiants dans public uniquement.

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT oid::regprocedure::text AS sig, proconfig
    FROM   pg_proc
    WHERE  pronamespace = 'public'::regnamespace
      AND  prokind IN ('f', 'p')
  LOOP
    IF r.proconfig IS NULL
    OR NOT (r.proconfig @> ARRAY['search_path=public'])
    THEN
      BEGIN
        EXECUTE 'ALTER FUNCTION ' || r.sig || ' SET search_path = public';
      EXCEPTION WHEN OTHERS THEN
        -- Ignorer les fonctions système non modifiables
        NULL;
      END;
    END IF;
  END LOOP;
END $$;


-- ── 2. Fonctions SECURITY DEFINER : restreindre l'accès à authenticated ──
--
-- Risque : "Public Can Execute SECURITY DEFINER Function"
-- Ces fonctions s'exécutent avec les droits du owner (postgres).
-- Un utilisateur non authentifié (anon) ne doit jamais pouvoir les appeler.
--
-- Stratégie :
--   • Fonctions métier utilisateur  → authenticated uniquement
--   • Fonctions admin / internes    → service_role uniquement (backend)

-- 2a. Fonctions appelables uniquement par une utilisatrice connectée
DO $$
DECLARE
  r       record;
  fname   text;
  user_fns text[] := ARRAY[
    '_grant_coins_to_user',
    '_sync_community_post_likes_count',
    'validate_routine',
    'grant_coins',
    'spend_coins',
    'claim_onboarding_gift',
    'apply_referral_code',
    'grant_journal_entry',
    'toggle_community_post_like',
    'join_challenge',
    'get_hydra_my_stats',
    'get_hydra_leaderboard',
    'get_hydra_participant_count',
    'get_monthly_analysis_count',
    'coach_consume_quota',
    'claim_brand_offer',
    'community_post_image_belongs_to_user',
    'fetch_similar_routine_plan_products'
  ];
BEGIN
  FOREACH fname IN ARRAY user_fns LOOP
    FOR r IN
      SELECT oid::regprocedure::text AS sig
      FROM   pg_proc
      WHERE  proname = fname
        AND  pronamespace = 'public'::regnamespace
    LOOP
      BEGIN
        EXECUTE 'REVOKE EXECUTE ON FUNCTION ' || r.sig || ' FROM anon';
        EXECUTE 'GRANT  EXECUTE ON FUNCTION ' || r.sig || ' TO authenticated';
      EXCEPTION WHEN OTHERS THEN NULL;
      END;
    END LOOP;
  END LOOP;
END $$;

-- 2b. Fonctions admin et internes → service_role uniquement
--     (appelées uniquement depuis les Edge Functions avec la service key)
DO $$
DECLARE
  r        record;
  fname    text;
  admin_fns text[] := ARRAY[
    'admin_adjust_coins',
    'admin_get_achievement_unlock_stats',
    'admin_get_analytics_overview',
    'admin_get_coach_activity',
    'admin_get_content_analytics',
    'admin_get_favorites_report',
    'admin_get_hydra_daily_stats',
    'admin_get_hydra_enrollments',
    'admin_get_hydra_leaderboard',
    'admin_get_hydra_overview',
    'admin_get_hydra_posts',
    'get_admin_user',
    '_premium_bypass',
    '_economy_bypass',
    'purge_hair_analyses_retention'
  ];
BEGIN
  FOREACH fname IN ARRAY admin_fns LOOP
    FOR r IN
      SELECT oid::regprocedure::text AS sig
      FROM   pg_proc
      WHERE  proname = fname
        AND  pronamespace = 'public'::regnamespace
    LOOP
      BEGIN
        EXECUTE 'REVOKE EXECUTE ON FUNCTION ' || r.sig
                || ' FROM public, anon, authenticated';
      EXCEPTION WHEN OTHERS THEN NULL;
      END;
    END LOOP;
  END LOOP;
END $$;


-- ── 3. Storage : restreindre le listing du bucket catalog-uploads ─────────
--
-- Risque : "Public Bucket Allows Listing"
-- Une policy SELECT trop large laisse lister tous les fichiers sans auth.
-- Fix : seules les utilisatrices authentifiées peuvent lire ce bucket.

-- Supprimer les policies SELECT trop permissives sur catalog-uploads
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM   pg_policies
    WHERE  tablename  = 'objects'
      AND  schemaname = 'storage'
      AND  cmd        = 'SELECT'
      AND  (qual ILIKE '%catalog-uploads%' OR policyname ILIKE '%catalog%' OR policyname ILIKE '%public%read%')
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS '
            || quote_ident(pol.policyname)
            || ' ON storage.objects';
  END LOOP;
END $$;

-- Policy restrictive : lecture authentifiée uniquement
DROP POLICY IF EXISTS "catalog-uploads authenticated read" ON storage.objects;
CREATE POLICY "catalog-uploads authenticated read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'catalog-uploads');

-- S'assurer que le bucket n'est pas public
UPDATE storage.buckets
SET    public = false
WHERE  id = 'catalog-uploads'
  AND  public = true;


-- ── 4. Vérification post-migration ────────────────────────────────────────
--
-- Lancer ces requêtes pour confirmer que les warnings ont disparu :
--
-- SELECT proname, proconfig
-- FROM   pg_proc
-- WHERE  pronamespace = 'public'::regnamespace
--   AND  (proconfig IS NULL OR NOT proconfig @> ARRAY['search_path=public'])
-- ORDER  BY proname;
-- → Doit retourner 0 lignes
--
-- SELECT grantee, routine_name, privilege_type
-- FROM   information_schema.routine_privileges
-- WHERE  routine_schema = 'public'
--   AND  grantee IN ('anon', 'public')
--   AND  privilege_type = 'EXECUTE';
-- → Les fonctions admin ne doivent plus apparaître

-- ═══════════════════════════════════════════════════════════════════════════
