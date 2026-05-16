import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { isWebAuthStoragePersistent } from './webAuthPolicy';

/** KV chiffré natif · web dev : sessionStorage · web prod : mémoire (pas de localStorage). */
export type SecureKV = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

const memoryStore = new Map<string, string>();
const memoryAdapter: SecureKV = {
  async getItem(key)        { return memoryStore.get(key) ?? null; },
  async setItem(key, value) { memoryStore.set(key, value); },
  async removeItem(key)     { memoryStore.delete(key); },
};

const sessionStorageAdapter: SecureKV = {
  async getItem(key) {
    return globalThis.sessionStorage?.getItem(key) ?? null;
  },
  async setItem(key, value) {
    globalThis.sessionStorage?.setItem(key, value);
  },
  async removeItem(key) {
    globalThis.sessionStorage?.removeItem(key);
  },
};

const nativeAdapter: SecureKV = {
  async getItem(key)        { return SecureStore.getItemAsync(key); },
  async setItem(key, value) { await SecureStore.setItemAsync(key, value); },
  async removeItem(key)     { await SecureStore.deleteItemAsync(key); },
};

function pickWebKV(): SecureKV {
  if (isWebAuthStoragePersistent() && typeof globalThis.sessionStorage !== 'undefined') {
    return sessionStorageAdapter;
  }
  return memoryAdapter;
}

/** Stockage Supabase Auth — jamais localStorage en prod web. */
export function pickAuthKV(): SecureKV {
  if (Platform.OS === 'web') return pickWebKV();
  return nativeAdapter;
}

/** Données app hors ligne (même politique web que auth). */
export function pickSecureKV(): SecureKV {
  if (Platform.OS === 'web') return pickWebKV();
  return nativeAdapter;
}

/** @deprecated Préférer pickAuthKV / pickSecureKV */
export const secureKV = pickSecureKV();
