import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/theme/colors';
import { useApp } from '../src/context/AppContext';
import { AppHeader } from '../src/components/AppHeader';
import { HAIR_OBJECTIVES, normalizeObjectiveId } from '../src/constants/hairObjectives';
import { CARE_STYLES } from '../src/constants/careStyles';

type OptionGroup = { key: string; label: string; options: string[] };

const HAIR_GROUPS: OptionGroup[] = [
  { key: 'hairType', label: 'Type de cheveux', options: ['3A', '3B', '3C', '4A', '4B', '4C'] },
  { key: 'porosity', label: 'Porosité',         options: ['Basse', 'Moyenne', 'Haute'] },
  { key: 'density',  label: 'Densité',           options: ['Fine', 'Moyenne', 'Épaisse'] },
  { key: 'routineType', label: 'Style de routine', options: ['Minimaliste', 'Standard', 'Intensive'] },
];

const PROBLEMATICS = [
  'Casse', 'Sécheresse', 'Pellicules', 'Nœuds', 'Fourches', 'Rétraction',
];

export default function HairProfileScreen() {
  const router = useRouter();
  const { state, dispatch } = useApp();
  const { profile } = state;

  const [localProfile, setLocalProfile] = useState(() => ({
    ...profile,
    objective: normalizeObjectiveId(profile.objective ?? ''),
  }));
  const [saved, setSaved] = useState(false);

  function setValue(key: string, value: string) {
    setLocalProfile(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function toggleProblematic(p: string) {
    const current = localProfile.problematics ?? [];
    const updated = current.includes(p) ? current.filter(x => x !== p) : [...current, p];
    setLocalProfile(prev => ({ ...prev, problematics: updated }));
    setSaved(false);
  }

  function handleSave() {
    dispatch({ type: 'updateProfile', payload: localProfile });
    setSaved(true);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Header */}
      <AppHeader
        title="Profil Capillaire"
        rightAction="custom"
        rightSlot={
          <TouchableOpacity
            onPress={handleSave}
            style={styles.saveBtn}
            accessibilityRole="button"
            accessibilityLabel={saved ? 'Enregistré' : 'Enregistrer le profil'}
          >
            <Text style={styles.saveBtnText}>{saved ? '✓' : 'Sauver'}</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Name + length */}
        <View style={styles.fieldCard}>
          <Text style={styles.fieldLabel}>Ton prénom</Text>
          <TextInput
            style={styles.textInput}
            value={localProfile.name}
            onChangeText={v => setValue('name', v)}
            placeholder="Prénom"
            placeholderTextColor={Colors.warmGray}
          />
          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Longueur (cm)</Text>
          <TextInput
            style={styles.textInput}
            value={localProfile.length}
            onChangeText={v => setValue('length', v)}
            keyboardType="decimal-pad"
            placeholder="ex: 32"
            placeholderTextColor={Colors.warmGray}
          />
        </View>

        {/* Option groups */}
        {HAIR_GROUPS.map(group => (
          <View key={group.key} style={styles.groupCard}>
            <Text style={styles.groupLabel}>{group.label}</Text>
            <View style={styles.optionsRow}>
              {group.options.map(opt => {
                const isActive = localProfile[group.key as keyof typeof localProfile] === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.optionPill, isActive && styles.optionPillActive]}
                    onPress={() => setValue(group.key, opt)}
                  >
                    <Text style={[styles.optionText, isActive && styles.optionTextActive]}>
                      {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        {/* Objective */}
        <View style={styles.groupCard}>
          <Text style={styles.groupLabel}>Objectif principal</Text>
          <View style={styles.optionsRow}>
            {HAIR_OBJECTIVES.map(o => {
              const isActive = localProfile.objective === o.id;
              return (
                <TouchableOpacity
                  key={o.id}
                  style={[styles.optionPill, isActive && styles.optionPillActive]}
                  onPress={() => setValue('objective', o.id)}
                >
                  <Text style={[styles.optionText, isActive && styles.optionTextActive]}>
                    {o.emoji} {o.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Care style — produit commerce / DIY / mixte */}
        <View style={styles.groupCard}>
          <Text style={styles.groupLabel}>Préférence de soin</Text>
          <Text style={styles.groupHint}>
            On adapte les recommandations en conséquence.
          </Text>
          {CARE_STYLES.map(c => {
            const isActive = (localProfile.careStyle ?? '') === c.id;
            return (
              <TouchableOpacity
                key={c.id}
                style={[styles.careCard, isActive && styles.careCardActive]}
                onPress={() => setValue('careStyle', c.id)}
              >
                <Text style={styles.careEmoji}>{c.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.careLabel, isActive && styles.careLabelActive]}>
                    {c.label}
                  </Text>
                  <Text style={styles.careDesc}>{c.desc}</Text>
                </View>
                {isActive && (
                  <Ionicons name="checkmark-circle" size={22} color={Colors.amber} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Problematics */}
        <View style={styles.groupCard}>
          <Text style={styles.groupLabel}>Problématiques (plusieurs possibles)</Text>
          <View style={styles.optionsRow}>
            {PROBLEMATICS.map(p => {
              const isActive = (localProfile.problematics ?? []).includes(p);
              return (
                <TouchableOpacity
                  key={p}
                  style={[styles.optionPill, isActive && styles.optionPillRose]}
                  onPress={() => toggleProblematic(p)}
                >
                  <Text style={[styles.optionText, isActive && styles.optionTextActive]}>
                    {p}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Target length */}
        <View style={styles.fieldCard}>
          <Text style={styles.fieldLabel}>Longueur cible (cm)</Text>
          <TextInput
            style={styles.textInput}
            value={localProfile.targetLength ?? ''}
            onChangeText={v => setValue('targetLength', v)}
            keyboardType="decimal-pad"
            placeholder="ex: 50"
            placeholderTextColor={Colors.warmGray}
          />
        </View>

        {/* Save button */}
        <TouchableOpacity style={styles.saveBigBtn} onPress={handleSave}>
          <Text style={styles.saveBigBtnText}>
            {saved ? '✅ Profil sauvegardé' : 'Sauvegarder le profil'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 20, fontFamily: 'Poppins_700Bold', color: Colors.ink },
  saveBtn: {
    backgroundColor: Colors.amber,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  saveBtnText: { fontSize: 14, fontFamily: 'DMSans_600SemiBold', color: Colors.white },

  fieldCard: {
    marginHorizontal: 20,
    marginBottom: 14,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.warmGray,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: Colors.cream,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'DMSans_500Medium',
    color: Colors.ink,
  },

  groupCard: {
    marginHorizontal: 20,
    marginBottom: 14,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
  },
  groupLabel: {
    fontSize: 14,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.ink,
    marginBottom: 12,
  },
  groupHint: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    marginTop: -8,
    marginBottom: 12,
    lineHeight: 17,
  },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Colors.cream,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  optionPillActive: { borderColor: Colors.amber, backgroundColor: Colors.amberLight },
  optionPillRose: { borderColor: Colors.rose, backgroundColor: Colors.blush },
  optionText: { fontSize: 13, fontFamily: 'DMSans_500Medium', color: Colors.warmGray },
  optionTextActive: { color: Colors.ink, fontFamily: 'DMSans_600SemiBold' },

  // ── Care style cards (verticales, type onboarding) ──
  careCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: Colors.cream,
    borderWidth: 1.5,
    borderColor: 'transparent',
    marginBottom: 8,
  },
  careCardActive: {
    borderColor: Colors.amber,
    backgroundColor: Colors.amberLight,
  },
  careEmoji: { fontSize: 26 },
  careLabel: {
    fontSize: 14,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.ink,
    marginBottom: 2,
  },
  careLabelActive: { fontFamily: 'DMSans_700Bold' },
  careDesc: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    lineHeight: 16,
  },

  saveBigBtn: {
    marginHorizontal: 20,
    marginTop: 8,
    backgroundColor: Colors.amber,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  saveBigBtnText: { fontSize: 16, fontFamily: 'DMSans_700Bold', color: Colors.white },
});
