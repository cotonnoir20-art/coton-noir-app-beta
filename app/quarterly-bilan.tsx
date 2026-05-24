import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/theme/colors';
import { AppHeader } from '../src/components/AppHeader';
import { useApp } from '../src/context/AppContext';
import { usePremium } from '../src/context/PremiumContext';
import { BCEmojiAvatar } from '../src/components/blackCotton/BCEmojiAvatar';
import { buildQuarterlyBilan } from '../src/lib/quarterlyBilan';
import { resolveBlackCottonBilanSynthesis } from '../src/lib/monthlyBilanSynthesis';
import { exportBilanPdf } from '../src/lib/bilanPdfExport';
import { markPremiumFirstValue } from '../src/lib/premiumTrial';
import { trackProductEvent } from '../src/lib/productAnalytics';

export default function QuarterlyBilanScreen() {
  const router = useRouter();
  const { state } = useApp();
  const { requireAccess, hasAccess } = usePremium();
  const bilan = useMemo(() => buildQuarterlyBilan(state), [state]);
  const [bcText, setBcText] = useState('');
  const [bcScore, setBcScore] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    void resolveBlackCottonBilanSynthesis(state).then(res => {
      if (!cancelled) {
        setBcText(res.text);
        setBcScore(res.score ?? null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [state]);

  async function handleExport() {
    const ok = await requireAccess('growth_export');
    if (!ok) return;
    if (hasAccess) {
      void markPremiumFirstValue('export');
      void trackProductEvent('premium_trial_first_value', { kind: 'export' });
    }
    await exportBilanPdf(state, {
      title: 'Bilan trimestriel Coton Noir',
      periodDays: 90,
    });
  }

  const stats = [
    { label: 'Routines validées', value: String(bilan.routinesValidated) },
    { label: 'Wash days', value: String(bilan.washdaysCount) },
    { label: 'Mesures (Devant)', value: String(bilan.measurementsCount) },
    {
      label: 'Progression longueur',
      value: bilan.growthDeltaCm != null ? `${bilan.growthDeltaCm > 0 ? '+' : ''}${bilan.growthDeltaCm} cm` : '—',
    },
    { label: 'Streak actuel', value: `${bilan.streakCurrent} j` },
  ];

  return (
    <SafeAreaView style={S.safe} edges={['top']}>
      <AppHeader title="Bilan trimestriel" onBack={() => router.back()} />
      <ScrollView contentContainerStyle={S.content}>
        <Text style={S.period}>{bilan.periodLabel}</Text>

        <View style={S.statsGrid}>
          {stats.map(s => (
            <View key={s.label} style={S.statCard}>
              <Text style={S.statVal}>{s.value}</Text>
              <Text style={S.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={S.bcCard}>
          <BCEmojiAvatar size={48} mood="coaching" />
          <View style={{ flex: 1 }}>
            <Text style={S.bcTitle}>Synthèse Black Cotton</Text>
            {bcScore != null ? (
              <Text style={S.bcScore}>Score diagnostic · {bcScore}/100</Text>
            ) : null}
            <Text style={S.bcSub}>{bcText || bilan.synthesisHint}</Text>
          </View>
        </View>

        <View style={S.rdvCard}>
          <Ionicons name="calendar-outline" size={22} color={Colors.rose} />
          <View style={{ flex: 1 }}>
            <Text style={S.rdvTitle}>RDV coiffeuse / trichologue</Text>
            <Text style={S.rdvSub}>
              Exporte ce bilan PDF avec tes mesures, routines et la synthèse de ton dernier diagnostic.
            </Text>
          </View>
        </View>

        <TouchableOpacity style={S.exportBtn} onPress={() => void handleExport()}>
          <Text style={S.exportBtnText}>Exporter le bilan PDF (Premium)</Text>
        </TouchableOpacity>

        <TouchableOpacity style={S.linkBtn} onPress={() => router.push('/growth' as any)}>
          <Text style={S.linkBtnText}>Voir mes mesures détaillées</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 16, paddingBottom: 32 },
  period: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    marginBottom: 14,
  },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statCard: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
  },
  statVal: { fontSize: 20, fontFamily: 'Satoshi_500Medium', color: Colors.ink },
  statLabel: { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, marginTop: 4 },
  bcCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: Colors.cream,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bcTitle: { fontSize: 14, fontFamily: 'DMSans_700Bold', color: Colors.ink, marginBottom: 4 },
  bcScore: { fontSize: 11, fontFamily: 'DMSans_600SemiBold', color: Colors.amberDark, marginBottom: 6 },
  bcSub: { fontSize: 12, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, lineHeight: 17 },
  rdvCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: Colors.blush,
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.rose,
  },
  rdvTitle: { fontSize: 14, fontFamily: 'DMSans_700Bold', color: Colors.ink, marginBottom: 4 },
  rdvSub: { fontSize: 12, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, lineHeight: 17 },
  exportBtn: {
    backgroundColor: Colors.ink,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  exportBtnText: { fontSize: 14, fontFamily: 'DMSans_700Bold', color: Colors.amber },
  linkBtn: { alignItems: 'center', paddingVertical: 10 },
  linkBtnText: { fontSize: 13, fontFamily: 'DMSans_600SemiBold', color: Colors.rose },
});
