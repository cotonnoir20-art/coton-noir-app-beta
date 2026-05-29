import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '../../theme/colors';
import { Fonts } from '../../theme/typography';

const STEPS = [
  'Cartographie de ta texture',
  'Analyse structurelle capillaire',
  'Détection de ta porosité',
  'Évaluation de ton état de santé',
  'Estimation de la densité',
  'Construction de ton profil',
] as const;

const STEP_MS = 880;
const RING_SIZE = 180;

// 6 dots symétriques autour de l'anneau (rayon 75 depuis le centre 90,90)
const DOT_POSITIONS = [
  { x: 124, y: 21  }, // 30°
  { x: 161, y: 82  }, // 90°
  { x: 124, y: 151 }, // 150°
  { x: 49,  y: 151 }, // 210°
  { x: 11,  y: 82  }, // 270°
  { x: 49,  y: 21  }, // 330°
] as const;

type Props = {
  apiDone: boolean;
  onComplete: () => void;
};

export function ScanAnalyzingOverlay({ apiDone, onComplete }: Props) {
  const insets = useSafeAreaInsets();
  const [ticked, setTicked]     = useState(0);
  const [animDone, setAnimDone] = useState(false);

  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const doneRef = useRef(false);
  function safeComplete() {
    if (doneRef.current) return;
    doneRef.current = true;
    onCompleteRef.current();
  }

  // Tick les étapes une par une
  useEffect(() => {
    let cancelled = false;
    function tick(n: number) {
      if (cancelled) return;
      setTicked(n);
      if (n < STEPS.length) {
        setTimeout(() => tick(n + 1), STEP_MS);
      } else {
        setAnimDone(true);
      }
    }
    const t = setTimeout(() => tick(1), STEP_MS);
    return () => { cancelled = true; clearTimeout(t); };
  }, []);

  // Animation terminée + API terminée → avancer
  useEffect(() => {
    if (!animDone || !apiDone) return;
    const t = setTimeout(safeComplete, 400);
    return () => clearTimeout(t);
  }, [animDone, apiDone]);

  // Sécurité : si l'API ne répond pas dans les 15 s, avancer quand même
  useEffect(() => {
    if (!animDone) return;
    const t = setTimeout(safeComplete, 15_000);
    return () => clearTimeout(t);
  }, [animDone]);

  // Arc tournant
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1800,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);
  const rotateDeg = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const pct = Math.min(100, Math.round((ticked / STEPS.length) * 100));

  return (
    <View style={[StyleSheet.absoluteFillObject, s.root, { paddingTop: insets.top + 32 }]}>

      {/* Anneau animé */}
      <View style={s.ringWrap}>
        {DOT_POSITIONS.map((d, i) => (
          <View
            key={i}
            style={[s.dot, { top: d.y, left: d.x, opacity: i < ticked ? 0.9 : 0.2 }]}
          />
        ))}
        <View style={s.ringBg} />
        <Animated.View style={[s.arc, { transform: [{ rotate: rotateDeg }] }]} />
        <View style={s.centerCircle}>
          <Ionicons name="sparkles" size={28} color={Colors.amber} />
        </View>
      </View>

      <Text style={s.title}>Analyse en cours…</Text>
      <Text style={s.subtitle}>
        On cartographie ta texture, ta porosité{'\n'}et l'état général de tes cheveux.
      </Text>

      <View style={s.stepList}>
        {STEPS.map((label, i) => {
          const done   = i < ticked;
          const active = i === ticked && !animDone;
          return (
            <View key={label} style={s.stepRow}>
              <View style={[s.bullet, done && s.bulletDone]}>
                {done   && <Ionicons name="checkmark" size={12} color="#1C1210" />}
                {active && <ActivityIndicator size="small" color={Colors.amber} />}
              </View>
              <Text style={[s.stepLabel, done && s.stepDone, active && s.stepActive]}>
                {label}
              </Text>
            </View>
          );
        })}
      </View>

      <Text style={s.pct}>{pct} % complété</Text>

      {animDone && !apiDone && (
        <Text style={s.waitingMsg}>Finalisation en cours…</Text>
      )}

    </View>
  );
}

const s = StyleSheet.create({
  root: {
    backgroundColor: '#1C1210',
    alignItems: 'center',
    paddingHorizontal: 28,
    zIndex: 200,
  },

  /* ── Anneau ─────────────────────────────────────────────── */
  ringWrap: {
    width: RING_SIZE,
    height: RING_SIZE,
    marginBottom: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.amber,
  },
  ringBg: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 2.5,
    borderColor: 'rgba(244, 148, 35, 0.18)',
  },
  arc: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 2.5,
    borderColor: 'transparent',
    borderTopColor: Colors.amber,
    borderRightColor: Colors.amber,
  },
  centerCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(61, 42, 34, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(244, 148, 35, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Texte ──────────────────────────────────────────────── */
  title: {
    fontSize: 24,
    fontFamily: Fonts.display,
    color: '#F5EDD8',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: Fonts.body,
    color: 'rgba(245, 237, 216, 0.6)',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 32,
  },

  /* ── Étapes ─────────────────────────────────────────────── */
  stepList: {
    alignSelf: 'stretch',
    gap: 12,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bullet: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(61, 42, 34, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(244, 148, 35, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  bulletDone: {
    backgroundColor: Colors.amber,
    borderColor: Colors.amber,
  },
  stepLabel: {
    fontSize: 14,
    fontFamily: Fonts.bodyMedium,
    color: 'rgba(245, 237, 216, 0.3)',
  },
  stepActive: {
    color: '#F5EDD8',
  },
  stepDone: {
    color: 'rgba(245, 237, 216, 0.8)',
  },

  /* ── Progression ────────────────────────────────────────── */
  pct: {
    marginTop: 28,
    fontSize: 13,
    fontFamily: Fonts.bodyMedium,
    color: 'rgba(245, 237, 216, 0.4)',
    letterSpacing: 0.3,
  },
  waitingMsg: {
    marginTop: 8,
    fontSize: 12,
    fontFamily: Fonts.body,
    color: Colors.amber,
  },
});
