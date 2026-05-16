import { useEffect, useMemo } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Colors } from '../../theme/colors';
import { useApp } from '../../context/AppContext';

const CONFETTI_COLORS = [
  '#F4A14B', // amber
  '#FF6B9D', // rose
  '#7ED4A0', // sage
  '#9370DB', // purple
  '#FFD93D', // yellow
  '#4FC3F7', // cyan
];

type ConfettiProps = {
  /** Position de départ X (0..1) sur la largeur. */
  startX: number;
  /** Couleur. */
  color: string;
  /** Délai avant lancement. */
  delay: number;
  /** Hauteur écran (fall target). */
  height: number;
  /** Forme (cercle | rectangle). */
  shape: 'circle' | 'rect';
};

function Confetti({ startX, color, delay, height, shape }: ConfettiProps) {
  const t = useSharedValue(0);

  useEffect(() => {
    t.value = 0;
    t.value = withDelay(
      delay,
      withTiming(1, { duration: 2600, easing: Easing.in(Easing.cubic) }),
    );
    return () => cancelAnimation(t);
  }, [t, delay]);

  const aStyle = useAnimatedStyle(() => {
    // Trajectoire : descente avec léger drift horizontal.
    const driftAmp = 40;
    const drift = Math.sin(t.value * Math.PI * 3) * driftAmp;
    const rotation = t.value * 360 * (shape === 'rect' ? 2 : 1);
    return {
      opacity: 1 - Math.max(0, t.value - 0.8) * 5, // fade out fin de trajet
      transform: [
        { translateX: drift },
        { translateY: t.value * (height + 80) },
        { rotate: `${rotation}deg` },
      ],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.confettiBase,
        {
          left: `${Math.round(startX * 100)}%`,
          backgroundColor: color,
          width: shape === 'rect' ? 6 : 8,
          height: shape === 'rect' ? 12 : 8,
          borderRadius: shape === 'rect' ? 1.5 : 8,
        },
        aStyle,
      ]}
    />
  );
}

/**
 * Modale plein écran déclenchée quand l'utilisatrice passe au niveau supérieur.
 * Branchée sur `useApp().pendingLevelUp` / `dismissLevelUp` (cf. AppContext).
 */
export function LevelUpCelebration() {
  const { pendingLevelUp, dismissLevelUp } = useApp();
  const { height } = useWindowDimensions();
  const visible = !!pendingLevelUp;

  const badgeScale = useSharedValue(0);
  const badgeRot   = useSharedValue(0);
  const titleFade  = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;
    badgeScale.value = 0;
    badgeRot.value   = 0;
    titleFade.value  = 0;
    badgeScale.value = withSpring(1, { damping: 8, stiffness: 110, mass: 0.8 });
    badgeRot.value   = withSequence(
      withTiming(-8, { duration: 220, easing: Easing.out(Easing.quad) }),
      withRepeat(
        withSequence(
          withTiming(6,  { duration: 360, easing: Easing.inOut(Easing.sin) }),
          withTiming(-6, { duration: 360, easing: Easing.inOut(Easing.sin) }),
        ),
        4,
        true,
      ),
      withTiming(0, { duration: 240, easing: Easing.inOut(Easing.quad) }),
    );
    titleFade.value = withDelay(180, withTiming(1, { duration: 380 }));
  }, [visible, badgeScale, badgeRot, titleFade]);

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: badgeScale.value },
      { rotate: `${badgeRot.value}deg` },
    ],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleFade.value,
    transform: [{ translateY: (1 - titleFade.value) * 12 }],
  }));

  const confetti = useMemo(() => {
    if (!visible) return [];
    return Array.from({ length: 24 }, (_, i) => ({
      key:    `c-${i}-${pendingLevelUp?.id}`,
      startX: Math.random(),
      color:  CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      delay:  Math.round(Math.random() * 700),
      shape:  (i % 3 === 0 ? 'rect' : 'circle') as 'circle' | 'rect',
    }));
    // On régénère à chaque niveau atteint
  }, [visible, pendingLevelUp?.id]);

  if (!visible || !pendingLevelUp) return null;
  const level = pendingLevelUp;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={dismissLevelUp}
      statusBarTranslucent
    >
      <View style={styles.root}>
        <LinearGradient
          colors={['rgba(0,0,0,0.78)', 'rgba(0,0,0,0.92)']}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Confettis */}
        {confetti.map(c => (
          <Confetti
            key={c.key}
            startX={c.startX}
            color={c.color}
            delay={c.delay}
            height={height}
            shape={c.shape}
          />
        ))}

        {/* Carte centrale */}
        <View style={styles.center}>
          <Animated.View style={[styles.badgeWrap, badgeStyle]}>
            <LinearGradient
              colors={[level.color, '#1A1209']}
              start={{ x: 0.2, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.badgeCircle}
            >
              <Text style={styles.badgeEmoji}>{level.emoji}</Text>
            </LinearGradient>
          </Animated.View>

          <Animated.View style={titleStyle}>
            <Text style={styles.kicker}>NIVEAU {level.id} DÉBLOQUÉ</Text>
            <Text style={styles.title}>{level.name}</Text>
            <Text style={styles.subtitle}>{level.desc}</Text>

            <View style={styles.benefitCard}>
              <Text style={styles.benefitLabel}>TON CADEAU</Text>
              <Text style={styles.benefitText}>{level.benefit}</Text>
            </View>

            <Pressable
              style={styles.cta}
              onPress={dismissLevelUp}
              accessibilityRole="button"
              accessibilityLabel="Continuer après célébration niveau"
            >
              <Text style={styles.ctaText}>Continuer ✨</Text>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    overflow: 'hidden',
  },
  confettiBase: {
    position: 'absolute',
    top: -16,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  badgeWrap: {
    marginBottom: 22,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  badgeCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  badgeEmoji: {
    fontSize: 72,
    includeFontPadding: false as unknown as boolean,
  },
  kicker: {
    fontSize: 11,
    fontFamily: 'DMSans_700Bold',
    color: Colors.amber,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Poppins_700Bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    marginBottom: 22,
  },
  benefitCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 22,
    alignItems: 'center',
  },
  benefitLabel: {
    fontSize: 10,
    fontFamily: 'DMSans_700Bold',
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  benefitText: {
    fontSize: 15,
    fontFamily: 'DMSans_600SemiBold',
    color: '#fff',
    textAlign: 'center',
  },
  cta: {
    backgroundColor: Colors.amber,
    borderRadius: 999,
    paddingHorizontal: 28,
    paddingVertical: 14,
    alignSelf: 'center',
  },
  ctaText: {
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
    color: Colors.ink,
  },
});
