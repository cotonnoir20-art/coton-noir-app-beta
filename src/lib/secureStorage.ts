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

const CHUNK_SIZE = 1800;

const nativeAdapter: SecureKV = {
  async getItem(key) {
    const chunksRaw = await SecureStore.getItemAsync(`${key}_chunks`);
    if (chunksRaw) {
      const count = parseInt(chunksRaw, 10);
      const parts: string[] = [];
      for (let i = 0; i < count; i++) {
        parts.push((await SecureStore.getItemAsync(`${key}_chunk_${i}`)) ?? '');
      }
      return parts.join('');
    }
    return SecureStore.getItemAsync(key);
  },
  async setItem(key, value) {
    if (value.length > CHUNK_SIZE) {
      const chunks = Math.ceil(value.length / CHUNK_SIZE);
      await SecureStore.setItemAsync(`${key}_chunks`, String(chunks));
      for (let i = 0; i < chunks; i++) {
        await SecureStore.setItemAsync(
          `${key}_chunk_${i}`,
          value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE),
        );
      }
      await SecureStore.deleteItemAsync(key);
      return;
    }
    await SecureStore.deleteItemAsync(`${key}_chunks`);
    await SecureStore.setItemAsync(key, value);
  },
  async removeItem(key) {
    const chunksRaw = await SecureStore.getItemAsync(`${key}_chunks`);
    if (chunksRaw) {
      const count = parseInt(chunksRaw, 10);
      for (let i = 0; i < count; i++) {
        await SecureStore.deleteItemAsync(`${key}_chunk_${i}`);
      }
      await SecureStore.deleteItemAsync(`${key}_chunks`);
    }
    await SecureStore.deleteItemAsync(key);
  },
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
