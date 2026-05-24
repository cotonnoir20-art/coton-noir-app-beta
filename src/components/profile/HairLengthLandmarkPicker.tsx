import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../theme/colors';
import { HAIR_LENGTH_LANDMARKS } from '../../constants/hairLengthLandmarks';
import { profileSectionStyles } from './profileSectionStyles';

/** Padding horizontal du contenu onboarding (`onboarding.tsx` → `S.content`). */
const ONBOARDING_CONTENT_PAD = 24;

type Props = {
  title: string;
  value: string;
  onChange: (landmark: string) => void;
  optional?: boolean;
  variant?: 'profile' | 'onboarding';
  /** Pleine largeur écran (onboarding principal uniquement). */
  edgeToEdge?: boolean;
};

export function HairLengthLandmarkPicker({
  title,
  value,
  onChange,
  optional,
  variant = 'onboarding',
  edgeToEdge = false,
}: Props) {
  const isProfile = variant === 'profile';
  const fullWidth = edgeToEdge && !isProfile;
  const lastIndex = HAIR_LENGTH_LANDMARKS.length - 1;
  const oddCount = HAIR_LENGTH_LANDMARKS.length % 2 === 1;

  return (
    <View style={[styles.wrap, fullWidth && styles.wrapOnboarding]}>
      <Text
        style={[
          styles.title,
          isProfile && styles.titleProfile,
          !isProfile && styles.titleOnboarding,
          fullWidth && styles.titleOnboardingBleed,
        ]}
      >
        {title}
        {optional ? (
          <Text style={isProfile ? styles.optionalProfile : styles.optionalOnboarding}>
            {' '}(optionnel)
          </Text>
        ) : null}
      </Text>
      <View style={[styles.card, fullWidth && styles.cardOnboarding]}>
        <View style={styles.grid}>
          {HAIR_LENGTH_LANDMARKS.map((label, index) => {
            const isActive = value === label;
            const isFullWidth = fullWidth && oddCount && index === lastIndex;
            return (
              <TouchableOpacity
                key={label}
                style={[
                  styles.cell,
                  fullWidth && styles.cellOnboarding,
                  isFullWidth && styles.cellFullWidth,
                  isActive && styles.cellActive,
                ]}
                onPress={() => onChange(isActive ? '' : label)}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
              >
                <Text style={[styles.cellText, isActive && styles.cellTextActive]}>{label}</Text>
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
  wrapOnboarding: {
    marginHorizontal: -ONBOARDING_CONTENT_PAD,
  },
  title: {
    marginBottom: 10,
    marginHorizontal: 20,
  },
  titleProfile: {
    ...profileSectionStyles.title,
  },
  titleOnboarding: {
    marginHorizontal: 0,
    fontSize: 18,
    fontFamily: 'Satoshi_500Medium',
    color: Colors.ink,
  },
  titleOnboardingBleed: {
    marginHorizontal: ONBOARDING_CONTENT_PAD,
  },
  optionalProfile: profileSectionStyles.optional,
  optionalOnboarding: {
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
  },
  card: {
    marginHorizontal: 20,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.cream,
    padding: 12,
  },
  cardOnboarding: {
    marginHorizontal: 0,
    borderRadius: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    paddingHorizontal: ONBOARDING_CONTENT_PAD,
    paddingVertical: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    width: '100%',
  },
  cell: {
    width: '47%',
    flexGrow: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: Colors.cream,
    borderWidth: 1.5,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  cellOnboarding: {
    width: undefined,
    flexBasis: '48%',
    flexGrow: 1,
    maxWidth: '48%',
  },
  cellFullWidth: {
    flexBasis: '100%',
    maxWidth: '100%',
  },
  cellActive: {
    borderColor: Colors.amber,
    backgroundColor: Colors.amberLight,
  },
  cellText: {
    fontSize: 14,
    fontFamily: 'DMSans_500Medium',
    color: Colors.warmGray,
    textAlign: 'center',
  },
  cellTextActive: {
    color: Colors.amber,
    fontFamily: 'DMSans_600SemiBold',
  },
});
