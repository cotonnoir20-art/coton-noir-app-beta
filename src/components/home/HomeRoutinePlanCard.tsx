import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AppIconBox } from '../AppIconBox';
import { Colors } from '../../theme/colors';
import { Type } from '../../theme/typography';
import type { RoutineStep } from '../../data/routines';
import { getPeriodIcon, getRoutineStepIcon } from '../../lib/routineStepVisual';

type PeriodKind = 'daily' | 'night';

type Props = {
  morningSteps: RoutineStep[];
  eveningSteps: RoutineStep[];
};

const PERIOD_THEME: Record<
  PeriodKind,
  { label: string; chipBg: string; accent: string; doneFill: [string, string] }
> = {
  daily: {
    label: 'Matin',
    chipBg: Colors.amberPowder,
    accent: Colors.amberDark,
    doneFill: [Colors.amber, Colors.amberDark],
  },
  night: {
    label: 'Soir',
    chipBg: Colors.growthLight,
    accent: Colors.growth,
    doneFill: [Colors.growth, Colors.inkSoft],
  },
};

function StepBubble({
  step,
  kind,
}: {
  step: RoutineStep;
  kind: PeriodKind;
}) {
  const visual = getRoutineStepIcon(step.title, kind);
  const theme = PERIOD_THEME[kind];

  return (
    <View style={s.stepCol}>
      <View style={s.bubbleWrap}>
        <LinearGradient
          colors={step.done ? theme.doneFill : visual.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[s.bubble, !step.done && s.bubblePending]}
        >
          <Ionicons
            name={visual.ion}
            size={22}
            color={step.done ? Colors.white : visual.ionColor}
          />
        </LinearGradient>
        {step.done ? (
          <View style={s.doneBadge}>
            <Ionicons name="checkmark" size={10} color={Colors.white} />
          </View>
        ) : null}
      </View>
      <Text style={[s.stepLabel, step.done && s.stepLabelDone]} numberOfLines={2}>
        {step.title}
      </Text>
    </View>
  );
}

function PeriodRow({
  kind,
  steps,
  onPress,
}: {
  kind: PeriodKind;
  steps: RoutineStep[];
  onPress: () => void;
}) {
  const theme = PERIOD_THEME[kind];
  const periodIcon = getPeriodIcon(kind);
  const done = steps.filter(s => s.done).length;
  const total = Math.max(steps.length, 1);

  return (
    <TouchableOpacity
      style={s.periodBlock}
      onPress={onPress}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel={`Routine du ${theme.label}, ${done} sur ${total} étapes faites`}
    >
      <View style={s.periodHead}>
        <View style={[s.periodChip, { backgroundColor: theme.chipBg }]}>
          <AppIconBox
            name={periodIcon.ion}
            backgroundColor={periodIcon.ionBg}
            color={periodIcon.ionColor}
            size={24}
            iconSize={13}
            borderRadius={12}
          />
          <Text style={s.periodChipText}>{theme.label}</Text>
        </View>
        <Text style={[s.periodProgress, { color: theme.accent }]}>
          {done}/{total} faites
        </Text>
      </View>
      <ScrollView
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.stepsRow}
      >
        {steps.map(step => (
          <StepBubble key={`${kind}-${step.id}`} step={step} kind={kind} />
        ))}
      </ScrollView>
    </TouchableOpacity>
  );
}

export function HomeRoutinePlanCard({ morningSteps, eveningSteps }: Props) {
  const router = useRouter();

  if (morningSteps.length === 0 && eveningSteps.length === 0) {
    return null;
  }

  const openRoutine = (kind: PeriodKind) => {
    router.push({ pathname: '/(tabs)/routine', params: { routine: kind } } as any);
  };

  const openAllRoutines = () => {
    router.push('/(tabs)/routine' as any);
  };

  return (
    <View style={s.section}>
      <View style={s.card}>
        <Text style={s.cardTitle}>Mes routines</Text>
        <View style={s.titleDivider} />

        <View style={s.cardBody}>
          {morningSteps.length > 0 ? (
            <PeriodRow kind="daily" steps={morningSteps} onPress={() => openRoutine('daily')} />
          ) : null}

          {morningSteps.length > 0 && eveningSteps.length > 0 ? <View style={s.divider} /> : null}

          {eveningSteps.length > 0 ? (
            <PeriodRow kind="night" steps={eveningSteps} onPress={() => openRoutine('night')} />
          ) : null}

          <TouchableOpacity
            style={s.voirPlusBtn}
            onPress={openAllRoutines}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Voir plus de routines"
          >
            <Text style={s.voirPlusText}>Voir plus</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  section: { marginBottom: 22, paddingHorizontal: 14 },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    shadowColor: Colors.ink,
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cardTitle: {
    ...Type.cardTitle,
    color: Colors.ink,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  titleDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
  },
  cardBody: {
    paddingTop: 14,
    paddingBottom: 16,
    paddingHorizontal: 14,
  },
  voirPlusBtn: {
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voirPlusText: {
    fontSize: 14,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.ink,
  },
  periodBlock: { paddingVertical: 4 },
  periodHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  periodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  periodChipText: { fontSize: 13, fontFamily: 'DMSans_600SemiBold', color: Colors.ink },
  periodProgress: { fontSize: 12, fontFamily: 'DMSans_600SemiBold' },
  stepsRow: { paddingHorizontal: 2, gap: 10 },
  stepCol: { width: 72, alignItems: 'center' },
  bubbleWrap: { position: 'relative', marginBottom: 6 },
  bubble: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubblePending: { opacity: 0.72 },
  doneBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.ink,
    borderWidth: 2,
    borderColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: {
    fontSize: 10,
    fontFamily: 'DMSans_500Medium',
    color: Colors.warmGray,
    textAlign: 'center',
    lineHeight: 13,
  },
  stepLabelDone: { color: Colors.ink, fontFamily: 'DMSans_600SemiBold' },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
    marginHorizontal: 2,
  },
});
