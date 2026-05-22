import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/theme/colors';
import { useApp } from '../../src/context/AppContext';
import { usePremium } from '../../src/context/PremiumContext';
import { FREE_ANALYSES_PER_MONTH } from '../../src/lib/premiumAccess';
import { markPremiumFirstValue } from '../../src/lib/premiumTrial';
import { buildPostAnalysisContext } from '../../src/lib/coachMoments';
import { BCEmojiAvatar } from '../../src/components/blackCotton/BCEmojiAvatar';
import { CoinIcon } from '../../src/components/CoinIcon';
import { pickCoachProfileFields } from '../../src/lib/coachProfile';
import { devLog } from '../../src/lib/devLog';
import { analyzeHairPhoto, saveHairAnalysis } from '../../src/services/coachApi';
import type { HairAnalysis, HairQuestionnaire } from '../../src/services/coachApi';
import { hapticLight, hapticMedium, hapticSelection, hapticSuccess } from '../../src/lib/haptics';
import { CC_ANALYSIS_COMPLETE, PTS_ANALYSIS_COMPLETE } from '../../src/lib/cotonCoins';
import { EmptyAnimation } from '../../src/components/animations/EmptyAnimation';
import { PRODUCTS, type Product } from '../../src/data/products';
import {
  fetchHairAnalysisHistory,
  formatAnalysisDate,
  type HairAnalysisSummary,
} from '../../src/lib/hairAnalysisHistory';
import { saveAnalysisDraft } from '../../src/lib/analysisDraftStorage';
import { matchRecipesFromTags } from '../../src/lib/matchRecipesFromTags';
import { trackProductEvent } from '../../src/lib/productAnalytics';
import {
  analysisJourneyProgress,
  loadAnalysisJourney,
  startAnalysisJourney,
  type AnalysisJourney,
} from '../../src/lib/analysisJourney';
import { scheduleAnalysisFollowUpReminder } from '../../src/lib/analysisFollowUpReminder';
import { applyAnalysisRoutineNow } from '../../src/lib/applyRoutinePlan';

const MIN_PHOTOS = 2;

type Phase = 'empty' | 'questions' | 'loading' | 'results';
type Tab   = 'problems' | 'advice' | 'routine' | 'ingredients';

type PhotoSlot = { uri: string; base64: string; mimeType: string } | null;

const PHOTO_SLOTS = [
  { label: 'Racines',    sub: 'Cuir chevelu',        emoji: '🌱' },
  { label: 'Longueurs',  sub: 'Milieu des mèches',   emoji: '💇' },
  { label: 'Pointes',    sub: 'Extrémités',           emoji: '✂️' },
];

// ── Questionnaire ────────────────────────────────────────────────────────
type QId = keyof HairQuestionnaire;
type QOption = { id: string; label: string; emoji: string; hint?: string };
type Question = {
  id: QId;
  title: string;
  subtitle: string;
  options: QOption[];
  optional?: boolean;
};

const QUESTIONS: Question[] = [
  {
    id: 'mainConcern',
    title: 'Quelle est ta préoccupation principale ?',
    subtitle: 'Choisis celle qui te dérange le plus en ce moment.',
    options: [
      { id: 'dryness',    label: 'Sécheresse',         emoji: '🏜️', hint: "Cheveux qui boivent vite, fils ternes" },
      { id: 'breakage',   label: 'Casse',               emoji: '💥', hint: 'Cheveux qui cassent, fragilité'         },
      { id: 'definition', label: 'Manque de définition',emoji: '🌀', hint: 'Boucles peu marquées, flou'             },
      { id: 'growth',     label: 'Pousse / longueur',  emoji: '📏', hint: 'Difficulté à gagner en longueur'         },
      { id: 'frizz',      label: 'Frisottis',           emoji: '⚡', hint: "Cheveux qui rebiquent, halo"            },
      { id: 'scalp',      label: 'Cuir chevelu',        emoji: '🪷', hint: 'Démangeaisons, pellicules, irritation'  },
      { id: 'volume',     label: 'Volume / densité',    emoji: '☁️', hint: 'Cheveux plats, peu denses'              },
    ],
  },
  {
    id: 'lastWash',
    title: 'Quand as-tu lavé tes cheveux ?',
    subtitle: "L'apparence change beaucoup avec la fraîcheur du lavage.",
    options: [
      { id: 'today',     label: "Aujourd'hui",            emoji: '💧' },
      { id: '1-3d',      label: 'Il y a 1 à 3 jours',      emoji: '📅' },
      { id: '4-7d',      label: 'Il y a 4 à 7 jours',      emoji: '🗓️' },
      { id: 'over-week', label: 'Plus d\'une semaine',     emoji: '🕰️' },
      { id: 'unknown',   label: 'Je ne sais plus',         emoji: '🤷' },
    ],
  },
  {
    id: 'texture',
    title: 'Quand tu touches tes cheveux, ils sont…',
    subtitle: 'Décris la sensation au toucher (le plus fiable).',
    options: [
      { id: 'soft-supple', label: 'Souples et hydratés',  emoji: '🪶', hint: 'Glissent entre les doigts' },
      { id: 'dry-soft',    label: 'Secs mais doux',        emoji: '🌾', hint: 'Doux mais boivent vite'   },
      { id: 'dry-rough',   label: 'Secs et rêches',        emoji: '🌵', hint: 'Sensation paille'         },
      { id: 'brittle',     label: 'Cassants',              emoji: '🥀', hint: 'Cassent au coiffage'      },
      { id: 'oily',        label: 'Gras / racines lourdes',emoji: '🛢️', hint: 'Film de sébum'            },
    ],
  },
  {
    id: 'porosityTest',
    title: 'As-tu déjà fait le test du verre d\'eau ?',
    subtitle: 'On dépose un cheveu propre dans un verre d\'eau et on observe.',
    options: [
      { id: 'sinks-fast', label: 'Coule rapidement',     emoji: '⬇️', hint: 'Porosité haute' },
      { id: 'sinks-slow', label: 'Coule lentement',      emoji: '🐢', hint: 'Porosité moyenne' },
      { id: 'floats',     label: 'Reste à la surface',   emoji: '⬆️', hint: 'Porosité faible' },
      { id: 'not-done',   label: 'Je ne l\'ai pas fait', emoji: '❓' },
    ],
  },
  {
    id: 'recentStress',
    title: 'Une agression récente sur tes cheveux ?',
    subtitle: 'Optionnel — utile pour cibler les soins reconstructeurs.',
    optional: true,
    options: [
      { id: 'none',             label: 'Aucune',                    emoji: '✅' },
      { id: 'heat',             label: 'Chaleur (lisseur, fer)',     emoji: '🔥' },
      { id: 'color',            label: 'Coloration / décoloration',  emoji: '🎨' },
      { id: 'relaxer',          label: 'Défrisage',                  emoji: '🧪' },
      { id: 'protective-style', label: 'Coiffure protectrice',       emoji: '👑', hint: 'Tresses, weave, perruque collée' },
    ],
  },
];

// ── Données de secours ────────────────────────────────────────────────────
const FB_PROBLEMS = [
  { sev: 'high', emoji: '🧴', name: 'Sécheresse marquée',  desc: "Manque d'hydratation profonde sur les longueurs et pointes." },
  { sev: 'med',  emoji: '✂️', name: 'Pointes fourchues',   desc: 'Quelques pointes abîmées — un trim léger est conseillé.'    },
  { sev: 'low',  emoji: '✨', name: 'Brillance correcte',  desc: 'La cuticule reste plutôt fermée, bonne base.'               },
];
const FB_ADVICE = [
  { type: 'produit',  icon: '🧴', t: 'Masque hydratant hebdo',  d: 'Beurre de karité + huile de jojoba, pose 30 min sous bonnet chauffant.' },
  { type: 'soin',     icon: '🧖', t: 'Méthode LCO',             d: "Leave-in → Crème → Huile pour sceller l'hydratation longue durée."      },
  { type: 'habitude', icon: '🌙', t: 'Bonnet satin nocturne',   d: "Réduit la friction et préserve l'hydratation pendant la nuit."          },
];
const FB_ROUTINE = [
  { t: 'Pré-poo',            f: 'Avant chaque wash', d: "Bain d'huile coco/avocat 30 min sur cheveux secs." },
  { t: 'Co-wash',            f: '1×/semaine',         d: 'Nettoyage doux sans sulfates, focus cuir chevelu.'  },
  { t: 'Masque hydratant',   f: '1×/semaine',         d: '20 min, démêlage doux sur cheveux essorés.'         },
  { t: 'Leave-in + huile',   f: 'À chaque coiffage',  d: 'Méthode LCO sur cheveux trempés.'                   },
  { t: 'Protection nocturne',f: 'Tous les soirs',     d: 'Bonnet satin + ananas style.'                        },
];
const FB_GAUGES = [
  { label: 'Hydratation', value: 58, icon: '💧' },
  { label: 'Solidité',    value: 72, icon: '💪' },
  { label: 'Brillance',   value: 80, icon: '✨' },
];
const GAUGE_COLORS = ['#3B82F6', '#8B5CF6', '#F59E0B'];

