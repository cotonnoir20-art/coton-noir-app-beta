import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import Reanimated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../src/context/AppContext';
import { useAuth } from '../../src/context/AuthContext';
import { useBlackCotton } from '../../src/components/blackCotton';
import { useNotifications } from '../../src/context/NotificationsContext';
import { AppIconBox } from '../../src/components/AppIconBox';
import { Colors } from '../../src/theme/colors';
import { ROUTINE_TYPES, type RoutineType } from '../../src/data/routines';
import { getCurrentLevel } from '../../src/data/levels';
import { CC_ROUTINE_VALIDATION_REWARD, CC_ROUTINE_WASHDAY } from '../../src/lib/cotonCoins';
import { HOME_TAGLINE, HOME_TAGLINE_WEB } from '../../src/constants/productPitch';
import { isWebPlatform } from '../../src/lib/webStaging';
import { PANTRY_ITEMS } from '../../src/data/pantryItems';
import { buildGrowthMilestones, computeHairHealthScore, getHomeLengthMetrics } from '../../src/lib/homeGrowth';
import { fetchHomeHighlights } from '../../src/lib/fetchHomeHighlights';
import type { MomentCard } from '../../src/data/homeHighlights';
import { FALLBACK_HOME_HIGHLIGHTS } from '../../src/data/homeHighlights';
import {
  HomeTopBar,
  HomeGreetingRow,
  HomeLengthRing,
  HomeWeekStrip,
  HomeNextWashday,
  HomeRoutineCTA,
  type HomeRoutineFocus,
  HomeGrowthMilestones,
  HomeRoutinePlanCard,
  HomeRecoExtras,
  HomeBlackCottonRecommendations,
  HomeMomentsForts,
  HomeShortcuts,
} from '../../src/components/home';
import { FirstMeasureGuidePopin } from '../../src/components/FirstMeasureGuidePopin';
import {
  hasSeenFirstMeasureGuide,
  markFirstMeasureGuideSeen,
} from '../../src/lib/firstMeasureGuide';

function toLocalISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const DAY_LABELS_SHORT = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const TOTAL_WEEKS = 4;
const MONTHS_SHORT = [
  'janv.', 'févr.', 'mars', 'avril', 'mai', 'juin',
  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
];

