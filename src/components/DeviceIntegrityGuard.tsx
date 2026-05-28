import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../theme/colors';
import { useAuth } from '../context/AuthContext';
import { scanDeviceIntegrity, type DeviceIntegrityReport } from '../lib/deviceIntegrity';
import { bootstrapDeviceAttestation } from '../lib/integrityApi';
import { isLocalIntegrityEnforced, isNativeMobile } from '../lib/integrityConfig';

type Props = { children: React.ReactNode };

/**
 * Bloque l’app sur appareil rooté / jailbreaké / hooké si enforcement activé.
 * Lance l’attestation Play Integrity / App Attest en arrière-plan (complément serveur).
 */
export function DeviceIntegrityGuard({ children }: Props) {
  const { session, loading: authLoading } = useAuth();
  const [report, setReport] = useState<DeviceIntegrityReport | null>(null);
  // En dev (Expo Go) on ne scanne pas : jail-monkey peut bloquer indéfiniment.
  const [scanning, setScanning] = useState(isNativeMobile() && !__DEV__);

  useEffect(() => {
    if (!isNativeMobile() || __DEV__) {
      setScanning(false);
      return;
    }
    let cancelled = false;
    // Timeout de 4 s pour éviter un blocage si le module natif ne répond pas.
    const timeout = setTimeout(() => {
      if (!cancelled) setScanning(false);
    }, 4000);
    scanDeviceIntegrity().then(r => {
      clearTimeout(timeout);
      if (!cancelled) {
        setReport(r);
        setScanning(false);
      }
    }).catch(() => {
      clearTimeout(timeout);
      if (!cancelled) setScanning(false);
    });
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId || authLoading) return;
    bootstrapDeviceAttestation(userId).catch(() => {});
  }, [session?.user?.id, authLoading]);

  if (!isNativeMobile()) {
    return <>{children}</>;
  }

  if (scanning) {
    return (
      <View style={S.centered}>
        <ActivityIndicator color={Colors.amber} />
      </View>
    );
  }

  const blocked =
    isLocalIntegrityEnforced() && report?.compromised === true;

  if (blocked) {
    return (
      <View style={S.centered}>
        <Text style={S.emoji}>🛡️</Text>
        <Text style={S.title}>Appareil non pris en charge</Text>
        <Text style={S.body}>
          Pour protéger ton compte et tes données, Coton Noir ne peut pas fonctionner sur un
          appareil modifié (root, jailbreak) ou avec des outils de contournement détectés.
        </Text>
        <Text style={S.hint}>
          Utilise l’application officielle depuis l’App Store ou le Play Store sur un appareil
          standard.
        </Text>
        {__DEV__ && report?.reasons.length ? (
          <Text style={S.devReasons}>{report.reasons.join(', ')}</Text>
        ) : null}
      </View>
    );
  }

  return <>{children}</>;
}

const S = StyleSheet.create({
  centered: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emoji: { fontSize: 48, marginBottom: 16 },
  title: {
    fontSize: 20,
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
    marginBottom: 12,
  },
  hint: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    textAlign: 'center',
    lineHeight: 18,
    opacity: 0.85,
  },
  devReasons: {
    marginTop: 16,
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: Colors.rose,
    textAlign: 'center',
  },
});
