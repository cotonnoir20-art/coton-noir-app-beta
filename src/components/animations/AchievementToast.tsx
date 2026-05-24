import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Colors } from '../../theme/colors';
import { useAchievements } from '../../context/AchievementsContext';
import { getAchievementCta } from '../../data/achievementCtas';

const AUTO_DISMISS_MS = 5500;

/**
 * Toast plein-largeur affiché en haut de l'écran quand un badge est débloqué.
 * Propose un CTA contextuel (progression, parrainage, etc.).
 */
export function AchievementToast() {
  const router = useRouter();
  const { pending, dismissCurrent } = useAchievements();
  const insets = useSafeAreaInsets();
  const visible = !!pending;

  const translateY = useSharedValue(-120);
  const scale      = useSharedValue(0.96);
  const opacity    = useSharedValue(0);
  const haloPulse  = useSharedValue(0);

  const cta = pending ? getAchievementCta(pending) : null;

  useEffect(() => {
    if (!visible) return;

    translateY.value = -120;
    scale.value      = 0.96;
    opacity.value    = 0;
    haloPulse.value  = 0;

    translateY.value = withSpring(0, { damping: 14, stiffness: 140, mass: 0.7 });
    scale.value      = withSpring(1, { damping: 12, stiffness: 160, mass: 0.6 });
    opacity.value    = withTiming(1, { duration: 220, easing: Easing.out(Easing.quad) });
    haloPulse.value  = withDelay(
      200,
      withSequence(
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.6, { duration: 600, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.6, { duration: 600, easing: Easing.inOut(Easing.quad) }),
      ),
    );

    const t = setTimeout(() => {
      translateY.value = withTiming(-140, { duration: 260, easing: Easing.in(Easing.quad) });
      opacity.value    = withTiming(0, { duration: 220, easing: Easing.in(Easing.quad) });
      setTimeout(dismissCurrent, 240);
    }, AUTO_DISMISS_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending?.id]);

  const aStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + 0.45 * haloPulse.value,
    transform: [{ scale: 0.9 + 0.15 * haloPulse.value }],
  }));

  function onCtaPress() {
    if (!cta) return;
    dismissCurrent();
    router.push(cta.route as any);
  }

  if (!visible || !pending) return null;

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        { top: insets.top + 8 },
        aStyle,
      ]}
    >
      <View style={styles.toast}>
        <LinearGradient
          colors={[Colors.ink, '#1A1209']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />

        <Pressable
          style={styles.mainRow}
          onPress={dismissCurrent}
          accessibilityRole="button"
          accessibilityLabel={`Badge débloqué : ${pending.name}. Toucher pour fermer.`}
        >
          <View style={styles.emojiWrap}>
            <Animated.View style={[styles.halo, haloStyle]} />
            <Text style={styles.emoji}>{pending.emoji}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.kicker}>BADGE DÉBLOQUÉ</Text>
            <Text style={styles.title} numberOfLines={1}>{pending.name}</Text>
            <Text style={styles.desc} numberOfLines={2}>{pending.desc}</Text>
          </View>

          <Text style={styles.close}>✕</Text>
        </Pressable>

        {cta ? (
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={onCtaPress}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel={cta.label}
          >
            <Text style={styles.ctaText}>{cta.label} →</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 9999,
    elevation: 12,
  },
  toast: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.32,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 10,
  },
  emojiWrap: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.amber,
  },
  emoji: {
    fontSize: 28,
    includeFontPadding: false as unknown as boolean,
  },
  kicker: {
    fontSize: 10,
    fontFamily: 'DMSans_700Bold',
    color: Colors.amber,
    letterSpacing: 1.6,
    marginBottom: 2,
  },
  title: {
    fontSize: 15,
    fontFamily: 'Satoshi_500Medium',
    color: '#fff',
  },
  desc: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(255,255,255,0.72)',
    marginTop: 2,
  },
  close: {
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
    color: 'rgba(255,255,255,0.55)',
    paddingHorizontal: 4,
  },
  ctaBtn: {
    marginHorizontal: 12,
    marginBottom: 12,
    backgroundColor: Colors.amber,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  ctaText: {
    fontSize: 13,
    fontFamily: 'DMSans_700Bold',
    color: Colors.ink,
  },
});
