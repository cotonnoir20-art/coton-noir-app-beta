import AsyncStorage from '@react-native-async-storage/async-storage';
import { CC_REFERRAL_SIGNUP } from './cotonCoins';
import {
  fetchReferralDashboardStats,
  fetchReferrerUsedCode,
} from './economyApi';

/**
 * Parrainage :
 * - Activation de code → RPC `apply_referral_code` (table `referrals`, crédit serveur)
 * - Compteur de partages / journal → AsyncStorage (cosmétique, pas de CC)
 */

export const INVITES_SENT_KEY = '@coton_noir_invites_sent';
export const INVITES_LOG_KEY = '@coton_noir_invites_log';
/** Ancien cache local — supprimé au chargement (ne plus créditer sans serveur). */
const LEGACY_REFERRER_USED_KEY = '@coton_noir_referrer_code';

export const REFERRER_REWARD_CC = CC_REFERRAL_SIGNUP;

export type InviteMethod = 'copy' | 'share' | 'whatsapp' | 'email' | 'sms';

export type InviteLogEntry = {
  at: string;
  method: InviteMethod;
};

/** Tronque + uppercase + retire accents/diacritiques. */
function sanitizeName(input: string): string {
  const norm = input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');
  return norm.slice(0, 5) || 'COTON';
}

/** Hash client (fallback affichage) — le code officiel est `profiles.referral_code` (md5 serveur). */
function shortHash(input: string): string {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) - h + input.charCodeAt(i)) | 0;
  }
  const hex = Math.abs(h).toString(16).padStart(8, '0');
  return hex.slice(-4).toUpperCase();
}

export function buildReferralCode(args: {
  id?: string | null;
  username?: string | null;
  email?: string | null;
}): string {
  const seed = (args.id ?? args.email ?? args.username ?? 'anon').trim();
  const namePart = sanitizeName(args.username ?? args.email?.split('@')[0] ?? 'COTON');
  const hashPart = shortHash(seed);
  return `${namePart}-${hashPart}`;
}

/** Retire l’ancien flag local qui pouvait simuler un code activé sans RPC. */
export async function clearLegacyReferralCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(LEGACY_REFERRER_USED_KEY);
  } catch {}
}

export async function getInvitesSentCount(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(INVITES_SENT_KEY);
    const n = raw ? Number(raw) : 0;
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

export async function getInvitesLog(): Promise<InviteLogEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(INVITES_LOG_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((x): x is InviteLogEntry => !!x && typeof x.at === 'string' && typeof x.method === 'string')
      .sort((a, b) => b.at.localeCompare(a.at));
  } catch {
    return [];
  }
}

export async function logInviteShare(method: InviteMethod): Promise<number> {
  const [count, log] = await Promise.all([
    getInvitesSentCount(),
    getInvitesLog(),
  ]);
  const next = count + 1;
  const entry: InviteLogEntry = { at: new Date().toISOString(), method };
  const nextLog = [entry, ...log].slice(0, 30);
  try {
    await Promise.all([
      AsyncStorage.setItem(INVITES_SENT_KEY, String(next)),
      AsyncStorage.setItem(INVITES_LOG_KEY, JSON.stringify(nextLog)),
    ]);
  } catch {}
  return next;
}

/** Code parrain déjà activé (uniquement `public.referrals`). */
export async function getReferrerUsed(): Promise<string | null> {
  await clearLegacyReferralCache();
  return fetchReferrerUsedCode();
}

/** CC gagnés en tant que marraine (somme des `reward_cc` côté serveur). */
export async function getReferrerCoinsEarned(): Promise<number> {
  const stats = await fetchReferralDashboardStats();
  return stats.coinsEarnedAsReferrer;
}

/** Nombre de filleules enregistrées côté serveur. */
export async function getReferralsCount(): Promise<number> {
  const stats = await fetchReferralDashboardStats();
  return stats.referralsCount;
}
