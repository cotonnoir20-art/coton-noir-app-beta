import { Platform } from 'react-native';

/** Blocage UI si appareil compromis (root / jailbreak / hook). */
export function isLocalIntegrityEnforced(): boolean {
  if (typeof process === 'undefined') return false;
  if (process.env?.EXPO_PUBLIC_INTEGRITY_ENFORCE === 'true') return true;
  if (__DEV__ && process.env?.EXPO_PUBLIC_INTEGRITY_ENFORCE_DEV === 'true') {
    return true;
  }
  return false;
}

export function getPlayIntegrityCloudProjectNumber(): string | null {
  const v =
    typeof process !== 'undefined' &&
    process.env?.EXPO_PUBLIC_PLAY_INTEGRITY_CLOUD_PROJECT_NUMBER;
  return typeof v === 'string' && v.trim() ? v.trim() : null;
}

export function isAppAttestationEnabled(): boolean {
  if (getPlayIntegrityCloudProjectNumber()) return true;
  return (
    typeof process !== 'undefined' &&
    process.env?.EXPO_PUBLIC_APP_ATTEST_ENABLED === 'true'
  );
}

export function isNativeMobile(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}
