import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BCEmojiAvatar } from '../blackCotton/BCEmojiAvatar';
import { Colors } from '../../theme/colors';
import { Type } from '../../theme/typography';
import {
  fetchHairAnalysisHistory,
  formatAnalysisDate,
  type HairAnalysisSummary,
} from '../../lib/hairAnalysisHistory';
import { CC_ANALYSIS_COMPLETE, formatDualEarnReward, PTS_ANALYSIS_COMPLETE } from '../../lib/cotonCoins';

export function HomeHairAnalysisCard() {
  const router = useRouter();
  const [latest, setLatest] = useState<HairAnalysisSummary | null>(null);

  const load = useCallback(async () => {
    const rows = await fetchHairAnalysisHistory(1);
    setLatest(rows[0] ?? null);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const rewardLabel = formatDualEarnReward(CC_ANALYSIS_COMPLETE, PTS_ANALYSIS_COMPLETE);

  return (
    <View style={s.section}>
      <View style={s.card}>
        <View style={s.cardHead}>
          <Text style={s.cardTitle}>Analyse capillaire</Text>
          <TouchableOpacity
            style={s.seeAll}
            onPress={() => router.push('/(tabs)/analyze' as any)}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel="Ouvrir l'analyse capillaire"
          >
            <Text style={s.seeAllText}>Analyser</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.warmGray} />
          </TouchableOpacity>
        </View>
        <View style={s.headDivider} />

        {latest ? (
          <TouchableOpacity
            style={s.lastRow}
            onPress={() => router.push('/(tabs)/analyze' as any)}
            activeOpacity={0.88}
          >
            <View style={s.scoreBadge}>
              <Text style={s.scoreVal}>{latest.score}</Text>
            </View>
            <View style={s.lastBody}>
              <Text style={s.lastDate}>{formatAnalysisDate(latest.createdAt)}</Text>
              <Text style={s.lastMeta} numberOfLines={1}>
                {latest.hairType} · Porosité {latest.porosity}
              </Text>
              {latest.synthesis ? (
                <Text style={s.lastSynth} numberOfLines={2}>
                  {latest.synthesis}
                </Text>
              ) : null}
            </View>
          </TouchableOpacity>
        ) : (
          <View style={s.empty}>
            <BCEmojiAvatar size={48} mood="coaching" />
            <Text style={s.emptyTitle}>Diagnostic Black Cotton</Text>
            <Text style={s.emptyHint}>
              3 photos + questionnaire → routine et conseils personnalisés ({rewardLabel}).
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={s.cta}
          onPress={() => router.push('/(tabs)/analyze' as any)}
          activeOpacity={0.88}
        >
          <Ionicons name="scan-outline" size={18} color="#fff" />
          <Text style={s.ctaText}>
            {latest ? 'Nouvelle analyse' : 'Lancer mon analyse'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  section: { marginBottom: 22, paddingHorizontal: 14 },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    shadowColor: Colors.ink,
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  cardTitle: {
    ...Type.sectionTitle,
    fontSize: 17,
    color: Colors.ink,
  },
  seeAll: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllText: {
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
    color: Colors.warmGray,
  },
  headDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
  },
  empty: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: 'DMSans_700Bold',
    color: Colors.ink,
    textAlign: 'center',
  },
  emptyHint: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    textAlign: 'center',
    lineHeight: 17,
  },
  lastRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  scoreBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.amberPowder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreVal: { fontSize: 20, fontFamily: 'Poppins_700Bold', color: Colors.amberDark },
  lastBody: { flex: 1, minWidth: 0 },
  lastDate: { fontSize: 12, fontFamily: 'DMSans_600SemiBold', color: Colors.warmGray, marginBottom: 4 },
  lastMeta: { fontSize: 13, fontFamily: 'DMSans_600SemiBold', color: Colors.ink, marginBottom: 4 },
  lastSynth: { fontSize: 12, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, lineHeight: 16 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    marginTop: 4,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: Colors.ink,
  },
  ctaText: { fontSize: 14, fontFamily: 'DMSans_700Bold', color: Colors.amber },
});
