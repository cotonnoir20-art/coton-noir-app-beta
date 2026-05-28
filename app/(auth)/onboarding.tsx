import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated, KeyboardAvoidingView, Platform,
  ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../src/lib/supabase';
import { PENDING_ONBOARDING_GIFT_KEY } from '../../src/lib/cotonCoins';
import { Colors } from '../../src/theme/colors';
import { useApp, type CareStyle } from '../../src/context/AppContext';
import {
  displayObjective,
  getOnboardingObjectives,
  normalizeObjectiveId,
} from '../../src/constants/hairObjectives';
import { CARE_STYLES, type CareStyleId } from '../../src/constants/careStyles';
import {
  buildOnboardingRecommendations,
  recoStepsToRoutineSteps,
} from '../../src/lib/onboardingRecommendations';
import { useSupabaseProducts } from '../../src/lib/useSupabaseProducts';
import { buildBlackCottonHomeRecommendations } from '../../src/lib/blackCottonRecommendations';
import { ONBOARDING_HAIR_TYPES } from '../../src/constants/onboardingHairTypes';
import { POROSITY_OPTIONS } from '../../src/constants/hairProfileOptions';
import { markOnboardingDoneLocal } from '../../src/lib/onboardingGate';
import { trackProductEvent } from '../../src/lib/productAnalytics';
import { MiniCalendar, formatFull } from '../../src/components/MiniCalendar';
import { HairLengthLandmarkPicker } from '../../src/components/profile/HairLengthLandmarkPicker';
import { HairProblematicsPicker } from '../../src/components/profile/HairProblematicsPicker';
import { normalizeProblematicLabels } from '../../src/constants/hairProblematics';
import { toLocalISODate } from '../../src/lib/homeGrowth';
import { canAttemptAuth, recordAuthAttempt } from '../../src/lib/authThrottle';
import { mapSupabaseAuthError, validatePassword } from '../../src/lib/passwordPolicy';
import { OnboardingProgressBar } from '../../src/components/onboarding/OnboardingProgressBar';
import { OnboardingFinalPlanStep } from '../../src/components/onboarding/OnboardingFinalPlanStep';
import { OnboardingSignUpStep } from '../../src/components/onboarding/OnboardingSignUpStep';
import {
  OnboardingConfidenceStep,
  OnboardingHairNotesField,
  OnboardingResultsPaceStep,
  OnboardingRoutineBlockersStep,
} from '../../src/components/onboarding/OnboardingStepViews';
import { ScanEntryCard } from '../../src/components/hairScan/ScanEntryCard';
import { OnboardingQuickCapture } from '../../src/components/hairScan/OnboardingQuickCapture';
import type { ScanPhoto } from '../../src/components/hairScan/HairZoneScanner';
import { analyzeOnboardingPhoto } from '../../src/services/onboardingScanApi';
import type { OnboardingQuickScan } from '../../src/services/onboardingScanApi';
import { OnboardingInterstitialStep } from '../../src/components/onboarding/OnboardingInterstitialStep';
import {
  ONBOARDING_INTERSTITIALS,
  ONBOARDING_INTERSTITIAL_STEPS,
} from '../../src/constants/onboardingInterstitials';
import type { OnboardingBlockerId, OnboardingConfidenceId, OnboardingResultsPaceId, OnboardingRoutineConsistencyId } from '../../src/constants/onboardingEmotional';
import {
  DEFAULT_RESULTS_PACE_WEEKS,
  MAX_ONBOARDING_BLOCKERS,
  paceFromResultsWeeks,
  snapResultsWeeks,
  weeksFromResultsPace,
  weeksUntilGoalDate,
} from '../../src/constants/onboardingEmotional';
import { ONBOARDING_STORAGE_KEY, PENDING_POST_ONBOARDING_SCAN_KEY } from '../../src/lib/onboardingStorage';
import {
  buildOnboardingProfileRow,
  normalizeOnboardingHairType,
  onboardingRowToHairProfile,
  savePendingOnboardingProfile,
} from '../../src/lib/onboardingProfile';

const SCAN_STEP = 14;
const FINAL_STEP = 15;
const SIGNUP_STEP = 16;
const TOTAL = 17;
const OPTIONAL_STEPS = new Set<number>([8, 9, 10, SCAN_STEP]);

/** Migration des anciennes numérotations (étape fantôme 15, étape confiance 8). */
function migrateOnboardingStep(saved: number): number {
  let s = saved;
  if (s >= 16) s -= 1;
  if (s >= 9) s -= 1;
  if (s === 3) s = 4;
  return s;
}

const INTERSTITIAL_BY_STEP: Record<number, (typeof ONBOARDING_INTERSTITIALS)[number]> = {
  7: ONBOARDING_INTERSTITIALS[1],
  11: ONBOARDING_INTERSTITIALS[2],
};

function defaultGoalDate(): Date {
  const d = new Date();
  d.setMonth(d.getMonth() + 6);
  return d;
}

const POROSITY = POROSITY_OPTIONS;

const DENSITIES = [
  { id: 'Faible',  emoji: '🌿', label: 'Peu de cheveux',      desc: 'Le cuir chevelu est légèrement visible' },
  { id: 'Moyenne', emoji: '🌳', label: 'Densité normale',      desc: 'Ni trop peu, ni trop — équilibre idéal' },
  { id: 'Épaisse', emoji: '🌲', label: 'Beaucoup de cheveux',  desc: 'Chevelure très volumineuse' },
];

