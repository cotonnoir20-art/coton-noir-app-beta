-- ============================================================
-- Correctif sécurité — Premium / checkout (checklist)
-- Complète le code app : safeLinking + expo-iap (StoreKit / Play Billing)
-- ============================================================

-- ── Côté app (déjà en place) ───────────────────────────────────────────────
-- • iOS / Android : achats via expo-iap uniquement (pas de Linking.openURL checkout).
-- • Web : EXPO_PUBLIC_PREMIUM_CHECKOUT_URL validée (allowlist domaines Stripe / Coton Noir).
-- • Partenaires / produits : openSafeUrl() avec politiques partner | product | social.
-- • Hôtes supplémentaires : EXPO_PUBLIC_LINK_ALLOWLIST_HOSTS=shop.example.com,brand.fr

-- ── Variables .env (exemple) ─────────────────────────────────────────────
-- EXPO_PUBLIC_IAP_PREMIUM_MONTHLY=com.cotonnoir.app.premium.monthly
-- EXPO_PUBLIC_IAP_PREMIUM_ANNUAL=com.cotonnoir.app.premium.annual
-- EXPO_PUBLIC_PREMIUM_CHECKOUT_URL=https://www.cotonnoir.app/premium  (web uniquement)
-- EXPO_PUBLIC_LINK_ALLOWLIST_HOSTS=ma-marque-partenaire.fr

-- ── À faire côté serveur (recommandé avant prod) ───────────────────────────
-- 1. Colonne profiles.is_premium + premium_expires_at (ou table subscriptions).
-- 2. Edge Function verify-iap-receipt :
--    - Valider reçu Apple (App Store Server API) / Google (Play Developer API).
--    - Activer is_premium uniquement après vérification (jamais depuis le client seul).
-- 3. Webhooks Stripe (si checkout web) → même table, idempotency par event.id.
-- 4. RLS : interdire UPDATE client sur is_premium (security definer / service_role).

-- Exemple schéma minimal (adapter si déjà présent) :
/*
alter table public.profiles
  add column if not exists is_premium boolean not null default false,
  add column if not exists premium_expires_at timestamptz;

create or replace function public.profiles_guard_premium()
returns trigger language plpgsql as $$
begin
  if current_setting('app.premium_bypass', true) = 'true' then
    return new;
  end if;
  if tg_op = 'UPDATE' then
    new.is_premium := old.is_premium;
    new.premium_expires_at := old.premium_expires_at;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_premium on public.profiles;
create trigger profiles_guard_premium
  before update on public.profiles
  for each row execute function public.profiles_guard_premium();
*/

-- ── Stores ─────────────────────────────────────────────────────────────────
-- • Créer les abonnements auto-renouvelables dans App Store Connect + Play Console.
-- • Identifiants alignés sur EXPO_PUBLIC_IAP_PREMIUM_*.
-- • Development build obligatoire (expo-iap ne fonctionne pas dans Expo Go).
-- • eas build --platform ios|android après ajout du plugin expo-iap dans app.json.
