import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  getOnboardingProblematics,
  getProblematicDisplayLabel,
  HAIR_PROBLEMATICS,
  MAX_HAIR_PROBLEMATICS,
  normalizeProblematicLabels,
} from '../../constants/hairProblematics';
import { Colors } from '../../theme/colors';
import { profileSectionStyles } from './profileSectionStyles';

type Props = {
  selected: string[];
  onChange: (labels: string[]) => void;
  /** Style onboarding (titre intégré à l'étape). */
  variant?: 'profile' | 'onboarding';
};

export function HairProblematicsPicker({
  selected,
  onChange,
  variant = 'profile',
}: Props) {
  const normalized = normalizeProblematicLabels(selected);
  const isOnboarding = variant === 'onboarding';
  const items = isOnboarding ? getOnboardingProblematics() : HAIR_PROBLEMATICS;
  // Seuls les items présents dans la liste actuelle comptent (ghost items du storage ignorés).
  const visibleSelected = normalized.filter(l => items.some(p => p.label === l));
  const atMax = visibleSelected.length >= MAX_HAIR_PROBLEMATICS;

  function toggle(label: string) {
    if (visibleSelected.includes(label)) {
      onChange(visibleSelected.filter(x => x !== label));
      return;
    }
    if (atMax) return;
    onChange([...visibleSelected, label]);
  }

  return (
    <View style={[styles.wrap, isOnboarding && styles.wrapOnboarding]}>
      <Text
        style={[
          styles.title,
          isOnboarding ? styles.titleOnboarding : styles.titleProfile,
        ]}
      >
        {isOnboarding ? 'Quelles sont tes problématiques ?' : 'Problématiques capillaires'}
      </Text>
      <Text
        style={[
          styles.subtitle,
          isOnboarding ? styles.subtitleOnboarding : styles.subtitleProfile,
        ]}
      >
        {isOnboarding
          ? "Sélectionne tout ce qui s'applique à tes cheveux actuellement."
          : "Sélectionne tes préoccupations pour des routines ciblées"}
      </Text>

      {isOnboarding ? (
        <Text style={[styles.counter, styles.counterOnboarding]}>
          {visibleSelected.length}/{MAX_HAIR_PROBLEMATICS} sélectionnée{visibleSelected.length > 1 ? 's' : ''}
        </Text>
      ) : null}

      {isOnboarding ? (
        <View style={styles.pillList}>
          {items.map(p => {
            const isActive = visibleSelected.includes(p.label);
            const isDisabled = atMax && !isActive;
            const display = getProblematicDisplayLabel(p);
            return (
              <TouchableOpacity
                key={p.id}
                style={[
                  styles.pill,
                  isActive && styles.pillActive,
                  isDisabled && styles.pillDisabled,
                ]}
                onPress={() => toggle(p.label)}
                disabled={isDisabled}
                activeOpacity={isDisabled ? 1 : 0.88}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
              >
                {p.emoji ? <Text style={styles.pillEmoji}>{p.emoji}</Text> : null}
                <Text style={[styles.pillLabel, isActive && styles.pillLabelActive]}>
                  {display}
                </Text>
                {isActive ? (
                  <Ionicons name="checkmark-circle" size={20} color={Colors.amber} />
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>
      ) : (
        <View style={styles.card}>
          <View style={styles.chips}>
            {items.map(p => {
              const isActive = normalized.includes(p.label);
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.chip, isActive && styles.chipActive]}
                  onPress={() => toggle(p.label)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                >
                  {p.emoji ? (
                    <Text style={styles.chipEmoji}>{p.emoji}</Text>
                  ) : (
                    <Ionicons
                      name={p.icon}
                      size={16}
                      color={isActive ? Colors.amber : Colors.warmGray}
                    />
                  )}
                  <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  wrapOnboarding: { marginBottom: 8 },
  title: {
    marginBottom: 6,
    marginHorizontal: 20,
  },
  titleProfile: {
    ...profileSectionStyles.title,
    marginBottom: 6,
  },
  titleOnboarding: {
    marginHorizontal: 0,
    fontSize: 22,
    fontFamily: 'Satoshi_500Medium',
    color: Colors.ink,
    marginBottom: 8,
  },
  subtitle: {
    marginBottom: 12,
    marginHorizontal: 20,
  },
  subtitleProfile: {
    ...profileSectionStyles.hint,
    fontSize: 13,
    lineHeight: 19,
  },
  subtitleOnboarding: {
    marginHorizontal: 0,
    marginBottom: 8,
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    lineHeight: 19,
  },
  counter: {
    marginBottom: 12,
    marginHorizontal: 20,
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
    color: Colors.amberDark,
  },
  counterOnboarding: {
    marginHorizontal: 0,
    marginBottom: 14,
  },
  pillList: { gap: 10 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  pillActive: {
    borderColor: Colors.amber,
    backgroundColor: Colors.amberLight,
  },
  pillDisabled: {
    opacity: 0.45,
  },
  pillEmoji: { fontSize: 20 },
  pillLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Satoshi_500Medium',
    color: Colors.ink,
    lineHeight: 20,
  },
  pillLabelActive: { color: Colors.amberDark },
  card: {
    marginHorizontal: 20,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: Colors.cream,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  chipActive: {
    borderColor: Colors.amber,
    backgroundColor: Colors.amberLight,
  },
  chipDisabled: {
    opacity: 0.45,
  },
  chipEmoji: { fontSize: 14 },
  chipText: {
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
    color: Colors.ink,
  },
  chipTextActive: {
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.amberDark,
  },
});
