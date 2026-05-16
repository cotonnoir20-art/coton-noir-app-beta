import { useEffect } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

/**
 * Animation d'état vide :
 * - Emoji XL au centre qui flotte (translateY) + respire (scale).
 * - Halo doux derrière qui pulse (opacity + scale).
 *
 * À utiliser à la place du `<Text>emoji</Text>` statique dans les listes vides.
 * Voué à être remplacé un jour par un vrai Lottie sans changer les écrans :
 * mêmes props (`emoji`, `size`, `style`).
 */
export type EmptyAnimationProps = {
  emoji?: string;
  /** Taille du conteneur carré (px). Défaut 96. */
  size?: number;
  /** Couleur du halo (alpha-aware). Défaut rgba sable doux. */
  haloColor?: string;
  style?: ViewStyle | ViewStyle[];
};

export function EmptyAnimation({
  emoji = '✨',
  size = 96,
  haloColor = 'rgba(212, 130, 42, 0.12)',
  style,
}: EmptyAnimationProps) {
  const float = useSharedValue(0);
  const halo  = useSharedValue(0);

  useEffect(() => {
    float.value = withRepeat(
      withSequence(
        withTiming(1,  { duration: 1600, easing: Easing.inOut(Easing.quad) }),
        withTiming(0,  { duration: 1600, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
    halo.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 2200, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
    return () => {
      cancelAnimation(float);
      cancelAnimation(halo);
    };
  }, [float, halo]);

  const emojiStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -6 * float.value },
      { scale: 1 + 0.04 * float.value },
    ],
  }));

  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.4 + 0.6 * halo.value,
    transform: [{ scale: 0.85 + 0.2 * halo.value }],
  }));

  const fontSize = Math.round(size * 0.55);

  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Animated.View
        style={[
          {
            position: 'absolute',
            width: size * 0.85,
            height: size * 0.85,
            borderRadius: size,
            backgroundColor: haloColor,
          },
          haloStyle,
        ]}
        pointerEvents="none"
      />
      <Animated.View style={emojiStyle}>
        <Text style={[styles.emoji, { fontSize }]}>{emoji}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  emoji: {
    textAlign: 'center',
    includeFontPadding: false as unknown as boolean,
  },
});
