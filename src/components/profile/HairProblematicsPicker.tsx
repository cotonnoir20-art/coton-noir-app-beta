import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  HAIR_PROBLEMATICS,
  normalizeProblematicLabels,
} from '../../constants/hairProblematics';
import { Colors } from '../../theme/colors';
import { profileSectionStyles } from './profileSectionStyles';

type Props = {
  selected: string[];
  onChange: (labels: string[]) => void;
  /** Style onboarding (titre intégré à l’étape). */
  variant?: 'profile' | 'onboarding';
};

export function HairProblematicsPicker({
  selected,
  onChange,
  variant = 'profile',
}: Props) {
  const normalized = normalizeProblematicLabels(selected);

  function toggle(label: string) {
    const next = normalized.includes(label)
      ? normalized.filter(x => x !== label)
      : [...normalized, label];
    onChange(next);
  }

  const isOnboarding = variant === 'onboarding';

  return (
    <View style={[styles.wrap, isOnboarding && styles.wrapOnboarding]}>
      <Text
        style={[
          styles.title,
          isOnboarding ? styles.titleOnboarding : styles.titleProfile,
        ]}
      >
        Problématiques capillaires
      </Text>
      <Text
        style={[
          styles.subtitle,
          isOnboarding ? styles.subtitleOnboarding : styles.subtitleProfile,
        ]}
      >
        Sélectionnez vos préoccupations pour des routines ciblées
      </Text>
      <View style={[styles.card, isOnboarding && styles.cardOnboarding]}>
        <View style={styles.chips}>
          {HAIR_PROBLEMATICS.map(p => {
            const isActive = normalized.includes(p.label);
            return (
              <TouchableOpacity
                key={p.id}
                style={[styles.chip, isActive && styles.chipActive]}
                onPress={() => toggle(p.label)}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
              >
                <Ionicons
                  name={p.icon}
                  size={16}
                  color={isActive ? Colors.amber : Colors.warmGray}
                />
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                  {p.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
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
    fontFamily: 'Poppins_700Bold',
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
    marginBottom: 16,
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    lineHeight: 19,
  },
  card: {
    marginHorizontal: 20,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
  },
  cardOnboarding: {
    marginHorizontal: 0,
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
