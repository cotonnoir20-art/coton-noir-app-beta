import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/theme/colors';
import { useApp } from '../src/context/AppContext';
import { AppHeader } from '../src/components/AppHeader';
import { BCEmojiAvatar } from '../src/components/blackCotton/BCEmojiAvatar';
import { ROUTINE_TYPES, RoutineType } from '../src/data/routines';
import {
  ROUTINE_ITEM_KIND_LABELS,
  ROUTINE_PLAN_LABELS,
  RoutineItemKind,
  RoutinePlanItem,
  RoutinePlanMode,
  RoutinePlanStep,
  UserRoutinePlan,
} from '../src/types/userRoutinePlan';
import {
  createBlankStep,
  newPlanId,
  planFromDisplayedSteps,
  validatePlan,
} from '../src/lib/userRoutinePlan';
import { hapticSuccess } from '../src/lib/haptics';
import { loadAnalysisDraft } from '../src/lib/analysisDraftStorage';
import { planFromHairAnalysis } from '../src/lib/planFromHairAnalysis';
import { planFromRecipe } from '../src/lib/planFromRecipe';
import { planWithTestedProduct } from '../src/lib/planFromProduct';
import { markAnalysisRoutineAdopted } from '../src/lib/analysisJourney';
import {
  clearProductTestedPending,
  loadProductTestedPending,
  recordCompletedProductTest,
} from '../src/lib/productTestedWorkflow';
import { saveProductTestSignal } from '../src/lib/productTestSignals';
import { trackProductEvent } from '../src/lib/productAnalytics';
import { CATALOG_RECIPES } from '../src/data/recipesCatalog';
import { formatDualEarnReward, getRoutineValidationRewards } from '../src/lib/cotonCoins';

function parseKind(raw: string | string[] | undefined): RoutineType {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v === 'night' || v === 'washday' || v === 'daily') return v;
  return 'daily';
}

const ITEM_KINDS: RoutineItemKind[] = ['product', 'recipe', 'other'];

