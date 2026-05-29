-- ═══════════════════════════════════════════════════════════════════════════
-- Migration sécurité v2 : SECURITY DEFINER — correction du rôle public
-- À exécuter après security-functions-hardening.sql
--
-- Problème du script v1 : REVOKE FROM anon insuffisant.
-- anon hérite de public → il faut REVOKE FROM public, puis GRANT TO authenticated.
-- ═══════════════════════════════════════════════════════════════════════════


-- ── 1. REVOKE EXECUTE FROM public sur TOUTES les fonctions SECURITY DEFINER
--
-- Cela coupe l'accès à anon ET authenticated (héritage de public).
-- On re-grantera authenticated aux fonctions utilisateur en étape 2.

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT oid::regprocedure::text AS sig
    FROM   pg_proc
    WHERE  pronamespace = 'public'::regnamespace
      AND  prosecdef    = true   -- SECURITY DEFINER uniquement
      AND  prokind      = 'f'
  LOOP
    BEGIN
      EXECUTE 'REVOKE EXECUTE ON FUNCTION ' || r.sig
              || ' FROM public, anon, authenticated';
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END LOOP;
END $$;


-- ── 2. Re-GRANT TO authenticated pour les fonctions utilisateur ──────────
--
-- Ces fonctions sont conçues pour être appelées par une utilisatrice connectée.
-- Elles vérifient toutes auth.uid() en interne.

DO $$
DECLARE
  r      record;
  fname  text;
  user_fns text[] := ARRAY[
    -- Économie & récompenses
    'validate_routine',
    'grant_coins',
    'spend_coins',
    'claim_onboarding_gift',
    'apply_referral_code',
    'grant_journal_entry',
    'claim_brand_offer',
    -- Communauté
    'toggle_community_post_like',
    'join_challenge',
    'get_hydra_my_stats',
    'get_hydra_leaderboard',
    'get_hydra_participant_count',
    'community_post_image_belongs_to_user',
    -- Analyse & coach
    'get_monthly_analysis_count',
    'coach_consume_quota',
    'fetch_similar_routine_plan_products',
    -- Notifications (auto-gestion par l'utilisatrice)
    'mark_all_notifications_read',
    'mark_notification_read'
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
        EXECUTE 'GRANT EXECUTE ON FUNCTION ' || r.sig || ' TO authenticated';
      EXCEPTION WHEN OTHERS THEN NULL;
      END;
    END LOOP;
  END LOOP;
END $$;


-- ── 3. Fonctions admin / système : pas de re-grant ───────────────────────
--
-- Ces fonctions ne doivent être appelées que depuis les Edge Functions
-- via la service_role key (qui bypass le système de grants).
-- Aucun GRANT TO authenticated → service_role uniquement.
--
-- Fonctions concernées (déjà révoquées à l'étape 1) :
--   admin_adjust_coins, admin_get_module_activity, admin_get_premium_analytics,
--   admin_get_product_analytics, admin_get_recent_achievement_unlocks,
--   admin_get_user_achievement_events, admin_get_user_favorites,
--   admin_set_premium, admin_get_achievement_unlock_stats,
--   admin_get_analytics_overview, admin_get_coach_activity,
--   admin_get_content_analytics, admin_get_favorites_report,
--   admin_get_hydra_*, cn_admin_can, cn_notification_user_matches,
--   dispatch_due_notification_campaigns, dispatch_notification_campaign,
--   has_admin_permission, is_super_admin, get_admin_user,
--   _premium_bypass, _economy_bypass, purge_hair_analyses_retention,
--   _grant_coins_to_user, _sync_community_post_likes_count, handle_new_user
--
-- (Pas de SQL nécessaire ici — le REVOKE de l'étape 1 couvre tout.)


-- ── 4. Leaked Password Protection ────────────────────────────────────────
--
-- ⚠️  CE WARNING NE PEUT PAS ÊTRE CORRIGÉ PAR SQL.
--
-- Action requise dans le dashboard Supabase :
--   Authentication → Sign In / Up → Password → "Leaked Password Protection"
--   → Activer le toggle
--
-- Cette option vérifie les mots de passe contre la base HaveIBeenPwned
-- lors de l'inscription et du changement de mot de passe.


-- ── 5. Vérification post-migration ────────────────────────────────────────

-- A. Vérifier qu'aucune SECURITY DEFINER n'est encore accessible à anon :
--
-- SELECT r.routine_name, grantee, privilege_type
-- FROM   information_schema.routine_privileges r
-- JOIN   pg_proc p
--        ON p.proname = r.routine_name
--        AND p.pronamespace = 'public'::regnamespace
--        AND p.prosecdef = true
-- WHERE  r.routine_schema = 'public'
--   AND  grantee IN ('anon', 'public')
--   AND  privilege_type = 'EXECUTE'
-- ORDER  BY r.routine_name;
-- → Doit retourner 0 lignes

-- B. Vérifier les fonctions utilisateur toujours accessibles (authenticated) :
--
-- SELECT routine_name, grantee
-- FROM   information_schema.routine_privileges
-- WHERE  routine_schema = 'public'
--   AND  grantee = 'authenticated'
--   AND  privilege_type = 'EXECUTE'
-- ORDER  BY routine_name;
-- → Doit lister les ~18 fonctions utilisateur

-- ═══════════════════════════════════════════════════════════════════════════