const SEV_STYLES: Record<string, { bg: string; dot: string; text: string; label: string }> = {
  high: { bg: Colors.alertLight, dot: Colors.alert,     text: Colors.alertDark, label: 'Élevé'  },
  med:  { bg: Colors.amberLight, dot: Colors.amberDark, text: Colors.amberInk,  label: 'Modéré' },
  low:  { bg: Colors.sageLight,  dot: Colors.sage,      text: Colors.sageDark,  label: 'Faible' },
};
const ADVICE_COLORS: Record<string, { bg: string; text: string }> = {
  produit:  { bg: '#DBEAFE', text: '#1E40AF' },
  soin:     { bg: '#F3E8FF', text: '#6D28D9' },
  habitude: { bg: '#DCFCE7', text: '#166534' },
};
const INGREDIENTS = [
  { level: 'high', icon: '🚫', name: 'Sulfates (SLS/SLES)',    desc: "Décapent le film hydrolipidique.",             examples: ['Sodium Lauryl Sulfate', 'Sodium Laureth Sulfate'] },
  { level: 'high', icon: '🚫', name: 'Silicones non-solubles', desc: "Empêchent l'hydratation de pénétrer la fibre.", examples: ['Dimethicone', 'Cyclomethicone']                   },
  { level: 'med',  icon: '⚠️', name: 'Alcools desséchants',    desc: 'Fragilisent la cuticule sur cheveux secs.',     examples: ['Isopropyl Alcohol', 'SD Alcohol']                 },
  { level: 'med',  icon: '⚠️', name: 'Parabènes',              desc: 'Conservateurs controversés, à limiter.',        examples: ['Methylparaben', 'Propylparaben']                  },
  { level: 'low',  icon: '👀', name: 'Parfums synthétiques',   desc: 'Peuvent irriter le cuir chevelu.',              examples: ['Fragrance', 'Parfum']                            },
];
const ING_LEVELS: Record<string, { bg: string; border: string; dot: string; text: string; label: string }> = {
  high: { bg: Colors.alertLight, border: '#FECACA',     dot: Colors.alert,     text: Colors.alertDark, label: 'À bannir'     },
  med:  { bg: Colors.amberLight, border: '#FDE68A',     dot: Colors.amberDark, text: Colors.amberInk,  label: 'À limiter'    },
  low:  { bg: '#F3F4F6',         border: '#E5E7EB',     dot: '#6B7280',        text: '#374151',        label: 'À surveiller' },
};
const TIPS = [
  { e: '📸', title: 'Lumière naturelle',  tip: "Prends tes photos en lumière naturelle pour une analyse plus précise." },
  { e: '🔄', title: 'Analyse mensuelle',  tip: "Analyse tes cheveux 1 fois par mois pour suivre l'évolution." },
  { e: '🧴', title: 'Ajuste ta routine',  tip: "Utilise les résultats pour choisir les bons produits ce mois-ci." },
  { e: '🌿', title: 'Cheveux propres',    tip: "Analyse toujours sur cheveux propres et sans produits." },
];

// Mapping tag → catégorie produit pour générer des recommandations locales.
const TAG_TO_CAT: Record<string, Product['cat'][]> = {
  hydratation:        ['mask', 'leave', 'cond'],
  sécheresse:         ['mask', 'oil', 'leave'],
  casse:              ['mask', 'oil', 'leave'],
  protéines:          ['mask', 'leave'],
  scellage:           ['oil'],
  frisottis:          ['style', 'oil', 'leave'],
  brillance:          ['oil', 'style'],
  pousse:             ['oil', 'compl'],
  scalp:              ['oil', 'sham'],
  'anti-buildup':     ['sham'],
  'leave-in':         ['leave'],
  'après-shampoing':  ['cond'],
  masque:             ['mask'],
  huile:              ['oil'],
};

function matchProducts(tags: string[] | undefined, limit = 4): Product[] {
  if (!tags || tags.length === 0) return [];
  const wantedCats = new Set<Product['cat']>();
  for (const t of tags) {
    const cats = TAG_TO_CAT[t.toLowerCase()];
    if (cats) cats.forEach(c => wantedCats.add(c));
  }
  if (wantedCats.size === 0) return PRODUCTS.slice(0, limit);
  return PRODUCTS.filter(p => wantedCats.has(p.cat)).slice(0, limit);
}

