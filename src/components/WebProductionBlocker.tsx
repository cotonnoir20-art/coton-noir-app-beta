import { useEffect } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { usePathname } from 'expo-router';
import { Colors } from '../theme/colors';
import {
  isWebProductionRestricted,
  purgeLegacyWebLocalStorageAuth,
} from '../lib/webAuthPolicy';
import { openSafeUrl, validateExternalUrl } from '../lib/safeLinking';

const PUBLIC_WEB_PATHS = ['/', '/privacy', '/cgv', '/legal'] as const;

function isPublicLegalWebPath(pathname: string): boolean {
  const p = pathname.replace(/\/$/, '') || '/';
  return PUBLIC_WEB_PATHS.some(
    route => p === route || (route !== '/' && p.startsWith(`${route}/`)),
  );
}

function readStoreUrl(): string | null {
  const raw =
    typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_STORE_URL;
  if (typeof raw !== 'string' || !raw.trim()) return null;
  const v = validateExternalUrl(raw.trim(), 'store');
  return v.ok ? v.url : null;
}

function isVercelStagingHost(): boolean {
  if (typeof globalThis.location === 'undefined') return false;
  return /\.vercel\.app$/i.test(globalThis.location.hostname);
}

/**
 * En production web sans staging : bloque l’app (sécurité).
 * Avec EXPO_PUBLIC_ALLOW_WEB_PROD=true au build → l’app PWA beta s’affiche.
 */
export function WebProductionBlocker({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    if (Platform.OS === 'web') purgeLegacyWebLocalStorageAuth();
  }, []);

  if (
    Platform.OS !== 'web' ||
    !isWebProductionRestricted() ||
    isPublicLegalWebPath(pathname)
  ) {
    return <>{children}</>;
  }

  const onVercel = isVercelStagingHost();
  const storeUrl = readStoreUrl();

  return (
    <View style={S.root}>
      <Text style={S.emoji}>{onVercel ? '⚙️' : '📱'}</Text>
      <Text style={S.title}>
        {onVercel ? 'Beta web en cours de configuration' : 'Coton Noir sur mobile'}
      </Text>
      <Text style={S.body}>
        {onVercel
          ? "Ce déploiement Vercel n'a pas encore les variables PWA. Dans Vercel → Settings → Environment Variables, ajoute EXPO_PUBLIC_ALLOW_WEB_PROD=true et EXPO_PUBLIC_WEB_STAGING_AUTH_PERSIST=true, puis Redeploy."
          : "Pour ta sécurité, la version navigateur complète n'est pas disponible ici. Télécharge l'application iOS ou Android pour te connecter en toute sécurité."}
      </Text>
      {storeUrl ? (
        <Text
          style={S.link}
          onPress={() => openSafeUrl(storeUrl, 'store').catch(() => {})}
        >
          En savoir plus →
        </Text>
      ) : onVercel ? (
        <Text style={S.hint}>
          En attendant, utilise l’URL .vercel.app après le redeploy — pas www.cotonnoir.app
          (domaine pas encore configuré).
        </Text>
      ) : null}
    </View>
  );
}

const S = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emoji: { fontSize: 48, marginBottom: 16 },
  title: {
    fontSize: 22,
    fontFamily: 'Satoshi_500Medium',
    color: Colors.ink,
    textAlign: 'center',
    marginBottom: 12,
  },
  body: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 400,
  },
  hint: {
    marginTop: 20,
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 400,
  },
  link: {
    marginTop: 24,
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
    color: Colors.amber,
  },
});
