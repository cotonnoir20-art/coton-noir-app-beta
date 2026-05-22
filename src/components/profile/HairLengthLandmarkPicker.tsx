import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../theme/colors';
import { HAIR_LENGTH_LANDMARKS } from '../../constants/hairLengthLandmarks';
import { profileSectionStyles } from './profileSectionStyles';

type Props = {
  title: string;
  value: string;
  onChange: (landmark: string) => void;
  optional?: boolean;
  variant?: 'profile' | 'onboarding';
};

export function HairLengthLandmarkPicker({
  title,
  value,
  onChange,
  optional,
  variant = 'onboarding',
}: Props) {
  const isProfile = variant === 'profile';

  return (
    <View style={styles.wrap}>
      <Text
        style={[
          styles.title,
          isProfile && styles.titleProfile,
          !isProfile && styles.titleOnboarding,
        ]}
      >
        {title}
        {optional ? (
          <Text style={isProfile ? styles.optionalProfile : styles.optionalOnboarding}>
            {' '}(optionnel)
          </Text>
        ) : null}
      </Text>
      <View style={styles.card}>
        <View style={styles.grid}>
          {HAIR_LENGTH_LANDMARKS.map(label => {
            const isActive = value === label;
            return (
              <TouchableOpacity
                key={label}
                style={[styles.cell, isActive && styles.cellActive]}
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
  title: {
    marginBottom: 10,
    marginHorizontal: 20,
  },
  titleProfile: {
    ...profileSectionStyles.title,
  },
  titleOnboarding: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: Colors.ink,
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
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
