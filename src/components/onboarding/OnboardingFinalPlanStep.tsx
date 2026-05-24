import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../theme/colors';
import { Fonts } from '../../theme/typography';
import { BlurredPaywall } from './BlurredPaywall';
import { PlanReadyHeader } from './PlanReadyHeader';
import { RoutineRecoCard } from '../recommendations/RoutineRecoCard';
import {
  buildHomeAwaitingTeaser,
  type OnboardingRecommendations,
} from '../../lib/onboardingRecommendations';

const ROUTINE_TIPS = {
  washday: 'Démêle toujours avec du conditioner, des pointes vers les racines.',
  morning: 'Coiffe sur cheveux humides pour une meilleure définition.',
  evening: 'Bonnet en satin la nuit pour limiter la casse.',
} as const;

type Props = {
  reco: OnboardingRecommendations;
  objective: string;
  resultsWeeks: number;
  hairTypeUnsure: boolean;
};

function LockedRoutineFromWashStep2({
  reco,
  washCount,
  morningCount,
}: {
  reco: OnboardingRecommendations;
  washCount: number;
  morningCount: number;
}) {
  const washTail = reco.weekly.slice(1);

  return (
    <View style={s.lockedBlock}>
      {washTail.length > 0 ? (
        <RoutineRecoCard
          kicker="WASH DAY"
          title=""
          icon="water-outline"
          accent="sage"
          steps={washTail}
          tip={ROUTINE_TIPS.washday}
          stepOffset={1}
          continuation
          embedded
        />
      ) : null}

      {morningCount > 0 ? (
        <RoutineRecoCard
          kicker="MATIN"
          title="Hydratation & coiffage"
          icon="sunny-outline"
          accent="amber"
          steps={reco.morning}
          tip={ROUTINE_TIPS.morning}
          stepOffset={washCount}
          embedded={washTail.length > 0}
        />
      ) : null}

      {reco.evening.length > 0 ? (
        <RoutineRecoCard
          kicker="SOIR"
          title="Soins de nuit"
          icon="moon-outline"
          accent="slate"
          steps={reco.evening}
          tip={ROUTINE_TIPS.evening}
          stepOffset={washCount + morningCount}
          embedded
        />
      ) : null}
    </View>
  );
}

export function OnboardingFinalPlanStep({
  reco,
  objective,
  resultsWeeks,
  hairTypeUnsure,
}: Props) {
  const homeTeaser = buildHomeAwaitingTeaser(reco);
  const washCount = reco.weekly.length;
  const morningCount = reco.morning.length;
  const washPreview = reco.weekly.slice(0, 1);
  const hasLockedRoutine = washCount > 1 || morningCount > 0 || reco.evening.length > 0;

  return (
    <View style={s.wrap}>
      <PlanReadyHeader
        objective={objective}
        resultsWeeks={resultsWeeks}
        hairTypeUnsure={hairTypeUnsure}
      />

      <Text style={s.routineHeading}>Ta routine capillaire</Text>
      <Text style={s.profileLine}>{reco.profileSummary}</Text>

      <View style={s.routineStack}>
        <View style={s.routineCard}>
          <RoutineRecoCard
            kicker="WASH DAY"
            title="Nettoyage & soin profond"
            icon="water-outline"
            accent="sage"
            steps={washPreview}
            tip=""
            embedded
          />
          {hasLockedRoutine ? (
            <BlurredPaywall
              locked
              progressive
              progressiveMaxHeight={420}
              fadeBottomColor={Colors.surface}
              homeTeaser={homeTeaser}
              style={s.progressivePaywall}
            >
              <LockedRoutineFromWashStep2
                reco={reco}
                washCount={washCount}
                morningCount={morningCount}
              />
            </BlurredPaywall>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { paddingBottom: 24 },
  routineHeading: {
    fontSize: 18,
    fontFamily: Fonts.display,
    color: Colors.ink,
    marginBottom: 6,
  },
  profileLine: {
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
    color: Colors.warmGray,
    marginBottom: 16,
    lineHeight: 17,
  },
  routineStack: { marginBottom: 8 },
  routineCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  progressivePaywall: {
    marginTop: 0,
    paddingHorizontal: 18,
    paddingBottom: 14,
  },
  lockedBlock: { paddingTop: 0 },
});