export default function HomeScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { state } = useApp();
  const { streak, profile } = state;
  const { fire } = useBlackCotton();
  const { unreadCount } = useNotifications();
  const { height: screenHeight } = useWindowDimensions();
  const PANTRY_SHEET_HEIGHT = Math.round(screenHeight * 0.6);

  const todayObj = new Date();
  const todayStr = toLocalISODate(todayObj);

  const routineDatesSet = useMemo(
    () => new Set(state.coinHistory.filter(e => e.amount > 0).map(e => e.date)),
    [state.coinHistory],
  );
  const soinDatesSet = useMemo(
    () => new Set(state.plannedSoins.map(s => s.date)),
    [state.plannedSoins],
  );

  const daysSinceMonday = (todayObj.getDay() + 6) % 7;
  const weekStart = new Date(todayObj);
  weekStart.setDate(todayObj.getDate() - daysSinceMonday);
  weekStart.setHours(0, 0, 0, 0);

  const calDays = useMemo(() => {
    return Array.from({ length: TOTAL_WEEKS * 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      const dateStr = toLocalISODate(d);
      return {
        dayLabel: DAY_LABELS_SHORT[(d.getDay() + 6) % 7],
        dateNum: d.getDate(),
        isToday: dateStr === todayStr,
        isPast: dateStr < todayStr,
        hasRoutine: routineDatesSet.has(dateStr),
        hasSoin: soinDatesSet.has(dateStr),
      };
    });
  }, [weekStart.getTime(), todayStr, routineDatesSet, soinDatesSet]);

  const focusRoutine = useMemo((): RoutineType | null => {
    const order: RoutineType[] = ['daily', 'night', 'washday'];
    for (const t of order) {
      if (!state.validated[t]) return t;
    }
    return null;
  }, [state.validated]);

  const homeRoutineFocus: HomeRoutineFocus = useMemo(() => {
    if (!focusRoutine) {
      const lvl = getCurrentLevel(state.totalEarned);
      return { kind: 'all_done', levelName: lvl.name, levelEmoji: lvl.emoji };
    }
    const steps = state.routineSteps[focusRoutine];
    const done = steps.filter(s => s.done).length;
    const total = Math.max(1, steps.length);
    const allStepsDone = done === total;
    return {
      kind: 'routine',
      done,
      total,
      reward: focusRoutine === 'washday' ? CC_ROUTINE_WASHDAY : CC_ROUTINE_VALIDATION_REWARD,
      label: ROUTINE_TYPES[focusRoutine].label,
      allStepsDone,
    };
  }, [focusRoutine, state.routineSteps, state.totalEarned]);

  const openFocusRoutine = useCallback(() => {
    if (!focusRoutine) {
      router.push('/(tabs)/growth' as any);
      return;
    }
    router.push({ pathname: '/(tabs)/routine', params: { routine: focusRoutine } } as any);
  }, [router, focusRoutine]);

  useEffect(() => {
    fire('first_login');
  }, [fire]);

  const lengthMetrics = useMemo(() => getHomeLengthMetrics(state), [state]);
  const healthScore = useMemo(() => computeHairHealthScore(state), [state]);

  const [measureGuideOpen, setMeasureGuideOpen] = useState(false);

  useEffect(() => {
    if (lengthMetrics.hasMeasurements) {
      setMeasureGuideOpen(false);
      return;
    }
    const userId = session?.user?.id ?? null;
    let cancelled = false;
    (async () => {
      const seen = await hasSeenFirstMeasureGuide(userId);
      if (!cancelled && !seen) setMeasureGuideOpen(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [lengthMetrics.hasMeasurements, session?.user?.id]);

  const closeMeasureGuide = useCallback(
    async (startMeasure: boolean) => {
      await markFirstMeasureGuideSeen(session?.user?.id ?? null);
      setMeasureGuideOpen(false);
      if (startMeasure) router.push('/hair-length' as any);
    },
    [router, session?.user?.id],
  );

  const goalHorizonLabel = useMemo(() => {
    const raw = state.profile.objectiveTargetDate?.trim();
    if (raw && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      const [yStr, mStr] = raw.split('-');
      const y = Number(yStr);
      const m = Number(mStr);
      if (y > 2000 && m >= 1 && m <= 12) return `${MONTHS_SHORT[m - 1]} ${y}`;
    }
    const y = new Date().getFullYear() + 1;
    return `${MONTHS_SHORT[11]} ${y}`;
  }, [state.profile.objectiveTargetDate]);

  const milestones = useMemo(
    () => buildGrowthMilestones(lengthMetrics.currentCm, lengthMetrics.targetCm),
    [lengthMetrics.currentCm, lengthMetrics.targetCm],
  );

  const [moments, setMoments] = useState<MomentCard[]>(FALLBACK_HOME_HIGHLIGHTS);
  const [highlightsNonce, setHighlightsNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchHomeHighlights()
      .then(list => {
        if (!cancelled) {
          setMoments(Array.isArray(list) && list.length > 0 ? list : FALLBACK_HOME_HIGHLIGHTS);
        }
      })
      .catch(() => {
        if (!cancelled) setMoments(FALLBACK_HOME_HIGHLIGHTS);
      });
    return () => {
      cancelled = true;
    };
  }, [highlightsNonce]);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setHighlightsNonce(n => n + 1);
    await new Promise(res => setTimeout(res, 600));
    setRefreshing(false);
  }, []);

  const [showPantry, setShowPantry] = useState(false);
  const [pantryMounted, setPantryMounted] = useState(false);
  const [pantryItems, setPantryItems] = useState<string[]>([]);
  const [customItems, setCustomItems] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [pantryQuery, setPantryQuery] = useState('');

  const pantryProgress = useSharedValue(0);
  const pantryBackdropStyle = useAnimatedStyle(() => ({
    opacity: pantryProgress.value * 0.45,
  }));
  const pantrySheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - pantryProgress.value) * PANTRY_SHEET_HEIGHT }],
  }));

  useEffect(() => {
    if (showPantry) {
      setPantryMounted(true);
      pantryProgress.value = withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic) });
    } else if (pantryMounted) {
      pantryProgress.value = withTiming(
        0,
        { duration: 220, easing: Easing.in(Easing.cubic) },
        finished => {
          if (finished) runOnJS(setPantryMounted)(false);
        },
      );
      setPantryQuery('');
      setShowCustomInput(false);
      setCustomInput('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPantry]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const seen = await AsyncStorage.getItem('pantry_popup_seen');
      if (!seen) setShowPantry(true);
    }, 10000);
    return () => clearTimeout(timer);
  }, []);

  function togglePantryItem(id: string) {
    setPantryItems(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  }

  function addCustomItem() {
    const val = customInput.trim();
    if (!val || customItems.includes(val)) return;
    setCustomItems(prev => [...prev, val]);
    setPantryItems(prev => [...prev, val]);
    setCustomInput('');
    setShowCustomInput(false);
  }

  function toggleCustomItem(label: string) {
    setPantryItems(prev => (prev.includes(label) ? prev.filter(x => x !== label) : [...prev, label]));
  }

  async function confirmPantry() {
    await AsyncStorage.setItem('pantry_popup_seen', '1');
    await AsyncStorage.setItem(
      'pantry_items',
      JSON.stringify([...pantryItems, ...customItems.filter(c => !pantryItems.includes(c))]),
    );
    fire('pantry_filled');
    setShowPantry(false);
  }

  const q = pantryQuery.trim().toLowerCase();
  const filteredItems = q ? PANTRY_ITEMS.filter(it => it.label.toLowerCase().includes(q)) : PANTRY_ITEMS;
  const filteredCustom = q ? customItems.filter(c => c.toLowerCase().includes(q)) : customItems;
  const noResults = q.length > 0 && filteredItems.length === 0 && filteredCustom.length === 0;
  const confirmLabel =
    pantryItems.length > 0
      ? `Confirmer (${pantryItems.length} sélectionné${pantryItems.length > 1 ? 's' : ''}) →`
      : "Passer pour l'instant";

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <LinearGradient
        colors={['#FDF1EC', '#FCE8E8', '#FAF0EA', '#FDF8F4']}
        locations={[0, 0.32, 0.65, 1]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={s.heroShell}
      >
        <HomeTopBar
          transparent
          coins={state.coins}
          streak={streak}
          unreadCount={unreadCount}
          onCoinsPress={() => router.push('/rewards')}
          onStreakPress={() => router.push('/(tabs)/growth' as any)}
          onNotifPress={() => router.push('/notifications')}
        />

        <ScrollView
          style={s.scroll}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.amber}
              colors={[Colors.amber]}
            />
          }
        >
          <View style={s.hero}>
            <HomeGreetingRow displayName={profile.name} greetingEmoji="🌸" />
            <Text
              style={s.homeTagline}
              numberOfLines={Platform.OS === 'web' ? 2 : 1}
              {...(Platform.OS === 'ios'
                ? { adjustsFontSizeToFit: true, minimumFontScale: 0.72 }
                : {})}
            >
              {HOME_TAGLINE}
            </Text>

            <HomeLengthRing
              hairType={profile.hairType || '—'}
              currentCm={lengthMetrics.currentCm}
              targetCm={lengthMetrics.targetCm}
              monthDeltaCm={lengthMetrics.monthDeltaCm}
              progress01={lengthMetrics.ringProgress}
              hasMeasurements={lengthMetrics.hasMeasurements}
              goalHorizonLabel={goalHorizonLabel}
              hint={lengthMetrics.hint}
              healthScore={healthScore}
              onRingPress={() => router.push('/(tabs)/growth' as any)}
              onEmptyPress={() => router.push('/hair-length' as any)}
            />

            <HomeWeekStrip days={calDays} />

            <HomeRoutineCTA focus={homeRoutineFocus} onPress={openFocusRoutine} />
          </View>

        <View style={s.whiteBlock}>
          <HomeGrowthMilestones
            items={milestones}
            currentCm={lengthMetrics.currentCm}
            targetCm={lengthMetrics.targetCm}
          />
          <HomeRoutinePlanCard
            morningSteps={state.routineSteps.daily}
            eveningSteps={state.routineSteps.night}
          />
          <HomeRecoExtras profile={profile} washdaySteps={state.routineSteps.washday} />
          <HomeBlackCottonRecommendations profile={profile} />
          <HomeMomentsForts
            moments={moments}
            onSeeAll={() => router.push('/highlights' as any)}
            onMomentPress={m => {
              if (m.route) router.push(m.route as any);
            }}
          />
          <HomeShortcuts />
          <HomeNextWashday routineDates={routineDatesSet} />
        </View>

        <View style={s.footer}>
          <Ionicons name="leaf-outline" size={20} color={Colors.warmGray} style={{ marginBottom: 2 }} />
          <Text style={s.footerName}>Coton Noir</Text>
          <Text style={s.footerRights}>© 2026 Coton Noir · Tous droits réservés</Text>
          <Text style={s.footerVersion}>V 1.0.0-beta</Text>
        </View>
        <View style={{ height: 28 }} />
      </ScrollView>
      </LinearGradient>

      <Modal visible={pantryMounted} transparent statusBarTranslucent animationType="none" onRequestClose={() => setShowPantry(false)}>
        <View style={p.root}>
          <Reanimated.View style={[p.backdrop, pantryBackdropStyle]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowPantry(false)} accessibilityLabel="Fermer" />
          </Reanimated.View>
          <Reanimated.View style={[p.sheet, { height: PANTRY_SHEET_HEIGHT }, pantrySheetStyle]}>
            <View style={p.handle} />
            <View style={p.titleRow}>
              <Text style={p.title}>Ce que tu as chez toi</Text>
              <Ionicons name="home-outline" size={18} color={Colors.warmGray} />
            </View>
            <Text style={p.sub}>
              Sélectionne les ingrédients et produits disponibles — on adapte tes recommandations.
            </Text>
            <View style={p.searchRow}>
              <Ionicons name="search-outline" size={16} color={Colors.warmGray} />
              <TextInput
                style={p.searchInput}
                placeholder="Rechercher un ingrédient…"
                placeholderTextColor={Colors.warmGray}
                value={pantryQuery}
                onChangeText={setPantryQuery}
                returnKeyType="search"
                autoCorrect={false}
              />
              {pantryQuery.length > 0 && (
                <TouchableOpacity onPress={() => setPantryQuery('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={16} color={Colors.warmGray} />
                </TouchableOpacity>
              )}
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 8 }}>
              <View style={p.grid}>
                {filteredItems.map(item => {
                  const selected = pantryItems.includes(item.id);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[p.chip, selected && p.chipActive]}
                      onPress={() => togglePantryItem(item.id)}
                    >
                      <View style={p.chipIcon}>
                        <AppIconBox name={item.name} backgroundColor={item.bg} color={item.color} size={28} iconSize={14} borderRadius={9} />
                      </View>
                      <Text style={[p.chipLabel, selected && p.chipLabelActive]}>{item.label}</Text>
                      {selected && <Ionicons name="checkmark-circle" size={14} color={Colors.amber} />}
                    </TouchableOpacity>
                  );
                })}
                {filteredCustom.map(label => {
                  const selected = pantryItems.includes(label);
                  return (
                    <TouchableOpacity
                      key={label}
                      style={[p.chip, selected && p.chipActive]}
                      onPress={() => toggleCustomItem(label)}
                    >
                      <View style={p.chipIcon}>
                        <AppIconBox name="create-outline" backgroundColor={Colors.cream} color={Colors.ink} size={28} iconSize={14} borderRadius={9} />
                      </View>
                      <Text style={[p.chipLabel, selected && p.chipLabelActive]}>{label}</Text>
                      {selected && <Ionicons name="checkmark-circle" size={14} color={Colors.amber} />}
                    </TouchableOpacity>
                  );
                })}
                <TouchableOpacity style={[p.chip, p.chipOther]} onPress={() => setShowCustomInput(v => !v)}>
                  <View style={p.chipIcon}>
                    <AppIconBox name="add-circle-outline" backgroundColor={Colors.amberLight} color={Colors.amberDark} size={28} iconSize={14} borderRadius={9} />
                  </View>
                  <Text style={p.chipLabel}>Autre</Text>
                </TouchableOpacity>
              </View>
              {noResults && (
                <Text style={p.noResult}>Aucun résultat pour « {pantryQuery} ». Utilise « Autre » pour l’ajouter.</Text>
              )}
              {showCustomInput && (
                <View style={p.inputRow}>
                  <TextInput
                    style={p.input}
                    value={customInput}
                    onChangeText={setCustomInput}
                    placeholder="Nom de l'ingrédient ou produit…"
                    placeholderTextColor={Colors.warmGray}
                    autoFocus
                    onSubmitEditing={addCustomItem}
                    returnKeyType="done"
                  />
                  <TouchableOpacity
                    style={[p.inputBtn, !customInput.trim() && { opacity: 0.4 }]}
                    onPress={addCustomItem}
                    disabled={!customInput.trim()}
                  >
                    <Text style={p.inputBtnText}>Ajouter</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
            <TouchableOpacity style={p.confirmBtn} onPress={confirmPantry}>
              <Text style={p.confirmText}>{confirmLabel}</Text>
            </TouchableOpacity>
          </Reanimated.View>
        </View>
      </Modal>

      <FirstMeasureGuidePopin
        visible={measureGuideOpen}
        onClose={() => closeMeasureGuide(false)}
        onStartMeasure={() => closeMeasureGuide(true)}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FDF1EC' },
  heroShell: { flex: 1 },
  scroll: { flex: 1, backgroundColor: 'transparent' },
  hero: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 24 },
  homeTagline: {
    alignSelf: 'stretch',
    fontSize: Platform.OS === 'android' ? 10.5 : 13,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    textAlign: 'center',
    lineHeight: Platform.OS === 'android' ? 14 : 18,
    marginTop: 6,
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  homeTaglineWeb: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  whiteBlock: { backgroundColor: Colors.bg, paddingTop: 4 },
  footer: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: 'center',
    paddingBottom: 8,
    marginHorizontal: 20,
  },
  footerName: { fontSize: 13, fontFamily: 'DMSans_700Bold', color: Colors.ink, marginBottom: 2 },
  footerRights: { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, marginBottom: 4 },
  footerVersion: { fontSize: 10, fontFamily: 'DMSans_400Regular', color: Colors.border, letterSpacing: 0.5 },
});

