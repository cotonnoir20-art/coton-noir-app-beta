import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppHeader } from '../src/components/AppHeader';
import { Colors } from '../src/theme/colors';
import { useApp } from '../src/context/AppContext';
import { useAuth } from '../src/context/AuthContext';
import { CHALLENGE_HYDRA_PTS_PER_DAY, PTS_DEFI_LABEL } from '../src/constants/productPitch';
import {
  HYDRA_DURATION_DAYS,
  HYDRA_SLUG,
  type HydraChallengeState,
  hydraDayNumber,
  hydraDaysRemaining,
  joinHydraChallenge,
  loadHydraChallengeState,
} from '../src/lib/hydraChallenge';
import {
  fetchHydraLeaderboard,
  fetchHydraParticipantCount,
  fetchHydraServerStats,
  type HydraLeaderboardRow,
  type HydraServerStats,
} from '../src/lib/hydraChallengeApi';
import { trackProductEvent } from '../src/lib/productAnalytics';

export default function HydraChallengeScreen() {
  const router = useRouter();
  const { state } = useApp();
  const { session } = useAuth();

  const [hydra, setHydra] = useState<HydraChallengeState>({
    joined: false,
    joinedAt: null,
    postDays: [],
  });
  const [serverStats, setServerStats] = useState<HydraServerStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<HydraLeaderboardRow[]>([]);
  const [participants, setParticipants] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAll = useCallback(async () => {
    const [local, stats, board, count] = await Promise.all([
      loadHydraChallengeState(),
      fetchHydraServerStats(),
      fetchHydraLeaderboard(25),
      fetchHydraParticipantCount(),
    ]);
    setHydra(local);
    setServerStats(stats);
    setLeaderboard(board);
    setParticipants(count);
  }, []);

  useEffect(() => {
    void loadAll().finally(() => setLoading(false));
  }, [loadAll]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  }, [loadAll]);

  const activeDays = useMemo(() => {
    const serverDays = serverStats?.active_days ?? 0;
    const localDays = hydra.postDays.length;
    return Math.max(serverDays, localDays);
  }, [serverStats, hydra.postDays.length]);

  const myRank = useMemo(
    () => leaderboard.find(r => r.is_me)?.rank_num ?? null,
    [leaderboard],
  );

  async function handleJoin() {
    if (!session?.user?.id) {
      router.push('/' as any);
      return;
    }
    const next = await joinHydraChallenge(true);
    setHydra(next);
    void trackProductEvent('challenge_joined', { challenge_slug: HYDRA_SLUG, source: 'hydra_screen' });
    await loadAll();
    router.push('/community?challenge=hydra' as any);
  }

  const displayName = state.profile.name?.trim() || 'Toi';

  return (
    <SafeAreaView style={S.safe} edges={['top']}>
      <AppHeader title="Hydra Challenge 30" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={S.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.amber} />
        }
      >
        <View style={S.hero}>
          <View style={S.livePill}>
            <Text style={S.liveText}>● DÉFI COLLECTIF</Text>
          </View>
          <Text style={S.heroTitle}>#HydraChallenge30</Text>
          <Text style={S.heroSub}>
            30 jours d&apos;hydratation — publie ta progression pour inspirer le groupe et grimper au classement.
          </Text>
          <View style={S.heroMeta}>
            <Text style={S.heroMetaText}>
              {participants != null ? `${participants} inscrites` : '— inscrites'}
            </Text>
            <Text style={S.heroMetaText}>
              +{CHALLENGE_HYDRA_PTS_PER_DAY} {PTS_DEFI_LABEL}/jour
            </Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={Colors.amber} style={{ marginVertical: 24 }} />
        ) : (
          <>
            <View style={S.statsRow}>
              <View style={S.statBox}>
                <Text style={S.statVal}>
                  {hydra.joined || serverStats?.joined_at
                    ? String(hydraDayNumber(hydra.joinedAt ?? serverStats?.joined_at ?? null))
                    : '—'}
                </Text>
                <Text style={S.statLabel}>Jour actuel</Text>
              </View>
              <View style={[S.statBox, S.statBorder]}>
                <Text style={S.statVal}>{activeDays}</Text>
                <Text style={S.statLabel}>Jours actifs</Text>
              </View>
              <View style={S.statBox}>
                <Text style={S.statVal}>
                  {hydra.joined || serverStats?.joined_at
                    ? `${hydraDaysRemaining(hydra.joinedAt ?? serverStats?.joined_at ?? null)}`
                    : HYDRA_DURATION_DAYS}
                </Text>
                <Text style={S.statLabel}>Jours restants</Text>
              </View>
            </View>

            {(hydra.joined || serverStats?.joined_at) && (
              <View style={S.progressCard}>
                <Text style={S.progressTitle}>Ta progression</Text>
                <Text style={S.progressSub}>
                  {displayName} · objectif {activeDays}/{HYDRA_DURATION_DAYS} jours de publication
                  {myRank != null ? ` · #${myRank} au classement` : ''}
                </Text>
                <View style={S.progressBarBg}>
                  <View
                    style={[
                      S.progressBarFill,
                      { width: `${Math.min(100, Math.round((activeDays / HYDRA_DURATION_DAYS) * 100))}%` },
                    ]}
                  />
                </View>
              </View>
            )}

            <View style={S.actions}>
              <TouchableOpacity
                style={S.primaryBtn}
                onPress={() => {
                  if (hydra.joined || serverStats?.joined_at) {
                    router.push('/community?challenge=hydra' as any);
                  } else {
                    void handleJoin();
                  }
                }}
              >
                <Text style={S.primaryBtnText}>
                  {hydra.joined || serverStats?.joined_at ? 'Publier du jour' : 'Rejoindre le défi'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={S.secondaryBtn}
                onPress={() => router.push('/community' as any)}
              >
                <Ionicons name="chatbubbles-outline" size={18} color={Colors.ink} />
                <Text style={S.secondaryBtnText}>Fil communauté</Text>
              </TouchableOpacity>
            </View>

            <Text style={S.secTitle}>Classement</Text>
            <Text style={S.secHint}>
              Classement par jours actifs (posts #HydraChallenge30). Publie régulièrement pour monter.
            </Text>

            {leaderboard.length === 0 ? (
              <View style={S.emptyBox}>
                <Text style={S.emptyText}>
                  Aucune participante classée pour l&apos;instant. Sois la première à publier !
                </Text>
              </View>
            ) : (
              leaderboard.map(row => (
                <View
                  key={row.user_id}
                  style={[S.rankRow, row.is_me && S.rankRowMe]}
                >
                  <Text style={[S.rankNum, row.rank_num <= 3 && S.rankNumTop]}>
                    {row.rank_num <= 3 ? ['🥇', '🥈', '🥉'][row.rank_num - 1] : `#${row.rank_num}`}
                  </Text>
                  <View style={S.rankInfo}>
                    <Text style={S.rankName}>
                      {row.is_me ? `${row.display_name} (toi)` : row.display_name}
                    </Text>
                    <Text style={S.rankSub}>
                      {row.active_days} jour{row.active_days > 1 ? 's' : ''} actif{row.active_days > 1 ? 's' : ''}
                      {' · '}
                      {row.post_count} post{row.post_count > 1 ? 's' : ''}
                    </Text>
                  </View>
                  <Text style={S.rankScore}>{row.active_days}</Text>
                </View>
              ))
            )}
          </>
        )}

        <View style={{ height: 28 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: 20, paddingBottom: 16 },

  hero: {
    backgroundColor: Colors.ink,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
  },
  livePill: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.amberLight,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
  },
  liveText: { fontSize: 10, fontFamily: 'DMSans_700Bold', color: Colors.amber },
  heroTitle: { fontSize: 22, fontFamily: 'Satoshi_500Medium', color: '#fff', marginBottom: 6 },
  heroSub: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 18,
  },
  heroMeta: { flexDirection: 'row', gap: 14, marginTop: 12 },
  heroMetaText: { fontSize: 11, fontFamily: 'DMSans_500Medium', color: 'rgba(255,255,255,0.7)' },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.cream,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
    overflow: 'hidden',
  },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  statBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: Colors.border },
  statVal: { fontSize: 18, fontFamily: 'Satoshi_500Medium', color: Colors.ink },
  statLabel: { fontSize: 10, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, marginTop: 2 },

  progressCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 14,
  },
  progressTitle: { fontSize: 14, fontFamily: 'DMSans_700Bold', color: Colors.ink },
  progressSub: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    marginTop: 4,
    marginBottom: 10,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 999,
    backgroundColor: Colors.cream,
    overflow: 'hidden',
  },
  progressBarFill: { height: '100%', backgroundColor: Colors.sage, borderRadius: 999 },

  actions: { gap: 10, marginBottom: 20 },
  primaryBtn: {
    backgroundColor: Colors.amber,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryBtnText: { fontSize: 15, fontFamily: 'DMSans_700Bold', color: Colors.ink },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  secondaryBtnText: { fontSize: 14, fontFamily: 'DMSans_600SemiBold', color: Colors.ink },

  secTitle: { fontSize: 18, fontFamily: 'Satoshi_500Medium', color: Colors.ink, marginBottom: 4 },
  secHint: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    marginBottom: 12,
    lineHeight: 17,
  },

  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    marginBottom: 8,
  },
  rankRowMe: { borderColor: Colors.sage, backgroundColor: Colors.sageLight },
  rankNum: { width: 36, fontSize: 14, fontFamily: 'DMSans_700Bold', color: Colors.warmGray, textAlign: 'center' },
  rankNumTop: { fontSize: 18 },
  rankInfo: { flex: 1 },
  rankName: { fontSize: 14, fontFamily: 'DMSans_600SemiBold', color: Colors.ink },
  rankSub: { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, marginTop: 2 },
  rankScore: { fontSize: 16, fontFamily: 'Satoshi_500Medium', color: Colors.ink },

  emptyBox: {
    padding: 20,
    backgroundColor: Colors.cream,
    borderRadius: 14,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    textAlign: 'center',
    lineHeight: 18,
  },
});