const REGIONS = [
  { id: 'france',    flag: '🇫🇷', label: 'France métropole',        climate: 'Tempéré',         desc: 'Saisons marquées, humidité variable' },
  { id: 'antilles',  flag: '🌴', label: 'Antilles / Guyane',        climate: 'Tropical humide', desc: "Chaleur et humidité toute l'année" },
  { id: 'afr_ouest', flag: '🌍', label: "Afrique de l'Ouest",       climate: 'Tropical',        desc: 'Saison sèche et saison des pluies' },
  { id: 'afr_c',     flag: '🌿', label: 'Afrique Centrale',         climate: 'Équatorial',      desc: 'Très humide, forêts tropicales' },
  { id: 'maghreb',   flag: '🌞', label: 'Maghreb / Afrique du Nord', climate: 'Méditerranéen',  desc: "Sec l'été, doux l'hiver" },
  { id: 'europe',    flag: '🇪🇺', label: 'Europe (autre)',            climate: 'Tempéré',         desc: 'Froid en hiver, doux en été' },
  { id: 'amerique',  flag: '🌎', label: 'Amériques',                climate: 'Varié',           desc: 'Grands écarts de température' },
  { id: 'autre',     flag: '🌐', label: 'Autre région',             climate: 'Varié',           desc: 'Paramètres standards' },
];

const CLIMATE_COLORS: Record<string, { bg: string; text: string }> = {
  'Tempéré':         { bg: Colors.cream,      text: Colors.warmGray },
  'Tropical humide': { bg: Colors.sageLight,  text: Colors.sage     },
  'Tropical':        { bg: Colors.sageLight,  text: Colors.sage     },
  'Équatorial':      { bg: Colors.sageLight,  text: Colors.sage     },
  'Méditerranéen':   { bg: Colors.amberLight, text: Colors.amberDark },
  'Varié':           { bg: Colors.blush,      text: Colors.rose     },
};

