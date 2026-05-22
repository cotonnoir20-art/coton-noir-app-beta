import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/theme/colors';
import { AppHeader } from '../src/components/AppHeader';
import { useAchievements } from '../src/context/AchievementsContext';
import { EmptyAnimation } from '../src/components/animations/EmptyAnimation';
import type { AchievementGroup, AchievementStatus } from '../src/data/achievements';
import { CHALLENGE_HYDRA_PTS_PER_DAY, PTS_DEFI_LABEL } from '../src/constants/productPitch';

const GROUP_LABEL: Record<AchievementGroup, string> = {
  starter:   'Premiers pas',
  streak:    'Régularité',
  growth:    'Pousse & suivi',
  coins:     'CotonCoins',
  community: 'Communauté',
};

const GROUP_ORDER: AchievementGroup[] = ['starter', 'streak', 'growth', 'coins', 'community'];

const MONTHS_SHORT = [
  'janv.', 'févr.', 'mars', 'avril', 'mai', 'juin',
  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
];

function formatDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

function TierStars({ tier }: { tier: 1 | 2 | 3 }) {
  return (
    <View style={S.tierRow}>
      {Array.from({ length: tier }).map((_, i) => (
        <Text key={i} style={S.tierStar}>⭑</Text>
      ))}
    </View>
  );
}

function ProgressBar({ ratio }: { ratio: number }) {
  const pct = Math.max(0, Math.min(1, ratio));
  return (
    <View style={S.progressTrack}>
      <View style={[S.progressFill, { width: `${Math.round(pct * 100)}%` }]} />
    </View>
  );
}

function Card({ a }: { a: AchievementStatus }) {
  return (
    <View style={[S.card, !a.unlocked && S.cardLocked]}>
      <View style={S.emojiWrap}>
        <Text style={[S.emoji, !a.unlocked && { opacity: 0.35 }]}>{a.def.emoji}</Text>
      </View>
      <TierStars tier={a.def.tier} />
      <Text style={S.name} numberOfLines={2}>{a.def.name}</Text>
      <Text style={S.desc} numberOfLines={2}>{a.def.desc}</Text>
      {a.unlocked ? (
        <Text style={S.unlockedAt}>
          {a.unlockedAt ? `Débloqué le ${formatDate(a.unlockedAt)}` : 'Débloqué'}
        </Text>
      ) : (
        <>
          <ProgressBar ratio={a.progress} />
          <Text style={S.lockedHint}>
            {a.progress > 0 ? `${Math.round(a.progress * 100)}%` : 'Verrouillé'}
          </Text>
        </>
      )}
    </View>
  );
}

