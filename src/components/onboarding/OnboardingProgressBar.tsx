import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../theme/colors';

type Props = {
  step: number;
  total: number;
  optional?: boolean;
  /** Affiché à gauche (ex. durée estimée). */
  durationLabel?: string;
  /** Avatar coach en haut à droite (masqué sur la page plan si doublon). */
  showCoachAvatar?: boolean;
};

export function OnboardingProgressBar({
  step,
  total,
  optional,
  durationLabel = '~3 min',
  showCoachAvatar = true,
}: Props) {
  const progress = total > 0 ? Math.min(1, (step + 1) / total) : 0;

  return (
    <View style={s.wrap}>
      <View style={s.row}>
        <View style={s.left}>
          <Text style={s.duration}>{durationLabel}</Text>
          {optional ? (
            <View style={s.optionalBadge}>
              <Text style={s.optionalBadgeText}>OPTIONNEL</Text>
            </View>
          ) : null}
        </View>
        <View style={s.right}>
          {showCoachAvatar ? (
            <View style={s.avatarRing}>
              <Image
                source={require('../../../assets/welcome-avatar.png')}
                style={s.avatar}
                contentFit="cover"
                accessibilityLabel="Black Cotton, ta coach capillaire"
              />
            </View>
          ) : null}
        </View>
      </View>
      <View style={s.track}>
        <View style={[s.fill, { width: `${Math.round(progress * 100)}%` }]} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  duration: {
    fontSize: 12,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.warmGray,
    letterSpacing: 0.2,
  },
  optionalBadge: {
    backgroundColor: Colors.amberLight,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  optionalBadgeText: {
    fontSize: 9,
    fontFamily: 'DMSans_700Bold',
    color: Colors.amberDark,
    letterSpacing: 1.1,
  },
  right: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
  },
  avatarRing: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: Colors.amberLight,
  },
  avatar: {
    width: 36,
    height: 36,
  },
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: Colors.amber,
  },
});
