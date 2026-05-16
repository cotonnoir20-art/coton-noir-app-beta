import { Platform } from 'react-native';

export function isWebPlatform(): boolean {
  return Platform.OS === 'web';
}

/**
 * Version web en build release : pas d’app complète (évite JWT en localStorage / XSS).
 * Définir EXPO_PUBLIC_ALLOW_WEB_PROD=true uniquement pour un environnement de staging contrôlé.
 */
export function isWebProductionRestricted(): boolean {
  if (!isWebPlatform()) return false;
  if (__DEV__) return false;
  return process.env.EXPO_PUBLIC_ALLOW_WEB_PROD !== 'true';
}

/**
 * Persistance session navigateur (sessionStorage — pas localStorage).
 * • dev web : oui
 * • PWA staging export : oui si EXPO_PUBLIC_WEB_STAGING_AUTH_PERSIST=true
 */
export function isWebAuthStoragePersistent(): boolean {
  if (!isWebPlatform()) return false;
  if (__DEV__) return true;
  if (process.env.EXPO_PUBLIC_ALLOW_WEB_PROD !== 'true') return false;
  return process.env.EXPO_PUBLIC_WEB_STAGING_AUTH_PERSIST === 'true';
}

/** Supprime d’anciens tokens Supabase laissés dans localStorage (migration XSS). */
export function purgeLegacyWebLocalStorageAuth(): void {
  if (typeof globalThis.localStorage === 'undefined') return;
  const keys: string[] = [];
  for (let i = 0; i < globalThis.localStorage.length; i++) {
    const k = globalThis.localStorage.key(i);
    if (!k) continue;
    if (k.includes('supabase') || k.startsWith('sb-')) keys.push(k);
  }
  keys.forEach(k => {
    try {
      globalThis.localStorage.removeItem(k);
    } catch {}
  });
}
