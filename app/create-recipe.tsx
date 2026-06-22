import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert, KeyboardAvoidingView, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/theme/colors';
import {
  CATEGORY_STYLES, RECIPE_CATEGORIES, type RecipeCategory,
} from '../src/data/recipesCatalog';
import {
  getPersonalRecipe, savePersonalRecipe, updatePersonalRecipe,
} from '../src/lib/personalRecipesStorage';

const EMOJI_OPTIONS = ['🥛', '🌿', '💧', '🍃', '🫧', '🧴', '🍯', '🥥', '🌸', '🧁', '🌾', '🍵', '🌻', '🫐'];
const DIFFICULTIES = ['Facile', 'Express', 'Moyen'] as const;
const CATEGORIES = RECIPE_CATEGORIES.filter(c => c.id !== 'Toutes') as {
  id: RecipeCategory; label: string; emoji: string;
}[];

export default function CreateRecipeScreen() {
  const router = useRouter();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const isEdit = !!editId;

  // Form state
  const [name,        setName]        = useState('');
  const [description, setDescription] = useState('');
  const [category,    setCategory]    = useState<RecipeCategory>('Masque');
  const [difficulty,  setDifficulty]  = useState<'Facile' | 'Express' | 'Moyen'>('Facile');
  const [prepMin,     setPrepMin]     = useState('5');
  const [poseMin,     setPoseMin]     = useState('15');
  const [thumbEmoji,  setThumbEmoji]  = useState('🥛');
  const [ingredients, setIngredients] = useState<string[]>(['']);
  const [steps,       setSteps]       = useState<string[]>(['']);
  const [saving,      setSaving]      = useState(false);

  // Pre-fill when editing
  useEffect(() => {
    if (!editId) return;
    getPersonalRecipe(editId).then(r => {
      if (!r) return;
      setName(r.name);
      setDescription(r.description);
      setCategory(r.category);
      setDifficulty(r.difficulty);
      setPrepMin(String(r.prep_minutes));
      setPoseMin(String(r.pose_minutes));
      setThumbEmoji(r.thumb_emoji);
      setIngredients(r.ingredients.length ? r.ingredients : ['']);
      setSteps(r.steps.length ? r.steps : ['']);
    });
  }, [editId]);

  // Auto-sync emoji when category changes (only on create)
  useEffect(() => {
    if (isEdit) return;
    const map: Record<RecipeCategory, string> = {
      Masque: '🥛', Huile: '🌿', Spray: '💧', 'Cuir chevelu': '🍃',
    };
    setThumbEmoji(map[category]);
  }, [category, isEdit]);

  // ── Ingredient helpers ──────────────────────────────────────────────────────
  const updateIngredient = useCallback((i: number, v: string) =>
    setIngredients(p => p.map((x, j) => j === i ? v : x)), []);
  const addIngredient = () => setIngredients(p => [...p, '']);
  const removeIngredient = (i: number) =>
    setIngredients(p => p.length > 1 ? p.filter((_, j) => j !== i) : p);

  // ── Step helpers ────────────────────────────────────────────────────────────
  const updateStep = useCallback((i: number, v: string) =>
    setSteps(p => p.map((x, j) => j === i ? v : x)), []);
  const addStep = () => setSteps(p => [...p, '']);
  const removeStep = (i: number) =>
    setSteps(p => p.length > 1 ? p.filter((_, j) => j !== i) : p);

  // ── Save ────────────────────────────────────────────────────────────────────
  async function handleSave() {
    const trimmedName = name.trim();
    if (!trimmedName || saving) return;
    setSaving(true);

    const cleanIngredients = ingredients.map(s => s.trim()).filter(Boolean);
    const cleanSteps       = steps.map(s => s.trim()).filter(Boolean);

    const data = {
      name:         trimmedName,
      description:  description.trim(),
      category,
      difficulty,
      prep_minutes: Math.max(0, parseInt(prepMin, 10) || 0),
      pose_minutes: Math.max(0, parseInt(poseMin, 10) || 0),
      thumb_emoji:  thumbEmoji,
      thumb_bg:     CATEGORY_STYLES[category].cardBg,
      ingredients:  cleanIngredients.length ? cleanIngredients : [],
      steps:        cleanSteps.length ? cleanSteps : [],
    };

    if (isEdit && editId) {
      await updatePersonalRecipe(editId, data);
    } else {
      await savePersonalRecipe(data);
    }
    setSaving(false);
    router.back();
  }

  function handleCancel() {
    if (name.trim() || ingredients.some(i => i.trim()) || steps.some(s => s.trim())) {
      Alert.alert(
        'Abandonner ?',
        'Les modifications seront perdues.',
        [
          { text: 'Continuer', style: 'cancel' },
          { text: 'Abandonner', style: 'destructive', onPress: () => router.back() },
        ],
      );
    } else {
      router.back();
    }
  }

  const canSave = name.trim().length > 0;

  return (
    <SafeAreaView style={S.safe} edges={['top']}>

      {/* ── Header ── */}
      <View style={S.header}>
        <TouchableOpacity style={S.cancelBtn} onPress={handleCancel}>
          <Text style={S.cancelText}>Annuler</Text>
        </TouchableOpacity>
        <Text style={S.headerTitle}>{isEdit ? 'Modifier' : 'Nouvelle recette'}</Text>
        <TouchableOpacity
          style={[S.saveBtn, !canSave && S.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!canSave || saving}
        >
          <Text style={[S.saveText, !canSave && S.saveTextDisabled]}>
            {saving ? '…' : isEdit ? 'Sauvegarder' : 'Créer'}
          </Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={S.scroll}
        >

          {/* ── Emoji picker ── */}
          <Text style={S.sectionLabel}>Apparence</Text>
          <View style={[S.emojiPreview, { backgroundColor: CATEGORY_STYLES[category].cardBg }]}>
            <Text style={S.emojiPreviewText}>{thumbEmoji}</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={S.emojiScroll}
            contentContainerStyle={S.emojiRow}
          >
            {EMOJI_OPTIONS.map(e => (
              <TouchableOpacity
                key={e}
                style={[S.emojiChip, thumbEmoji === e && S.emojiChipActive]}
                onPress={() => setThumbEmoji(e)}
              >
                <Text style={S.emojiChipText}>{e}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* ── Nom ── */}
          <Text style={S.label}>Nom de la recette <Text style={S.required}>*</Text></Text>
          <TextInput
            style={S.input}
            value={name}
            onChangeText={setName}
            placeholder="ex : Masque avocat-miel maison"
            placeholderTextColor={Colors.warmGray}
            autoCapitalize="sentences"
          />

          {/* ── Description ── */}
          <Text style={S.label}>Description (optionnel)</Text>
          <TextInput
            style={[S.input, S.inputMulti]}
            value={description}
            onChangeText={setDescription}
            placeholder="Résumé de la recette, bienfaits…"
            placeholderTextColor={Colors.warmGray}
            multiline
            numberOfLines={2}
            textAlignVertical="top"
          />

          {/* ── Catégorie ── */}
          <Text style={S.label}>Catégorie</Text>
          <View style={S.chipsRow}>
            {CATEGORIES.map(c => (
              <TouchableOpacity
                key={c.id}
                style={[S.chip, category === c.id && S.chipActive]}
                onPress={() => setCategory(c.id)}
                activeOpacity={0.8}
              >
                <Text style={S.chipEmoji}>{c.emoji}</Text>
                <Text style={[S.chipText, category === c.id && S.chipTextActive]}>
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Difficulté ── */}
          <Text style={S.label}>Difficulté</Text>
          <View style={S.chipsRow}>
            {DIFFICULTIES.map(d => (
              <TouchableOpacity
                key={d}
                style={[S.chip, difficulty === d && S.chipActive]}
                onPress={() => setDifficulty(d)}
                activeOpacity={0.8}
              >
                <Text style={[S.chipText, difficulty === d && S.chipTextActive]}>{d}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Temps ── */}
          <Text style={S.label}>Durée</Text>
          <View style={S.timesRow}>
            <View style={S.timeBox}>
              <Text style={S.timeBoxLabel}>Préparation</Text>
              <View style={S.timeInputRow}>
                <TextInput
                  style={S.timeInput}
                  value={prepMin}
                  onChangeText={setPrepMin}
                  keyboardType="numeric"
                  maxLength={3}
                  selectTextOnFocus
                />
                <Text style={S.timeUnit}>min</Text>
              </View>
            </View>
            <View style={S.timeSep} />
            <View style={S.timeBox}>
              <Text style={S.timeBoxLabel}>Pose</Text>
              <View style={S.timeInputRow}>
                <TextInput
                  style={S.timeInput}
                  value={poseMin}
                  onChangeText={setPoseMin}
                  keyboardType="numeric"
                  maxLength={3}
                  selectTextOnFocus
                />
                <Text style={S.timeUnit}>min</Text>
              </View>
            </View>
          </View>

          {/* ── Ingrédients ── */}
          <View style={S.listHeader}>
            <Text style={S.label}>🧴 Ingrédients</Text>
            <Text style={S.listCount}>{ingredients.filter(i => i.trim()).length}</Text>
          </View>
          {ingredients.map((ing, i) => (
            <View key={i} style={S.listRow}>
              <View style={S.listDot} />
              <TextInput
                style={[S.input, S.listInput]}
                value={ing}
                onChangeText={v => updateIngredient(i, v)}
                placeholder={`Ingrédient ${i + 1}`}
                placeholderTextColor={Colors.warmGray}
                autoCapitalize="sentences"
                returnKeyType="next"
              />
              <TouchableOpacity
                style={S.listRemove}
                onPress={() => removeIngredient(i)}
                hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
              >
                <Ionicons name="close-circle" size={20} color={Colors.warmGray} />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={S.addRowBtn} onPress={addIngredient} activeOpacity={0.8}>
            <Ionicons name="add-circle-outline" size={18} color={Colors.sage} />
            <Text style={S.addRowText}>Ajouter un ingrédient</Text>
          </TouchableOpacity>

          {/* ── Étapes ── */}
          <View style={[S.listHeader, { marginTop: 8 }]}>
            <Text style={S.label}>📋 Étapes</Text>
            <Text style={S.listCount}>{steps.filter(s => s.trim()).length}</Text>
          </View>
          {steps.map((step, i) => (
            <View key={i} style={S.listRow}>
              <View style={S.stepNum}>
                <Text style={S.stepNumText}>{i + 1}</Text>
              </View>
              <TextInput
                style={[S.input, S.listInput, S.stepInput]}
                value={step}
                onChangeText={v => updateStep(i, v)}
                placeholder={`Étape ${i + 1}`}
                placeholderTextColor={Colors.warmGray}
                multiline
                textAlignVertical="top"
                autoCapitalize="sentences"
              />
              <TouchableOpacity
                style={S.listRemove}
                onPress={() => removeStep(i)}
                hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
              >
                <Ionicons name="close-circle" size={20} color={Colors.warmGray} />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={S.addRowBtn} onPress={addStep} activeOpacity={0.8}>
            <Ionicons name="add-circle-outline" size={18} color={Colors.sage} />
            <Text style={S.addRowText}>Ajouter une étape</Text>
          </TouchableOpacity>

          <View style={{ height: 60 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingHorizontal: 20, paddingTop: 8 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  cancelBtn:  { minWidth: 70 },
  cancelText: { fontSize: 14, fontFamily: 'DMSans_500Medium', color: Colors.warmGray },
  headerTitle: { fontSize: 16, fontFamily: 'Satoshi_500Medium', color: Colors.ink },
  saveBtn:  { minWidth: 70, alignItems: 'flex-end' },
  saveBtnDisabled: {},
  saveText: { fontSize: 14, fontFamily: 'DMSans_700Bold', color: Colors.amberDark },
  saveTextDisabled: { opacity: 0.35 },

  // Section / labels
  sectionLabel: {
    fontSize: 11, fontFamily: 'DMSans_700Bold', color: Colors.warmGray,
    letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10, marginTop: 20,
  },
  label: {
    fontSize: 13, fontFamily: 'DMSans_600SemiBold', color: Colors.ink,
    marginBottom: 8, marginTop: 20,
  },
  required: { color: Colors.rose },

  // Emoji picker
  emojiPreview: {
    width: 72, height: 72, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: 12,
  },
  emojiPreviewText: { fontSize: 40 },
  emojiScroll: { marginLeft: -20, marginRight: -20 },
  emojiRow:    { paddingHorizontal: 20, gap: 8, marginBottom: 4 },
  emojiChip: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  emojiChipActive: { borderColor: Colors.amber, borderWidth: 2 },
  emojiChipText: { fontSize: 22 },

  // Text inputs
  input: {
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, fontFamily: 'DMSans_400Regular', color: Colors.ink,
  },
  inputMulti: { minHeight: 70, paddingTop: 12 },

  // Chips
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999,
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border,
  },
  chipActive:     { backgroundColor: Colors.ink, borderColor: Colors.ink },
  chipEmoji:      { fontSize: 13 },
  chipText:       { fontSize: 13, fontFamily: 'DMSans_600SemiBold', color: Colors.warmGray },
  chipTextActive: { color: '#fff' },

  // Times
  timesRow: {
    flexDirection: 'row', gap: 12,
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: 14, padding: 16,
  },
  timeBox:   { flex: 1, alignItems: 'center', gap: 8 },
  timeSep:   { width: 1, backgroundColor: Colors.border },
  timeBoxLabel: { fontSize: 12, fontFamily: 'DMSans_600SemiBold', color: Colors.warmGray },
  timeInputRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeInput: {
    fontSize: 28, fontFamily: 'DMSans_700Bold', color: Colors.ink,
    textAlign: 'center', minWidth: 48,
    padding: 0,
  },
  timeUnit: { fontSize: 14, fontFamily: 'DMSans_500Medium', color: Colors.warmGray },

  // Dynamic lists
  listHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  listCount: {
    fontSize: 12, fontFamily: 'DMSans_500Medium', color: Colors.warmGray,
    backgroundColor: Colors.cream, borderRadius: 999,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  listRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10,
  },
  listDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.sage, marginTop: 16, flexShrink: 0,
  },
  listInput: { flex: 1 },
  listRemove: { marginTop: 10, flexShrink: 0 },

  stepNum: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: Colors.ink, alignItems: 'center', justifyContent: 'center',
    marginTop: 10, flexShrink: 0,
  },
  stepNumText: { fontSize: 12, fontFamily: 'DMSans_700Bold', color: '#fff' },
  stepInput: { minHeight: 56, paddingTop: 10 },

  addRowBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 10, paddingHorizontal: 4,
  },
  addRowText: { fontSize: 13, fontFamily: 'DMSans_600SemiBold', color: Colors.sage },
});
