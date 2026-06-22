import { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BackButton } from '../../src/components/BackButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../../src/theme/colors';
import { useApp } from '../../src/context/AppContext';
import { usePremium } from '../../src/context/PremiumContext';
import { ROUTINE_TYPES, RoutineType } from '../../src/data/routines';
import { loadUserPrefs } from '../../src/lib/userPrefs';
import { getProtectiveNightGuide } from '../../src/lib/protectiveRoutine';
import { BCEmojiAvatar } from '../../src/components/blackCotton/BCEmojiAvatar';
import { CoinIcon } from '../../src/components/CoinIcon';
import { AppIconBox, type IonName } from '../../src/components/AppIconBox';
import { CompletionLottieOverlay, type CompletionLottieVariant } from '../../src/components/animations/CompletionLottieOverlay';
import { hapticSelection, hapticSuccess } from '../../src/lib/haptics';
import {
  CC_ROUTINE_VALIDATION_REWARD,
  CC_ROUTINE_WASHDAY,
  PTS_ROUTINE_DAILY_NIGHT,
  PTS_ROUTINE_WASHDAY,
  formatDualEarnReward,
} from '../../src/lib/cotonCoins';
import { buildHairWeekAgenda, type WeekAgendaItem } from '../../src/lib/hairWeekPlan';
import { getRoutineADNTip } from '../../src/lib/adnRecommendations';
import { HairWeekAgenda } from '../../src/components/workflows/HairWeekAgenda';

const TABS: {
  key: RoutineType;
  ion: IonName;
  ionBg: string;
  ionColor: string;
  label: string;
}[] = [
  { key: 'daily', ion: 'sunny-outline', ionBg: '#FEF3C7', ionColor: '#D97706', label: 'Matin' },
  { key: 'night', ion: 'moon-outline', ionBg: '#EEF2FF', ionColor: '#4F46E5', label: 'Soir' },
];

const TIPS: { name: IonName; bg: string; color: string; title: string; tip: string }[] = [
  {
    name: 'water-outline',
    bg: '#E0F2FE',
    color: '#0369A1',
    title: 'Méthode LCO',
    tip: "Liquide → Crème → Huile. Cet ordre scelle l'hydratation durablement dans tes longueurs.",
  },
  {
    name: 'snow-outline',
    bg: '#ECFEFF',
    color: '#0E7490',
    title: 'Rinçage froid',
    tip: "Termine toujours à l'eau froide pour refermer les cuticules et gagner en brillance.",
  },
  {
    name: 'hourglass-outline',
    bg: '#F3F4F6',
    color: '#4B5563',
    title: "Moins c'est plus",
    tip: 'Trop de produits = surcharge. 2–3 produits bien choisis suffisent pour une routine efficace.',
  },
  {
    name: 'water-outline',
    bg: '#F0FDF4',
    color: '#15803D',
    title: 'Pré-poo',
    tip: "Applique de l'huile avant le shampoing pour limiter le dessèchement lors du lavage.",
  },
];

function parseDuration(str: string): number {
  const m = str.match(/(\d+)(?:-(\d+))?\s*min/);
  if (!m) return 0;
  const lo = parseInt(m[1], 10);
  const hi = m[2] ? parseInt(m[2], 10) : lo;
  return Math.round((lo + hi) / 2);
}

type Period = 'today' | 'week' | 'month';

const PERIODS: { key: Period; label: string }[] = [
  { key: 'today', label: "Aujourd'hui" },
  { key: 'week',  label: 'Cette semaine' },
  { key: 'month', label: 'Ce mois' },
];

