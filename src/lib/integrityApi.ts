import { Platform } from 'react-native';
import { supabase } from './supabase';
import {
  attestIosKeyWithChallenge,
  initAppAttestation,
  requestAttestationForAction,
  setupAndroidHardwareAttestation,
} from './appAttestation';
import { devLog } from './devLog';
import { isAppAttestationEnabled } from './integrityConfig';

export type IntegrityHeaders = {
  'X-App-Integrity-Token'?: string;
  'X-App-Integrity-Platform'?: 'ios' | 'android';
};

/** Initialise l’attestation + enregistrement serveur si Edge Function déployée. */
export async function bootstrapDeviceAttestation(userId: string): Promise<void> {
  await initAppAttestation();
  if (!isAppAttestationEnabled() || !userId) return;

  try {
    const { data, error } = await supabase.functions.invoke('verify-app-integrity', {
      body: { action: 'challenge', userId },
    });
    if (error) {
      devLog.warn('[integrityApi] challenge unavailable', error.message);
      return;
    }
    const challenge =
      typeof data === 'object' && data && 'challenge' in data
        ? String((data as { challenge: string }).challenge)
        : null;
    if (!challenge) return;

    await attestIosKeyWithChallenge(challenge);
    await setupAndroidHardwareAttestation(challenge);

    const token = await requestAttestationForAction('bootstrap', userId);
    if (!token) return;

    await supabase.functions.invoke('verify-app-integrity', {
      body: {
        action: 'register',
        userId,
        challenge,
        token,
      },
    });
  } catch (e) {
    devLog.warn('[integrityApi] bootstrap failed', e);
  }
}

/** En-têtes optionnels pour RPC / Edge Functions sensibles. */
export async function buildIntegrityHeaders(
  action: string,
  userId: string,
): Promise<IntegrityHeaders> {
  const token = await requestAttestationForAction(action, userId);
  if (!token) return {};
  const platform: 'ios' | 'android' =
    Platform.OS === 'ios' ? 'ios' : 'android';
  return {
    'X-App-Integrity-Token': token,
    'X-App-Integrity-Platform': platform,
  };
}
