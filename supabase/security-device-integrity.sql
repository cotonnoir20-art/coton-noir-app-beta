-- ============================================================
-- Correctif sécurité — Intégrité appareil / app (complément client)
-- Play Integrity (Android) + App Attest (iOS) + jail-monkey (heuristiques)
-- Ne remplace PAS : RLS, RPC security definer, validation économie serveur.
-- ============================================================

-- ── Côté app (déjà en place) ───────────────────────────────────────────────
-- • jail-monkey : root / jailbreak / hook / debug (scanDeviceIntegrity).
-- • DeviceIntegrityGuard : blocage UI si EXPO_PUBLIC_INTEGRITY_ENFORCE=true.
-- • @expo/app-integrity : jetons Play Integrity + assertions App Attest.
-- • Edge Function verify-app-integrity : challenge + enregistrement (stub vérif).

-- Variables .env (exemple) :
-- EXPO_PUBLIC_INTEGRITY_ENFORCE=true
-- EXPO_PUBLIC_INTEGRITY_ENFORCE_DEV=true          (tests en dev)
-- EXPO_PUBLIC_PLAY_INTEGRITY_CLOUD_PROJECT_NUMBER=123456789012
-- EXPO_PUBLIC_APP_ATTEST_ENABLED=true
-- INTEGRITY_ENFORCE_SERVER=true                   (secrets Edge Function)

-- ── Stores / build ───────────────────────────────────────────────────────────
-- • iOS : capability App Attest dans Xcode (Signing & Capabilities).
-- • Android : Play Integrity API activée (Play Console + Google Cloud).
-- • Development build obligatoire (pas Expo Go pour jail-monkey / attestation).

-- ── Schéma optionnel (journal + challenges) ────────────────────────────────
/*
create table if not exists public.device_integrity_challenges (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  challenge  text not null,
  expires_at timestamptz not null default (now() + interval '5 minutes'),
  used_at    timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists device_integrity_challenges_user_idx
  on public.device_integrity_challenges (user_id, expires_at desc);

alter table public.device_integrity_challenges enable row level security;

create table if not exists public.device_integrity_log (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  platform   text not null check (platform in ('ios', 'android')),
  verdict    text not null,
  created_at timestamptz not null default now()
);

alter table public.device_integrity_log enable row level security;

alter table public.profiles
  add column if not exists device_integrity_ok boolean not null default false,
  add column if not exists device_integrity_at timestamptz;
*/

-- ── RPC sensibles : exiger attestation (après vérif serveur configurée) ───────
-- Exemple dans validate_routine / grant_coins :
--   if not exists (select 1 from profiles where id = auth.uid() and device_integrity_ok)
--     and current_setting('app.skip_integrity', true) <> 'true'
--   then return jsonb_build_object('ok', false, 'error', 'integrity_required');

-- Déploiement Edge Function :
--   supabase functions deploy verify-app-integrity --no-verify-jwt
--   (JWT vérifié dans la fonction via supabase.auth.getUser)
