import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { buildConicSweepSegments } from '../../lib/ringSweepPaths';
import { getHealthScoreColors } from '../../lib/homeGrowth';
import { Colors } from '../../theme/colors';
import { FontDisplay } from '../../theme/typography';

type Props = {
  hairType: string;
  currentCm: number;
  targetCm: number;
  monthDeltaCm: number | null;
  progress01: number;
  hasMeasurements: boolean;
  /** Suffixe objectif (ex. « déc. 2026 »). */
  goalHorizonLabel?: string;
  /** Texte optionnel (ex. source profil). */
  hint?: string | null;
  /** Score santé capillaire 0–100 (écran Progrès). */
  healthScore?: number | null;
  /** Clic sur l’anneau (ex. ouvrir Progrès). */
  onRingPress?: () => void;
  onEmptyPress?: () => void;
};

const RING_SIZE = 288;
const RING_STROKE = 17;
const SWEEP_SEGMENTS = 48;
const KNOB = 32;

export function HomeLengthRing({
  hairType,
  currentCm,
  targetCm,
  monthDeltaCm,
  progress01,
  hasMeasurements,
  goalHorizonLabel,
  hint,
  healthScore,
  onRingPress,
  onEmptyPress,
}: Props) {
  const size = RING_SIZE;
  const stroke = RING_STROKE;
  const r = (size - stroke) / 2;
  const p = Math.min(1, Math.max(0, progress01));

  const sweep = useMemo(
    () => buildConicSweepSegments(size, stroke, SWEEP_SEGMENTS),
    [size, stroke],
  );

  const theta = -Math.PI / 2 + p * 2 * Math.PI;
  const cx = size / 2;
  const cy = size / 2;
  const knobLeft = cx + r * Math.cos(theta) - KNOB / 2;
  const knobTop = cy + r * Math.sin(theta) - KNOB / 2;

  const deltaLabel =
    monthDeltaCm == null
      ? null
      : monthDeltaCm >= 0
        ? `↑ +${String(monthDeltaCm).replace('.', ',')} cm ce mois`
        : `↓ ${String(monthDeltaCm).replace('.', ',')} cm ce mois`;

  const cmDisplay = hasMeasurements ? String(currentCm).replace('.', ',') : '—';
  const cmParts = cmDisplay.includes(',') ? cmDisplay.split(',') : [cmDisplay, null];

  const goalLine =
    goalHorizonLabel != null && goalHorizonLabel.length > 0
      ? `Objectif ${targetCm} cm · ${goalHorizonLabel}`
      : `Objectif ${targetCm} cm`;

  const healthColors = getHealthScoreColors(healthScore ?? null);

  const growthChip =
    monthDeltaCm == null
      ? null
      : monthDeltaCm >= 0
        ? { bg: Colors.growthLight, text: Colors.growthDark }
        : { bg: Colors.alertLight, text: Colors.alertDark };

  return (
    <View style={s.wrap}>
      <Pressable
        style={[s.ringOuter, Platform.OS === 'web' ? s.ringOuterWeb : s.ringOuterNative, { width: size, height: size }]}
        onPress={onRingPress}
        disabled={!onRingPress}
        accessibilityRole={onRingPress ? 'button' : undefined}
        accessibilityLabel={onRingPress ? 'Voir la progression et les mesures' : undefined}
      >
        <View style={[s.ringCanvas, { width: size, height: size }]}>
          <Svg width={size} height={size} style={s.ringSvg}>
            {sweep.map((seg, i) => (
              <Path
                key={i}
                d={seg.d}
                stroke={seg.stroke}
                strokeWidth={stroke}
                strokeLinecap="round"
                fill="none"
              />
            ))}
          </Svg>
          <View
            pointerEvents="none"
            style={[
              s.knob,
              {
                left: knobLeft,
                top: knobTop,
                width: KNOB,
                height: KNOB,
                borderRadius: KNOB / 2,
              },
            ]}
          >
            <Ionicons name="star" size={14} color={Colors.amber} />
          </View>
          <View style={[s.inner, { width: size, height: size }]}>
            <Text style={s.kicker}>LONGUEUR - {hairType || '—'}</Text>
            {hasMeasurements ? (
              <Text style={s.cmRow}>
                <Text style={s.cmNum}>{cmParts[0]}</Text>
                {cmParts[1] != null ? (
                  <Text style={s.cmNum}>,{cmParts[1]}</Text>
                ) : null}
                <Text style={s.cmUnit}> cm</Text>
              </Text>
            ) : (
              <Text style={s.emptyCm}>—</Text>
            )}
            <View style={[s.healthPill, { backgroundColor: healthColors.bg }]}>
              <Text style={[s.healthLabel, { color: healthColors.muted }]}>Santé</Text>
              <Text style={[s.healthScore, { color: healthColors.value }]}>
                {healthScore != null ? healthScore : '—'}
                <Text style={[s.healthScoreMuted, { color: healthColors.muted, opacity: 0.75 }]}>
                  /100
                </Text>
              </Text>
            </View>
            <Text style={s.goal}>{goalLine}</Text>
            {hint ? <Text style={s.hint}>{hint}</Text> : null}
            {deltaLabel && growthChip ? (
              <View style={[s.deltaPill, { backgroundColor: growthChip.bg }]}>
                <Text style={[s.deltaPillText, { color: growthChip.text }]}>{deltaLabel}</Text>
              </View>
            ) : null}
            {!hasMeasurements && onEmptyPress ? (
              <Pressable onPress={onEmptyPress} hitSlop={8}>
                <Text style={s.hintTap}>Ajouter une mesure →</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: 'center', marginBottom: 20 },
  ringOuter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  /** iOS / Android : ombre douce sous l’anneau */
  ringOuterNative: {
    shadowColor: '#2C1810',
    shadowOpacity: 0.14,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  /**
   * Web/PWA : shadow* sur un View carré force un fond opaque (carré visible).
   * Fond transparent ; l’anneau SVG porte un léger drop-shadow CSS.
   */
  ringOuterWeb: {
    backgroundColor: 'transparent',
  },
  ringCanvas: {
    position: 'relative',
    backgroundColor: 'transparent',
    overflow: 'visible',
  },
  ringSvg: Platform.OS === 'web'
    ? ({
        backgroundColor: 'transparent',
        overflow: 'visible',
        filter: 'drop-shadow(0px 10px 18px rgba(44, 24, 16, 0.12))',
      } as object)
    : {},
  inner: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  knob: {
    position: 'absolute',
    backgroundColor: Colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 2px 6px rgba(0,0,0,0.25)' }
      : {
          shadowColor: '#000',
          shadowOpacity: 0.25,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 2 },
          elevation: 6,
        }),
  },
  kicker: {
    fontSize: 11,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.warmGray,
    letterSpacing: 1,
    marginBottom: 8,
  },
  cmRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 2 },
  cmNum: {
    fontSize: 46,
    fontFamily: FontDisplay,
    color: Colors.ink,
    letterSpacing: -0.5,
    lineHeight: 52,
  },
  cmUnit: {
    fontSize: 20,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.warmGray,
    letterSpacing: 0.2,
  },
  emptyCm: {
    fontSize: 46,
    fontFamily: FontDisplay,
    color: Colors.warmGray,
    lineHeight: 52,
  },
  healthPill: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  healthLabel: {
    fontSize: 12,
    fontFamily: 'DMSans_600SemiBold',
  },
  healthScore: {
    fontSize: 15,
    fontFamily: 'DMSans_700Bold',
  },
  healthScoreMuted: {
    fontSize: 12,
    fontFamily: 'DMSans_600SemiBold',
  },
  goal: {
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
    color: Colors.warmGray,
    marginTop: 4,
    textAlign: 'center',
  },
  hint: {
    fontSize: 10,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 14,
    paddingHorizontal: 8,
  },
  deltaPill: {
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  deltaPillText: {
    fontSize: 12,
    fontFamily: 'DMSans_700Bold',
  },
  hintTap: {
    marginTop: 8,
    fontSize: 12,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.ink,
    textDecorationLine: 'underline',
  },
});
