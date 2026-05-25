import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../theme/colors';
import { Fonts } from '../../theme/typography';
import { displayObjective, normalizeObjectiveId } from '../../constants/hairObjectives';
import { BCEmojiAvatar } from '../blackCotton/BCEmojiAvatar';

type Props = {
  objective: string;
  resultsWeeks: number;
  hairTypeUnsure?: boolean;
};

export function PlanReadyHeader({ objective, resultsWeeks, hairTypeUnsure }: Props) {
  const focus = displayObjective(normalizeObjectiveId(objective)) || 'Prendre soin de tes cheveux';

  return (
    <View style={s.wrap}>
      <View style={s.avatarWrap}>
        <BCEmojiAvatar size={88} mood="coaching" />
      </View>
      <Text style={s.title}>Ton plan personnalisé est prêt</Text>
      <Text style={s.subtitle}>
        Des résultats visibles visés d’ici {resultsWeeks} semaine{resultsWeeks > 1 ? 's' : ''}.
      </Text>
      {hairTypeUnsure ? (
        <Text style={s.scanHint}>
          Tu n’as pas encore précisé ton type : le scan guidé t’aidera à affiner sans deviner.
        </Text>
      ) : null}

      <View style={s.focusCard}>
        <Text style={s.focusKicker}>TON OBJECTIF</Text>
        <Text style={s.focusTitle}>{focus}</Text>
        <Text style={s.focusSub}>Tout ton plan est calibré autour de cet objectif.</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { marginBottom: 20 },
  avatarWrap: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontFamily: Fonts.display,
    color: Colors.ink,
    lineHeight: 32,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    lineHeight: 20,
    marginBottom: 8,
  },
  scanHint: {
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
    color: Colors.amberDark,
    marginBottom: 14,
    lineHeight: 17,
  },
  focusCard: {
    backgroundColor: Colors.ink,
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
  },
  focusKicker: {
    fontSize: 10,
    fontFamily: 'DMSans_700Bold',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  focusTitle: {
    fontSize: 18,
    fontFamily: Fonts.display,
    color: Colors.white,
    marginBottom: 4,
  },
  focusSub: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(255,255,255,0.72)',
    lineHeight: 17,
  },
});
