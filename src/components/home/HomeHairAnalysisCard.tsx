import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { Fonts, Type } from '../../theme/typography';
import { HAIR_SCAN_ZONES } from '../../constants/hairScanZones';
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
  const openAnalyze = () => router.push('/(tabs)/analyze' as any);

  return (
    <View style={s.section}>
      <View style={s.card}>
        <View style={s.cardHead}>
          <Text style={s.cardTitle}>Analyse capillaire</Text>
          <TouchableOpacity
            style={s.seeAll}
            onPress={openAnalyze}
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
          <TouchableOpacity style={s.lastRow} onPress={openAnalyze} activeOpacity={0.88}>
            <View style={s.scoreBadge}>
              <Text style={s.scoreVal}>{latest.score}</Text>
              <Text style={s.scoreLabel}>score</Text>
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
          <View style={s.scanBlock}>
            <View style={s.scanIconCircle}>
              <Ionicons name="camera" size={24} color={Colors.ink} />
            </View>
            <Text style={s.scanTitle}>Scanner mes cheveux</Text>
            <Text style={s.scanSub}>
              Photos guidées + questionnaire → routine et conseils catalogue ({rewardLabel}).
            </Text>
            <View style={s.zonesRow}>
              {HAIR_SCAN_ZONES.map(z => (
                <View key={z.id} style={s.zoneChip}>
                  <Text style={s.zoneEmoji}>{z.emoji}</Text>
                  <Text style={s.zoneLabel}>{z.label}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <TouchableOpacity style={s.cta} onPress={openAnalyze} activeOpacity={0.88}>
          <Ionicons name="scan-outline" size={18} color={Colors.amber} />
          <Text style={s.ctaText}>{latest ? 'Nouvelle analyse' : 'Lancer le scan'}</Text>
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
    ...Type.cardTitle,
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
  scanBlock: {
    paddingHorizontal: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  scanIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.amber,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  scanTitle: {
    fontSize: 17,
    fontFamily: Fonts.displayBold,
    color: Colors.ink,
    textAlign: 'center',
    marginBottom: 6,
  },
  scanSub: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  zonesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  zoneChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.cream,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  zoneEmoji: { fontSize: 12 },
  zoneLabel: {
    fontSize: 11,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.ink,
  },
  lastRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  scoreBadge: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.amberPowder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreVal: {
    fontSize: 18,
    fontFamily: Fonts.displayBold,
    color: Colors.amberDark,
    lineHeight: 20,
  },
  scoreLabel: {
    fontSize: 9,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.amberDark,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  lastBody: { flex: 1, minWidth: 0 },
  lastDate: {
    fontSize: 12,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.warmGray,
    marginBottom: 4,
  },
  lastMeta: {
    fontSize: 13,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.ink,
    marginBottom: 4,
  },
  lastSynth: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    lineHeight: 16,
  },
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
  ctaText: {
    fontSize: 14,
    fontFamily: 'Satoshi_700Bold',
    color: Colors.amber,
  },
});