const BUDGETS = [
  { id: 'mini',    emoji: '🌱', label: 'Petit budget',       range: '< 20 €/mois',   desc: 'On mise sur le fait-maison et les essentiels' },
  { id: 'moyen',   emoji: '💚', label: 'Budget moyen',       range: '20 – 50 €/mois', desc: 'Un bon rapport qualité / efficacité' },
  { id: 'confort', emoji: '✨', label: 'Budget confortable',  range: '50 – 100 €/mois', desc: 'Des gammes premium et des soins pro' },
  { id: 'libre',   emoji: '💎', label: 'Pas de limite',      range: '100 €+/mois',   desc: 'Les meilleurs produits sans compromis' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { plan, signup } = useLocalSearchParams<{ plan?: string; signup?: string }>();
  const { dispatch, claimOnboardingGiftSecure } = useApp();
  const { products } = useSupabaseProducts();
  const [hydrated, setHydrated]   = useState(false);
  const [step, setStep]           = useState(0);
  const [hairType, setHairType]   = useState('');
  const [hairTypeUnsure, setHairTypeUnsure] = useState(false);
  const [porosity, setPorosity]   = useState('');
  const [density, setDensity]     = useState('');
  const [problematics, setProblematics] = useState<string[]>([]);
  const [hairNotes, setHairNotes] = useState('');
  const [objective, setObjective] = useState('');
  const [confidence, setConfidence] = useState<OnboardingConfidenceId | ''>('');
  const [routineConsistency, setRoutineConsistency] = useState<OnboardingRoutineConsistencyId | ''>('');
  const [blockers, setBlockers] = useState<OnboardingBlockerId[]>([]);
  const [resultsPace, setResultsPace] = useState<OnboardingResultsPaceId>('balanced');
  const [resultsWeeks, setResultsWeeks] = useState(DEFAULT_RESULTS_PACE_WEEKS);
  const [currentLength, setCurrentLength] = useState('');
  const [targetLength, setTargetLength] = useState('');
  const [goalDate, setGoalDate]         = useState<Date>(defaultGoalDate);
  const [showGoalCal, setShowGoalCal]   = useState(false);
  const [region, setRegion]       = useState('');
  const [budget, setBudget]       = useState('');
  const [careStyle, setCareStyle] = useState<CareStyleId | ''>('');
  const [name, setName]           = useState('');
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [showCapture, setShowCapture] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanResult, setScanResult]   = useState<OnboardingQuickScan | null>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const animating = useRef(false);

  function withFade(action: () => void) {
    if (animating.current) return;
    animating.current = true;
    Animated.timing(fadeAnim, { toValue: 0, duration: 100, useNativeDriver: true }).start(() => {
      action();
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start(() => {
        animating.current = false;
      });
    });
  }

  // ── Restaure l'onboarding (lastStep + champs) au démarrage ──
  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_STORAGE_KEY).then(raw => {
      if (raw) {
        try {
          const p = JSON.parse(raw) as Partial<{
            step: number; hairType: string; hairTypeUnsure: boolean; porosity: string; density: string;
            problematics: string[]; hairNotes: string; objective: string;
            confidence: OnboardingConfidenceId; routineConsistency: OnboardingRoutineConsistencyId;
            blockers: OnboardingBlockerId[]; resultsPace: OnboardingResultsPaceId;
            resultsWeeks: number;
            currentLength: string; targetLength: string; goalDateIso: string;
            region: string; budget: string; careStyle: CareStyleId;
            name: string; email: string;
          }>;
          if (typeof p.step === 'number') {
            const migrated = migrateOnboardingStep(p.step);
            setStep(Math.min(Math.max(migrated, 0), TOTAL - 1));
          }
          if (p.hairType)  setHairType(p.hairType);
          if (p.hairTypeUnsure) setHairTypeUnsure(true);
          if (p.porosity)  setPorosity(p.porosity);
          if (p.density)   setDensity(p.density);
          if (p.problematics?.length) setProblematics(normalizeProblematicLabels(p.problematics));
          if (p.hairNotes) setHairNotes(p.hairNotes);
          if (p.objective) setObjective(normalizeObjectiveId(p.objective));
          if (p.confidence) setConfidence(p.confidence);
          if (p.routineConsistency) setRoutineConsistency(p.routineConsistency);
          if (p.blockers?.length) setBlockers(p.blockers);
          if (p.resultsWeeks) {
            setResultsWeeks(snapResultsWeeks(p.resultsWeeks));
            setResultsPace(paceFromResultsWeeks(p.resultsWeeks));
          } else if (p.resultsPace) {
            setResultsPace(p.resultsPace);
            setResultsWeeks(weeksFromResultsPace(p.resultsPace));
          }
          if (p.currentLength) setCurrentLength(p.currentLength);
          if (p.targetLength) setTargetLength(p.targetLength);
          if (p.goalDateIso && /^\d{4}-\d{2}-\d{2}$/.test(p.goalDateIso)) {
            setGoalDate(new Date(`${p.goalDateIso}T12:00:00`));
          }
          if (p.region)    setRegion(p.region);
          if (p.budget)    setBudget(p.budget);
          if (p.careStyle) setCareStyle(p.careStyle);
          if (p.name)      setName(p.name);
          if (p.email)     setEmail(p.email);
        } catch {}
      }
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (hydrated && plan === '1') setStep(FINAL_STEP);
  }, [hydrated, plan]);

  // ── Sauvegarde à chaque changement (jamais le mot de passe) ──
  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(
      ONBOARDING_STORAGE_KEY,
      JSON.stringify({
        step, hairType, hairTypeUnsure, porosity, density, problematics, hairNotes, objective,
        confidence, routineConsistency, blockers, resultsPace, resultsWeeks,
        currentLength, targetLength, goalDateIso: toLocalISODate(goalDate),
        region, budget, careStyle, name, email,
      }),
    );
  }, [
    hydrated, step, hairType, hairTypeUnsure, porosity, density, problematics, hairNotes, objective,
    confidence, routineConsistency, blockers, resultsPace,
    currentLength, targetLength, goalDate, region, budget, careStyle, name, email,
  ]);

  function next() { withFade(() => setStep(s => { const n = Math.min(s + 1, TOTAL - 1); return n === 3 ? 4 : n; })); }
  function skip() { next(); }
  function goToFinalPlan() {
    void AsyncStorage.removeItem(PENDING_POST_ONBOARDING_SCAN_KEY);
    withFade(() => setStep(FINAL_STEP));
  }

  async function handleScanCapture(photo: ScanPhoto) {
    setShowCapture(false);
    setScanLoading(true);
    withFade(() => setStep(FINAL_STEP));
    try {
      const result = await analyzeOnboardingPhoto(photo, {
        hairType: hairType || undefined,
        porosity: porosity || undefined,
        density: density || undefined,
        objective: objective || undefined,
        problematics: problematics.length ? problematics : undefined,
      });
      setScanResult(result);
    } catch {
      // Scan indisponible — le plan s'affiche sans résultat scan
    } finally {
      setScanLoading(false);
    }
  }
  function back() {
    if (step === SIGNUP_STEP) withFade(() => setStep(FINAL_STEP));
    else if (step === FINAL_STEP) withFade(() => setStep(SCAN_STEP));
    else if (step === 0) router.back();
    else if (step === 4) withFade(() => setStep(2));
    else withFade(() => setStep(s => s - 1));
  }

  function toggleBlocker(id: OnboardingBlockerId) {
    setBlockers(prev => {
      if (prev.includes(id)) return prev.filter(b => b !== id);
      if (prev.length >= MAX_ONBOARDING_BLOCKERS) return prev;
      return [...prev, id];
    });
  }

  function selectHairType(code: string) {
    setHairType(code);
    setHairTypeUnsure(false);
    setTimeout(next, 280);
  }

  function markHairTypeUnsure() {
    setHairType('');
    setHairTypeUnsure(true);
    next();
  }

  const goalDateIso = toLocalISODate(goalDate);

  function handleResultsWeeksChange(weeks: number) {
    const snapped = snapResultsWeeks(weeks);
    setResultsWeeks(snapped);
    setResultsPace(paceFromResultsWeeks(snapped));
  }

  async function handleSignUp() {
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError('Tous les champs sont obligatoires.');
      return;
    }
    const pwdCheck = validatePassword(password);
    if (!pwdCheck.ok) {
      setError(pwdCheck.message);
      return;
    }
    const throttle = canAttemptAuth();
    if (!throttle.allowed) {
      setError(throttle.message);
      return;
    }
    setLoading(true);
    setError('');

    const { data, error: err } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          name: name.trim(),
          hair_type: normalizeOnboardingHairType(hairType, hairTypeUnsure),
          hair_type_unsure: hairTypeUnsure,
          porosity: porosity || 'Moyenne',
          density: density || 'Moyenne',
          onboarding_done: true,
        },
      },
    });

    recordAuthAttempt(!err);
    if (err) {
      setError(mapSupabaseAuthError(err.message));
      setLoading(false);
      return;
    }

    if (!data.user) {
      setLoading(false);
      setError('Inscription reçue. Si un email de confirmation est activé, ouvre-le puis reconnecte-toi.');
      return;
    }

    const selectedRegion = REGIONS.find(r => r.id === region);
    const selectedBudget = BUDGETS.find(b => b.id === budget);

    await supabase.auth.getSession();

    const profileRow = buildOnboardingProfileRow({
      userId: data.user.id,
      name: name.trim(),
      hairType,
      hairTypeUnsure,
      porosity,
      density,
      problematics,
      hairNotes,
      confidence,
      routineConsistency,
      blockers,
      resultsPace,
      resultsWeeks,
      objective,
      currentLength,
      targetLength,
      goalDateIso,
      regionLabel: selectedRegion?.label ?? '',
      regionClimate: selectedRegion?.climate ?? '',
      budgetRange: selectedBudget?.range ?? '',
      careStyle,
    });

    await savePendingOnboardingProfile(profileRow);

    const { error: profileError } = await supabase.from('profiles').upsert(profileRow, {
      onConflict: 'id',
    });
    if (profileError) {
      if (__DEV__) console.warn('[onboarding] profiles upsert', profileError.message ?? profileError);
      setError(
        'Impossible d’enregistrer ton profil capillaire. Vérifie ta connexion et réessaie. '
        + 'Si le problème persiste, contacte support@appcotonnoir.com.',
      );
      setLoading(false);
      return;
    }

    await AsyncStorage.setItem(PENDING_ONBOARDING_GIFT_KEY, '1');
    const giftResult = await claimOnboardingGiftSecure();
    if (!giftResult.ok && __DEV__) {
      console.warn('[onboarding] claim gift', giftResult.error);
    }
    dispatch({
      type: 'updateProfile',
      payload: onboardingRowToHairProfile(profileRow),
    });

    const reco = buildOnboardingRecommendations({
      hairType: profileRow.hair_type,
      porosity: profileRow.porosity,
      density: profileRow.density,
      objective: profileRow.objective,
      region: profileRow.region,
      budget: profileRow.budget,
      careStyle: (profileRow.care_style || '') as CareStyleId,
      problematics: profileRow.problematics,
      blockers: profileRow.hair_blockers,
      hairNotes: profileRow.hair_notes,
      resultsWeeks: profileRow.results_weeks,
      hairTypeUnsure: profileRow.hair_type_unsure,
    }, products);
    dispatch({
      type: 'applyRecoRoutineSteps',
      daily: recoStepsToRoutineSteps(reco.morning),
      evening: recoStepsToRoutineSteps(reco.evening),
    });

    await AsyncStorage.removeItem(ONBOARDING_STORAGE_KEY);
    await markOnboardingDoneLocal(data.user.id);
    void trackProductEvent('onboarding_completed', {
      hair_type: profileRow.hair_type,
      care_style: profileRow.care_style,
    });
    if (profileRow.target_length) {
      void trackProductEvent('growth_goal_set', {
        source: 'onboarding',
        target_cm: profileRow.target_length,
        target_date: profileRow.target_goal_date ?? '',
      });
    }

    const pendingScan = await AsyncStorage.getItem(PENDING_POST_ONBOARDING_SCAN_KEY);
    await AsyncStorage.removeItem(PENDING_POST_ONBOARDING_SCAN_KEY);
    setLoading(false);
    router.replace(pendingScan ? '/(tabs)/analyze' : '/(auth)/recommendations');
  }

  const selectedRegion = REGIONS.find(r => r.id === region);

  const finalReco = useMemo(() => {
    if (!careStyle) return null;
    const selectedRegionRow = REGIONS.find(r => r.id === region);
    const selectedBudgetRow = BUDGETS.find(b => b.id === budget);
    return buildOnboardingRecommendations({
      hairType: normalizeOnboardingHairType(hairType, hairTypeUnsure),
      porosity: porosity || 'Moyenne',
      density: density || 'Moyenne',
      objective: normalizeObjectiveId(objective),
      region: selectedRegionRow?.label ?? '',
      budget: selectedBudgetRow?.range ?? '',
      careStyle,
      problematics,
      blockers,
      hairNotes: hairNotes.trim(),
      resultsWeeks,
      hairTypeUnsure,
    }, products);
  }, [
    careStyle, hairType, porosity, density, objective, region, budget,
    problematics, blockers, hairNotes, resultsWeeks, hairTypeUnsure, products,
  ]);

  const coachReco = useMemo(() => {
    if (!careStyle) return null;
    return buildBlackCottonHomeRecommendations({
      name: name || '',
      hairType: hairType || '',
      porosity: porosity || '',
      density: density || '',
      length: '',
      objective: objective || '',
      problematics,
      careStyle,
    });
  }, [careStyle, hairType, porosity, density, objective, problematics, name]);

  const canNext = (
    (step === 0 && (!!hairType || hairTypeUnsure)) ||
    (step === 1 && !!porosity && !!density) ||
    (step === 2 && problematics.length > 0) ||
    ONBOARDING_INTERSTITIAL_STEPS.has(step) ||
    (step === 4 && !!objective) ||
    (step === 5 && !!confidence) ||
    (step === 6 && !!routineConsistency) ||
    step === 8 ||
    step === 9 ||
    step === 10 ||
    (step === 12 && !!careStyle) ||
    step === 13 ||
    step === SCAN_STEP ||
    (step === FINAL_STEP && !!finalReco)
  );

  return (
    <SafeAreaView style={S.safe} edges={['top']}>

      <OnboardingProgressBar
        step={step}
        total={TOTAL}
        optional={OPTIONAL_STEPS.has(step)}
        onBack={back}
      />

      <Animated.View style={[S.animatedContainer, { opacity: fadeAnim }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            S.content,
            step === 0 && S.contentHairStep,
            step === FINAL_STEP && S.contentFinalStep,
            ONBOARDING_INTERSTITIAL_STEPS.has(step) && S.contentInterstitial,
          ]}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── ÉTAPE 0 : Type de cheveux ── */}
          {step === 0 && (
            <>
              <Text style={S.stepTitle}>Quel est ton type de cheveux ?</Text>
              <Text style={S.stepSub}>
                Fais défiler et choisis la photo qui ressemble le plus aux tiens. Pas sûre ? On t’aide après le scan.
              </Text>
              <View style={S.hairList}>
                {ONBOARDING_HAIR_TYPES.map(h => {
                  const active = hairType === h.code;
                  return (
                    <TouchableOpacity
                      key={h.code}
                      style={[S.hairCard, active && S.hairCardActive]}
                      onPress={() => selectHairType(h.code)}
                      activeOpacity={0.88}
                    >
                      <View style={S.hairPhotoWrap}>
                        <Image
                          source={h.image}
                          style={S.hairPhoto}
                          contentFit="cover"
                          transition={120}
                        />
                      </View>
                      <View style={S.hairCardSide}>
                        <View style={S.hairCardHeaderRow}>
                          <View style={S.hairCardTextCol}>
                            <Text style={S.hairCardCurl}>{h.curl}</Text>
                            <Text style={[S.hairCardCode, active && S.hairCardCodeActive]}>{h.code}</Text>
                            <Text style={S.hairCardDesc}>{h.desc}</Text>
                          </View>
                          <View style={S.hairCardCheck}>
                            {active ? (
                              <Ionicons name="checkmark-circle" size={28} color={Colors.amber} />
                            ) : null}
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TouchableOpacity onPress={markHairTypeUnsure} style={S.skipLink}>
                <Text style={S.skipText}>Je ne sais pas encore</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 1 && (
            <>
              <Text style={S.stepTitle}>Porosité & densité</Text>
              <Text style={S.stepSub}>Deux infos clés pour calibrer hydratation et produits.</Text>

              <Text style={S.sectionLabel}>Comment réagit ton cheveu à l'eau ?</Text>
              {POROSITY.map(p => (
                <TouchableOpacity
                  key={p.id}
                  style={[S.optionCard, porosity === p.id && S.optionCardActive]}
                  onPress={() => setPorosity(p.id)}
                >
                  <Text style={S.optionEmoji}>{p.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[S.optionLabel, porosity === p.id && S.optionLabelActive]}>{p.label}</Text>
                    <Text style={S.optionDesc}>{p.desc}</Text>
                  </View>
                  {porosity === p.id && <Ionicons name="checkmark-circle" size={22} color={Colors.amber} />}
                </TouchableOpacity>
              ))}

              <Text style={[S.sectionLabel, { marginTop: 20 }]}>Quelle est la densité de tes cheveux ?</Text>
              {DENSITIES.map(d => (
                <TouchableOpacity
                  key={d.id}
                  style={[S.optionCard, density === d.id && S.optionCardActive]}
                  onPress={() => setDensity(d.id)}
                >
                  <Text style={S.optionEmoji}>{d.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[S.optionLabel, density === d.id && S.optionLabelActive]}>{d.label}</Text>
                    <Text style={S.optionDesc}>{d.desc}</Text>
                  </View>
                  {density === d.id && <Ionicons name="checkmark-circle" size={22} color={Colors.amber} />}
                </TouchableOpacity>
              ))}
            </>
          )}

          {step === 2 && (
            <>
              <HairProblematicsPicker
                variant="onboarding"
                selected={problematics}
                onChange={setProblematics}
              />
              <Text style={S.requiredHint}>
                Sélectionne 1 à 3 problématiques pour continuer.
              </Text>
              <OnboardingHairNotesField value={hairNotes} onChange={setHairNotes} />
            </>
          )}

          {INTERSTITIAL_BY_STEP[step] ? (
            <OnboardingInterstitialStep
              config={INTERSTITIAL_BY_STEP[step]}
              hairType={hairType || undefined}
            />
          ) : null}

          {step === 4 && (
            <>
              <Text style={S.stepTitle}>Qu'est-ce que tu veux changer ?</Text>
              <Text style={S.stepSub}>Choisis ton objectif principal.</Text>
              {getOnboardingObjectives().map(o => (
                <TouchableOpacity
                  key={o.id}
                  style={[S.optionCard, objective === o.id && S.optionCardActive]}
                  onPress={() => { setObjective(o.id); setTimeout(next, 280); }}
                >
                  <Text style={S.optionEmoji}>{o.emoji}</Text>
                  <Text style={[S.optionLabel, objective === o.id && S.optionLabelActive]}>{o.label}</Text>
                  {objective === o.id && <Ionicons name="checkmark-circle" size={22} color={Colors.amber} />}
                </TouchableOpacity>
              ))}
            </>
          )}

          {step === 5 && (
            <OnboardingConfidenceStep value={confidence} onChange={v => { setConfidence(v); setTimeout(next, 280); }} />
          )}

          {step === 6 && (
            <OnboardingRoutineBlockersStep
              routineValue={routineConsistency}
              onRoutineChange={setRoutineConsistency}
              blockers={blockers}
              onToggleBlocker={toggleBlocker}
            />
          )}

          {step === 8 && (
            <>
              <Text style={S.stepSub}>
                Pour personnaliser ton suivi de pousse — tu pourras modifier dans ton profil.
              </Text>
              <HairLengthLandmarkPicker
                title="Longueur actuelle"
                value={currentLength}
                onChange={setCurrentLength}
                edgeToEdge
              />
              <HairLengthLandmarkPicker
                title="Longueur souhaitée"
                value={targetLength}
                onChange={setTargetLength}
                optional
                edgeToEdge
              />
              {!!targetLength.trim() && (
                <View style={S.inputGroup}>
                  <Text style={S.inputLabel}>Date cible (optionnel)</Text>
                  <TouchableOpacity
                    style={[S.input, S.dateRow]}
                    onPress={() => setShowGoalCal(v => !v)}
                  >
                    <Text style={S.dateRowText}>{formatFull(goalDate)}</Text>
                    <Ionicons name="calendar-outline" size={18} color={Colors.amber} />
                  </TouchableOpacity>
                  {showGoalCal && (
                    <MiniCalendar
                      selectedDate={goalDate}
                      onSelect={d => { setGoalDate(d); setShowGoalCal(false); }}
                      horizontalOffset={24}
                    />
                  )}
                </View>
              )}
              <TouchableOpacity onPress={skip} style={S.skipLink}>
                <Text style={S.skipText}>Passer cette étape</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 9 && (
            <>
              <Text style={S.stepTitle}>Tu te trouves où dans le monde ?</Text>
              <Text style={S.stepSub}>On adapte les produits disponibles et ta routine à ton climat.</Text>

              {REGIONS.map(r => {
                const climateStyle = CLIMATE_COLORS[r.climate] ?? { bg: Colors.cream, text: Colors.warmGray };
                const isSelected = region === r.id;
                return (
                  <TouchableOpacity
                    key={r.id}
                    style={[S.regionCard, isSelected && S.regionCardActive]}
                    onPress={() => setRegion(r.id)}
                  >
                    <Text style={S.regionFlag}>{r.flag}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[S.regionLabel, isSelected && S.regionLabelActive]}>{r.label}</Text>
                      <Text style={S.regionDesc}>{r.desc}</Text>
                    </View>
                    <View style={[S.climateBadge, { backgroundColor: climateStyle.bg }]}>
                      <Text style={[S.climateBadgeText, { color: climateStyle.text }]}>{r.climate}</Text>
                    </View>
                    {isSelected && <Ionicons name="checkmark-circle" size={22} color={Colors.amber} />}
                  </TouchableOpacity>
                );
              })}
              <TouchableOpacity onPress={skip} style={S.skipLink}>
                <Text style={S.skipText}>Plus tard · Je préfère renseigner ça après</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 10 && (
            <>
              <Text style={S.stepTitle}>Quel est ton budget capillaire ?</Text>
              <Text style={S.stepSub}>On te recommande des produits dans ta fourchette de prix.</Text>
              {BUDGETS.map(b => (
                <TouchableOpacity
                  key={b.id}
                  style={[S.optionCard, budget === b.id && S.optionCardActive]}
                  onPress={() => setBudget(b.id)}
                >
                  <Text style={S.optionEmoji}>{b.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[S.optionLabel, budget === b.id && S.optionLabelActive]}>{b.label}</Text>
                    <Text style={S.optionDesc}>{b.range} · {b.desc}</Text>
                  </View>
                  {budget === b.id && <Ionicons name="checkmark-circle" size={22} color={Colors.amber} />}
                </TouchableOpacity>
              ))}
              <TouchableOpacity onPress={skip} style={S.skipLink}>
                <Text style={S.skipText}>Plus tard · Je préfère renseigner ça après</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 12 && (
            <>
              <Text style={S.stepTitle}>
                Plutôt produit du commerce, recette DIY ou un mixte des deux ?
              </Text>
              <Text style={S.stepSub}>
                On adapte les recommandations en conséquence : plus de produits, plus de recettes, ou un mélange.
              </Text>
              {CARE_STYLES.map(c => (
                <TouchableOpacity
                  key={c.id}
                  style={[S.optionCard, careStyle === c.id && S.optionCardActive]}
                  onPress={() => { setCareStyle(c.id); setTimeout(next, 280); }}
                >
                  <Text style={S.optionEmoji}>{c.emoji}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[S.optionLabel, careStyle === c.id && S.optionLabelActive]}>
                      {c.label}
                    </Text>
                    <Text style={S.optionDesc}>{c.desc}</Text>
                  </View>
                  {careStyle === c.id && <Ionicons name="checkmark-circle" size={22} color={Colors.amber} />}
                </TouchableOpacity>
              ))}
            </>
          )}

          {step === 13 && (
            <OnboardingResultsPaceStep
              weeks={resultsWeeks}
              onWeeksChange={handleResultsWeeksChange}
              goalDateIso={targetLength.trim() ? goalDateIso : ''}
            />
          )}

          {step === SCAN_STEP && (
            <ScanEntryCard onStartScan={() => setShowCapture(true)} />
          )}

          {step === FINAL_STEP && finalReco ? (
            <OnboardingFinalPlanStep
              reco={finalReco}
              objective={objective}
              resultsWeeks={resultsWeeks ?? 8}
              hairTypeUnsure={hairTypeUnsure}
              hairType={hairType}
              porosity={porosity}
              density={density}
              problematics={problematics}
              coachReco={coachReco}
              scanResult={scanResult ?? undefined}
              scanLoading={scanLoading}
              onRestart={() => setStep(0)}
            />
          ) : step === FINAL_STEP ? (
            <Text style={S.stepSub}>Préparation de ton plan…</Text>
          ) : null}

          {step === SIGNUP_STEP ? (
            <OnboardingSignUpStep
              name={name}
              email={email}
              password={password}
              error={error}
              loading={loading}
              onNameChange={setName}
              onEmailChange={setEmail}
              onPasswordChange={setPassword}
              onSubmit={handleSignUp}
            />
          ) : null}

        </ScrollView>
      </KeyboardAvoidingView>

      {step < SIGNUP_STEP && (
        <View style={S.footer}>
          {step !== SCAN_STEP && (
            <TouchableOpacity
              style={[S.nextBtn, !canNext && S.nextBtnDisabled]}
              onPress={() => {
                if (step === FINAL_STEP) next();
                else next();
              }}
              disabled={!canNext}
            >
              <Text style={S.nextBtnText}>
                {ONBOARDING_INTERSTITIAL_STEPS.has(step)
                  ? 'Suivant'
                  : step === FINAL_STEP
                    ? 'Sauvegarder mon plan'
                    : 'Continuer'}{' '}
                <Text style={S.nextBtnAccent}>→</Text>
              </Text>
            </TouchableOpacity>
          )}
          {step === SCAN_STEP ? (
            <TouchableOpacity onPress={() => goToFinalPlan()} style={S.skipLink}>
              <Text style={S.skipText}>Passer pour l'instant</Text>
            </TouchableOpacity>
          ) : step === FINAL_STEP ? (
            <Text style={S.saveHint}>Gratuit · ton plan disparaît si tu fermes sans compte.</Text>
          ) : null}
        </View>
      )}
      </Animated.View>

      {showCapture && (
        <OnboardingQuickCapture
          onCapture={handleScanCapture}
          onClose={() => setShowCapture(false)}
        />
      )}

    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.bg },
  animatedContainer: { flex: 1 },
  content: { paddingHorizontal: 24, paddingBottom: 24, paddingTop: 8 },
  contentHairStep: { paddingBottom: 120 },
  contentFinalStep: { paddingBottom: 48 },
  contentInterstitial: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionLabel: {
    fontSize: 15,
    fontFamily: 'Satoshi_500Medium',
    color: Colors.ink,
    marginBottom: 10,
    marginTop: 4,
  },
  requiredHint: {
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
    color: Colors.amberDark,
    marginTop: 8,
    marginBottom: 4,
  },

  // ── Progress ──
  progressHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingTop: 8, paddingBottom: 4,
  },
  progressLabel: {
    fontSize: 12, fontFamily: 'DMSans_700Bold',
    color: Colors.warmGray, letterSpacing: 0.6,
  },
  optionalBadge: {
    backgroundColor: Colors.amberLight,
    borderRadius: 999,
    paddingHorizontal: 9, paddingVertical: 3,
  },
  optionalBadgeText: {
    fontSize: 9, fontFamily: 'DMSans_700Bold',
    color: Colors.amberDark, letterSpacing: 1.2,
  },
  progressBar: {
    flexDirection: 'row', gap: 6,
    paddingHorizontal: 24, paddingTop: 4, paddingBottom: 4,
  },
  progressDot:       { flex: 1, height: 4, borderRadius: 2, backgroundColor: Colors.border },
  progressDotActive: { backgroundColor: Colors.amber },

  // ── Titres ──
  stepTitle: { fontSize: 24, fontFamily: 'Satoshi_500Medium', color: Colors.ink, marginBottom: 8, lineHeight: 32 },
  stepSub:   { fontSize: 14, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, marginBottom: 24, lineHeight: 20 },

  // ── Types cheveux (liste verticale, carte = image | texte) ──
  hairList: { gap: 14 },
  hairCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 216,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  hairCardActive: {
    borderColor: Colors.amber,
    backgroundColor: Colors.amberLight,
  },
  hairPhotoWrap: {
    width: '52%',
    height: 216,
    backgroundColor: Colors.cream,
  },
  hairPhoto: { width: '100%', height: '100%' },
  hairCardSide: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  hairCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  hairCardTextCol: { flex: 1, minWidth: 0 },
  hairCardCurl: { fontSize: 18, marginBottom: 4 },
  hairCardCode: { fontSize: 16, fontFamily: 'Satoshi_500Medium', color: Colors.ink, marginBottom: 4 },
  hairCardCodeActive: { color: Colors.amberDark },
  hairCardDesc: { fontSize: 12, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, lineHeight: 17 },
  hairCardCheck: { width: 30, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 2 },
  skipLink:       { alignItems: 'center', marginTop: 16 },
  skipText:       { fontSize: 13, fontFamily: 'DMSans_500Medium', color: Colors.warmGray },

  // ── Option cards (porosité + objectif) ──
  optionCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.surface, borderRadius: 18,
    borderWidth: 1.5, borderColor: Colors.border,
    padding: 16, marginBottom: 10,
  },
  optionCardActive:  { borderColor: Colors.amber, backgroundColor: Colors.amberLight },
  optionEmoji:       { fontSize: 28 },
  optionLabel:       { fontSize: 14, fontFamily: 'Satoshi_500Medium', color: Colors.ink },
  optionLabelActive: { color: Colors.amber },
  optionDesc:        { fontSize: 12, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, marginTop: 2 },

  // ── Région ──
  regionCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.surface, borderRadius: 18,
    borderWidth: 1.5, borderColor: Colors.border,
    padding: 14, marginBottom: 10,
  },
  regionCardActive:  { borderColor: Colors.amber, backgroundColor: Colors.amberLight },
  regionFlag:        { fontSize: 26 },
  regionLabel:       { fontSize: 14, fontFamily: 'Satoshi_500Medium', color: Colors.ink, marginBottom: 2 },
  regionLabelActive: { color: Colors.amber },
  regionDesc:        { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray },
  climateBadge:      { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  climateBadgeText:  { fontSize: 10, fontFamily: 'DMSans_600SemiBold' },

  // ── WOW moment ──
  wowCard: { backgroundColor: Colors.ink, borderRadius: 20, padding: 20, marginBottom: 14 },
  wowRoutineLabel: { fontSize: 10, fontFamily: 'DMSans_700Bold', color: 'rgba(255,255,255,0.45)', letterSpacing: 1, marginBottom: 16 },
  wowStep:        { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  wowStepNum:     { width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.amber, alignItems: 'center', justifyContent: 'center' },
  wowStepNumText: { fontSize: 12, fontFamily: 'DMSans_700Bold', color: '#fff' },
  wowStepText:    { flex: 1, fontSize: 13, fontFamily: 'DMSans_400Regular', color: '#fff', lineHeight: 18 },

  climateBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.sageLight, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.sage,
    padding: 14, marginBottom: 12,
  },
  climateBannerEmoji: { fontSize: 24 },
  climateBannerTitle: { fontSize: 13, fontFamily: 'DMSans_700Bold', color: Colors.ink, marginBottom: 2 },
  climateBannerSub:   { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray },

  coinsTeaser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.amberLight,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.amber,
    padding: 16,
  },
  coinsTeaserEmoji: { fontSize: 30, flexShrink: 0 },
  coinsTeaserBody: { flex: 1, minWidth: 0 },
  coinsTeaserTitle: {
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
    color: Colors.ink,
    flexShrink: 1,
  },
  coinsTeaserSub: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    marginTop: 2,
    flexShrink: 1,
  },

  // ── Formulaire compte ──
  inputGroup:  { marginBottom: 16 },
  inputLabel:  { fontSize: 12, fontFamily: 'DMSans_600SemiBold', color: Colors.ink, marginBottom: 6 },
  policyHint: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    marginTop: 6,
    lineHeight: 15,
  },
  input: {
    backgroundColor: Colors.surface, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 14, fontFamily: 'DMSans_400Regular', color: Colors.ink,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateRowText: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: Colors.ink,
  },
  errorText:      { fontSize: 13, fontFamily: 'DMSans_400Regular', color: Colors.rose, marginBottom: 12, textAlign: 'center' },
  primaryBtn: {
    backgroundColor: Colors.ink,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnText: {
    fontSize: 15,
    fontFamily: 'DMSans_700Bold',
    color: Colors.white,
  },
  primaryBtnAccent: {
    color: Colors.amber,
    fontFamily: 'DMSans_700Bold',
  },
  loginLink:      { alignItems: 'center', marginTop: 16 },
  loginLinkText:  { fontSize: 13, fontFamily: 'DMSans_500Medium', color: Colors.warmGray },

  // ── Footer ──
  footer:          { paddingHorizontal: 24, paddingBottom: 20, paddingTop: 8 },
  nextBtn: {
    backgroundColor: Colors.ink,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  nextBtnDisabled: { opacity: 0.4 },
  nextBtnText: {
    fontSize: 15,
    fontFamily: 'DMSans_700Bold',
    color: Colors.white,
  },
  nextBtnAccent: {
    color: Colors.amber,
    fontFamily: 'DMSans_700Bold',
  },
  saveHint: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 15,
  },
});