export default function RoutinePlanScreen() {
  const router = useRouter();
  const { dispatch, state } = useApp();
  const params = useLocalSearchParams<{
    kind?: string | string[];
    source?: string | string[];
    recipeId?: string | string[];
    productName?: string | string[];
    productBrand?: string | string[];
    focus?: string | string[];
    eventName?: string | string[];
  }>();
  const kind = parseKind(params.kind);
  const source = Array.isArray(params.source) ? params.source[0] : params.source;
  const fromAnalysis = source === 'analysis';
  const fromRecipe = source === 'recipe';
  const fromProduct = source === 'product';
  const fromEvent = source === 'event';
  const eventName = (Array.isArray(params.eventName) ? params.eventName[0] : params.eventName)?.trim();
  const focusEvolution = (Array.isArray(params.focus) ? params.focus[0] : params.focus) === 'evolution';

  const savedPlan = state.routinePlans?.[kind] ?? null;
  const defaultSeed = planFromDisplayedSteps(kind, state.routineSteps[kind], savedPlan);
  const [analysisSeed, setAnalysisSeed] = useState<UserRoutinePlan | null>(null);
  const [contentSeed, setContentSeed] = useState<UserRoutinePlan | null>(null);

  useEffect(() => {
    if (!fromAnalysis || savedPlan) return;
    let cancelled = false;
    void loadAnalysisDraft().then(draft => {
      if (cancelled || !draft?.analysis?.routine?.length) return;
      setAnalysisSeed(
        planFromHairAnalysis(kind, draft.analysis.routine, draft.analysis.synthesis),
      );
    });
    return () => { cancelled = true; };
  }, [fromAnalysis, kind, savedPlan]);

  useEffect(() => {
    if (fromRecipe && !savedPlan) {
      const recipeId = Array.isArray(params.recipeId) ? params.recipeId[0] : params.recipeId;
      const recipe = CATALOG_RECIPES.find(r => r.id === recipeId) ?? CATALOG_RECIPES[0];
      if (recipe) setContentSeed(planFromRecipe(kind, recipe));
    }
    if (fromProduct) {
      const name = Array.isArray(params.productName) ? params.productName[0] : params.productName ?? '';
      const brand = Array.isArray(params.productBrand) ? params.productBrand[0] : params.productBrand ?? '';
      setContentSeed(planWithTestedProduct(kind, brand, name, savedPlan));
    }
  }, [fromRecipe, fromProduct, kind, savedPlan, params.recipeId, params.productName, params.productBrand]);

  const seedPlan = contentSeed ?? analysisSeed ?? defaultSeed;
  const meta = ROUTINE_PLAN_LABELS[kind];

  const [mode, setMode] = useState<RoutinePlanMode>(seedPlan.mode);
  const [name, setName] = useState(
    fromEvent && eventName
      ? `Coiffage · ${eventName}`
      : savedPlan?.name?.trim() || seedPlan.name || ROUTINE_TYPES[kind].label,
  );

  useEffect(() => {
    if (fromEvent && eventName) setName(`Coiffage · ${eventName}`);
  }, [fromEvent, eventName]);
  const [items, setItems] = useState<RoutinePlanItem[]>(seedPlan.items);
  const [steps, setSteps] = useState<RoutinePlanStep[]>(seedPlan.steps);
  const [hairStateComment, setHairStateComment] = useState(savedPlan?.hairStateComment ?? '');
  const [evolutionComment, setEvolutionComment] = useState(savedPlan?.evolutionComment ?? '');
  const [newItemLabel, setNewItemLabel] = useState('');
  const [newItemKind, setNewItemKind] = useState<RoutineItemKind>('product');

  useEffect(() => {
    const seed = contentSeed ?? analysisSeed;
    if (!seed || (savedPlan && !fromProduct)) return;
    setMode(fromProduct ? 'try_new' : seed.mode);
    setName(seed.name);
    setItems(seed.items);
    setSteps(seed.steps);
    setHairStateComment(seed.hairStateComment ?? '');
    setEvolutionComment(seed.evolutionComment ?? '');
  }, [contentSeed, analysisSeed, savedPlan, fromProduct]);

  const itemLabels = useMemo(() => items.map(i => i.label).filter(Boolean), [items]);

  function addItem() {
    const label = newItemLabel.trim();
    if (!label) return;
    setItems(prev => [...prev, { id: newPlanId(), kind: newItemKind, label }]);
    setNewItemLabel('');
  }

  function removeItem(id: string) {
    setItems(prev => prev.filter(i => i.id !== id));
    setSteps(prev =>
      prev.map(s => ({
        ...s,
        productLabels: s.productLabels.filter(l => {
          const item = items.find(i => i.id === id);
          return item ? l !== item.label : true;
        }),
      })),
    );
  }

  function addStep() {
    setSteps(prev => [...prev, createBlankStep()]);
  }

  function updateStep(id: string, patch: Partial<RoutinePlanStep>) {
    setSteps(prev => prev.map(s => (s.id === id ? { ...s, ...patch } : s)));
  }

  function removeStep(id: string) {
    setSteps(prev => prev.filter(s => s.id !== id));
  }

  function toggleStepProduct(stepId: string, label: string) {
    setSteps(prev =>
      prev.map(s => {
        if (s.id !== stepId) return s;
        const has = s.productLabels.includes(label);
        return {
          ...s,
          productLabels: has
            ? s.productLabels.filter(l => l !== label)
            : [...s.productLabels, label],
        };
      }),
    );
  }

  async function handleSave() {
    const plan: UserRoutinePlan = {
      kind,
      mode,
      name: name.trim(),
      items,
      steps,
      hairStateComment: hairStateComment.trim(),
      evolutionComment: evolutionComment.trim(),
      updatedAt: new Date().toISOString(),
    };
    const err = validatePlan(plan);
    if (err) {
      Alert.alert('Routine incomplète', err);
      return;
    }
    hapticSuccess();
    dispatch({ type: 'setRoutinePlan', plan });
    if (fromAnalysis) {
      void trackProductEvent('analysis_routine_adopted', { routine_type: kind });
      void markAnalysisRoutineAdopted();
    }
    if (fromProduct) {
      void trackProductEvent('product_added_to_routine', { routine_type: kind });
      const pending = await loadProductTestedPending();
      const brand = Array.isArray(params.productBrand) ? params.productBrand[0] : params.productBrand ?? pending?.brand ?? '';
      const name = Array.isArray(params.productName) ? params.productName[0] : params.productName ?? pending?.name ?? '';
      if (plan.evolutionComment.trim()) {
        void trackProductEvent('product_tested_evolution_saved', { routine_type: kind });
        await clearProductTestedPending();
        if (pending || name) {
          await recordCompletedProductTest({
            productId: pending?.productId ?? `${brand}-${name}`,
            brand,
            name,
            completedAt: new Date().toISOString(),
          });
          void saveProductTestSignal({
            profile: state.profile,
            productBrand: brand,
            productName: name,
            productId: pending?.productId,
          });
        }
      }
    }
    if (fromRecipe) {
      void trackProductEvent('recipe_added_to_routine', { routine_type: kind });
    }

    const offerMorningValidation =
      kind === 'daily' &&
      !state.validated.daily &&
      !fromAnalysis;

    if (offerMorningValidation) {
      const { cc, pts } = getRoutineValidationRewards('daily');
      const reward = formatDualEarnReward(cc, pts);
      Alert.alert(
        'Routine enregistrée ✓',
        `Valide ta routine matin maintenant pour lancer ton streak et gagner ${reward}.`,
        [
          { text: 'Plus tard', style: 'cancel', onPress: () => router.back() },
          {
            text: 'Valider ma routine matin',
            onPress: () => {
              router.replace('/(tabs)/routine?routine=daily' as any);
            },
          },
        ],
      );
      return;
    }

    router.back();
  }

  function handleReset() {
    Alert.alert(
      'Revenir au modèle par défaut ?',
      'Ta routine personnalisée sera remplacée par les étapes suggérées par Coton Noir.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réinitialiser',
          style: 'destructive',
          onPress: () => {
            dispatch({ type: 'clearRoutinePlan', kind });
            router.back();
          },
        },
      ],
    );
  }

  return (
    <SafeAreaView style={S.safe} edges={['top']}>
      <AppHeader title={meta.title} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.content}>

          <View style={S.introCard}>
            <BCEmojiAvatar size={48} mood="coaching" />
            <View style={S.introBody}>
              <Text style={S.introTitle}>{meta.subtitle}</Text>
              <Text style={S.introText}>
                Décris ta routine pour que Black Cotton comprenne ce qui fonctionne sur tes cheveux
                et puisse le suggérer à d&apos;autres profils similaires.
              </Text>
            </View>
          </View>

          {/* Mode */}
          <Text style={S.label}>Objectif</Text>
          <View style={S.modeRow}>
            <TouchableOpacity
              style={[S.modeBtn, mode === 'keep' && S.modeBtnActive]}
              onPress={() => setMode('keep')}
            >
              <Text style={S.modeEmoji}>✨</Text>
              <Text style={[S.modeTitle, mode === 'keep' && S.modeTitleActive]}>
                Ma routine qui fonctionne
              </Text>
              <Text style={S.modeSub}>Je garde ce qui marche bien</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[S.modeBtn, mode === 'try_new' && S.modeBtnActive]}
              onPress={() => setMode('try_new')}
            >
              <Text style={S.modeEmoji}>🧪</Text>
              <Text style={[S.modeTitle, mode === 'try_new' && S.modeTitleActive]}>
                Tester une nouvelle routine
              </Text>
              <Text style={S.modeSub}>J&apos;expérimente et j&apos;observe</Text>
            </TouchableOpacity>
          </View>

          {/* Nom */}
          <Text style={S.label}>Nom de ta routine <Text style={S.req}>*</Text></Text>
          <TextInput
            style={S.input}
            placeholder="Ex : LOC du matin, Wash day coco…"
            placeholderTextColor={Colors.warmGray}
            value={name}
            onChangeText={setName}
          />

          {/* Produits & recettes */}
          <Text style={S.label}>Produits & recettes utilisés</Text>
          <View style={S.kindRow}>
            {ITEM_KINDS.map(k => (
              <TouchableOpacity
                key={k}
                style={[S.kindPill, newItemKind === k && S.kindPillActive]}
                onPress={() => setNewItemKind(k)}
              >
                <Text style={[S.kindPillText, newItemKind === k && S.kindPillTextActive]}>
                  {ROUTINE_ITEM_KIND_LABELS[k]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={S.addRow}>
            <TextInput
              style={[S.input, { flex: 1 }]}
              placeholder="Nom du produit ou de la recette"
              placeholderTextColor={Colors.warmGray}
              value={newItemLabel}
              onChangeText={setNewItemLabel}
              onSubmitEditing={addItem}
            />
            <TouchableOpacity style={S.addBtn} onPress={addItem}>
              <Ionicons name="add" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
          {items.length > 0 && (
            <View style={S.chips}>
              {items.map(item => (
                <TouchableOpacity key={item.id} style={S.chip} onPress={() => removeItem(item.id)}>
                  <Text style={S.chipKind}>{ROUTINE_ITEM_KIND_LABELS[item.kind]}</Text>
                  <Text style={S.chipLabel}>{item.label}</Text>
                  <Ionicons name="close" size={14} color={Colors.warmGray} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Étapes */}
          <View style={S.sectionHead}>
            <Text style={S.label}>Étapes <Text style={S.req}>*</Text></Text>
            <TouchableOpacity onPress={addStep} style={S.linkBtn}>
              <Ionicons name="add-circle-outline" size={18} color={Colors.amber} />
              <Text style={S.linkText}>Ajouter</Text>
            </TouchableOpacity>
          </View>

          {steps.map((step, index) => (
            <View key={step.id} style={S.stepCard}>
              <View style={S.stepHead}>
                <Text style={S.stepNum}>Étape {index + 1}</Text>
                {steps.length > 1 && (
                  <TouchableOpacity onPress={() => removeStep(step.id)} hitSlop={8}>
                    <Ionicons name="trash-outline" size={18} color={Colors.rose} />
                  </TouchableOpacity>
                )}
              </View>
              <TextInput
                style={S.input}
                placeholder="Titre (ex : Leave-in, Pré-poo…)"
                placeholderTextColor={Colors.warmGray}
                value={step.title}
                onChangeText={t => updateStep(step.id, { title: t })}
              />
              <TextInput
                style={[S.input, S.inputSmall]}
                placeholder="Durée (ex : 10 min)"
                placeholderTextColor={Colors.warmGray}
                value={step.duration}
                onChangeText={t => updateStep(step.id, { duration: t })}
              />
              <TextInput
                style={[S.input, S.textArea]}
                placeholder="Description de l'étape"
                placeholderTextColor={Colors.warmGray}
                value={step.desc}
                onChangeText={t => updateStep(step.id, { desc: t })}
                multiline
              />
              {itemLabels.length > 0 && (
                <>
                  <Text style={S.subLabel}>Produits pour cette étape</Text>
                  <View style={S.chips}>
                    {itemLabels.map(label => {
                      const active = step.productLabels.includes(label);
                      return (
                        <TouchableOpacity
                          key={label}
                          style={[S.chip, active && S.chipActive]}
                          onPress={() => toggleStepProduct(step.id, label)}
                        >
                          <Text style={[S.chipLabel, active && S.chipLabelActive]}>{label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}
            </View>
          ))}

          {/* Commentaires */}
          <Text style={S.label}>Comment sont tes cheveux ?</Text>
          <TextInput
            style={[S.input, S.textArea]}
            placeholder="Hydratés, secs, cassants, brillants, frisottis…"
            placeholderTextColor={Colors.warmGray}
            value={hairStateComment}
            onChangeText={setHairStateComment}
            multiline
          />

          <Text style={S.label}>Comment évoluent-ils avec cette routine ?</Text>
          {focusEvolution ? (
            <Text style={S.focusHint}>
              Note l’effet de ton nouveau produit après ton wash day — utile pour affiner tes prochaines reco.
            </Text>
          ) : null}
          <TextInput
            style={[S.input, S.textArea, focusEvolution && S.textAreaFocus]}
            placeholder="Ce qui s'améliore, ce qui coince, depuis combien de temps tu testes…"
            placeholderTextColor={Colors.warmGray}
            value={evolutionComment}
            onChangeText={setEvolutionComment}
            multiline
          />

          <TouchableOpacity style={S.saveBtn} onPress={handleSave}>
            <Text style={S.saveBtnText}>Enregistrer ma routine</Text>
          </TouchableOpacity>

          {savedPlan && (
            <TouchableOpacity style={S.resetBtn} onPress={handleReset}>
              <Text style={S.resetBtnText}>Réinitialiser au modèle Coton Noir</Text>
            </TouchableOpacity>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 20, paddingBottom: 48 },

  introCard: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: Colors.cream,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  introBody: { flex: 1 },
  introTitle: { fontFamily: 'Satoshi_500Medium', fontSize: 14, color: Colors.ink, marginBottom: 4 },
  introText: { fontFamily: 'DMSans_400Regular', fontSize: 13, color: Colors.warmGray, lineHeight: 19 },

  label: {
    fontFamily: 'Satoshi_500Medium',
    fontSize: 13,
    color: Colors.ink,
    marginBottom: 8,
    marginTop: 4,
  },
  subLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 12,
    color: Colors.warmGray,
    marginBottom: 8,
    marginTop: 8,
  },
  req: { color: Colors.rose },

  modeRow: { gap: 10, marginBottom: 16 },
  modeBtn: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#fff',
  },
  modeBtnActive: { borderColor: Colors.amber, backgroundColor: Colors.amberLight },
  modeEmoji: { fontSize: 20, marginBottom: 4 },
  modeTitle: { fontFamily: 'Satoshi_500Medium', fontSize: 14, color: Colors.ink },
  modeTitleActive: { color: Colors.ink },
  modeSub: { fontFamily: 'DMSans_400Regular', fontSize: 12, color: Colors.warmGray, marginTop: 2 },

  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    color: Colors.ink,
    marginBottom: 12,
  },
  inputSmall: { marginBottom: 8 },
  textArea: { minHeight: 88, textAlignVertical: 'top' },
  textAreaFocus: { borderColor: Colors.amber, borderWidth: 2 },
  focusHint: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.amberDark,
    marginBottom: 8,
    lineHeight: 18,
  },

  kindRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  kindPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#fff',
  },
  kindPillActive: { borderColor: Colors.amber, backgroundColor: Colors.amberLight },
  kindPillText: { fontFamily: 'DMSans_500Medium', fontSize: 12, color: Colors.warmGray },
  kindPillTextActive: { color: Colors.ink },

  addRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.amberLight, borderColor: Colors.amber },
  chipKind: { fontFamily: 'DMSans_500Medium', fontSize: 10, color: Colors.warmGray },
  chipLabel: { fontFamily: 'DMSans_500Medium', fontSize: 13, color: Colors.ink },
  chipLabelActive: { color: Colors.ink },

  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  linkBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 8 },
  linkText: { fontFamily: 'DMSans_500Medium', fontSize: 13, color: Colors.amber },

  stepCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 12,
  },
  stepHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  stepNum: { fontFamily: 'Satoshi_500Medium', fontSize: 13, color: Colors.amber },

  saveBtn: {
    backgroundColor: Colors.ink,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBtnText: { fontFamily: 'Satoshi_500Medium', fontSize: 15, color: '#fff' },
  resetBtn: { alignItems: 'center', paddingVertical: 16 },
  resetBtnText: { fontFamily: 'DMSans_500Medium', fontSize: 13, color: Colors.warmGray },
});
