import { useEffect } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../theme/colors';
import {
  isWebProductionRestricted,
  purgeLegacyWebLocalStorageAuth,
} from '../lib/webAuthPolicy';
import { openSafeUrl } from '../lib/safeLinking';

const STORE_URL = 'https://www.cotonnoir.app';

/**
 * En production web : bloque l’app (pas de session Supabase persistante / surface XSS).
 */
export function WebProductionBlocker({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (Platform.OS === 'web') purgeLegacyWebLocalStorageAuth();
  }, []);

  if (Platform.OS !== 'web' || !isWebProductionRestricted()) {
    return <>{children}</>;
  }

  return (
    <View style={S.root}>
      <Text style={S.emoji}>📱</Text>
      <Text style={S.title}>Coton Noir sur mobile</Text>
      <Text style={S.body}>
        Pour ta sécurité, la version navigateur complète n’est pas disponible. Télécharge
        l’application iOS ou Android pour te connecter en toute sécurité.
      </Text>
      <Text
        style={S.link}
        onPress={() => openSafeUrl(STORE_URL, 'store').catch(() => {})}
      >
        Découvrir Coton Noir →
      </Text>
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
    fontFamily: 'Poppins_700Bold',
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
  link: {
    marginTop: 24,
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
    color: Colors.amber,
  },
});
