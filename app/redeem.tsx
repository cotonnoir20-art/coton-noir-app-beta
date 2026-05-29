import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/theme/colors';
import { useApp } from '../src/context/AppContext';
import { supabase } from '../src/lib/supabase';
import { AppHeader } from '../src/components/AppHeader';
import { CoinIcon } from '../src/components/CoinIcon';
import { REWARDS } from '../src/data/rewards';
import { formatCc } from '../src/lib/cotonCoins';

type CatalogRow = { id: string; emoji: string; name: string; cost: number; locked: boolean };

function mapCatalogRow(c: Record<string, unknown>): CatalogRow {
  return {
    id: String(c.id ?? ''),
    emoji: typeof c.emoji === 'string' && c.emoji.trim() ? c.emoji.trim() : '🎁',
    name: typeof c.name === 'string' ? c.name : '',
    cost: typeof c.cost === 'number' ? c.cost : parseInt(String(c.cost ?? 0), 10) || 0,
    locked: Boolean(c.locked),
  };
}

export default function RedeemScreen() {
  const router = useRouter();
  const { state, spendCoinsSecure } = useApp();
  const { coins } = state;

  const [catalog, setCatalog] = useState<CatalogRow[]>(() =>
    REWARDS.map(r => ({ id: String(r.id), emoji: r.emoji, name: r.name, cost: r.cost, locked: r.locked }))
  );

  useEffect(() => {
    supabase
      .from('reward_catalog')
      .select('*')
      .eq('status', 'active')
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (!error && Array.isArray(data) && data.length > 0) {
          setCatalog(data.map(c => mapCatalogRow(c as Record<string, unknown>)));
        }
      });
  }, []);

  async function handleRedeem(r: CatalogRow) {
    const result = await spendCoinsSecure(r.cost, r.name, { rewardId: r.id });
    if (!result.ok) {
      Alert.alert('Échange impossible', 'Solde insuffisant ou erreur serveur. Réessaie dans un instant.');
      return;
    }
    Alert.alert(
      'Récompense débloquée 🎁',
      `${r.name} — ${formatCc(r.cost)} débités. Récupère ton avantage dans Codes promo.`,
      [
        { text: 'Plus tard', style: 'cancel' },
        { text: 'Voir mes codes →', onPress: () => router.replace('/codes' as any) },
      ],
    );
  }

  const affordable = catalog.filter(r => !r.locked && coins >= r.cost);
  const rest       = catalog.filter(r => r.locked || coins < r.cost);

  return (
    <SafeAreaView style={S.safe} edges={['top']}>

      <AppHeader title="Échanger mes avoirs" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.content}>

        {/* Solde */}
        <View style={S.soldeCard}>
          <CoinIcon size={28} />
          <View style={{ flex: 1 }}>
            <Text style={S.soldeLabel}>TON SOLDE</Text>
            <Text style={S.soldeAmount}>{coins.toLocaleString('fr-FR')} CC</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push('/rewards' as any)}
            style={S.histLink}
            hitSlop={8}
          >
            <Text style={S.histLinkText}>Historique</Text>
            <Ionicons name="chevron-forward" size={13} color={Colors.amber} />
          </TouchableOpacity>
        </View>

        {/* ── Disponibles maintenant ── */}
        {affordable.length > 0 && (
          <>
            <Text style={S.secTitle}>Disponibles maintenant</Text>
            {affordable.map(r => (
              <View key={r.id} style={[S.card, S.cardAffordable]}>
                <View style={[S.iconWrap, { backgroundColor: Colors.amberLight }]}>
                  <Text style={S.emoji}>{r.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={S.name}>{r.name}</Text>
                  <View style={S.costRow}>
                    <CoinIcon size={13} />
                    <Text style={S.cost}>{r.cost.toLocaleString('fr-FR')} CC</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={S.redeemBtn}
                  onPress={() => void handleRedeem(r)}
                  activeOpacity={0.85}
                >
                  <Text style={S.redeemBtnText}>Échanger</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        {affordable.length === 0 && (
          <View style={S.emptyBox}>
            <Text style={S.emptyEmoji}>🪙</Text>
            <Text style={S.emptyText}>Continue à gagner des CC pour débloquer des récompenses !</Text>
          </View>
        )}

        {/* ── Reste du catalogue ── */}
        {rest.length > 0 && (
          <>
            <Text style={[S.secTitle, { marginTop: 8 }]}>À venir</Text>
            {rest.map(r => {
              const pct = Math.min(100, Math.round((coins / r.cost) * 100));
              const missing = r.cost - coins;
              return (
                <View key={r.id} style={[S.card, r.locked && S.cardLocked]}>
                  <View style={[S.iconWrap, { backgroundColor: Colors.cream, opacity: r.locked ? 0.5 : 1 }]}>
                    <Text style={[S.emoji, r.locked && { opacity: 0.4 }]}>{r.locked ? '🔒' : r.emoji}</Text>
                  </View>
                  <View style={{ flex: 1, gap: 6 }}>
                    <View style={S.nameRow}>
                      <Text style={[S.name, { opacity: r.locked ? 0.5 : 1 }]}>{r.name}</Text>
                      <View style={S.costRow}>
                        <CoinIcon size={12} />
                        <Text style={S.cost}>{r.cost.toLocaleString('fr-FR')} CC</Text>
                      </View>
                    </View>
                    {!r.locked && (
                      <>
                        <View style={S.progressBg}>
                          <View style={[S.progressFill, { width: `${pct}%` as any }]} />
                        </View>
                        <Text style={S.missingText}>encore {missing.toLocaleString('fr-FR')} CC</Text>
                      </>
                    )}
                    {r.locked && (
                      <Text style={S.lockedText}>Bientôt disponible</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: 20, paddingBottom: 16 },

  soldeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.ink,
    borderRadius: 18,
    padding: 18,
    marginBottom: 24,
  },
  soldeLabel:  { fontSize: 10, fontFamily: 'DMSans_500Medium', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.8 },
  soldeAmount: { fontSize: 26, fontFamily: 'Satoshi_500Medium', color: Colors.amber, marginTop: 2 },
  histLink:    { flexDirection: 'row', alignItems: 'center', gap: 2 },
  histLinkText: { fontSize: 12, fontFamily: 'DMSans_600SemiBold', color: Colors.amber },

  secTitle: {
    fontSize: 17,
    fontFamily: 'Satoshi_500Medium',
    color: Colors.ink,
    marginBottom: 12,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 10,
  },
  cardAffordable: {
    borderColor: '#86EFAC',
    backgroundColor: '#F0FDF4',
  },
  cardLocked: { opacity: 0.55 },

  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  emoji: { fontSize: 22 },

  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name:    { fontSize: 14, fontFamily: 'DMSans_600SemiBold', color: Colors.ink, flex: 1 },
  costRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cost:    { fontSize: 12, fontFamily: 'DMSans_600SemiBold', color: Colors.amber },

  redeemBtn: {
    backgroundColor: Colors.amber,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexShrink: 0,
  },
  redeemBtnText: { fontSize: 13, fontFamily: 'DMSans_700Bold', color: '#fff' },

  progressBg: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    backgroundColor: Colors.amber,
    borderRadius: 2,
  },
  missingText: { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray },
  lockedText:  { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, fontStyle: 'italic' },

  emptyBox: {
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.cream,
    borderRadius: 16,
    paddingVertical: 28,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  emptyEmoji: { fontSize: 36 },
  emptyText:  { fontSize: 13, fontFamily: 'DMSans_500Medium', color: Colors.warmGray, textAlign: 'center', lineHeight: 20 },
});
