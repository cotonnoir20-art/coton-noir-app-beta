import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/theme/colors';
import { useApp } from '../src/context/AppContext';
import { usePremium } from '../src/context/PremiumContext';
import { BCEmojiAvatar } from '../src/components/blackCotton/BCEmojiAvatar';
import { LEVELS, getCurrentLevel, getNextLevel, getLevelProgress } from '../src/data/levels';
import { EARN_WAYS, REWARDS } from '../src/data/rewards';
import { supabase } from '../src/lib/supabase';
import { AppHeader } from '../src/components/AppHeader';
import { REWARDS_MONEY_LEGEND } from '../src/constants/productPitch';
import { CoinIcon } from '../src/components/CoinIcon';
import {
  CC_REFERRAL_SIGNUP,
  CC_ROUTINE_DAILY_NIGHT,
  CC_ROUTINE_WASHDAY,
  CC_STREAK_BONUS_30,
  CC_STREAK_BONUS_7,
  PTS_ROUTINE_DAILY_NIGHT,
  PTS_ROUTINE_WASHDAY,
  REFERRAL_MAX_CC_EARNED,
  REFERRAL_MAX_REFEREES,
  formatCc,
  formatCcSigned,
  formatPoints,
  formatPointsSigned,
} from '../src/lib/cotonCoins';

type EarnRow = { id?: string; emoji: string; name: string; freq: string; amountCc: number; amountPts?: number };
type CatalogRow = { id: string; emoji: string; name: string; cost: number; locked: boolean };

function mapEarnRule(r: Record<string, unknown>): EarnRow {
  const emoji = typeof r.emoji === 'string' && r.emoji.trim() ? r.emoji.trim() : '✅';
  const action = typeof r.action === 'string' ? r.action : '';
  const desc = typeof r.description === 'string' ? r.description.trim() : '';
  const freq = typeof r.freq === 'string' && r.freq.trim() ? r.freq.trim() : '—';
  const rawCc = r.amount_cc ?? r.amountCc;
  const amountCc = typeof rawCc === 'number' ? rawCc : parseInt(String(rawCc ?? 0), 10) || 0;
  const rawPts = r.amount_pts ?? r.amountPts;
  const amountPts = rawPts != null
    ? (typeof rawPts === 'number' ? rawPts : parseInt(String(rawPts), 10) || 0)
    : undefined;
  return {
    id: r.id != null ? String(r.id) : undefined,
    emoji,
    name: desc || action || '—',
    freq,
    amountCc,
    amountPts,
  };
}

function mapCatalogRow(c: Record<string, unknown>): CatalogRow {
  const cost = typeof c.cost === 'number' ? c.cost : parseInt(String(c.cost ?? 0), 10) || 0;
  return {
    id: String(c.id ?? ''),
    emoji: typeof c.emoji === 'string' && c.emoji.trim() ? c.emoji.trim() : '🎁',
    name: typeof c.name === 'string' ? c.name : '',
    cost,
    locked: Boolean(c.locked),
  };
}

const TIPS = [
  {
    e: '💧',
    title: 'Wash day validé',
    tip: `Chaque wash day complet te rapporte +${CC_ROUTINE_WASHDAY} CC et +${PTS_ROUTINE_WASHDAY} pts cumulés pour ton niveau.`,
  },
  {
    e: '🔥',
    title: 'Streak de 7 jours',
    tip: `Maintiens ton streak une semaine : +${CC_STREAK_BONUS_7} CC en bonus (portefeuille).`,
  },
  {
    e: '🔥',
    title: 'Streak de 30 jours',
    tip: `Un mois sans interruption = +${CC_STREAK_BONUS_30} CC en bonus (portefeuille).`,
  },
  {
    e: '🎁',
    title: 'Invite tes amies',
    tip: `Chaque filleule inscrite via ton code : +${CC_REFERRAL_SIGNUP} CC (plafond ${REFERRAL_MAX_REFEREES} filleules · ${REFERRAL_MAX_CC_EARNED} CC max).`,
  },
];