export default function AnalyzeScreen() {
  const router = useRouter();
  const { state, dispatch, grantCoinsSecure, queueBcTrigger } = useApp();
  const { hasAccess, requireAccess } = usePremium();
  const [phase, setPhase]         = useState<Phase>('empty');
  const [step, setStep]           = useState(0);
  const [tab, setTab]             = useState<Tab>('problems');
  const [shared, setShared]       = useState(false);
  const [photos, setPhotos]       = useState<PhotoSlot[]>([null, null, null]);
  const [analysis, setAnalysis]   = useState<HairAnalysis | null>(null);
  const [analysisError, setError] = useState<string | null>(null);

  // Questionnaire
  const [qIndex, setQIndex]   = useState(0);
  const [answers, setAnswers] = useState<Partial<HairQuestionnaire>>({});
  const [coinsAwarded, setCoinsAwarded] = useState(false);

  const [refreshing, setRefreshing] = useState(false);
  const [history, setHistory] = useState<HairAnalysisSummary[]>([]);
  const [resultPhotos, setResultPhotos] = useState<(PhotoSlot | null)[]>([null, null, null]);
  const [previousScore, setPreviousScore] = useState<number | null>(null);
  const [journey, setJourney] = useState<AnalysisJourney | null>(null);
  const previousScoreRef = useRef<number | null>(null);

  const loadHistory = useCallback(async () => {
    const rows = await fetchHairAnalysisHistory(8);
    setHistory(rows);
    return rows;
  }, []);

  const loadJourney = useCallback(async () => {
    const j = await loadAnalysisJourney();
    setJourney(j);
    return j;
  }, []);

  useEffect(() => {
    void loadHistory();
    void loadJourney();
  }, [loadHistory, loadJourney]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadHistory(), loadJourney()]);
    setRefreshing(false);
  }, [loadHistory, loadJourney]);

  const filledCount = photos.filter(Boolean).length;
  const displayPhotos = phase === 'results' ? resultPhotos : photos;
  const mainPhotoUri = displayPhotos.find(Boolean)?.uri ?? null;
  const journeyProg = analysisJourneyProgress(journey);

  const recommendedRecipes = useMemo(
    () => matchRecipesFromTags(analysis?.recommendedTags, 4),
    [analysis?.recommendedTags],
  );

  const scoreDelta = useMemo(() => {
    if (previousScore == null || !analysis) return null;
    return analysis.score - previousScore;
  }, [previousScore, analysis]);

  // ── Animation de chargement ───────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'loading') return;
    setStep(0);
    const t1 = setTimeout(() => setStep(1), 1000);
    const t2 = setTimeout(() => setStep(2), 2000);
    const t3 = setTimeout(() => setStep(3), 3000);
    return () => [t1, t2, t3].forEach(clearTimeout);
  }, [phase]);

  // ── Sélection photo par slot ──────────────────────────────────────────
  const pickPhoto = (slotIndex: number) => {
    const actions: any[] = [
      { text: '📷 Appareil photo', onPress: () => launchPicker(slotIndex, true)  },
      { text: '🖼️ Galerie',        onPress: () => launchPicker(slotIndex, false) },
    ];
    if (photos[slotIndex]) {
      actions.push({
        text: '🗑️ Supprimer',
        style: 'destructive',
        onPress: () => {
          const next = [...photos];
          next[slotIndex] = null;
          setPhotos(next);
        },
      });
    }
    actions.push({ text: 'Annuler', style: 'cancel' });
    Alert.alert(PHOTO_SLOTS[slotIndex].label, 'Source de la photo', actions);
  };

  const launchPicker = async (slotIndex: number, useCamera: boolean) => {
    const perm = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission refusée', 'Active les permissions dans les réglages de ton téléphone.');
      return;
    }
    if (useCamera) hapticLight();
    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ base64: true, quality: 0.7, exif: false })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], base64: true, quality: 0.7, exif: false });

    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];

    const resized = await ImageManipulator.manipulateAsync(
      asset.uri,
      [{ resize: { width: 800 } }],
      { compress: 0.4, format: ImageManipulator.SaveFormat.JPEG, base64: true },
    );

    const next = [...photos];
    next[slotIndex] = { uri: resized.uri, base64: resized.base64!, mimeType: 'image/jpeg' };
    setPhotos(next);
    hapticSuccess();
  };

  // ── Passage à l'étape questionnaire ────────────────────────────────────
  const startQuestionnaire = () => {
    if (filledCount < MIN_PHOTOS) {
      Alert.alert(
        'Encore une photo',
        `Ajoute au moins ${MIN_PHOTOS} vues (racines + longueurs recommandées) pour un diagnostic fiable.`,
      );
      return;
    }
    hapticMedium();
    setQIndex(0);
    setAnswers({});
    setError(null);
    setPhase('questions');
  };

  const currentQuestion = QUESTIONS[qIndex];
  const isLastQuestion  = qIndex === QUESTIONS.length - 1;
  const canGoNext       = currentQuestion?.optional ? true : Boolean(answers[currentQuestion.id]);

  const selectAnswer = (qId: QId, optionId: string) => {
    hapticSelection();
    setAnswers(prev => ({ ...prev, [qId]: optionId as any }));
  };

  const goNextQuestion = () => {
    if (!canGoNext) return;
    hapticLight();
    if (isLastQuestion) {
      void startAnalysis();
      return;
    }
    setQIndex(qIndex + 1);
  };

  const goPrevQuestion = () => {
    if (qIndex === 0) {
      setPhase('empty');
      return;
    }
    hapticLight();
    setQIndex(qIndex - 1);
  };

  const skipQuestion = () => {
    if (!currentQuestion?.optional) return;
    hapticLight();
    if (isLastQuestion) {
      void startAnalysis();
    } else {
      setQIndex(qIndex + 1);
    }
  };

  // ── Lancement de l'analyse ────────────────────────────────────────────
  const startAnalysis = async () => {
    if (filledCount < MIN_PHOTOS) return;

    const allowed = await requireAccess('analysis_limit');
    if (!allowed) return;

    previousScoreRef.current = history[0]?.score ?? null;
    setPreviousScore(previousScoreRef.current);

    const photoInputs = photos
      .map((p, i) => p ? { base64: p.base64, mediaType: p.mimeType, label: PHOTO_SLOTS[i].label } : null)
      .filter(Boolean) as { base64: string; mediaType: string; label: string }[];

    // Si on a quand même une question non répondue (non-optionnelle), on retombe
    // sur "unknown" par défaut pour éviter le blocage.
    const finalQuestionnaire: HairQuestionnaire = {
      lastWash:     (answers.lastWash     ?? 'unknown')   as HairQuestionnaire['lastWash'],
      texture:      (answers.texture      ?? 'dry-soft')  as HairQuestionnaire['texture'],
      porosityTest: (answers.porosityTest ?? 'not-done')  as HairQuestionnaire['porosityTest'],
      mainConcern:  (answers.mainConcern  ?? 'dryness')   as HairQuestionnaire['mainConcern'],
      recentStress: answers.recentStress as HairQuestionnaire['recentStress'],
    };

    setAnalysis(null);
    setError(null);
    setCoinsAwarded(false);
    setPhase('loading');

    const minWait = new Promise<void>(r => setTimeout(r, 3500));

    try {
      const results = await Promise.all([
        analyzeHairPhoto(photoInputs, pickCoachProfileFields(state.profile), finalQuestionnaire),
        minWait,
      ]);
      const hairAnalysis = results[0] as HairAnalysis;
      setAnalysis(hairAnalysis);
      setResultPhotos(photos.map(p => (p ? { uri: p.uri, base64: '', mimeType: 'image/jpeg' } : null)));
      setPhotos([null, null, null]);
      setPhase('results');
      hapticSuccess();

      void saveAnalysisDraft({
        analysis: hairAnalysis,
        resultPhotoUri: photos.find(Boolean)?.uri ?? null,
        completedAt: new Date().toISOString(),
      });

      void trackProductEvent('analysis_completed', {
        score: hairAnalysis.score,
        photo_count: photoInputs.length,
        had_previous: previousScoreRef.current != null,
      });
      if (hasAccess) {
        void markPremiumFirstValue('analysis');
        void trackProductEvent('premium_trial_first_value', { kind: 'analysis' });
      }

      const j = await startAnalysisJourney();
      setJourney(j);
      void scheduleAnalysisFollowUpReminder(new Date().toISOString());
      queueBcTrigger('post_analysis', buildPostAnalysisContext(hairAnalysis));

      // Sauvegarde dans Supabase (alimente l'historique + algo)
      const photoMeta = photos
        .map((p, i) => p ? { label: PHOTO_SLOTS[i].label, byteSize: Math.round(p.base64.length * 0.75) } : null)
        .filter(Boolean) as { label: string; byteSize: number }[];
      void saveHairAnalysis({
        questionnaire: finalQuestionnaire,
        analysis: hairAnalysis,
        photoMeta,
      }).then(async res => {
        if (!res.ok) devLog.warn('[saveHairAnalysis] skipped:', res.error);
        else await loadHistory();
      });

      // Récompense : +CC_ANALYSIS_COMPLETE pour analyse complète (max 1× par session)
      if (!coinsAwarded) {
        const grant = await grantCoinsSecure({
          amount: CC_ANALYSIS_COMPLETE,
          label: 'Analyse capillaire complète',
          points: PTS_ANALYSIS_COMPLETE,
          idempotencyKey: 'hair_analysis',
        });
        if (grant.ok) setCoinsAwarded(true);
      }
    } catch (e: any) {
      setError(e?.message ?? String(e));
      setPhase('empty');
    }
  };

  // ── Données dynamiques ou de secours ─────────────────────────────────
  const problems  = analysis?.problems ?? FB_PROBLEMS;
  const advice    = analysis?.advice   ?? FB_ADVICE;
  const routine   = analysis?.routine  ?? FB_ROUTINE;
  const gauges    = (analysis?.gauges  ?? FB_GAUGES).map((g, i) => ({ ...g, color: GAUGE_COLORS[i] ?? '#888' }));
  const score     = analysis?.score    ?? 68;
  const hairType  = analysis?.hairType ?? '3C · Bouclé serré';
  const porosity  = analysis?.porosity ?? 'Moyenne';
  const synthesis = analysis?.synthesis ?? 'Bonne base bouclée mais sécheresse marquée. Une routine hydratation + scellage devrait remonter ton score à 80+ en 6 semaines.';

  const recommendedProducts = useMemo(
    () => matchProducts(analysis?.recommendedTags),
    [analysis?.recommendedTags],
  );

  function handleApplyRoutineNow() {
    if (!analysis?.routine?.length) {
      Alert.alert('Routine indisponible', 'Relance une analyse pour obtenir des étapes.');
      return;
    }
    hapticSuccess();
    const err = applyAnalysisRoutineNow(dispatch, analysis.routine, analysis.synthesis, 'daily');
    if (err) {
      Alert.alert('Routine incomplète', err);
      return;
    }
    Alert.alert(
      'Routine appliquée ✓',
      'Ta routine matin est prête. Tu peux la valider maintenant pour gagner tes CotonCoins.',
      [
        { text: 'Voir ma routine', onPress: () => router.push('/(tabs)/routine?routine=daily' as any) },
        { text: 'OK', style: 'cancel' },
      ],
    );
  }

  const resetAnalysis = () => {
    setPhase('empty');
    setError(null);
    setPhotos([null, null, null]);
    setResultPhotos([null, null, null]);
    setAnalysis(null);
    setAnswers({});
    setQIndex(0);
    setCoinsAwarded(false);
    setPreviousScore(null);
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.topbar}>
        <Text style={s.topbarTitle}>Analyse Black Cotton</Text>
        <TouchableOpacity style={s.coinsBadge} onPress={() => router.push('/rewards')}>
          <CoinIcon size={16} />
          <Text style={s.coinsText}>{state.coins}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={s.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.amber}
            colors={[Colors.amber]}
          />
        }
      >

        {/* ── ÉTAT VIDE : photos ── */}
        {phase === 'empty' && (
          <>
            {analysisError && (
              <View style={s.errorBanner}>
                <Text style={s.errorText}>⚠️ {analysisError}</Text>
              </View>
            )}

            {/* Stepper de workflow */}
            <View style={s.stepper}>
              <View style={s.stepperRow}>
                <View style={[s.stepDot, s.stepDotActive]}><Text style={s.stepDotTextActive}>1</Text></View>
                <View style={s.stepLine} />
                <View style={s.stepDot}><Text style={s.stepDotText}>2</Text></View>
                <View style={s.stepLine} />
                <View style={s.stepDot}><Text style={s.stepDotText}>3</Text></View>
              </View>
              <View style={s.stepperLabels}>
                <Text style={[s.stepLabel, s.stepLabelActive]}>Photos</Text>
                <Text style={s.stepLabel}>Questions</Text>
                <Text style={s.stepLabel}>Diagnostic</Text>
              </View>
            </View>

            <View style={s.emptyCard}>
              <Text style={s.emptyTitle}>Étape 1 — Ajoute tes photos</Text>
              <Text style={s.emptyDesc}>
                3 photos idéales (racines, longueurs, pointes) — minimum {MIN_PHOTOS} pour lancer l'analyse.
                Cheveux propres, lumière naturelle.
              </Text>
              {!hasAccess ? (
                <Text style={s.quotaHint}>
                  {FREE_ANALYSES_PER_MONTH} analyses gratuites / mois · illimité avec Premium
                </Text>
              ) : null}

              <View style={s.photoSlots}>
                {PHOTO_SLOTS.map((slot, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[s.photoSlot, photos[i] && s.photoSlotFilled]}
                    onPress={() => pickPhoto(i)}
                    activeOpacity={0.75}
                  >
                    {photos[i] ? (
                      <>
                        <Image source={{ uri: photos[i]!.uri }} style={s.photoSlotImg} />
                        <View style={s.photoSlotCheck}>
                          <Text style={{ fontSize: 11, color: '#fff' }}>✓</Text>
                        </View>
                      </>
                    ) : (
                      <>
                        <Text style={s.photoSlotEmoji}>{slot.emoji}</Text>
                        <Text style={s.photoSlotLabel}>{slot.label}</Text>
                        <Text style={s.photoSlotSub}>{slot.sub}</Text>
                        <View style={s.photoSlotPlus}>
                          <Text style={{ fontSize: 16, color: Colors.warmGray }}>+</Text>
                        </View>
                      </>
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {filledCount > 0 && filledCount < 3 && (
                <Text style={s.photoHint}>
                  {filledCount === 1
                    ? '💡 Ajoute longueurs ou pointes pour un diagnostic plus précis.'
                    : '💡 Une 3ᵉ photo (pointes) affine encore le score.'}
                </Text>
              )}

              <TouchableOpacity
                style={[s.analyzeBtn, filledCount < MIN_PHOTOS && s.analyzeBtnDisabled]}
                onPress={startQuestionnaire}
                disabled={filledCount < MIN_PHOTOS}
              >
                <Text style={s.analyzeBtnText}>
                  {filledCount < MIN_PHOTOS
                    ? `📸 ${MIN_PHOTOS} photos minimum (${filledCount}/${MIN_PHOTOS})`
                    : `Continuer · ${filledCount}/3 photo${filledCount > 1 ? 's' : ''}  →`}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={s.tipCard}>
              <Text style={s.tipText}>💡 Plus tu fournis de photos et de réponses précises, plus le diagnostic Black Cotton sera fiable.</Text>
            </View>

            <Text style={s.secTitle}>Tes dernières analyses</Text>
            {history.length === 0 ? (
              <View style={s.emptyHistory}>
                <EmptyAnimation emoji="📊" size={92} style={{ marginBottom: 12 }} />
                <Text style={s.emptyHistoryTitle}>Aucune analyse précédente</Text>
                <Text style={s.emptyHistoryDesc}>Lance ta première analyse pour commencer à suivre l'évolution de ta santé capillaire.</Text>
              </View>
            ) : (
              <View style={s.historyList}>
                {history.map((h, i) => (
                  <View key={h.id} style={[s.historyRow, i < history.length - 1 && s.historyRowBorder]}>
                    <View style={s.historyScoreBadge}>
                      <Text style={s.historyScoreVal}>{h.score}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.historyDate}>{formatAnalysisDate(h.createdAt)}</Text>
                      <Text style={s.historyMeta} numberOfLines={1}>{h.hairType} · Porosité {h.porosity}</Text>
                      {h.synthesis ? (
                        <Text style={s.historySynth} numberOfLines={2}>{h.synthesis}</Text>
                      ) : null}
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {/* ── ÉTAT QUESTIONS ── */}
        {phase === 'questions' && (
          <>
            {/* Stepper */}
            <View style={s.stepper}>
              <View style={s.stepperRow}>
                <View style={[s.stepDot, s.stepDotDone]}><Text style={s.stepDotTextDone}>✓</Text></View>
                <View style={[s.stepLine, s.stepLineDone]} />
                <View style={[s.stepDot, s.stepDotActive]}><Text style={s.stepDotTextActive}>2</Text></View>
                <View style={s.stepLine} />
                <View style={s.stepDot}><Text style={s.stepDotText}>3</Text></View>
              </View>
              <View style={s.stepperLabels}>
                <Text style={s.stepLabel}>Photos</Text>
                <Text style={[s.stepLabel, s.stepLabelActive]}>Questions</Text>
                <Text style={s.stepLabel}>Diagnostic</Text>
              </View>
            </View>

            {/* Progression questions */}
            <View style={s.qProgressRow}>
              <Text style={s.qProgressLabel}>Question {qIndex + 1} sur {QUESTIONS.length}</Text>
              {currentQuestion.optional && (
                <View style={s.qOptionalBadge}><Text style={s.qOptionalText}>Optionnel</Text></View>
              )}
            </View>
            <View style={s.qProgressBarBg}>
              <View style={[s.qProgressBarFill, { width: `${((qIndex + 1) / QUESTIONS.length) * 100}%` }]} />
            </View>

            {/* Question card */}
            <View style={s.qCard}>
              <Text style={s.qTitle}>{currentQuestion.title}</Text>
              <Text style={s.qSubtitle}>{currentQuestion.subtitle}</Text>

              <View style={s.qOptions}>
                {currentQuestion.options.map(opt => {
                  const selected = answers[currentQuestion.id] === (opt.id as any);
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      style={[s.qOption, selected && s.qOptionSelected]}
                      onPress={() => selectAnswer(currentQuestion.id, opt.id)}
                      activeOpacity={0.85}
                    >
                      <View style={[s.qOptionEmojiBox, selected && s.qOptionEmojiBoxSelected]}>
                        <Text style={s.qOptionEmoji}>{opt.emoji}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.qOptionLabel, selected && s.qOptionLabelSelected]}>{opt.label}</Text>
                        {opt.hint && <Text style={[s.qOptionHint, selected && s.qOptionHintSelected]}>{opt.hint}</Text>}
                      </View>
                      <View style={[s.qOptionRadio, selected && s.qOptionRadioSelected]}>
                        {selected && <View style={s.qOptionRadioDot} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Nav buttons */}
            <View style={s.qNavRow}>
              <TouchableOpacity style={s.qNavBack} onPress={goPrevQuestion}>
                <Ionicons name="chevron-back" size={16} color={Colors.ink} />
                <Text style={s.qNavBackText}>{qIndex === 0 ? 'Photos' : 'Retour'}</Text>
              </TouchableOpacity>

              {currentQuestion.optional && !answers[currentQuestion.id] && (
                <TouchableOpacity style={s.qNavSkip} onPress={skipQuestion}>
                  <Text style={s.qNavSkipText}>Passer</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[s.qNavNext, !canGoNext && s.qNavNextDisabled]}
                onPress={goNextQuestion}
                disabled={!canGoNext}
              >
                <Text style={s.qNavNextText}>
                  {isLastQuestion ? '🔍 Lancer l\'analyse' : 'Suivant'}
                </Text>
                {!isLastQuestion && <Ionicons name="chevron-forward" size={16} color="#fff" />}
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* ── CHARGEMENT ── */}
        {phase === 'loading' && (
          <>
            <View style={s.stepper}>
              <View style={s.stepperRow}>
                <View style={[s.stepDot, s.stepDotDone]}><Text style={s.stepDotTextDone}>✓</Text></View>
                <View style={[s.stepLine, s.stepLineDone]} />
                <View style={[s.stepDot, s.stepDotDone]}><Text style={s.stepDotTextDone}>✓</Text></View>
                <View style={[s.stepLine, s.stepLineDone]} />
                <View style={[s.stepDot, s.stepDotActive]}><Text style={s.stepDotTextActive}>3</Text></View>
              </View>
              <View style={s.stepperLabels}>
                <Text style={s.stepLabel}>Photos</Text>
                <Text style={s.stepLabel}>Questions</Text>
                <Text style={[s.stepLabel, s.stepLabelActive]}>Diagnostic</Text>
              </View>
            </View>

            <View style={s.thumbnailRow}>
              {photos.map((p, i) => p ? (
                <Image key={i} source={{ uri: p.uri }} style={s.thumbnail} />
              ) : null)}
            </View>
            <View style={s.loadingCard}>
              <ActivityIndicator color={Colors.rose} size="large" style={{ marginBottom: 14 }} />
              <Text style={s.loadingTitle}>Analyse en cours…</Text>
              {[
                'Analyse visuelle des photos',
                'Croisement avec tes réponses',
                'Génération du diagnostic personnalisé',
              ].map((label, i) => (
                <View key={i} style={s.loadingStep}>
                  <View style={[s.loadingDot, { backgroundColor: i < step ? Colors.sage : Colors.border }]} />
                  <Text style={[s.loadingLabel, { color: i < step ? Colors.ink : Colors.warmGray }]}>{label}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ── RÉSULTATS ── */}
        {phase === 'results' && (
          <>
            <View style={s.photoWrapper}>
              {mainPhotoUri ? (
                <Image source={{ uri: mainPhotoUri }} style={[s.photoPh, { resizeMode: 'cover' }]} />
              ) : (
                <View style={s.photoPh}><Text style={s.photoPhText}>photo capillaire</Text></View>
              )}
              <View style={s.scoreRing}>
                <Text style={s.scoreRingVal}>{score}</Text>
                <Text style={s.scoreRingSub}>/100</Text>
              </View>
            </View>

            {displayPhotos.filter(Boolean).length > 1 && (
              <View style={s.thumbnailRow}>
                {displayPhotos.map((p, i) => p && i > 0 ? (
                  <Image key={i} source={{ uri: p.uri }} style={s.thumbnail} />
                ) : null)}
              </View>
            )}

            {journeyProg.showBanner && (
              <View style={s.journeyBanner}>
                <Text style={s.journeyTitle}>Valide ta routine 3 jours</Text>
                <Text style={s.journeySub}>
                  Ancre les habitudes recommandées — {journeyProg.daysValidated}/3 jours validés.
                </Text>
                <View style={s.journeyDots}>
                  {[0, 1, 2].map(i => (
                    <View
                      key={i}
                      style={[s.journeyDot, i < journeyProg.daysValidated && s.journeyDotDone]}
                    />
                  ))}
                </View>
                <TouchableOpacity
                  style={s.journeyBtn}
                  onPress={() => router.push('/(tabs)/routine')}
                >
                  <Text style={s.journeyBtnText}>Aller à ma routine →</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={s.compareRow}>
              {scoreDelta != null ? (
                <View style={[s.compareCard, {
                  backgroundColor: scoreDelta >= 0 ? Colors.sageLight : Colors.amberLight,
                  borderColor: scoreDelta >= 0 ? '#A5D6A7' : '#FDE68A',
                }]}>
                  <Text style={{ fontSize: 20 }}>{scoreDelta >= 0 ? '📈' : '📉'}</Text>
                  <View>
                    <Text style={[s.compareTitle, { color: scoreDelta >= 0 ? Colors.sageDark : Colors.amberInk }]}>
                      {scoreDelta >= 0 ? '+' : ''}{scoreDelta} pts vs dernière analyse
                    </Text>
                    <Text style={[s.compareSub, { color: scoreDelta >= 0 ? Colors.sage : Colors.amberDark }]}>
                      Score précédent : {previousScore}/100
                    </Text>
                  </View>
                </View>
              ) : (
                <View style={[s.compareCard, { backgroundColor: Colors.cream, borderColor: Colors.border }]}>
                  <Text style={{ fontSize: 20 }}>✨</Text>
                  <View>
                    <Text style={s.compareTitle}>Première analyse</Text>
                    <Text style={s.compareSub}>Refais une analyse dans ~2 semaines pour comparer</Text>
                  </View>
                </View>
              )}
              <View style={[s.compareCard, { backgroundColor: Colors.cream, borderColor: Colors.border }]}>
                <Text style={{ fontSize: 20 }}>🎯</Text>
                <View>
                  <Text style={s.compareTitle}>Objectif : {Math.min(100, Math.max(score + 12, 80))}/100</Text>
                  <Text style={s.compareSub}>~6 semaines avec routine adaptée</Text>
                </View>
              </View>
            </View>

            <View style={s.typeCard}>
              <View style={s.typeIconBox}><Text style={{ fontSize: 28 }}>🌀</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={s.typeMeta}>TYPE DÉTECTÉ</Text>
                <Text style={s.typeTitle}>{hairType}</Text>
                <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                  <View style={s.typePill}><Text style={s.typePillText}>Porosité {porosity.toLowerCase()}</Text></View>
                  {analysis?.density && (
                    <View style={s.typePillAmber}><Text style={s.typePillAmberText}>{analysis.density}</Text></View>
                  )}
                </View>
              </View>
            </View>

            <View style={s.progressionCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Text style={s.progressionTitle}>Progression vers l'objectif</Text>
                <Text style={s.progressionSub}>~6 semaines</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <Text style={s.progressionLabel}>Score actuel</Text>
                <View style={s.progressionBarBg}>
                  <View style={[s.progressionBarFill, { width: `${score}%` }]} />
                  <View style={s.progressionMarker} />
                </View>
                <Text style={s.progressionLabel}>Objectif</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                {[{ v: String(score), l: 'Actuel', c: Colors.amberDark }, { v: '80', l: 'Objectif', c: Colors.sage }, { v: '100', l: 'Max', c: Colors.ink }].map((item, i) => (
                  <View key={i} style={{ alignItems: 'center' }}>
                    <Text style={[s.progressionScore, { color: item.c }]}>{item.v}</Text>
                    <Text style={s.progressionScoreLabel}>{item.l}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={s.gaugesCard}>
              <Text style={s.gaugesTitle}>Détail du score</Text>
              {gauges.map((g, i) => (
                <View key={i} style={{ marginBottom: i < gauges.length - 1 ? 14 : 0 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ fontSize: 14 }}>{g.icon}</Text>
                      <Text style={s.gaugeName}>{g.label}</Text>
                    </View>
                    <Text style={[s.gaugeVal, { color: g.color }]}>{g.value}%</Text>
                  </View>
                  <View style={s.gaugeBarBg}>
                    <View style={[s.gaugeBarFill, { width: `${g.value}%`, backgroundColor: g.color }]} />
                  </View>
                </View>
              ))}
            </View>

            <View style={s.syntheseCard}>
              <Text style={s.syntheseTitle}>Synthèse personnalisée</Text>
              <Text style={s.syntheseText}>{synthesis}</Text>
            </View>

            {/* Tabs */}
            <View style={s.segmented}>
              {(['problems', 'advice', 'routine', 'ingredients'] as Tab[]).map(t => (
                <TouchableOpacity key={t} style={[s.seg, tab === t && s.segActive]} onPress={() => setTab(t)}>
                  <Text style={[s.segText, tab === t && s.segTextActive]}>
                    {t === 'problems' ? 'Problèmes' : t === 'advice' ? 'Conseils' : t === 'routine' ? 'Routine' : 'Ingrédients'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {tab === 'problems' && problems.map((p, i) => {
              const st = SEV_STYLES[p.sev] ?? SEV_STYLES.low;
              return (
                <View key={i} style={[s.problemCard, { backgroundColor: st.bg, marginBottom: 10 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <Text style={{ fontSize: 18 }}>{p.emoji}</Text>
                    <Text style={[s.problemName, { color: st.text, flex: 1 }]}>{p.name}</Text>
                    <View style={[s.sevBadge, { backgroundColor: st.dot }]}>
                      <Text style={s.sevBadgeText}>{st.label}</Text>
                    </View>
                  </View>
                  <Text style={[s.problemDesc, { color: st.text }]}>{p.desc}</Text>
                </View>
              );
            })}

            {tab === 'advice' && advice.map((a, i) => {
              const c = ADVICE_COLORS[a.type] ?? ADVICE_COLORS.soin;
              return (
                <View key={i} style={[s.card, { padding: 12, marginBottom: 10 }]}>
                  <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                    <View style={s.adviceIconBox}><Text style={{ fontSize: 20 }}>{a.icon}</Text></View>
                    <View style={{ flex: 1 }}>
                      <View style={[s.adviceTypeBadge, { backgroundColor: c.bg }]}>
                        <Text style={[s.adviceTypeText, { color: c.text }]}>{a.type.toUpperCase()}</Text>
                      </View>
                      <Text style={s.adviceTitle}>{a.t}</Text>
                      <Text style={s.adviceDesc}>{a.d}</Text>
                    </View>
                  </View>
                  {a.type === 'produit' && (
                    <TouchableOpacity style={s.shopBtn} onPress={() => router.push('/shop')}>
                      <Text style={s.shopBtnText}>🛍️ Voir dans la boutique</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}

            {tab === 'routine' && (
              <View>
                {routine.map((r, i) => (
                  <View key={i} style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={{ alignItems: 'center' }}>
                      <View style={s.routineNum}><Text style={s.routineNumText}>{i + 1}</Text></View>
                      {i < routine.length - 1 && <View style={s.routineLine} />}
                    </View>
                    <View style={{ flex: 1, paddingBottom: 16 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                        <Text style={s.routineTitle}>{r.t}</Text>
                        <View style={s.routineFreqBadge}><Text style={s.routineFreqText}>{r.f}</Text></View>
                      </View>
                      <Text style={s.routineDesc}>{r.d}</Text>
                    </View>
                  </View>
                ))}
                <TouchableOpacity style={s.saveRoutineBtn} onPress={handleApplyRoutineNow}>
                  <Text style={s.saveRoutineBtnText}>✓ Appliquer maintenant</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.customizeRoutineBtn}
                  onPress={() =>
                    router.push({ pathname: '/routine-plan', params: { kind: 'daily', source: 'analysis' } })
                  }
                >
                  <Text style={s.customizeRoutineBtnText}>Personnaliser avant d&apos;appliquer</Text>
                </TouchableOpacity>
              </View>
            )}

            {tab === 'ingredients' && (
              <View>
                <View style={{ flexDirection: 'row', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
                  {Object.entries(ING_LEVELS).map(([k, v]) => (
                    <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <View style={[s.ingDot, { backgroundColor: v.dot }]} />
                      <Text style={s.ingLegendText}>{v.label}</Text>
                    </View>
                  ))}
                </View>
                {INGREDIENTS.map((ing, i) => {
                  const lv = ING_LEVELS[ing.level];
                  return (
                    <View key={i} style={[s.ingCard, { backgroundColor: lv.bg, borderColor: lv.border, marginBottom: 10 }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <Text style={{ fontSize: 16 }}>{ing.icon}</Text>
                        <Text style={[s.ingName, { color: lv.text, flex: 1 }]}>{ing.name}</Text>
                        <View style={[s.ingBadge, { backgroundColor: lv.dot }]}>
                          <Text style={s.ingBadgeText}>{lv.label}</Text>
                        </View>
                      </View>
                      <Text style={[s.ingDesc, { color: lv.text }]}>{ing.desc}</Text>
                      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                        {ing.examples.map((ex, j) => (
                          <View key={j} style={[s.ingExample, { backgroundColor: 'rgba(0,0,0,0.07)' }]}>
                            <Text style={[s.ingExampleText, { color: lv.text }]}>{ex}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  );
                })}
                <View style={s.ingGoodCard}>
                  <Text style={s.ingGoodTitle}>✅ Ingrédients à privilégier</Text>
                  <Text style={s.ingGoodText}>Aloe vera · Beurre de karité · Glycérine · Huile d'argan · Protéines hydrolysées · Panthenol</Text>
                </View>
              </View>
            )}

            {/* Produits recommandés (matchés sur recommendedTags) */}
            {recommendedProducts.length > 0 && (
              <View style={s.recoSection}>
                <View style={s.recoHeader}>
                  <Text style={s.recoTitle}>🛍️ Produits recommandés pour toi</Text>
                  <TouchableOpacity onPress={() => router.push('/shop')}>
                    <Text style={s.recoSeeAll}>Voir tout →</Text>
                  </TouchableOpacity>
                </View>
                <Text style={s.recoSub}>Sélectionnés selon ton diagnostic.</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingVertical: 4 }}>
                  {recommendedProducts.map((p, i) => (
                    <TouchableOpacity
                      key={`${p.brand}-${p.name}-${i}`}
                      style={s.recoCard}
                      activeOpacity={0.85}
                      onPress={() => router.push('/shop')}
                    >
                      <View style={[s.recoCardImg, { backgroundColor: p.bg }]}>
                        <Text style={{ fontSize: 38 }}>{p.emoji}</Text>
                      </View>
                      <Text style={s.recoCardBrand} numberOfLines={1}>{p.brand}</Text>
                      <Text style={s.recoCardName} numberOfLines={2}>{p.name}</Text>
                      <Text style={s.recoCardPrice}>{p.price}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Barre d'actions : recettes + boutique */}
            <View style={s.actionBar}>
              <TouchableOpacity style={s.actionBarBtn} onPress={() => router.push('/recipes')}>
                <Text style={s.actionBarEmoji}>🌿</Text>
                <Text style={s.actionBarLabel}>Recettes</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.actionBarBtn} onPress={() => router.push('/shop')}>
                <Text style={s.actionBarEmoji}>🛍️</Text>
                <Text style={s.actionBarLabel}>Boutique</Text>
              </TouchableOpacity>
            </View>

            {recommendedRecipes.length > 0 && (
              <View style={s.recoSection}>
                <View style={s.recoHeader}>
                  <Text style={s.recoTitle}>🌿 Recettes pour ton diagnostic</Text>
                  <TouchableOpacity onPress={() => router.push('/recipes')}>
                    <Text style={s.recoSeeAll}>Toutes →</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 4 }}>
                  {recommendedRecipes.map(r => (
                    <TouchableOpacity
                      key={r.id}
                      style={s.recipeRecoCard}
                      onPress={() => router.push('/recipes')}
                      activeOpacity={0.85}
                    >
                      <View style={[s.recipeRecoThumb, { backgroundColor: r.thumb_bg }]}>
                        <Text style={{ fontSize: 28 }}>{r.thumb_emoji}</Text>
                      </View>
                      <Text style={s.recipeRecoName} numberOfLines={2}>{r.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Actions */}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <TouchableOpacity
                style={[s.shareBtn, shared && { backgroundColor: Colors.sage }]}
                onPress={() => { setShared(true); setTimeout(() => setShared(false), 2500); }}
              >
                <Text style={s.shareBtnText}>{shared ? '✓ Lien copié !' : '📤 Partager'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.newAnalysisBtn}
                onPress={resetAnalysis}
              >
                <Text style={s.newAnalysisBtnText}>› Nouvelle analyse</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Tips */}
        <View style={s.tipsBlock}>
          <View style={s.tipsHeader}>
            <BCEmojiAvatar size={40} mood="coaching" />
            <View style={{ flex: 1 }}>
              <Text style={s.tipsHeaderTitle}>Conseils Black Cotton</Text>
              <Text style={s.tipsHeaderSub}>Astuces pour mieux analyser</Text>
            </View>
          </View>
          {TIPS.map((tip, i) => (
            <View key={i} style={[s.tipRow, i < TIPS.length - 1 && s.tipRowBorder]}>
              <Text style={s.tipEmoji}>{tip.e}</Text>
              <View style={{ flex: 1 }}>
                <Text style={s.tipTitle}>{tip.title}</Text>
                <Text style={s.tipText}>{tip.tip}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.bg },
  scroll:  { flex: 1 },
  content: { paddingHorizontal: 20 },

  topbar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12,
    backgroundColor: Colors.bg, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  topbarTitle: { fontSize: 20, fontFamily: 'Poppins_700Bold', color: Colors.ink },
  coinsBadge:  { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: Colors.ink, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7 },
  coinsText:   { fontSize: 15, fontFamily: 'DMSans_700Bold', color: Colors.amber },

  errorBanner: { backgroundColor: '#FDE8E8', borderRadius: 12, padding: 12, marginTop: 12 },
  errorText:   { fontSize: 13, fontFamily: 'DMSans_400Regular', color: '#7A1F1F', lineHeight: 18 },

  /* Stepper */
  stepper:       { paddingHorizontal: 8, marginTop: 14, marginBottom: 4 },
  stepperRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepDot:       { width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.cream, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  stepDotActive: { backgroundColor: Colors.ink, borderColor: Colors.ink },
  stepDotDone:   { backgroundColor: Colors.sage, borderColor: Colors.sage },
  stepDotText:       { fontSize: 11, fontFamily: 'DMSans_700Bold', color: Colors.warmGray },
  stepDotTextActive: { fontSize: 11, fontFamily: 'DMSans_700Bold', color: '#fff' },
  stepDotTextDone:   { fontSize: 12, fontFamily: 'DMSans_700Bold', color: '#fff' },
  stepLine:      { flex: 1, height: 2, backgroundColor: Colors.border, marginHorizontal: 6 },
  stepLineDone:  { backgroundColor: Colors.sage },
  stepperLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, paddingHorizontal: 2 },
  stepLabel:        { fontSize: 10, fontFamily: 'DMSans_500Medium', color: Colors.warmGray, flex: 1, textAlign: 'center' },
  stepLabelActive:  { color: Colors.ink, fontFamily: 'DMSans_700Bold' },

  /* Empty */
  emptyCard: {
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: 24, backgroundColor: Colors.cream,
    padding: 20, alignItems: 'center', marginTop: 14,
  },
  emptyTitle: { fontSize: 20, fontFamily: 'Poppins_700Bold', color: Colors.ink, marginBottom: 6, textAlign: 'center' },
  emptyDesc:  { fontSize: 13, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, textAlign: 'center', lineHeight: 20, marginBottom: 10, maxWidth: 300 },
  quotaHint: {
    fontSize: 12,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.amberDark,
    textAlign: 'center',
    marginBottom: 14,
  },

  /* Photo slots */
  photoSlots:      { flexDirection: 'row', gap: 10, width: '100%', marginBottom: 16 },
  photoSlot: {
    flex: 1, aspectRatio: 0.85, borderRadius: 16,
    borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed',
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', gap: 4,
  },
  photoSlotFilled: { borderStyle: 'solid', borderColor: Colors.ink, borderWidth: 1.5 },
  photoSlotImg:    { width: '100%', height: '100%' },
  photoSlotEmoji:  { fontSize: 22 },
  photoSlotLabel:  { fontSize: 11, fontFamily: 'DMSans_700Bold', color: Colors.ink, textAlign: 'center' },
  photoSlotSub:    { fontSize: 9,  fontFamily: 'DMSans_400Regular', color: Colors.warmGray, textAlign: 'center' },
  photoSlotPlus: {
    position: 'absolute', bottom: 6, right: 6,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: Colors.border, alignItems: 'center', justifyContent: 'center',
  },
  photoSlotCheck: {
    position: 'absolute', top: 6, right: 6,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: Colors.ink, alignItems: 'center', justifyContent: 'center',
  },

  analyzeBtn:         { backgroundColor: Colors.ink, borderRadius: 14, paddingVertical: 15, width: '100%', alignItems: 'center' },
  analyzeBtnDisabled: { backgroundColor: Colors.border },
  analyzeBtnText:     { fontSize: 15, fontFamily: 'DMSans_700Bold', color: '#fff' },

  tipCard:  { backgroundColor: Colors.cream, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: 14, marginTop: 14 },
  tipText:  { fontSize: 12, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, lineHeight: 18 },

  secTitle: { fontSize: 20, fontFamily: 'Poppins_600SemiBold', color: Colors.ink, marginTop: 22, marginBottom: 12 },

  emptyHistory:       { backgroundColor: Colors.cream, borderRadius: 18, padding: 28, alignItems: 'center' },
  emptyHistoryTitle:  { fontSize: 15, fontFamily: 'DMSans_700Bold', color: Colors.ink, marginBottom: 6, textAlign: 'center' },
  emptyHistoryDesc:   { fontSize: 13, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, textAlign: 'center', lineHeight: 20 },

  photoHint: { fontSize: 12, fontFamily: 'DMSans_500Medium', color: Colors.amberDark, textAlign: 'center', marginBottom: 10, lineHeight: 18 },

  historyList:       { backgroundColor: Colors.cream, borderRadius: 18, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' },
  historyRow:        { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14 },
  historyRowBorder:  { borderBottomWidth: 1, borderBottomColor: Colors.border },
  historyScoreBadge: { width: 44, height: 44, borderRadius: 12, backgroundColor: Colors.ink, alignItems: 'center', justifyContent: 'center' },
  historyScoreVal:   { fontSize: 16, fontFamily: 'DMSans_700Bold', color: Colors.amber },
  historyDate:       { fontSize: 13, fontFamily: 'DMSans_700Bold', color: Colors.ink, marginBottom: 2 },
  historyMeta:       { fontSize: 11, fontFamily: 'DMSans_500Medium', color: Colors.warmGray },
  historySynth:      { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, marginTop: 4, lineHeight: 16 },

  journeyBanner: { backgroundColor: Colors.amberLight, borderRadius: 16, borderWidth: 1, borderColor: '#FDE68A', padding: 14, marginBottom: 14 },
  journeyTitle:  { fontSize: 15, fontFamily: 'DMSans_700Bold', color: Colors.ink, marginBottom: 4 },
  journeySub:    { fontSize: 12, fontFamily: 'DMSans_400Regular', color: Colors.amberInk, lineHeight: 18, marginBottom: 10 },
  journeyDots:   { flexDirection: 'row', gap: 8, marginBottom: 12 },
  journeyDot:    { width: 28, height: 8, borderRadius: 4, backgroundColor: 'rgba(0,0,0,0.12)' },
  journeyDotDone:{ backgroundColor: Colors.sage },
  journeyBtn:    { alignSelf: 'flex-start', backgroundColor: Colors.ink, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  journeyBtnText:{ fontSize: 12, fontFamily: 'DMSans_700Bold', color: '#fff' },

  actionBar:     { flexDirection: 'row', gap: 10, marginTop: 8 },
  actionBarBtn:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.cream, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, paddingVertical: 12 },
  actionBarEmoji:{ fontSize: 18 },
  actionBarLabel:{ fontSize: 13, fontFamily: 'DMSans_700Bold', color: Colors.ink },

  recipeRecoCard:  { width: 120 },
  recipeRecoThumb: { width: 120, height: 88, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  recipeRecoName:  { fontSize: 11, fontFamily: 'DMSans_600SemiBold', color: Colors.ink, lineHeight: 15 },

  /* Questions */
  qProgressRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 18, marginBottom: 6 },
  qProgressLabel: { fontSize: 12, fontFamily: 'DMSans_600SemiBold', color: Colors.warmGray },
  qOptionalBadge: { backgroundColor: Colors.amberLight, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  qOptionalText:  { fontSize: 10, fontFamily: 'DMSans_600SemiBold', color: '#7A4E0A' },
  qProgressBarBg:  { height: 6, borderRadius: 999, backgroundColor: Colors.cream, overflow: 'hidden', marginBottom: 16 },
  qProgressBarFill:{ height: 6, borderRadius: 999, backgroundColor: Colors.amber },

  qCard:     { backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: Colors.border, padding: 18 },
  qTitle:    { fontSize: 18, fontFamily: 'Poppins_700Bold', color: Colors.ink, marginBottom: 4 },
  qSubtitle: { fontSize: 12, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, lineHeight: 18, marginBottom: 14 },
  qOptions:  { gap: 8 },
  qOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 12, paddingVertical: 11,
    borderRadius: 14, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: '#fff',
  },
  qOptionSelected:     { borderColor: Colors.ink, backgroundColor: Colors.amberLight },
  qOptionEmojiBox:     { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.cream, alignItems: 'center', justifyContent: 'center' },
  qOptionEmojiBoxSelected: { backgroundColor: '#fff' },
  qOptionEmoji:        { fontSize: 18 },
  qOptionLabel:        { fontSize: 14, fontFamily: 'DMSans_600SemiBold', color: Colors.ink },
  qOptionLabelSelected:{ color: Colors.ink },
  qOptionHint:         { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, marginTop: 2 },
  qOptionHintSelected: { color: '#5C3D08' },
  qOptionRadio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  qOptionRadioSelected: { borderColor: Colors.ink },
  qOptionRadioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.ink },

  qNavRow:   { flexDirection: 'row', gap: 10, marginTop: 16, alignItems: 'center' },
  qNavBack:  { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.cream, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12 },
  qNavBackText: { fontSize: 13, fontFamily: 'DMSans_600SemiBold', color: Colors.ink },
  qNavSkip:    { paddingHorizontal: 12, paddingVertical: 12 },
  qNavSkipText:{ fontSize: 13, fontFamily: 'DMSans_500Medium', color: Colors.warmGray, textDecorationLine: 'underline' },
  qNavNext:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: Colors.ink, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13 },
  qNavNextDisabled: { backgroundColor: Colors.border },
  qNavNextText: { fontSize: 14, fontFamily: 'DMSans_700Bold', color: '#fff' },

  /* Loading */
  thumbnailRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  thumbnail:    { flex: 1, height: 90, borderRadius: 14, overflow: 'hidden', backgroundColor: Colors.cream },

  photoPh:      { height: 220, borderRadius: 20, backgroundColor: Colors.cream, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center', marginTop: 12, overflow: 'hidden' },
  photoPhText:  { fontSize: 12, fontFamily: 'DMSans_400Regular', color: Colors.warmGray },
  loadingCard:  { backgroundColor: Colors.cream, borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: 22, marginTop: 14, alignItems: 'center' },
  loadingTitle: { fontSize: 20, fontFamily: 'Poppins_600SemiBold', color: Colors.ink, marginBottom: 16 },
  loadingStep:  { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12, width: '100%' },
  loadingDot:   { width: 14, height: 14, borderRadius: 7 },
  loadingLabel: { fontSize: 13, fontFamily: 'DMSans_400Regular' },

  /* Results */
  photoWrapper: { position: 'relative', marginTop: 12 },
  scoreRing: {
    position: 'absolute', top: 12, right: 12,
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: Colors.amberDark, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 8, elevation: 4,
  },
  scoreRingVal: { fontSize: 18, fontFamily: 'Poppins_700Bold', color: '#fff', lineHeight: 20 },
  scoreRingSub: { fontSize: 9,  fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.9)' },

  compareRow:   { flexDirection: 'row', gap: 10, marginTop: 12 },
  compareCard:  { flex: 1, borderWidth: 1, borderRadius: 14, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 8 },
  compareTitle: { fontSize: 12, fontFamily: 'DMSans_700Bold', color: Colors.ink },
  compareSub:   { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, marginTop: 1 },

  typeCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#2D1B4E', borderRadius: 18, padding: 16, marginTop: 10,
  },
  typeIconBox:       { width: 58, height: 58, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  typeMeta:          { fontSize: 10, fontFamily: 'DMSans_600SemiBold', color: 'rgba(255,255,255,0.6)', letterSpacing: 0.6, marginBottom: 4 },
  typeTitle:         { fontSize: 18, fontFamily: 'DMSans_700Bold', color: '#fff' },
  typePill:          { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  typePillText:      { fontSize: 10, fontFamily: 'DMSans_600SemiBold', color: '#fff' },
  typePillAmber:     { backgroundColor: 'rgba(242,160,74,0.3)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  typePillAmberText: { fontSize: 10, fontFamily: 'DMSans_600SemiBold', color: '#FDE68A' },

  progressionCard:       { backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.border, borderRadius: 18, padding: 16, marginTop: 10 },
  progressionTitle:      { fontSize: 13, fontFamily: 'DMSans_700Bold', color: Colors.ink },
  progressionSub:        { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray },
  progressionLabel:      { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray },
  progressionBarBg:      { flex: 1, height: 10, backgroundColor: Colors.cream, borderRadius: 999, overflow: 'hidden' },
  progressionBarFill:    { height: 10, backgroundColor: Colors.amber, borderRadius: 999 },
  progressionMarker:     { position: 'absolute', top: 0, left: '80%', width: 2, height: 10, backgroundColor: 'rgba(26,18,9,0.3)' },
  progressionScore:      { fontSize: 20, fontFamily: 'DMSans_700Bold' },
  progressionScoreLabel: { fontSize: 10, fontFamily: 'DMSans_400Regular', color: Colors.warmGray },

  gaugesCard:  { backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.border, borderRadius: 18, padding: 16, marginTop: 10 },
  gaugesTitle: { fontSize: 13, fontFamily: 'DMSans_700Bold', color: Colors.ink, marginBottom: 14 },
  gaugeName:   { fontSize: 13, fontFamily: 'DMSans_600SemiBold', color: Colors.ink },
  gaugeVal:    { fontSize: 13, fontFamily: 'DMSans_700Bold' },
  gaugeBarBg:  { height: 8, backgroundColor: Colors.cream, borderRadius: 999, overflow: 'hidden' },
  gaugeBarFill:{ height: 8, borderRadius: 999 },

  syntheseCard:  { backgroundColor: Colors.amberLight, borderLeftWidth: 3, borderLeftColor: Colors.amber, borderRadius: 14, padding: 14, marginTop: 10 },
  syntheseTitle: { fontSize: 13, fontFamily: 'DMSans_600SemiBold', color: Colors.ink, marginBottom: 4 },
  syntheseText:  { fontSize: 13, fontFamily: 'DMSans_400Regular', color: '#5C3D08', lineHeight: 20 },

  segmented:     { flexDirection: 'row', backgroundColor: Colors.cream, borderRadius: 14, borderWidth: 1, borderColor: Colors.border, padding: 4, gap: 4, marginTop: 16 },
  seg:           { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center' },
  segActive:     { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  segText:       { fontSize: 11, fontFamily: 'DMSans_500Medium', color: Colors.warmGray },
  segTextActive: { color: Colors.ink, fontFamily: 'DMSans_600SemiBold' },

  card:         { backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1, borderColor: Colors.border },
  problemCard:  { borderRadius: 14, padding: 14 },
  problemName:  { fontSize: 14, fontFamily: 'DMSans_600SemiBold' },
  problemDesc:  { fontSize: 12, fontFamily: 'DMSans_400Regular', opacity: 0.85, lineHeight: 18 },
  sevBadge:     { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  sevBadgeText: { fontSize: 10, fontFamily: 'DMSans_600SemiBold', color: '#fff' },

  adviceIconBox:   { width: 44, height: 44, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  adviceTypeBadge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start', marginBottom: 4 },
  adviceTypeText:  { fontSize: 10, fontFamily: 'DMSans_600SemiBold', letterSpacing: 0.4 },
  adviceTitle:     { fontSize: 14, fontFamily: 'DMSans_600SemiBold', color: Colors.ink },
  adviceDesc:      { fontSize: 12, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, marginTop: 2 },
  shopBtn:         { marginTop: 12, backgroundColor: Colors.ink, borderRadius: 10, paddingVertical: 9, alignItems: 'center' },
  shopBtnText:     { fontSize: 12, fontFamily: 'DMSans_600SemiBold', color: '#fff' },

  routineNum:       { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.ink, alignItems: 'center', justifyContent: 'center' },
  routineNumText:   { fontSize: 12, fontFamily: 'DMSans_600SemiBold', color: '#fff' },
  routineLine:      { flex: 1, width: 2, backgroundColor: Colors.border, minHeight: 16 },
  routineTitle:     { fontSize: 14, fontFamily: 'DMSans_600SemiBold', color: Colors.ink },
  routineFreqBadge: { backgroundColor: Colors.amberLight, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  routineFreqText:  { fontSize: 10, fontFamily: 'DMSans_500Medium', color: '#7A4E0A' },
  routineDesc:      { fontSize: 12, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, lineHeight: 18 },
  saveRoutineBtn:   { backgroundColor: Colors.ink, borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  saveRoutineBtnText:{ fontSize: 15, fontFamily: 'DMSans_700Bold', color: '#fff' },
  customizeRoutineBtn: {
    marginTop: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  customizeRoutineBtnText: { fontSize: 13, fontFamily: 'DMSans_600SemiBold', color: Colors.ink },

  ingDot:        { width: 8, height: 8, borderRadius: 4 },
  ingLegendText: { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray },
  ingCard:       { borderWidth: 1, borderRadius: 16, padding: 14 },
  ingName:       { fontSize: 13, fontFamily: 'DMSans_700Bold' },
  ingBadge:      { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  ingBadgeText:  { fontSize: 9,  fontFamily: 'DMSans_700Bold', color: '#fff' },
  ingDesc:       { fontSize: 12, fontFamily: 'DMSans_400Regular', opacity: 0.85, lineHeight: 18 },
  ingExample:    { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  ingExampleText:{ fontSize: 10, fontFamily: 'DMSans_400Regular' },
  ingGoodCard:   { backgroundColor: '#E8F5E9', borderWidth: 1, borderColor: '#A5D6A7', borderRadius: 14, padding: 12, marginTop: 4 },
  ingGoodTitle:  { fontSize: 12, fontFamily: 'DMSans_600SemiBold', color: '#2E7D32', marginBottom: 4 },
  ingGoodText:   { fontSize: 12, fontFamily: 'DMSans_400Regular', color: '#388E3C', lineHeight: 20 },

  /* Recommandés */
  recoSection: {
    marginTop: 18,
    backgroundColor: Colors.amberLight,
    borderRadius: 18,
    padding: 16,
  },
  recoHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  recoTitle:   { fontSize: 15, fontFamily: 'Poppins_700Bold', color: Colors.ink, flexShrink: 1 },
  recoSeeAll:  { fontSize: 12, fontFamily: 'DMSans_600SemiBold', color: Colors.ink },
  recoSub:     { fontSize: 11, fontFamily: 'DMSans_400Regular', color: '#5C3D08', marginBottom: 10 },
  recoCard:    { width: 140, backgroundColor: '#fff', borderRadius: 14, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)', padding: 8 },
  recoCardImg: { width: '100%', height: 90, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  recoCardBrand:{ fontSize: 10, fontFamily: 'DMSans_600SemiBold', color: Colors.warmGray, letterSpacing: 0.4 },
  recoCardName: { fontSize: 12, fontFamily: 'DMSans_700Bold', color: Colors.ink, marginTop: 2, lineHeight: 16 },
  recoCardPrice:{ fontSize: 12, fontFamily: 'DMSans_700Bold', color: Colors.ink, marginTop: 4 },

  shareBtn:          { flex: 1, backgroundColor: Colors.ink, borderRadius: 14, paddingVertical: 13, alignItems: 'center' },
  shareBtnText:      { fontSize: 13, fontFamily: 'DMSans_700Bold', color: '#fff' },
  newAnalysisBtn:    { flex: 1, backgroundColor: Colors.cream, borderWidth: 1, borderColor: Colors.border, borderRadius: 14, paddingVertical: 13, alignItems: 'center' },
  newAnalysisBtnText:{ fontSize: 13, fontFamily: 'DMSans_600SemiBold', color: Colors.ink },

  tipsBlock: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 20, overflow: 'hidden', marginTop: 24,
  },
  tipsHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, backgroundColor: Colors.cream,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  tipsHeaderTitle: { fontSize: 15, fontFamily: 'Poppins_600SemiBold', color: Colors.ink },
  tipsHeaderSub:   { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, marginTop: 2 },
  tipRow:          { flexDirection: 'row', gap: 12, padding: 14 },
  tipRowBorder:    { borderBottomWidth: 1, borderBottomColor: Colors.border },
  tipEmoji:        { fontSize: 18, marginTop: 1 },
  tipTitle:        { fontSize: 13, fontFamily: 'DMSans_700Bold', color: Colors.ink, marginBottom: 4 },
});