export default function RoutineScreen() {
  const { state, dispatch, validateRoutineSecure } = useApp();
  const { maybeShowMoment } = usePremium();
  const params = useLocalSearchParams<{ routine?: string | string[]; period?: string | string[] }>();
  const [type,   setType]   = useState<RoutineType>('daily');
  const [period, setPeriod] = useState<Period>('today');
  const [isProtective, setIsProtective] = useState(false);
  const [protectiveType, setProtectiveType] = useState('');

  useEffect(() => {
    const rawP = params.period;
    const p = Array.isArray(rawP) ? rawP[0] : rawP;
    if (p === 'today' || p === 'week' || p === 'month') setPeriod(p);
  }, [params.period]);

  useEffect(() => {
    const raw = params.routine;
    const r = Array.isArray(raw) ? raw[0] : raw;
    if (r === 'daily' || r === 'night' || r === 'washday') {
      setType(r);
      return;
    }
    loadUserPrefs().then(p => {
      if (p.isProtective) setType('night');
      setIsProtective(!!p.isProtective);
      setProtectiveType(p.protectiveType ?? '');
    });
  }, [params.routine]);

  useEffect(() => {
    loadUserPrefs().then(p => {
      setIsProtective(!!p.isProtective);
      setProtectiveType(p.protectiveType ?? '');
    });
  }, []);

  const protectiveGuide = getProtectiveNightGuide(protectiveType);

  const [refreshing, setRefreshing] = useState(false);
  const [completionOpen, setCompletionOpen] = useState(false);
  const [completionVariant, setCompletionVariant] = useState<CompletionLottieVariant>('light');
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise(res => setTimeout(res, 600));
    setRefreshing(false);
  }, []);

  const currentSteps = state.routineSteps[type];
  const customPlan   = state.routinePlans?.[type] ?? null;
  const isValidated  = state.validated[type];
  const routine      = ROUTINE_TYPES[type];
  const displayTitle = customPlan?.name?.trim() || 'Routine complète';
  const done         = currentSteps.filter(s => s.done).length;
  const total        = currentSteps.length;
  const pct          = Math.round((done / total) * 100);
  const totalMin     = currentSteps.reduce((acc, s) => acc + parseDuration(s.duration), 0);
  const allDone      = done === total;
  const validationCc = type === 'washday' ? CC_ROUTINE_WASHDAY : CC_ROUTINE_VALIDATION_REWARD;
  const validationPts = type === 'washday' ? PTS_ROUTINE_WASHDAY : PTS_ROUTINE_DAILY_NIGHT;
  const validationRewardLabel = formatDualEarnReward(validationCc, validationPts);

  const usedProducts = [...new Set(
    currentSteps.filter(s => s.done && s.products?.length).flatMap(s => s.products)
  )];

  const router = useRouter();

  // ── Streak : donnée réelle depuis Supabase ──
  const routineStreak = state.streak;

  // ── Dernière routine : aujourd'hui si validée, sinon cherche dans coinHistory ──
  const anyValidatedToday = state.validated.washday || state.validated.daily || state.validated.night;
  const lastRoutineEntry  = state.coinHistory.find(
    e => !e.date.includes('instant') && /^\d{4}/.test(e.date),
  );
  const daysSinceLast = lastRoutineEntry
    ? Math.round((Date.now() - new Date(lastRoutineEntry.date).getTime()) / 86400000)
    : null;
  const lastRoutine = anyValidatedToday
    ? "Aujourd'hui"
    : daysSinceLast !== null
      ? `il y a ${daysSinceLast} jour${daysSinceLast > 1 ? 's' : ''}`
      : '–';

  // ── Prochain wash day : calculé depuis plannedSoins ──
  const todayMidnight = new Date(); todayMidnight.setHours(0, 0, 0, 0);
  const nextWashSoin  = state.plannedSoins
    .filter(s => new Date(s.date) >= todayMidnight)
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  const nextWashDayDays = nextWashSoin
    ? Math.round((new Date(nextWashSoin.date).getTime() - todayMidnight.getTime()) / 86400000)
    : null;

  // ── Données historique ──
  const todayStr   = new Date().toISOString().slice(0, 10);
  const weekStart  = (() => { const d = new Date(); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.toISOString().slice(0, 10); })();
  const monthStart = todayStr.slice(0, 7);

  const weekEntries  = state.coinHistory.filter(e => e.amount > 0 && e.date >= weekStart);

  const weekAgenda = useMemo(
    () => buildHairWeekAgenda({ coinHistory: state.coinHistory, plannedSoins: state.plannedSoins }),
    [state.coinHistory, state.plannedSoins],
  );

  const adnTip = useMemo(() => getRoutineADNTip(state.profile), [state.profile]);

  const onWeekSlotPress = useCallback(
    (item: WeekAgendaItem) => {
      if (item.kind === 'washday' && item.detail === 'À planifier') {
        router.push({ pathname: '/add-washday', params: { date: item.dateIso } } as any);
        return;
      }
      setType(item.routineType);
      if (item.dateIso === todayStr) setPeriod('today');
    },
    [router, todayStr],
  );
  const monthEntries = state.coinHistory.filter(e => e.date.startsWith(monthStart));
  const monthSoins   = state.plannedSoins.filter(s => s.date.startsWith(monthStart));

  return (
    <SafeAreaView style={S.safe} edges={['top']}>
      {/* Header fixe */}
      <View style={S.header}>
        <BackButton onPress={() => router.back()} style={S.backBtn} />
        <Text style={S.headerTitle}>Ma Routine</Text>
        <TouchableOpacity style={S.coinsBadge} onPress={() => router.push('/rewards' as any)}>
          <CoinIcon size={16} />
          <Text style={S.coinsText}>{state.coins}</Text>
        </TouchableOpacity>
      </View>

      {/* Onglets période */}
      <View style={S.periodRow}>
        {PERIODS.map(p => (
          <TouchableOpacity
            key={p.key}
            style={[S.periodTab, period === p.key && S.periodTabActive]}
            onPress={() => setPeriod(p.key)}
          >
            <Text style={[S.periodLabel, period === p.key && S.periodLabelActive]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={S.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={S.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.amber}
            colors={[Colors.amber]}
          />
        }
      >

        {/* ══ AUJOURD'HUI ══ */}
        {period === 'today' && (<>

        {/* ── Streak ── */}
        <View style={S.streakCard}>
          <View style={S.streakLeft}>
            <AppIconBox name="flame-outline" backgroundColor="#FFF7ED" color={Colors.amber} size={44} iconSize={22} />
            <View>
              <Text style={S.streakTitle}>{routineStreak} jours de suite</Text>
              <Text style={S.streakSub}>Streak de routine · Continue comme ça !</Text>
            </View>
          </View>
          <View style={S.streakBadge}>
            <Text style={S.streakNum}>{routineStreak}</Text>
            <Text style={S.streakJours}>JOURS</Text>
          </View>
        </View>

        {isProtective && type === 'night' ? (
          <View style={S.protectBanner}>
            <BCEmojiAvatar size={40} mood="coaching" />
            <View style={S.protectBannerBody}>
              <Text style={S.protectBannerTitle}>{protectiveGuide.title}</Text>
              <Text style={S.protectBannerSub}>{protectiveGuide.focus}</Text>
              {protectiveGuide.steps.map((step, i) => (
                <Text key={i} style={S.protectStep}>• {step}</Text>
              ))}
              <Text style={S.protectTip}>{protectiveGuide.scalpTip}</Text>
              <TouchableOpacity
                style={S.protectProfileLink}
                onPress={() => router.push('/(tabs)/profile' as any)}
              >
                <Text style={S.protectProfileLinkText}>Modifier coiffure →</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* ── Type selector ── */}
        <View style={S.typeRow}>
          {TABS.map(t => (
            <TouchableOpacity
              key={t.key}
              style={[S.typeTab, type === t.key && S.typeTabActive]}
              onPress={() => setType(t.key)}
            >
              <AppIconBox name={t.ion} backgroundColor={t.ionBg} color={t.ionColor} size={38} iconSize={18} borderRadius={12} />
              <Text style={[S.typeLabel, type === t.key && S.typeLabelActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Personnaliser ── */}
        <TouchableOpacity
          style={S.planCard}
          onPress={() => router.push({ pathname: '/routine-plan', params: { kind: type } } as any)}
          activeOpacity={0.85}
        >
          <View style={S.planCardLeft}>
            <AppIconBox
              name={customPlan ? 'create-outline' : 'sparkles-outline'}
              backgroundColor={Colors.amberLight}
              color={Colors.ink}
              size={40}
              iconSize={20}
              borderRadius={12}
            />
            <View style={{ flex: 1 }}>
              <Text style={S.planCardTitle}>
                {customPlan ? 'Modifier ma routine' : 'Définir ma routine'}
              </Text>
              <Text style={S.planCardSub} numberOfLines={2}>
                {customPlan
                  ? customPlan.mode === 'try_new'
                    ? `Test en cours · ${customPlan.name}`
                    : customPlan.name
                  : 'Nom, produits, recettes, étapes et tes retours cheveux'}
              </Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.warmGray} />
        </TouchableOpacity>

        {customPlan && (customPlan.hairStateComment || customPlan.evolutionComment) ? (
          <View style={S.notesCard}>
            <View style={S.notesHeader}>
              <BCEmojiAvatar size={36} mood="thinking" />
              <Text style={S.notesTitle}>Tes notes cheveux</Text>
            </View>
            {!!customPlan.hairStateComment && (
              <Text style={S.notesText}>
                <Text style={S.notesBold}>État : </Text>
                {customPlan.hairStateComment}
              </Text>
            )}
            {!!customPlan.evolutionComment && (
              <Text style={[S.notesText, !!customPlan.hairStateComment && { marginTop: 8 }]}>
                <Text style={S.notesBold}>Évolution : </Text>
                {customPlan.evolutionComment}
              </Text>
            )}
          </View>
        ) : null}

        {/* ── Dark progress card ── */}
        <View style={S.darkCard}>
          <Ionicons name="leaf-outline" size={88} color="rgba(255,255,255,0.08)" style={S.darkLeafIon} />
          <Text style={S.darkSub}>Aujourd'hui · {routine.label}</Text>
          <Text style={S.darkTitle}>{displayTitle}</Text>
          <View style={S.barBg}>
            <View style={[S.barFill, { width: `${pct}%` as any }]} />
          </View>
          <View style={S.darkFooter}>
            <Text style={S.darkCount}>{done} / {total} étapes complétées</Text>
            <View style={S.darkTimeRow}>
              <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.4)" />
              <Text style={S.darkTime}> ~{totalMin} min</Text>
            </View>
          </View>
        </View>

        {/* ── Mini-cards row ── */}
        <View style={S.miniRow}>
          <View style={S.miniLight}>
            <AppIconBox name="time-outline" backgroundColor={Colors.amberLight} color={Colors.ink} size={36} iconSize={18} borderRadius={11} />
            <View>
              <Text style={S.miniTitleLight}>Dernière routine</Text>
              <Text style={S.miniSubLight}>{lastRoutine}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={S.miniDark}
            onPress={() => router.push('/washday' as any)}
            activeOpacity={0.85}
          >
            <AppIconBox name="water-outline" backgroundColor="rgba(255,255,255,0.12)" color={Colors.amber} size={36} iconSize={18} borderRadius={11} />
            <View>
              <Text style={S.miniTitleDark}>Prochain wash day</Text>
              <Text style={S.miniSubAmber}>{nextWashDayDays !== null ? `dans ${nextWashDayDays} jour${nextWashDayDays > 1 ? 's' : ''} →` : 'Non planifié →'}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Steps ── */}
        <Text style={S.secTitle}>Étapes</Text>
        {currentSteps.map((s, i) => (
          <View key={`${s.id}-${s.title}-${s.duration}-${i}`} style={S.stepRow}>
            <View style={S.timeline}>
              <TouchableOpacity
                style={[S.check, s.done && S.checkDone]}
                onPress={() => {
                  hapticSelection();
                  dispatch({ type: 'toggleRoutineStep', routineType: type, stepId: s.id });
                }}
              >
                {s.done && <Text style={S.checkMark}>✓</Text>}
              </TouchableOpacity>
              {i < currentSteps.length - 1 && (
                <View style={[S.connector, s.done && S.connectorDone]} />
              )}
            </View>
            <View style={S.stepBody}>
              <View style={S.stepTop}>
                <Text style={[S.stepTitle, s.done && S.stepTitleDone]}>{s.title}</Text>
                <View style={S.durPill}><Text style={S.durText}>{s.duration}</Text></View>
              </View>
              <Text style={S.stepDesc}>{s.desc}</Text>
              {s.products?.length > 0 && (
                <View style={S.productRow}>
                  {s.products.map((p, j) => (
                    <View key={j} style={S.productPill}>
                      <Text style={S.productPillText}>{p}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        ))}

        {/* ── Validate CTA ── */}
        {allDone && !isValidated && (
          <TouchableOpacity
            style={S.validateBtn}
            onPress={async () => {
              hapticSuccess();
              setCompletionVariant(type === 'washday' ? 'strong' : 'light');
              setCompletionOpen(true);
              const res = await validateRoutineSecure(type);
              if (res.ok) void maybeShowMoment('routine_insight');
            }}
          >
            <View style={S.validateRow}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={S.validateLabel} numberOfLines={1}>
                Valider ma routine
              </Text>
              <Text style={S.validateReward} numberOfLines={1}>
                ({validationRewardLabel})
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* ── Célébration ── */}
        {isValidated && (
          <View style={S.celebCard}>
            <BCEmojiAvatar size={56} mood="celebrating" />
            <View style={S.celebBubbleWrap}>
              <View style={S.celebTailBorder} />
              <View style={S.celebTailFill} />
              <View style={S.celebBubble}>
                <Text style={S.celebMsg}>{`Bravo ! Ta routine ${routine.label.toLowerCase()} est validée. ${validationRewardLabel} crédités.`}</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Used products ── */}
        {usedProducts.length > 0 && (
          <View style={S.usedCard}>
            <View style={S.usedHeader}>
              <AppIconBox name="bag-handle-outline" backgroundColor={Colors.cream} color={Colors.ink} size={36} iconSize={18} borderRadius={11} />
              <Text style={S.usedTitle}>Produits utilisés</Text>
            </View>
            <View style={S.usedChips}>
              {usedProducts.map((p, i) => (
                <View key={i} style={S.usedChip}>
                  <Text style={S.usedChipText}>{p}</Text>
                </View>
              ))}
            </View>
            {allDone && <Text style={S.usedFooter}>✓ Historique enregistré pour cette routine</Text>}
          </View>
        )}

        {/* ── Tips ── */}
        <View style={S.tipsBlock}>
          <View style={S.tipsHeader}>
            <BCEmojiAvatar size={40} mood="coaching" />
            <View style={{ flex: 1 }}>
              <Text style={S.tipsHeaderTitle}>Conseils Black Cotton</Text>
              <Text style={S.tipsHeaderSub}>Astuces pour optimiser ta routine</Text>
            </View>
          </View>

          {/* Conseil ADN personnalisé */}
          {adnTip ? (
            <View style={[S.tipRow, S.tipRowBorder, S.adnTipRow]}>
              <View style={S.adnTipBadge}>
                <Text style={S.adnTipBadgeText}>{adnTip.method}</Text>
              </View>
              <View style={S.tipBody}>
                <Text style={S.tipTitle}>{adnTip.title}</Text>
                <Text style={S.tipText}>{adnTip.tip}</Text>
              </View>
            </View>
          ) : null}

          {TIPS.map((tip, i) => (
            <View key={i} style={[S.tipRow, i < TIPS.length - 1 && S.tipRowBorder]}>
              <AppIconBox name={tip.name} backgroundColor={tip.bg} color={tip.color} size={40} iconSize={19} borderRadius={12} />
              <View style={S.tipBody}>
                <Text style={S.tipTitle}>{tip.title}</Text>
                <Text style={S.tipText}>{tip.tip}</Text>
              </View>
            </View>
          ))}
        </View>

        </>)}

        {/* ══ CETTE SEMAINE ══ */}
        {period === 'week' && (
          <>
          <HairWeekAgenda items={weekAgenda} onPressSlot={onWeekSlotPress} />
          <View style={S.historySection}>
            <Text style={S.historySectionTitle}>Validations · Cette semaine</Text>
            {weekEntries.length === 0 ? (
              <View style={S.emptyState}>
                <AppIconBox name="file-tray-outline" backgroundColor={Colors.cream} color={Colors.warmGray} size={56} iconSize={26} borderRadius={16} />
                <Text style={S.emptyText}>Aucune routine validée cette semaine.</Text>
              </View>
            ) : weekEntries.map(e => (
              <View key={e.id} style={S.historyRow}>
                <View style={S.historyDot} />
                <View style={S.historyBody}>
                  <Text style={S.historyLabel}>{e.label}</Text>
                  <Text style={S.historyDate}>{e.date}</Text>
                </View>
                <View style={S.historyCoin}>
                  <Text style={S.historyCoinText}>+{e.amount}</Text>
                  <CoinIcon size={12} />
                </View>
              </View>
            ))}
          </View>
          </>
        )}

        {/* ══ CE MOIS ══ */}
        {period === 'month' && (<>
          <View style={S.historySection}>
            <Text style={S.historySectionTitle}>Routines · Ce mois</Text>
            {monthEntries.length === 0 ? (
              <View style={S.emptyState}>
                <AppIconBox name="file-tray-outline" backgroundColor={Colors.cream} color={Colors.warmGray} size={56} iconSize={26} borderRadius={16} />
                <Text style={S.emptyText}>Aucune routine ce mois-ci.</Text>
              </View>
            ) : monthEntries.map(e => (
              <View key={e.id} style={S.historyRow}>
                <View style={S.historyDot} />
                <View style={S.historyBody}>
                  <Text style={S.historyLabel}>{e.label}</Text>
                  <Text style={S.historyDate}>{e.date}</Text>
                </View>
                {e.amount !== 0 && (
                  <View style={S.historyCoin}>
                    <Text style={S.historyCoinText}>{e.amount > 0 ? '+' : ''}{e.amount}</Text>
                    <CoinIcon size={12} />
                  </View>
                )}
              </View>
            ))}
          </View>
          <View style={[S.historySection, { marginTop: 12, marginBottom: 8 }]}>
            <Text style={S.historySectionTitle}>Soins planifiés · Ce mois</Text>
            {monthSoins.length === 0 ? (
              <View style={S.emptyState}>
                <AppIconBox name="calendar-outline" backgroundColor={Colors.cream} color={Colors.warmGray} size={56} iconSize={26} borderRadius={16} />
                <Text style={S.emptyText}>Aucun soin planifié ce mois-ci.</Text>
              </View>
            ) : monthSoins.map(s => (
              <View key={s.id} style={S.historyRow}>
                <View style={[S.historyDot, { backgroundColor: Colors.amber }]} />
                <View style={S.historyBody}>
                  <Text style={S.historyLabel}>{s.soinType}</Text>
                  <Text style={S.historyDate}>{s.date}</Text>
                </View>
              </View>
            ))}
          </View>
        </>)}

      </ScrollView>

      <CompletionLottieOverlay
        visible={completionOpen}
        variant={completionVariant}
        onClose={() => setCompletionOpen(false)}
        caption={
          type === 'washday'
            ? `Wash day validé ! ${validationRewardLabel}`
            : `Routine validée ! ${validationRewardLabel}`
        }
      />
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.bg },
  scroll:  { flex: 1 },
  content: { paddingBottom: 40 },

  // ── Header ──
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: Colors.bg,
  },
  backBtn:     { marginRight: 4, flexShrink: 0 },
  headerTitle: { fontSize: 22, fontFamily: 'Satoshi_500Medium', color: Colors.ink, flex: 1 },
  coinsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.ink,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  coinsText:  { fontSize: 15, fontFamily: 'DMSans_700Bold', color: Colors.amber },

  // ── Streak ──
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 14,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 14,
  },
  streakLeft:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  streakTitle: { fontSize: 14, fontFamily: 'DMSans_700Bold', color: Colors.ink },
  streakSub:   { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, marginTop: 1 },
  streakBadge: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  streakNum:   { fontSize: 16, fontFamily: 'DMSans_700Bold', color: Colors.amber },
  streakJours: { fontSize: 9,  fontFamily: 'DMSans_600SemiBold', color: '#92400E' },

  // ── Type selector ──
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  typeTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    gap: 4,
  },
  typeTabActive:   { borderWidth: 2, borderColor: Colors.amber, backgroundColor: '#FFFBEB' },
  typeLabel:       { fontSize: 11, fontFamily: 'DMSans_500Medium', color: Colors.warmGray },
  typeLabelActive: { fontFamily: 'DMSans_700Bold', color: Colors.amber },

  protectBanner: {
    marginHorizontal: 20,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: Colors.growthLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.growth,
    padding: 14,
  },
  protectBannerBody: { flex: 1 },
  protectBannerTitle: {
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
    color: Colors.ink,
    marginBottom: 4,
  },
  protectBannerSub: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    lineHeight: 17,
  },
  protectStep: {
    fontSize: 11,
    fontFamily: 'DMSans_500Medium',
    color: Colors.ink,
    lineHeight: 16,
    marginTop: 4,
  },
  protectTip: {
    fontSize: 10,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    fontStyle: 'italic',
    marginTop: 6,
    lineHeight: 14,
  },
  protectProfileLink: { marginTop: 8, alignSelf: 'flex-start' },
  protectProfileLinkText: {
    fontSize: 11,
    fontFamily: 'DMSans_700Bold',
    color: Colors.growth,
  },
  planCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 14,
  },
  planCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  planCardTitle: { fontFamily: 'Satoshi_500Medium', fontSize: 14, color: Colors.ink },
  planCardSub: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.warmGray, marginTop: 2 },

  notesCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 14,
  },
  notesHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  notesTitle: { fontFamily: 'Satoshi_500Medium', fontSize: 14, color: Colors.ink },
  notesText: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.ink, lineHeight: 19 },
  notesBold: { fontFamily: 'DMSans_700Bold' },

  // ── Dark progress card ──
  darkCard: {
    marginHorizontal: 20,
    backgroundColor: Colors.ink,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  darkLeafIon: {
    position: 'absolute',
    top: -4,
    right: -10,
    pointerEvents: 'none',
  },
  darkSub:   { fontSize: 12, fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.55)' },
  darkTitle: { fontSize: 24, fontFamily: 'Satoshi_500Medium', color: '#fff', marginTop: 4, marginBottom: 14 },
  barBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 999,
    overflow: 'hidden',
  },
  barFill: { height: 6, backgroundColor: Colors.amber, borderRadius: 999 },
  darkFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  darkCount: { fontSize: 12, fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.55)' },
  darkTimeRow: { flexDirection: 'row', alignItems: 'center' },
  darkTime:  { fontSize: 12, fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.4)'  },

  // ── Mini-cards row ──
  miniRow: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 4,
  },
  miniLight: {
    flex: 1,
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniDark: {
    flex: 1,
    backgroundColor: Colors.ink,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniTitleLight: { fontSize: 11, fontFamily: 'DMSans_700Bold', color: Colors.ink },
  miniSubLight:   { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, marginTop: 1 },
  miniTitleDark:  { fontSize: 11, fontFamily: 'DMSans_700Bold', color: '#fff' },
  miniSubAmber:   { fontSize: 11, fontFamily: 'DMSans_600SemiBold', color: Colors.amber, marginTop: 1 },

  // ── Section title ──
  secTitle: {
    fontSize: 17,
    fontFamily: 'Satoshi_500Medium',
    color: Colors.ink,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
  },

  // ── Steps ──
  stepRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    gap: 14,
  },
  timeline:     { width: 32, alignItems: 'center' },
  check: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDone:     { backgroundColor: Colors.sage, borderColor: Colors.sage },
  checkMark:     { color: '#fff', fontSize: 13, fontFamily: 'DMSans_700Bold' },
  connector:     { flex: 1, width: 2, backgroundColor: Colors.border, minHeight: 22 },
  connectorDone: { backgroundColor: Colors.sage },
  stepBody:      { flex: 1, paddingBottom: 18 },
  stepTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  stepTitle:     { fontSize: 15, fontFamily: 'DMSans_600SemiBold', color: Colors.ink, flex: 1 },
  stepTitleDone: { textDecorationLine: 'line-through', color: Colors.warmGray },
  durPill: {
    backgroundColor: Colors.amberLight,
    borderRadius: 999,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
  durText:     { fontSize: 10, fontFamily: 'DMSans_500Medium', color: Colors.ink },
  stepDesc:    { fontSize: 13, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, lineHeight: 18 },
  productRow:  { flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  productPill: {
    backgroundColor: Colors.blush,
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  productPillText: { fontSize: 10, fontFamily: 'DMSans_500Medium', color: Colors.rose },

  // ── Validate ──
  validateBtn: {
    marginHorizontal: 20,
    marginTop: 8,
    backgroundColor: Colors.sage,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  validateBtnDone: { opacity: 0.6 },
  validateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    maxWidth: '100%',
  },
  validateLabel: {
    fontSize: 15,
    fontFamily: 'DMSans_700Bold',
    color: '#fff',
    flexShrink: 0,
  },
  validateReward: {
    fontSize: 12,
    fontFamily: 'DMSans_600SemiBold',
    color: 'rgba(255,255,255,0.92)',
    flexShrink: 1,
  },

  // ── Used products ──
  usedCard: {
    marginHorizontal: 20,
    marginTop: 22,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    padding: 16,
  },
  usedHeader:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  usedTitle:       { fontSize: 15, fontFamily: 'Satoshi_500Medium', color: Colors.ink },
  usedChips:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  usedChip: {
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  usedChipText: { fontSize: 12, fontFamily: 'DMSans_600SemiBold', color: Colors.ink },
  usedFooter:   { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, marginTop: 10 },

  // ── Tips ──
  tipsBlock: {
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    overflow: 'hidden',
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: Colors.cream,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tipsHeaderTitle: { fontSize: 15, fontFamily: 'Satoshi_500Medium', color: Colors.ink },
  tipsHeaderSub:   { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, marginTop: 2 },
  tipRow:       { flexDirection: 'row', gap: 12, padding: 14, alignItems: 'flex-start' },
  tipRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  tipBody:  { flex: 1 },
  tipTitle: { fontSize: 13, fontFamily: 'DMSans_700Bold', color: Colors.ink, marginBottom: 4 },
  tipText:  { fontSize: 12, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, lineHeight: 18 },
  adnTipRow: { backgroundColor: Colors.amberPowder },
  adnTipBadge: {
    backgroundColor: Colors.amber, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  adnTipBadgeText: { fontSize: 13, fontFamily: 'DMSans_700Bold', color: Colors.ink, letterSpacing: 0.5 },

  celebCard: {
    backgroundColor: Colors.amberLight,
    borderRadius: 20, borderWidth: 1, borderColor: Colors.amber,
    padding: 14, marginBottom: 16, marginHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  celebBubbleWrap: {
    flex: 1,
    marginLeft: 6,
  },
  celebTailBorder: {
    position: 'absolute', left: -9, top: 12,
    width: 0, height: 0,
    borderTopWidth: 8, borderBottomWidth: 8, borderRightWidth: 9,
    borderTopColor: 'transparent', borderBottomColor: 'transparent',
    borderRightColor: Colors.amber,
  },
  celebTailFill: {
    position: 'absolute', left: -7, top: 13,
    width: 0, height: 0,
    borderTopWidth: 7, borderBottomWidth: 7, borderRightWidth: 8,
    borderTopColor: 'transparent', borderBottomColor: 'transparent',
    borderRightColor: '#fff',
  },
  celebBubble: {
    backgroundColor: '#fff',
    borderRadius: 16, borderTopLeftRadius: 4,
    paddingVertical: 10, paddingHorizontal: 13,
    borderWidth: 1, borderColor: Colors.amber,
  },
  celebMsg: {
    fontSize: 13, fontFamily: 'DMSans_500Medium', color: Colors.ink,
    lineHeight: 20,
  },

  // ── Period tabs ──
  periodRow: {
    flexDirection: 'row',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 8,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  periodTabActive: {
    borderColor: Colors.ink,
    backgroundColor: Colors.ink,
  },
  periodLabel: {
    fontSize: 12,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.warmGray,
  },
  periodLabelActive: {
    color: '#fff',
  },

  // ── History ──
  historySection: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    overflow: 'hidden',
  },
  historySectionTitle: {
    fontSize: 15,
    fontFamily: 'Satoshi_500Medium',
    color: Colors.ink,
    padding: 16,
    paddingBottom: 12,
    backgroundColor: Colors.cream,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  historyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.sage,
  },
  historyBody: { flex: 1 },
  historyLabel: {
    fontSize: 13,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.ink,
  },
  historyDate: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    marginTop: 1,
  },
  historyCoin: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.amberLight,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  historyCoinText: {
    fontSize: 11,
    fontFamily: 'DMSans_700Bold',
    color: Colors.ink,
  },

  // ── Empty state ──
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 14,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    textAlign: 'center',
  },
});
