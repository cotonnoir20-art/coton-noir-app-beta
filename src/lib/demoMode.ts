/**
 * Mode démo : actif uniquement en build développement (`__DEV__`).
 * En release (APK/IPA store), toutes les helpers retournent false / null / [].
 *
 * Identifiants Supabase : jamais dans le code — uniquement via `.env.local`
 * (EXPO_PUBLIC_DEV_DEMO_EMAIL / EXPO_PUBLIC_DEV_DEMO_PASSWORD).
 */

export function isDemoModeAvailable(): boolean {
  return __DEV__ === true;
}

export function getDevDemoLoginCredentials(): { email: string; password: string } | null {
  if (!isDemoModeAvailable()) return null;
  const email = process.env.EXPO_PUBLIC_DEV_DEMO_EMAIL?.trim();
  const password = process.env.EXPO_PUBLIC_DEV_DEMO_PASSWORD;
  if (!email || !password) return null;
  return { email, password };
}

/** Indication UI login (dev) — sans exposer le mot de passe. */
export function getDevDemoLoginHint(): string | null {
  if (!isDemoModeAvailable()) return null;
  return getDevDemoLoginCredentials()
    ? 'Connexion démo (variables .env.local)'
    : 'Démo : ajoute EXPO_PUBLIC_DEV_DEMO_EMAIL et EXPO_PUBLIC_DEV_DEMO_PASSWORD dans .env.local';
}
