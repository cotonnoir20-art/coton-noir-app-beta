import { Alert, Linking, Platform } from 'react-native';

/** Politiques d’ouverture de liens externes (anti-phishing). */
export type SafeLinkPolicy =
  | 'premium_checkout'
  | 'partner'
  | 'product'
  | 'social'
  | 'store'
  | 'mailto';

export type SafeUrlResult =
  | { ok: true; url: string }
  | { ok: false; reason: string };

const DANGEROUS_PROTOCOL =
  /^(javascript|data|file|intent|market|vbscript|blob):/i;

/** Hôtes exacts autorisés par politique. */
const EXACT_HOSTS: Record<Exclude<SafeLinkPolicy, 'mailto'>, readonly string[]> = {
  premium_checkout: [
    'cotonnoir.app',
    'www.cotonnoir.app',
    'coton-noir.com',
    'www.coton-noir.com',
    'checkout.stripe.com',
    'buy.stripe.com',
    'billing.stripe.com',
    'pay.stripe.com',
    'apps.apple.com',
    'play.google.com',
  ],
  store: [
    'cotonnoir.app',
    'www.cotonnoir.app',
    'apps.apple.com',
    'itunes.apple.com',
    'play.google.com',
  ],
  social: [
    'instagram.com',
    'www.instagram.com',
    'tiktok.com',
    'www.tiktok.com',
  ],
  partner: [
    'youtube.com',
    'www.youtube.com',
    'youtu.be',
    'm.youtube.com',
    'instagram.com',
    'www.instagram.com',
    'amazon.fr',
    'www.amazon.fr',
    'amazon.com',
    'www.amazon.com',
    'sephora.fr',
    'www.sephora.fr',
    'nocibe.fr',
    'www.nocibe.fr',
    'asos.com',
    'www.asos.com',
    'lookfantastic.com',
    'www.lookfantastic.com',
    'notino.fr',
    'www.notino.fr',
    'cotonnoir.app',
    'www.cotonnoir.app',
    'coton-noir.com',
    'www.coton-noir.com',
  ],
  product: [
    'amazon.fr',
    'www.amazon.fr',
    'amazon.com',
    'www.amazon.com',
    'sephora.fr',
    'www.sephora.fr',
    'nocibe.fr',
    'www.nocibe.fr',
    'cotonnoir.app',
    'www.cotonnoir.app',
    'coton-noir.com',
    'www.coton-noir.com',
  ],
};

/** Suffixes de domaine autorisés (sous-domaines inclus). */
const SUFFIX_HOSTS: Record<Exclude<SafeLinkPolicy, 'mailto'>, readonly string[]> = {
  premium_checkout: ['.stripe.com'],
  store: [],
  social: [],
  partner: ['.myshopify.com'],
  product: ['.myshopify.com'],
};

function extraHostsFromEnv(): Set<string> {
  const raw =
    typeof process !== 'undefined'
      ? process.env?.EXPO_PUBLIC_LINK_ALLOWLIST_HOSTS
      : undefined;
  if (typeof raw !== 'string' || !raw.trim()) return new Set();
  return new Set(
    raw
      .split(',')
      .map(h => h.trim().toLowerCase())
      .filter(Boolean),
  );
}

const EXTRA_HOSTS = extraHostsFromEnv();

function isPrivateOrLocalHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === 'localhost' || h.endsWith('.localhost')) return true;
  if (h === '127.0.0.1' || h.startsWith('127.')) return true;
  if (h === '0.0.0.0') return true;
  if (h.startsWith('10.')) return true;
  if (h.startsWith('192.168.')) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return true;
  if (h.includes(':') && !h.startsWith('[')) return true; // IPv6 / host:port
  return false;
}

function hostMatchesPolicy(hostname: string, policy: Exclude<SafeLinkPolicy, 'mailto'>): boolean {
  const h = hostname.toLowerCase();
  if (EXTRA_HOSTS.has(h)) return true;
  if (EXACT_HOSTS[policy].includes(h)) return true;
  return SUFFIX_HOSTS[policy].some(suffix => h === suffix.slice(1) || h.endsWith(suffix));
}

export function normalizeHttpUrl(raw: string): string | null {
  const t = raw.trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

/**
 * Valide une URL avant ouverture. Bloque schémas dangereux, IP locales, hôtes hors allowlist.
 */
export function validateExternalUrl(
  raw: string,
  policy: SafeLinkPolicy,
): SafeUrlResult {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, reason: 'empty' };

  if (policy === 'mailto') {
    if (!/^mailto:[^\s]+@[^\s]+\.[^\s]+$/i.test(trimmed)) {
      return { ok: false, reason: 'invalid_mailto' };
    }
    return { ok: true, url: trimmed };
  }

  if (DANGEROUS_PROTOCOL.test(trimmed)) {
    return { ok: false, reason: 'dangerous_protocol' };
  }

  const normalized = normalizeHttpUrl(trimmed);
  if (!normalized) return { ok: false, reason: 'empty' };

  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    return { ok: false, reason: 'invalid_url' };
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return { ok: false, reason: 'protocol_not_allowed' };
  }

  if (parsed.protocol === 'http:' && Platform.OS !== 'web' && !__DEV__) {
    return { ok: false, reason: 'https_required' };
  }

  const hostname = parsed.hostname.toLowerCase();
  if (isPrivateOrLocalHost(hostname)) {
    return { ok: false, reason: 'private_host' };
  }

  if (parsed.username || parsed.password) {
    return { ok: false, reason: 'credentials_in_url' };
  }

  if (!hostMatchesPolicy(hostname, policy)) {
    return { ok: false, reason: 'host_not_allowed' };
  }

  return { ok: true, url: parsed.toString() };
}

export async function openSafeUrl(
  raw: string,
  policy: SafeLinkPolicy,
  options?: { alertTitle?: string },
): Promise<boolean> {
  const title = options?.alertTitle ?? 'Lien';
  const result = validateExternalUrl(raw, policy);
  if (!result.ok) {
    if (__DEV__) {
      console.warn('[safeLinking] blocked', policy, result.reason, raw);
    }
    Alert.alert(title, "Ce lien n'est pas autorisé pour des raisons de sécurité.");
    return false;
  }

  const canOpen = await Linking.canOpenURL(result.url).catch(() => false);
  if (!canOpen) {
    Alert.alert(title, "Impossible d'ouvrir ce lien.");
    return false;
  }

  try {
    await Linking.openURL(result.url);
    return true;
  } catch {
    Alert.alert(title, "Impossible d'ouvrir ce lien.");
    return false;
  }
}

export async function openSafeMailto(
  email: string,
  options?: { subject?: string },
): Promise<boolean> {
  const addr = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr)) {
    Alert.alert('Contact', 'Adresse e-mail invalide.');
    return false;
  }
  const allowed =
    addr.endsWith('@coton-noir.com') ||
    addr.endsWith('@cotonnoir.app') ||
    (__DEV__ && addr.endsWith('@cotonnoir.app'));
  if (!allowed) {
    Alert.alert('Contact', "Adresse de support non reconnue.");
    return false;
  }
  const q = options?.subject
    ? `?subject=${encodeURIComponent(options.subject)}`
    : '';
  return openSafeUrl(`mailto:${addr}${q}`, 'mailto', { alertTitle: 'Contact' });
}