export default function RewardsScreen() {
  const router  = useRouter();
  const { state, dispatch, spendCoinsSecure } = useApp();
  const { hasAccess, openPremium, maybeShowMoment } = usePremium();

  useEffect(() => {
    void maybeShowMoment('coins_multiplier');
  }, [maybeShowMoment]);
  const { coins, coinHistory, totalEarned } = state;

  const scrollRef    = useRef<ScrollView>(null);
  const catalogueY   = useRef(0);

  const [earnWays, setEarnWays] = useState<EarnRow[]>(() =>
    EARN_WAYS.map((w, i) => ({
      id: `local-earn-${i}`,
      emoji: w.emoji,
      name: w.name,
      freq: w.freq,
      amountCc: w.amountCc,
      amountPts: 'amountPts' in w ? w.amountPts : undefined,
    }))
  );
  const [catalogRewards, setCatalogRewards] = useState<CatalogRow[]>(() =>
    REWARDS.map(r => ({ id: String(r.id), emoji: r.emoji, name: r.name, cost: r.cost, locked: r.locked }))
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [rulesRes, catRes] = await Promise.all([
        supabase.from('reward_rules').select('*').eq('active', true).order('sort_order', { ascending: true }),
        supabase.from('reward_catalog').select('*').eq('status', 'active').order('sort_order', { ascending: true }),
      ]);
      if (cancelled) return;
      if (!rulesRes.error && Array.isArray(rulesRes.data) && rulesRes.data.length > 0) {
        setEarnWays(rulesRes.data.map(r => mapEarnRule(r as Record<string, unknown>)));
      }
      if (!catRes.error && Array.isArray(catRes.data) && catRes.data.length > 0) {
        setCatalogRewards(catRes.data.map(c => mapCatalogRow(c as Record<string, unknown>)));
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Les niveaux sont basés sur le total cumulé gagné (jamais décrémenté par les dépenses)
  const level    = getCurrentLevel(totalEarned);
  const nextLvl  = getNextLevel(totalEarned);
  const progress = getLevelProgress(totalEarned);

  async function handleRedeem(r: CatalogRow) {
    const result = await spendCoinsSecure(r.cost, r.name, { rewardId: r.id });
    if (!result.ok) {
      Alert.alert('Échange impossible', 'Solde insuffisant ou erreur serveur. Réessaie dans un instant.');
      return;
    }
    Alert.alert(
      'Récompense débloquée 🎁',
      `${r.name} — ${formatCc(r.cost)} débités. Récupère ton avantage partenaire dans Codes promo.`,
      [
        { text: 'Plus tard', style: 'cancel' },
        { text: 'Voir mes codes →', onPress: () => router.push('/codes' as any) },
      ],
    );
  }

  return (
    <SafeAreaView style={S.safe} edges={['top']}>

      <AppHeader title="Récompenses" subtitle={REWARDS_MONEY_LEGEND} />

      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={S.content}>

        {!hasAccess ? (
          <TouchableOpacity style={S.premiumCcCard} onPress={() => openPremium('coins_multiplier')} activeOpacity={0.88}>
            <Text style={S.premiumCcTitle}>CotonCoins × 2 avec Premium</Text>
            <Text style={S.premiumCcSub}>
              Chaque routine, wash day et défi rapporte le double — monte plus vite au catalogue.
            </Text>
            <Text style={S.premiumCcCta}>Essai 7 jours →</Text>
          </TouchableOpacity>
        ) : (
          <View style={S.premiumCcActive}>
            <Text style={S.premiumCcActiveText}>✨ Multiplicateur Premium actif · gains doublés</Text>
          </View>
        )}

        {/* ── Niveau actuel ── */}
        <LinearGradient
          colors={['#2D1B4E', '#1A1209']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={S.levelCard}
        >
          {/* Decorative crown */}
          <Text style={S.crownDecor}>👑</Text>

          <Text style={S.levelLabel}>NIVEAU ACTUEL</Text>
          <Text style={S.levelName}>{level.emoji}  {level.name}</Text>

          <View style={S.statsRow}>
            <View style={[S.statBox, S.statBoxPoints]}>
              <Text style={S.statBoxLabel}>Points cumulés</Text>
              <Text style={S.statBoxValue}>{formatPoints(totalEarned)}</Text>
              <Text style={S.statBoxHint}>Progression de niveau</Text>
            </View>
            <View style={[S.statBox, S.statBoxCc]}>
              <Text style={S.statBoxLabel}>CotonCoins</Text>
              <View style={S.statCcRow}>
                <CoinIcon size={22} />
                <Text style={S.statBoxValueCc}>{formatCc(coins)}</Text>
              </View>
              <Text style={S.statBoxHint}>À échanger au catalogue</Text>
            </View>
          </View>

          <Text style={S.progressSectionLabel}>Prochain niveau (points cumulés)</Text>
          <View style={S.progressBg}>
            <LinearGradient
              colors={[Colors.amber, Colors.rose]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[S.progressFill, { width: `${progress}%` as any }]}
            />
          </View>

          <Text style={S.progressCaption}>
            {formatPoints(totalEarned)} / {nextLvl ? formatPoints(nextLvl.min) : '—'} → {nextLvl?.name ?? 'Niveau max atteint 🏆'}
          </Text>

          <TouchableOpacity
            style={S.exchangeBtn}
            onPress={() => scrollRef.current?.scrollTo({ y: catalogueY.current, animated: true })}
          >
            <Text style={S.exchangeBtnText}>🎁 Échanger mes CotonCoins</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* ── Niveaux ── */}
        <Text style={S.secTitle}>Niveaux · selon tes points cumulés</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={S.levelsScroll}
          contentContainerStyle={S.levelsRow}
        >
          {LEVELS.map(l => {
            const isUnlocked = totalEarned >= l.min;
            const isCurrent  = l.id === level.id;
            return (
              <View
                key={l.id}
                style={[
                  S.lvlCard,
                  isCurrent  && { backgroundColor: l.color + '22', borderColor: l.color,         borderWidth: 2 },
                  !isCurrent && isUnlocked && { borderColor: l.color + '99', borderWidth: 2 },
                  !isUnlocked && S.lvlCardLocked,
                ]}
              >
                {isCurrent && (
                  <View style={[S.enCoursBadge, { backgroundColor: l.color }]}>
                    <Text style={S.enCoursText}>EN COURS</Text>
                  </View>
                )}
                <View style={[S.lvlIconBox, { backgroundColor: isUnlocked ? l.color : Colors.border }]}>
                  <Text style={S.lvlEmoji}>{isUnlocked ? l.emoji : '🔒'}</Text>
                </View>
                <Text style={[S.lvlName, isCurrent && { color: l.color }]}>{l.name}</Text>
                <Text style={S.lvlDesc}>{l.desc}</Text>
                <Text style={S.lvlRange}>
                  {formatPoints(l.min)} – {l.max === 999999 ? '∞' : formatPoints(l.max)}
                </Text>
                <View style={[S.lvlBenefit, { backgroundColor: isUnlocked ? l.color + '18' : Colors.cream }]}>
                  <Text style={[S.lvlBenefitText, { color: isUnlocked ? l.color : Colors.warmGray }]}>
                    🎁 {l.benefit}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* ── Conseils ── */}
        <View style={[S.tipsBlock, { marginTop: 24 }]}>
          <View style={S.tipsHeader}>
            <BCEmojiAvatar size={40} mood="coaching" />
            <View style={{ flex: 1 }}>
              <Text style={S.tipsHeaderTitle}>Conseils Black Cotton</Text>
              <Text style={S.tipsHeaderSub}>Gagne des CC et des points cumulés</Text>
            </View>
          </View>
          {TIPS.map((tip, i) => (
            <View key={i} style={[S.tipRow, i < TIPS.length - 1 && S.tipRowBorder]}>
              <Text style={S.tipEmoji}>{tip.e}</Text>
              <View style={{ flex: 1 }}>
                <Text style={S.tipTitle}>{tip.title}</Text>
                <Text style={S.tipText}>{tip.tip}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── Catalogue récompenses ── */}
        <Text
          style={[S.secTitle, { marginTop: 24 }]}
          onLayout={e => { catalogueY.current = e.nativeEvent.layout.y; }}
        >Catalogue récompenses</Text>
        {catalogRewards.map(r => {
          const canRedeem = !r.locked && coins >= r.cost;
          const insufficient = !r.locked && coins < r.cost;
          return (
            <View key={r.id} style={[S.rewardRow, (r.locked || insufficient) && { opacity: 0.6 }]}>
              <View style={[S.rewardIcon, { backgroundColor: r.locked ? Colors.cream : Colors.blush }]}>
                <Text style={{ fontSize: 20 }}>{r.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={S.rewardName}>{r.name}</Text>
                <Text style={S.rewardCost}>{formatCc(r.cost)}</Text>
              </View>
              <TouchableOpacity
                style={[S.redeemBtn, !canRedeem && S.redeemBtnDisabled]}
                disabled={!canRedeem}
                onPress={() => { if (canRedeem) void handleRedeem(r); }}
              >
                <Text style={[S.redeemText, !canRedeem && S.redeemTextDisabled]}>
                  {r.locked ? 'Bientôt' : insufficient ? 'Insuff.' : 'Échanger'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}

        {/* ── Comment gagner ── */}
        <Text style={[S.secTitle, { marginTop: 24 }]}>Comment gagner (CC + points)</Text>
        <Text style={S.earnIntro}>
          Les routines créditent des CC et des points cumulés (montants différents). Seuls les échanges du catalogue retirent des CC.
        </Text>
        <View style={S.earnCard}>
          {earnWays.map((w, i) => (
            <View key={w.id ?? `earn-${i}`} style={[S.earnRow, i < earnWays.length - 1 && S.earnBorder]}>
              <View style={S.earnIconBox}>
                <Text style={{ fontSize: 16 }}>{w.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={S.earnName}>{w.name}</Text>
                <Text style={S.earnFreq}>{w.freq}</Text>
              </View>
              <View style={S.earnPtsCol}>
                <Text style={S.earnPts}>{formatCcSigned(w.amountCc)}</Text>
                {w.amountPts != null && w.amountPts > 0 && (
                  <Text style={S.earnPtsSub}>{formatPointsSigned(w.amountPts)}</Text>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* ── Historique ── */}
        {coinHistory && coinHistory.length > 0 && (
          <>
            <Text style={[S.secTitle, { marginTop: 24 }]}>Historique</Text>
            <View style={S.histCard}>
              {coinHistory.map((h: any, i: number) => (
                <View key={h.id} style={[S.histRow, i < coinHistory.length - 1 && S.earnBorder]}>
                  <View style={{ flex: 1 }}>
                    <Text style={S.histLabel}>{h.label}</Text>
                    <Text style={S.histDate}>{h.date}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={[S.histAmount, h.amount > 0 ? S.positive : S.negative]}>
                      {h.amount > 0 ? '+' : ''}{h.amount}
                    </Text>
                    <CoinIcon size={13} />
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: 20, paddingBottom: 16 },

  premiumCcCard: {
    backgroundColor: Colors.amberLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.amber,
    padding: 14,
    marginBottom: 14,
  },
  premiumCcTitle: { fontSize: 15, fontFamily: 'DMSans_700Bold', color: Colors.ink, marginBottom: 4 },
  premiumCcSub: { fontSize: 12, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, lineHeight: 17 },
  premiumCcCta: { marginTop: 8, fontSize: 12, fontFamily: 'DMSans_700Bold', color: Colors.amberDark },
  premiumCcActive: {
    backgroundColor: Colors.sageLight,
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
    alignItems: 'center',
  },
  premiumCcActiveText: { fontSize: 12, fontFamily: 'DMSans_600SemiBold', color: Colors.sage },

  workflowCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 16,
  },
  workflowTitle: {
    fontSize: 15,
    fontFamily: 'DMSans_700Bold',
    color: Colors.ink,
    marginBottom: 6,
  },
  workflowSub: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    lineHeight: 18,
    marginBottom: 12,
  },
  workflowSteps: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  workflowStep: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Colors.cream,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  workflowStepEmoji: { fontSize: 20, marginBottom: 4 },
  workflowStepLabel: {
    fontSize: 10,
    fontFamily: 'DMSans_700Bold',
    color: Colors.ink,
    textAlign: 'center',
  },
  workflowArrow: {
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
    color: Colors.warmGray,
    marginHorizontal: 4,
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  backBtn: {
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { flex: 1, fontSize: 20, fontFamily: 'Poppins_700Bold', color: Colors.ink },
  coinsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.ink,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  coinsEmoji: { fontSize: 15 },
  coinsText:  { fontSize: 15, fontFamily: 'DMSans_700Bold', color: Colors.amber },

  // ── Niveau card ──
  levelCard: {
    borderRadius: 20,
    padding: 22,
    marginBottom: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  crownDecor: {
    position: 'absolute',
    right: -10,
    top: -10,
    fontSize: 100,
    opacity: 0.22,
  },
  levelLabel: {
    fontSize: 11,
    fontFamily: 'DMSans_500Medium',
    color: 'rgba(255,255,255,0.55)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  levelName: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: '#fff',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  statBoxPoints: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderColor: 'rgba(255,193,7,0.45)',
  },
  statBoxCc: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.2)',
  },
  statBoxLabel: {
    fontSize: 10,
    fontFamily: 'DMSans_600SemiBold',
    color: 'rgba(255,255,255,0.65)',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  statBoxValue: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    color: Colors.amber,
    marginBottom: 4,
  },
  statBoxValueCc: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    color: '#fff',
  },
  statCcRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  statBoxHint: {
    fontSize: 10,
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 14,
  },
  progressSectionLabel: {
    fontSize: 11,
    fontFamily: 'DMSans_600SemiBold',
    color: 'rgba(255,255,255,0.55)',
    marginBottom: 6,
  },
  progressBg: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: 8,
    borderRadius: 999,
  },
  progressCaption: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(255,255,255,0.55)',
  },

  exchangeBtn: {
    marginTop: 18,
    backgroundColor: Colors.amber,
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
  },
  exchangeBtnText: {
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
    color: '#fff',
  },

  // ── Section titles ──
  secRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  secTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.ink,
    marginBottom: 12,
  },
  earnIntro: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    lineHeight: 18,
    marginTop: -6,
    marginBottom: 12,
  },

  // ── Tips bloc ──
  tipsBlock: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 20, overflow: 'hidden',
  },
  tipsHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, backgroundColor: Colors.cream,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  tipsHeaderTitle: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: Colors.ink },
  tipsHeaderSub:   { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, marginTop: 2 },
  tipRow:       { flexDirection: 'row', gap: 12, padding: 14 },
  tipRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  tipEmoji: { fontSize: 18, marginTop: 1 },
  tipTitle: { fontSize: 13, fontFamily: 'DMSans_700Bold', color: Colors.ink, marginBottom: 4 },
  tipText:  { fontSize: 12, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, lineHeight: 18 },

  // ── Levels horizontal scroll ──
  levelsScroll: { marginBottom: 4 },
  levelsRow:    { paddingHorizontal: 20, gap: 10, paddingBottom: 8 },
  lvlCard: {
    width: 160,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    position: 'relative',
  },
  lvlCardLocked: { opacity: 0.45 },
  enCoursBadge: {
    position: 'absolute',
    top: 8, right: 8,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  enCoursText: { fontSize: 9, fontFamily: 'DMSans_700Bold', color: '#fff' },
  lvlIconBox: {
    width: 40, height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  lvlEmoji:  { fontSize: 20 },
  lvlName: {
    fontSize: 13,
    fontFamily: 'DMSans_700Bold',
    color: Colors.ink,
    marginBottom: 2,
  },
  lvlDesc: {
    fontSize: 10,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    lineHeight: 14,
    marginBottom: 8,
  },
  lvlRange: {
    fontSize: 10,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.ink,
    opacity: 0.6,
    marginBottom: 6,
  },
  lvlBenefit: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  lvlBenefitText: { fontSize: 10, fontFamily: 'DMSans_600SemiBold' },

  // ── Catalogue ──
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    marginBottom: 10,
  },
  rewardIcon: {
    width: 44, height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardName: { fontSize: 13, fontFamily: 'DMSans_600SemiBold', color: Colors.ink },
  rewardCost: { fontSize: 11, fontFamily: 'DMSans_500Medium', color: Colors.amber, marginTop: 2 },
  redeemBtn: {
    backgroundColor: Colors.amber,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  redeemBtnDisabled: { backgroundColor: Colors.border },
  redeemText:        { fontSize: 12, fontFamily: 'DMSans_600SemiBold', color: '#fff' },
  redeemTextDisabled: { color: Colors.warmGray },

  // ── Earn ways ──
  earnCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  earnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  earnBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  earnIconBox: {
    width: 36, height: 36,
    borderRadius: 12,
    backgroundColor: Colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  earnName: { fontSize: 13, fontFamily: 'DMSans_500Medium', color: Colors.ink },
  earnFreq: { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray },
  earnPtsCol: { alignItems: 'flex-end', gap: 2 },
  earnPts:    { fontSize: 13, fontFamily: 'DMSans_700Bold', color: Colors.amber },
  earnPtsSub: { fontSize: 10, fontFamily: 'DMSans_500Medium', color: Colors.warmGray },

  // ── Historique ──
  histCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  histRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  histLabel:  { fontSize: 13, fontFamily: 'DMSans_500Medium', color: Colors.ink },
  histDate:   { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray },
  histAmount: { fontSize: 13, fontFamily: 'DMSans_700Bold' },
  positive:   { color: Colors.sage },
  negative:   { color: Colors.rose },
});
