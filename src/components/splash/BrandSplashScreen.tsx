import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Image,
  Platform,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import LottieView from 'lottie-react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const LOGO = require('../../../assets/brand/splash-logo.png');
/** Halo vectoriel uniquement (pas d’image embarquée — compatible web). */
const GLOW_LOTTIE = require('../../../assets/animations/splash-glow.json');

/** Ratio réel du PNG splash (carré). */
const LOGO_ASPECT = 1;

const BRAND_BLACK = '#000000';
const FADE_OUT_MS = 420;
const MAX_SPLASH_MS = 3200;

type Props = {
  visible: boolean;
  onFinish: () => void;
};

export function BrandSplashScreen({ visible, onFinish }: Props) {
  const { width, height } = useWindowDimensions();
  const logoWidth = Math.min(width * 0.68, height * 0.42, 280);
  const logoHeight = logoWidth / LOGO_ASPECT;

  const [reduceMotion, setReduceMotion] = useState(false);
  const finishedRef = useRef(false);
  const lottieRef = useRef<LottieView>(null);

  const screenOpacity = useSharedValue(1);
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.9);

  const finishOnce = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onFinish();
  }, [onFinish]);

  const fadeOutAndFinish = useCallback(() => {
    screenOpacity.value = withTiming(0, { duration: FADE_OUT_MS, easing: Easing.in(Easing.cubic) }, done => {
      if (done) runOnJS(finishOnce)();
    });
  }, [finishOnce, screenOpacity]);

  const scheduleExit = useCallback(() => {
    fadeOutAndFinish();
  }, [fadeOutAndFinish]);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!visible) return;
    finishedRef.current = false;
    screenOpacity.value = 1;
    logoOpacity.value = 0;
    logoScale.value = 0.9;

    const safety = setTimeout(() => scheduleExit(), MAX_SPLASH_MS);

    if (reduceMotion) {
      logoOpacity.value = 1;
      logoScale.value = 1;
      const t = setTimeout(() => scheduleExit(), 900);
      return () => {
        clearTimeout(safety);
        clearTimeout(t);
      };
    }

    logoOpacity.value = withDelay(
      120,
      withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) }),
    );
    logoScale.value = withDelay(
      120,
      withSequence(
        withTiming(1.04, { duration: 600, easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: 280, easing: Easing.inOut(Easing.quad) }),
      ),
    );

    lottieRef.current?.reset();
    lottieRef.current?.play();

    const exitTimer = setTimeout(() => scheduleExit(), 2200);

    return () => {
      clearTimeout(safety);
      clearTimeout(exitTimer);
    };
  }, [visible, reduceMotion, logoOpacity, logoScale, scheduleExit, screenOpacity]);

  const screenStyle = useAnimatedStyle(() => ({
    opacity: screenOpacity.value,
  }));

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View
      style={[styles.screen, screenStyle]}
      pointerEvents="auto"
      accessibilityRole="image"
      accessibilityLabel="Coton Noir"
    >
      {!reduceMotion ? (
        <View style={styles.glowWrap} pointerEvents="none">
          <LottieView
            ref={lottieRef}
            source={GLOW_LOTTIE}
            autoPlay
            loop={false}
            style={styles.glowLottie}
          />
        </View>
      ) : null}

      <View style={styles.stage}>
        <Animated.View
          style={[
            logoStyle,
            styles.logoBox,
            { width: logoWidth, height: logoHeight },
          ]}
        >
          <Image
            source={LOGO}
            style={styles.logoImage}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
          />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BRAND_BLACK,
    zIndex: 9999,
    ...(Platform.OS === 'web'
      ? { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0 }
      : {}),
  },
  glowWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowLottie: {
    width: 340,
    height: 340,
  },
  stage: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBox: {
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' ? { transformOrigin: 'center center' } : {}),
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
});
