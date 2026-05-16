import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { devLog } from './devLog';
import { isNativeMobile } from './integrityConfig';

export type DeviceIntegrityReport = {
  compromised: boolean;
  reasons: string[];
  flags: {
    jailbrokenOrRooted: boolean;
    hookDetected: boolean;
    trustFall: boolean;
    canMockLocation: boolean;
    onExternalStorage: boolean;
    adbEnabled: boolean;
    debuggedMode: boolean;
    developmentSettings: boolean;
    isEmulator: boolean;
  };
};

type JailMonkeyModule = {
  isJailBroken: () => boolean;
  hookDetected: () => boolean;
  trustFall: () => boolean;
  canMockLocation: () => boolean;
  isOnExternalStorage: () => boolean;
  AdbEnabled: () => boolean;
  isDebuggedMode: () => Promise<boolean>;
  isDevelopmentSettingsMode: () => Promise<boolean>;
};

function loadJailMonkey(): JailMonkeyModule | null {
  if (!isNativeMobile()) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('jail-monkey').default as JailMonkeyModule;
  } catch {
    return null;
  }
}

/**
 * Heuristiques locales (root / jailbreak / hook / debug).
 * Complémentaire à Play Integrity / App Attest — ne remplace pas la validation serveur.
 */
export async function scanDeviceIntegrity(): Promise<DeviceIntegrityReport> {
  const reasons: string[] = [];
  const flags = {
    jailbrokenOrRooted: false,
    hookDetected: false,
    trustFall: false,
    canMockLocation: false,
    onExternalStorage: false,
    adbEnabled: false,
    debuggedMode: false,
    developmentSettings: false,
    isEmulator: !Device.isDevice,
  };

  if (!isNativeMobile()) {
    return { compromised: false, reasons, flags };
  }

  const jm = loadJailMonkey();
  if (!jm) {
    devLog.warn('[deviceIntegrity] jail-monkey indisponible (Expo Go ?) — scan partiel');
  } else {
    flags.jailbrokenOrRooted = !!jm.isJailBroken();
    flags.hookDetected = !!jm.hookDetected();
    flags.trustFall = !!jm.trustFall();
    flags.canMockLocation = !!jm.canMockLocation();
    flags.onExternalStorage = !!jm.isOnExternalStorage();
    if (Platform.OS === 'android') {
      flags.adbEnabled = !!jm.AdbEnabled();
    }
    try {
      flags.debuggedMode = await jm.isDebuggedMode();
    } catch {
      flags.debuggedMode = false;
    }
    try {
      flags.developmentSettings = await jm.isDevelopmentSettingsMode();
    } catch {
      flags.developmentSettings = false;
    }
  }

  if (flags.isEmulator) reasons.push('emulator');
  if (flags.jailbrokenOrRooted) reasons.push('jailbreak_or_root');
  if (flags.hookDetected) reasons.push('hook_detected');
  if (flags.trustFall) reasons.push('trust_fall');
  if (flags.canMockLocation) reasons.push('mock_location');
  if (flags.onExternalStorage) reasons.push('external_storage');
  if (flags.adbEnabled) reasons.push('adb_enabled');

  const blockDebugInRelease =
    !__DEV__ &&
    (flags.debuggedMode || flags.developmentSettings);

  if (blockDebugInRelease) {
    if (flags.debuggedMode) reasons.push('debugged');
    if (flags.developmentSettings) reasons.push('dev_settings');
  }

  const compromised =
    flags.jailbrokenOrRooted ||
    flags.hookDetected ||
    flags.trustFall ||
    blockDebugInRelease;

  if (compromised) {
    devLog.warn('[deviceIntegrity] compromised', { reasons, flags });
  }

  return { compromised, reasons, flags };
}
