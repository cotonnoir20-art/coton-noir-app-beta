import { useEffect, useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../src/lib/supabase';
import {
  CC_ONBOARDING_GIFT,
  PENDING_ONBOARDING_GIFT_KEY,
} from '../../src/lib/cotonCoins';
import { Colors } from '../../src/theme/colors';
import { useApp, type CareStyle } from '../../src/context/AppContext';
import { displayObjective, HAIR_OBJECTIVES, normalizeObjectiveId } from '../../src/constants/hairObjectives';
import { CARE_STYLES, type CareStyleId } from '../../src/constants/careStyles';
import {
  buildOnboardingRecommendations,
  recoStepsToRoutineSteps,
} from '../../src/lib/onboardingRecommendations';
import { ONBOARDING_HAIR_TYPES } from '../../src/constants/onboardingHairTypes';
import { markOnboardingDoneLocal } from '../../src/lib/onboardingGate';
import { trackProductEvent } from '../../src/lib/productAnalytics';
import { MiniCalendar, formatFull } from '../../src/components/MiniCalendar';
import { HairLengthLandmarkPicker } from '../../src/components/profile/HairLengthLandmarkPicker';
import { HairProblematicsPicker } from '../../src/components/profile/HairProblematicsPicker';
import { normalizeProblematicLabels } from '../../src/constants/hairProblematics';
import { toLocalISODate } from '../../src/lib/homeGrowth';
import { canAttemptAuth, recordAuthAttempt } from '../../src/lib/authThrottle';
import {
  mapSupabaseAuthError,
  PASSWORD_POLICY_HINT,
  validatePassword,
} from '../../src/lib/passwordPolicy';

const ONBOARDING_STORAGE_KEY = '@coton_noir_onboarding';
const OPTIONAL_STEPS = new Set<number>([3, 5, 6, 7]);

function defaultGoalDate(): Date {
  const d = new Date();
  d.setMonth(d.getMonth() + 6);
  return d;
}

const POROSITY = [
  { id: 'Faible',  label: "L'eau perle",         desc: "Le cheveu repousse l'eau",        emoji: '💧' },
  { id: 'Moyenne', label: "L'eau s'absorbe",      desc: 'Ni trop vite, ni trop lentement', emoji: '🌊' },
  { id: 'Élevée',  label: 'Le cheveu boit tout',  desc: 'Absorption instantanée',          emoji: '🫧' },
];

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
  const { signup } = useLocalSearchParams<{ signup?: string }>();
  const { dispatch } = useApp();
  const [hydrated, setHydrated]   = useState(false);
  const [step, setStep]           = useState(0);
  const [hairType, setHairType]   = useState('');
  const [porosity, setPorosity]   = useState('');
  const [density, setDensity]     = useState('');
  const [problematics, setProblematics] = useState<string[]>([]);
  const [objective, setObjective] = useState('');
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

  const TOTAL = 11;

  // ── Restaure l'onboarding (lastStep + champs) au démarrage ──
  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_STORAGE_KEY).then(raw => {
      if (raw) {
        try {
          const p = JSON.parse(raw) as Partial<{
            step: number; hairType: string; porosity: string; density: string;
            problematics: string[]; objective: string; currentLength: string;
            targetLength: string; goalDateIso: string;
            region: string; budget: string; careStyle: CareStyleId;
            name: string; email: string;
          }>;
          // Ne reprend pas sur l'étape "Créer mon compte" si email/nom ont été effacés
          if (typeof p.step === 'number') setStep(Math.min(Math.max(p.step, 0), TOTAL - 1));
          if (p.hairType)  setHairType(p.hairType);
          if (p.porosity)  setPorosity(p.porosity);
          if (p.density)   setDensity(p.density);
          if (p.problematics?.length) setProblematics(normalizeProblematicLabels(p.problematics));
          if (p.objective) setObjective(normalizeObjectiveId(p.objective));
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
    if (hydrated && signup === '1') setStep(10);
  }, [hydrated, signup]);

  // ── Sauvegarde à chaque changement (jamais le mot de passe) ──
  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(
      ONBOARDING_STORAGE_KEY,
      JSON.stringify({
        step, hairType, porosity, density, problematics, objective, currentLength,
        targetLength, goalDateIso: toLocalISODate(goalDate), region, budget, careStyle, name, email,
      }),
    );
  }, [hydrated, step, hairType, porosity, density, problematics, objective, currentLength, targetLength, goalDate, region, budget, careStyle, name, email]);

  function next() { setStep(s => Math.min(s + 1, TOTAL - 1)); }
  function skip() { next(); }
  function goToRecommendations() {
    router.push('/(auth)/recommendations');
  }
  function back() {
    if (step === 0) router.back();
    else setStep(s => s - 1);
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
      options: { data: { name: name.trim() } },
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

    const profileRow = {
      id:           data.user.id,
      name:         name.trim(),
      hair_type:    hairType  || '3C',
      porosity:     porosity  || 'Moyenne',
      density:      density   || 'Moyenne',
      problematics: problematics.length ? problematics : [],
      objective:    normalizeObjectiveId(objective) || '',
      length:         currentLength.trim() || null,
      target_length: targetLength.trim() || null,
      target_goal_date: targetLength.trim() ? toLocalISODate(goalDate) : null,
      region:       selectedRegion?.label   || '',
      climate:      selectedRegion?.climate || '',
      budget:       selectedBudget?.range   || '',
      care_style:   careStyle               || '',
      onboarding_done: true,
    };

    const { error: profileError } = await supabase.from('profiles').upsert(profileRow);
    if (profileError) {
      if (__DEV__) console.warn('[onboarding] profiles upsert', profileError.message ?? profileError);
    }

    await AsyncStorage.setItem(PENDING_ONBOARDING_GIFT_KEY, '1');
    dispatch({
      type: 'updateProfile',
      payload: {
        name:         profileRow.name,
        hairType:     profileRow.hair_type,
        porosity:     profileRow.porosity,
        density:      profileRow.density,
        problematics: profileRow.problematics ?? [],
        objective:    profileRow.objective,
        length:       profileRow.length ?? '',
        targetLength: profileRow.target_length ?? '',
        objectiveTargetDate: profileRow.target_goal_date ?? '',
        region:       profileRow.region,
        climate:      profileRow.climate,
        budget:       profileRow.budget,
        careStyle:    (profileRow.care_style || '') as CareStyle,
      },
    });

    const reco = buildOnboardingRecommendations({
      hairType: profileRow.hair_type,
      porosity: profileRow.porosity,
      density: profileRow.density,
      objective: profileRow.objective,
      region: profileRow.region,
      budget: profileRow.budget,
      careStyle: (profileRow.care_style || '') as CareStyleId,
    });
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

    setLoading(false);
    router.replace('/(tabs)');
  }

  const selectedRegion = REGIONS.find(r => r.id === region);

  const canNext = (
    (step === 0 && !!hairType)  ||
    (step === 1 && !!porosity)  ||
    (step === 2 && !!density)   ||
    step === 3 ||                 // problématiques : optionnel
    (step === 4 && !!objective) ||
    step === 5 ||                 // longueur : optionnel
    step === 6 ||                 // région : optionnel
    step === 7 ||                 // budget : optionnel
    (step === 8 && !!careStyle)
  );

  return (
    <SafeAreaView style={S.safe} edges={['top']}>

      {/* ── Barre de progression ── */}
      <View style={S.progressHeader}>
        <Text style={S.progressLabel}>Étape {step + 1} / {TOTAL}</Text>
        {OPTIONAL_STEPS.has(step) && (
          <View style={S.optionalBadge}>
            <Text style={S.optionalBadgeText}>OPTIONNEL</Text>
          </View>
        )}
      </View>
      <View style={S.progressBar}>
        {Array.from({ length: TOTAL }).map((_, i) => (
          <View key={i} style={[S.progressDot, i <= step && S.progressDotActive]} />
        ))}
      </View>

      {/* ── Bouton retour ── */}
      <TouchableOpacity
        style={S.backBtn}
        onPress={back}
        accessibilityRole="button"
        accessibilityLabel="Étape précédente"
      >
        <Ionicons name="chevron-back" size={22} color={Colors.ink} />
      </TouchableOpacity>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[S.content, step === 0 && S.contentHairStep]}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── ÉTAPE 0 : Type de cheveux ── */}
          {step === 0 && (
            <>
              <Text style={S.stepTitle}>Quel est ton type de cheveux ?</Text>
              <Text style={S.stepSub}>Fais défiler et choisis la photo qui ressemble le plus aux tiens.</Text>
              <View style={S.hairList}>
                {ONBOARDING_HAIR_TYPES.map(h => {
                  const active = hairType === h.code;
                  return (
                    <TouchableOpacity
                      key={h.code}
                      style={[S.hairCard, active && S.hairCardActive]}
                      onPress={() => setHairType(h.code)}
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
              <TouchableOpacity onPress={next} style={S.skipLink}>
                <Text style={S.skipText}>Je ne sais pas encore</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── ÉTAPE 1 : Porosité ── */}
          {step === 1 && (
            <>
              <Text style={S.stepTitle}>Comment réagit ton cheveu à l'eau ?</Text>
              <Text style={S.stepSub}>C'est ce qu'on appelle la porosité.</Text>
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
            </>
          )}

          {/* ── ÉTAPE 2 : Densité ── */}
          {step === 2 && (
            <>
              <Text style={S.stepTitle}>Quelle est la densité de tes cheveux ?</Text>
              <Text style={S.stepSub}>Compte le nombre de mèches sur une petite zone du cuir chevelu.</Text>
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

          {/* ── ÉTAPE 3 : Problématiques capillaires (optionnel) ── */}
          {step === 3 && (
            <>
              <HairProblematicsPicker
                variant="onboarding"
                selected={problematics}
                onChange={setProblematics}
              />
              <TouchableOpacity onPress={skip} style={S.skipLink}>
                <Text style={S.skipText}>Passer cette étape</Text>
              </TouchableOpacity>
            </>
          )}

          {/* ── ÉTAPE 4 : Objectif ── */}
          {step === 4 && (
            <>
              <Text style={S.stepTitle}>Qu'est-ce que tu veux changer ?</Text>
              <Text style={S.stepSub}>Choisis ton objectif principal.</Text>
              {HAIR_OBJECTIVES.map(o => (
                <TouchableOpacity
                  key={o.id}
                  style={[S.optionCard, objective === o.id && S.optionCardActive]}
                  onPress={() => setObjective(o.id)}
                >
                  <Text style={S.optionEmoji}>{o.emoji}</Text>
                  <Text style={[S.optionLabel, objective === o.id && S.optionLabelActive]}>{o.label}</Text>
                  {objective === o.id && <Ionicons name="checkmark-circle" size={22} color={Colors.amber} />}
                </TouchableOpacity>
              ))}
            </>
          )}

          {/* ── ÉTAPE 5 : Longueur actuelle / souhaitée (optionnel) ── */}
          {step === 5 && (
            <>
              <Text style={S.stepSub}>
                Pour personnaliser ton suivi de pousse — tu pourras modifier dans ton profil.
              </Text>
              <HairLengthLandmarkPicker
                title="Longueur actuelle"
                value={currentLength}
                onChange={setCurrentLength}
              />
              <HairLengthLandmarkPicker
                title="Longueur souhaitée"
                value={targetLength}
                onChange={setTargetLength}
                optional
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

          {/* ── ÉTAPE 6 : Localisation ── */}
          {step === 6 && (
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

          {/* ── ÉTAPE 6 : Budget ── */}
          {step === 7 && (
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

          {/* ── ÉTAPE 8 : Préférence de soin ── */}
          {step === 8 && (
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
                  onPress={() => setCareStyle(c.id)}
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

          {/* ── ÉTAPE 10 : Créer le compte (après page recommandations) ── */}
          {step === 10 && (
            <>
              <Text style={S.stepTitle}>Sauvegarde tes recommandations</Text>
              <Text style={S.stepSub}>
                Crée ton compte pour débloquer ta routine complète et tes {CC_ONBOARDING_GIFT} CotonCoins offerts.
              </Text>

              {error ? <Text style={S.errorText}>{error}</Text> : null}

              <View style={S.inputGroup}>
                <Text style={S.inputLabel}>Prénom</Text>
                <TextInput
                  style={S.input}
                  placeholder="Aïssatou"
                  placeholderTextColor={Colors.warmGray}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>

              <View style={S.inputGroup}>
                <Text style={S.inputLabel}>Email</Text>
                <TextInput
                  style={S.input}
                  placeholder="toi@email.com"
                  placeholderTextColor={Colors.warmGray}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={S.inputGroup}>
                <Text style={S.inputLabel}>Mot de passe</Text>
                <TextInput
                  style={S.input}
                  placeholder="8+ caractères, complexe"
                  placeholderTextColor={Colors.warmGray}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
                <Text style={S.policyHint}>{PASSWORD_POLICY_HINT}</Text>
              </View>

              <TouchableOpacity
                style={[S.primaryBtn, loading && { opacity: 0.7 }]}
                onPress={handleSignUp}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color={Colors.white} />
                  : (
                    <Text style={S.primaryBtnText}>
                      Créer mon compte{' '}
                      <Text style={S.primaryBtnAccent}>→</Text>
                    </Text>
                    )}
              </TouchableOpacity>

              <TouchableOpacity style={S.loginLink} onPress={() => router.push('/(auth)/login')}>
                <Text style={S.loginLinkText}>J'ai déjà un compte · Se connecter</Text>
              </TouchableOpacity>
            </>
          )}

        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Bouton Suivant (sauf étape 8 qui a son propre CTA) ── */}
      {step < 10 && (
        <View style={S.footer}>
          <TouchableOpacity
            style={[S.nextBtn, !canNext && S.nextBtnDisabled]}
            onPress={step === 8 ? goToRecommendations : next}
            disabled={!canNext}
          >
            <Text style={S.nextBtnText}>
              {step === 8 ? 'Voir mes recommandations' : 'Continuer'}{' '}
              <Text style={S.nextBtnAccent}>→</Text>
            </Text>
          </TouchableOpacity>
        </View>
      )}

    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: 24, paddingBottom: 24, paddingTop: 8 },
  contentHairStep: { paddingBottom: 120 },

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

  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 24, marginBottom: 12,
  },

  // ── Titres ──
  stepTitle: { fontSize: 26, fontFamily: 'Poppins_700Bold', color: Colors.ink, marginBottom: 8, lineHeight: 34 },
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
  hairCardCode: { fontSize: 17, fontFamily: 'DMSans_700Bold', color: Colors.ink, marginBottom: 4 },
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
  optionLabel:       { fontSize: 14, fontFamily: 'DMSans_700Bold', color: Colors.ink },
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
  regionLabel:       { fontSize: 14, fontFamily: 'DMSans_700Bold', color: Colors.ink, marginBottom: 2 },
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
});
