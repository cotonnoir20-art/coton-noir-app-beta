import { StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';

/** Titres de section sur Profil capillaire (alignés sur `groupLabel`). */
export const profileSectionStyles = StyleSheet.create({
  title: {
    fontSize: 14,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.ink,
    marginBottom: 10,
  },
  titleInCard: {
    marginBottom: 12,
  },
  optional: {
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
  },
  hint: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    lineHeight: 17,
    marginBottom: 12,
  },
});