export default function AchievementsScreen() {
  const router = useRouter();
  const { achievements, unlockedCount, totalCount } = useAchievements();

  const grouped = useMemo(() => {
    const map = new Map<AchievementGroup, AchievementStatus[]>();
    for (const a of achievements) {
      const list = map.get(a.def.group) ?? [];
      list.push(a);
      map.set(a.def.group, list);
    }
    // Tri intra-groupe : débloqués d'abord (puis tier desc), sinon par progression desc.
    for (const list of map.values()) {
      list.sort((x, y) => {
        if (x.unlocked !== y.unlocked) return x.unlocked ? -1 : 1;
        if (x.unlocked) return y.def.tier - x.def.tier;
        return y.progress - x.progress;
      });
    }
    return GROUP_ORDER
      .map(g => ({ group: g, items: map.get(g) ?? [] }))
      .filter(g => g.items.length > 0);
  }, [achievements]);

  const ratio = totalCount > 0 ? unlockedCount / totalCount : 0;

  return (
    <SafeAreaView style={S.root} edges={['top']}>
      <AppHeader title="Mes badges" subtitle="Tes accomplissements capillaires" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={S.content}
      >
        {/* Hero compteur */}
        <View style={S.hero}>
          <Text style={S.heroNum}>
            {unlockedCount}
            <Text style={S.heroDenom}>{` / ${totalCount}`}</Text>
          </Text>
          <Text style={S.heroLabel}>badges débloqués</Text>
          <View style={S.heroBar}>
            <View style={[S.heroFill, { width: `${Math.round(ratio * 100)}%` }]} />
          </View>
        </View>

        <Text style={[S.groupTitle, { marginTop: 4 }]}>Défis collectifs</Text>
        <TouchableOpacity
          style={S.challengeCard}
          onPress={() => router.push('/hydra-challenge' as any)}
          activeOpacity={0.88}
        >
          <View style={S.challengeLive}>
            <Text style={S.challengeLiveText}>● LIVE</Text>
          </View>
          <Text style={S.challengeTitle}>Hydra Challenge 30</Text>
          <Text style={S.challengeSub}>
            30 jours d&apos;hydratation · posts communauté · +{CHALLENGE_HYDRA_PTS_PER_DAY} {PTS_DEFI_LABEL}/jour
          </Text>
          <Text style={S.challengeLink}>Rejoindre le défi →</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={S.highlightsLink}
          onPress={() => router.push('/highlights' as any)}
          activeOpacity={0.85}
        >
          <Text style={S.challengeAlt}>Voir tous les moments forts →</Text>
        </TouchableOpacity>

        <View style={S.shareTeaser}>
          <Ionicons name="share-social-outline" size={18} color={Colors.warmGray} />
          <Text style={S.shareTeaserText}>
            Partager ta collection de badges — bientôt disponible.
          </Text>
        </View>

        {grouped.length === 0 ? (
          <View style={S.empty}>
            <EmptyAnimation emoji="🏆" size={96} />
            <Text style={S.emptyText}>Pas encore de badge — c'est le moment de commencer !</Text>
          </View>
        ) : (
          grouped.map(g => (
            <View key={g.group} style={{ marginTop: 20 }}>
              <Text style={S.groupTitle}>{GROUP_LABEL[g.group]}</Text>
              <View style={S.grid}>
                {g.items.map(a => <Card key={a.def.id} a={a} />)}
              </View>
            </View>
          ))
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  root:    { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 18, paddingBottom: 32 },

  hero: {
    backgroundColor: Colors.ink,
    borderRadius: 22,
    padding: 22,
    alignItems: 'center',
  },
  heroNum: {
    fontSize: 56,
    fontFamily: 'Poppins_700Bold',
    color: '#fff',
    lineHeight: 60,
  },
  heroDenom: {
    fontSize: 22,
    fontFamily: 'Poppins_500Medium',
    color: 'rgba(255,255,255,0.55)',
  },
  heroLabel: {
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
    letterSpacing: 0.4,
  },
  heroBar: {
    marginTop: 14,
    width: '100%',
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  heroFill: {
    height: '100%',
    backgroundColor: Colors.amber,
    borderRadius: 4,
  },

  groupTitle: {
    fontSize: 13,
    fontFamily: 'DMSans_700Bold',
    color: Colors.warmGray,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    marginBottom: 10,
    paddingHorizontal: 2,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  card: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 160,
  },
  cardLocked: {
    backgroundColor: Colors.cream,
    opacity: 0.92,
  },

  emojiWrap: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.amberLight,
    marginBottom: 8,
  },
  emoji: { fontSize: 26, includeFontPadding: false as unknown as boolean },

  tierRow:  { flexDirection: 'row', gap: 2, marginBottom: 4 },
  tierStar: { fontSize: 11, color: Colors.amber, fontFamily: 'DMSans_700Bold' },

  name: {
    fontSize: 13,
    fontFamily: 'DMSans_700Bold',
    color: Colors.ink,
    marginBottom: 2,
  },
  desc: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    lineHeight: 15,
    marginBottom: 10,
    minHeight: 30,
  },
  unlockedAt: {
    fontSize: 11,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.sage,
  },
  lockedHint: {
    fontSize: 11,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.warmGray,
    marginTop: 6,
  },

  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.amber,
    borderRadius: 3,
  },

  empty: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 10,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
    color: Colors.warmGray,
    textAlign: 'center',
    paddingHorizontal: 24,
  },

  challengeCard: {
    backgroundColor: Colors.ink,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
  },
  challengeLive: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
  },
  challengeLiveText: {
    fontSize: 10,
    fontFamily: 'DMSans_700Bold',
    color: Colors.amber,
    letterSpacing: 0.6,
  },
  challengeTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: '#fff',
    marginBottom: 6,
  },
  challengeSub: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(255,255,255,0.65)',
    lineHeight: 19,
    marginBottom: 12,
  },
  challengeLink: {
    fontSize: 13,
    fontFamily: 'DMSans_700Bold',
    color: Colors.amber,
  },
  highlightsLink: {
    alignSelf: 'flex-start',
    marginBottom: 14,
    paddingVertical: 4,
  },
  challengeAlt: {
    fontSize: 12,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.warmGray,
  },
  shareTeaser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 8,
  },
  shareTeaserText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    lineHeight: 17,
  },
});
