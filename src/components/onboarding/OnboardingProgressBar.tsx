import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';

type Phase = { label: string; startStep: number; endStep: number };

const PHASES: Phase[] = [
  { label: 'Profil',   startStep: 0,  endStep: 2  },
  { label: 'Objectif', startStep: 4,  endStep: 7  },
  { label: 'Envies',   startStep: 8,  endStep: 13 },
  { label: 'Ton plan', startStep: 14, endStep: 16 },
];

function getPhaseState(phase: Phase, step: number): 'done' | 'active' | 'pending' {
  if (step > phase.endStep) return 'done';
  if (step >= phase.startStep) return 'active';
  return 'pending';
}

type Props = {
  step: number;
  total: number;
  optional?: boolean;
  showCoachAvatar?: boolean;
  onBack?: () => void;
};

export function OnboardingProgressBar({ step, optional, onBack }: Props) {
  return (
    <View style={s.wrap}>
      <View style={s.headerRow}>

        {/* Chevron retour compact */}
        <TouchableOpacity
          style={s.backBtn}
          onPress={onBack}
          disabled={!onBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 6 }}
          accessibilityRole="button"
          accessibilityLabel="Étape précédente"
        >
          <Ionicons
            name="chevron-back"
            size={22}
            color={onBack ? Colors.warmGray : 'transparent'}
          />
        </TouchableOpacity>

        {/* Phases */}
        <View style={s.phases}>
          {PHASES.map((phase, i) => {
            const state = getPhaseState(phase, step);
            const isDone = state === 'done';
            const isActive = state === 'active';
            const leftAmber = i > 0 && getPhaseState(PHASES[i - 1], step) === 'done';
            const rightAmber = isDone;

            return (
              <View key={phase.label} style={s.phaseCol}>
                <View style={s.connRow}>
                  <View style={[
                    s.line,
                    i === 0 ? s.lineHidden : leftAmber ? s.lineAmber : undefined,
                  ]} />

                  <View style={[
                    s.dot,
                    isDone ? s.dotDone : isActive ? s.dotActive : s.dotPending,
                  ]}>
                    {isDone && <Ionicons name="checkmark" size={11} color="#fff" />}
                    {isActive && <View style={s.innerDot} />}
                  </View>

                  <View style={[
                    s.line,
                    i === PHASES.length - 1 ? s.lineHidden : rightAmber ? s.lineAmber : undefined,
                  ]} />
                </View>

                <Text style={[
                  s.label,
                  isDone && s.labelDone,
                  isActive && s.labelActive,
                ]}>
                  {phase.label}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Pastille Optionnel — symétrique du bouton retour */}
        <View style={s.optionalSlot}>
          {optional && (
            <View style={s.optionalBadge}>
              <Text style={s.optionalText}>Optionnel</Text>
            </View>
          )}
        </View>

      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  phases: { flex: 1, flexDirection: 'row' },
  phaseCol: { flex: 1, alignItems: 'center' },

  connRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 5,
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.border,
  },
  lineHidden: { backgroundColor: 'transparent' },
  lineAmber:  { backgroundColor: Colors.amber },

  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone:    { backgroundColor: Colors.amber },
  dotActive:  { backgroundColor: Colors.amber },
  dotPending: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  innerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },

  label: {
    fontSize: 10,
    fontFamily: 'DMSans_500Medium',
    color: Colors.warmGray,
    textAlign: 'center',
  },
  labelDone:   { color: Colors.amberDark },
  labelActive: { color: Colors.ink, fontFamily: 'DMSans_700Bold' },

  optionalSlot: {
    minWidth: 28,
    flexShrink: 0,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  optionalBadge: {
    backgroundColor: Colors.amberLight,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  optionalText: {
    fontSize: 9,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.amberDark,
    letterSpacing: 0.3,
  },
});
