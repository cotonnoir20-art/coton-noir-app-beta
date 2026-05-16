import * as AppIntegrity from '@expo/app-integrity';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { devLog } from './devLog';
import {
  getPlayIntegrityCloudProjectNumber,
  isAppAttestationEnabled,
  isNativeMobile,
} from './integrityConfig';
import { secureKV } from './secureStorage';

const IOS_KEY_ID_STORAGE = 'app_attest_key_id_ios';
const ANDROID_KEY_ALIAS = 'coton_noir_hw_attest';

let androidProviderReady = false;

async function sha256Hex(payload: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, payload);
}

/** Prépare Play Integrity (Android) et clé App Attest (iOS) — non bloquant. */
export async function initAppAttestation(): Promise<void> {
  if (!isNativeMobile() || !isAppAttestationEnabled()) return;

  const cloudProject = getPlayIntegrityCloudProjectNumber();
  if (Platform.OS === 'android' && cloudProject) {
    try {
      await AppIntegrity.prepareIntegrityTokenProviderAsync(cloudProject);
      androidProviderReady = true;
      devLog.log('[appAttestation] Play Integrity provider ready');
    } catch (e) {
      devLog.warn('[appAttestation] prepareIntegrityTokenProvider failed', e);
      androidProviderReady = false;
    }
  }

  if (Platform.OS === 'ios' && AppIntegrity.isSupported) {
    try {
      let keyId = await secureKV.getItem(IOS_KEY_ID_STORAGE);
      if (!keyId) {
        keyId = await AppIntegrity.generateKeyAsync();
        await secureKV.setItem(IOS_KEY_ID_STORAGE, keyId);
        devLog.log('[appAttestation] App Attest key created');
      }
    } catch (e) {
      devLog.warn('[appAttestation] iOS key setup failed', e);
    }
  }
}

/**
 * Jeton Play Integrity (Android) ou assertion App Attest (iOS) pour une action sensible.
 * À envoyer au serveur avec la requête — validation côté backend obligatoire.
 */
export async function requestAttestationForAction(
  action: string,
  userId: string,
): Promise<string | null> {
  if (!isNativeMobile() || !isAppAttestationEnabled()) return null;

  const requestHash = await sha256Hex(`${action}:${userId}:${Date.now()}`);

  if (Platform.OS === 'android') {
    const cloudProject = getPlayIntegrityCloudProjectNumber();
    if (!cloudProject) return null;
    if (!androidProviderReady) {
      try {
        await AppIntegrity.prepareIntegrityTokenProviderAsync(cloudProject);
        androidProviderReady = true;
      } catch {
        return null;
      }
    }
    try {
      return await AppIntegrity.requestIntegrityCheckAsync(requestHash);
    } catch (e) {
      devLog.warn('[appAttestation] requestIntegrityCheck failed', e);
      if (String(e).includes('PROVIDER_INVALID')) {
        androidProviderReady = false;
        try {
          await AppIntegrity.prepareIntegrityTokenProviderAsync(cloudProject);
          androidProviderReady = true;
          return await AppIntegrity.requestIntegrityCheckAsync(requestHash);
        } catch {
          return null;
        }
      }
      return null;
    }
  }

  if (Platform.OS === 'ios' && AppIntegrity.isSupported) {
    const keyId = await secureKV.getItem(IOS_KEY_ID_STORAGE);
    if (!keyId) return null;
    try {
      const payload = JSON.stringify({ action, userId, requestHash });
      return await AppIntegrity.generateAssertionAsync(keyId, payload);
    } catch (e) {
      devLog.warn('[appAttestation] generateAssertion failed', e);
      return null;
    }
  }

  return null;
}

/** Enregistrement initial App Attest avec challenge serveur (optionnel). */
export async function attestIosKeyWithChallenge(challenge: string): Promise<boolean> {
  if (Platform.OS !== 'ios' || !AppIntegrity.isSupported) return false;
  try {
    let keyId = await secureKV.getItem(IOS_KEY_ID_STORAGE);
    if (!keyId) {
      keyId = await AppIntegrity.generateKeyAsync();
      await secureKV.setItem(IOS_KEY_ID_STORAGE, keyId);
    }
    const attestationObject = await AppIntegrity.attestKeyAsync(keyId, challenge);
    return !!attestationObject;
  } catch (e) {
    devLog.warn('[appAttestation] attestKey failed', e);
    return false;
  }
}

/** Attestation matérielle Android (GrapheneOS / Keystore) si supportée. */
export async function setupAndroidHardwareAttestation(
  challenge: string,
): Promise<string[] | null> {
  if (Platform.OS !== 'android') return null;
  try {
    const supported = await AppIntegrity.isHardwareAttestationSupportedAsync();
    if (!supported) return null;
    await AppIntegrity.generateHardwareAttestedKeyAsync(ANDROID_KEY_ALIAS, challenge);
    return await AppIntegrity.getAttestationCertificateChainAsync(ANDROID_KEY_ALIAS);
  } catch (e) {
    devLog.warn('[appAttestation] hardware attestation failed', e);
    return null;
  }
}