const p = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000' },
  sheet: {
    backgroundColor: Colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 12,
    flexDirection: 'column',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: 20 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  title: { fontSize: 20, fontFamily: 'Poppins_700Bold', color: Colors.ink, flex: 1 },
  sub: { fontSize: 13, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, lineHeight: 19, marginBottom: 18 },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: 'DMSans_400Regular', color: Colors.ink, padding: 0 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingBottom: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipActive: { backgroundColor: Colors.amberLight, borderColor: Colors.amber },
  chipIcon: { flexShrink: 0 },
  chipLabel: { fontSize: 12, fontFamily: 'DMSans_500Medium', color: Colors.ink },
  chipLabelActive: { color: Colors.amberDark, fontFamily: 'DMSans_700Bold' },
  chipOther: { borderStyle: 'dashed', borderColor: Colors.warmGray },
  noResult: { fontSize: 12, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, textAlign: 'center', marginTop: 14, paddingHorizontal: 8, lineHeight: 18 },
  inputRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 4, marginBottom: 8 },
  input: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.amber,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: Colors.ink,
  },
  inputBtn: { backgroundColor: Colors.amber, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  inputBtnText: { fontSize: 13, fontFamily: 'DMSans_700Bold', color: '#fff' },
  confirmBtn: { backgroundColor: Colors.ink, borderRadius: 16, paddingVertical: 15, alignItems: 'center', marginTop: 16 },
  confirmText: { fontSize: 14, fontFamily: 'DMSans_700Bold', color: '#fff' },
});
