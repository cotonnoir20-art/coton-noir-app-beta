import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { HIGHLIGHTS_PTS_LEGEND } from '../../constants/productPitch';
import { Colors } from '../../theme/colors';
import { FontDisplay } from '../../theme/typography';
import type { MomentCard } from '../../data/homeHighlights';
import { FALLBACK_HOME_HIGHLIGHTS } from '../../data/homeHighlights';
import { HighlightCard } from './HighlightCard';

export type { MomentCard } from '../../data/homeHighlights';

type Props = {
  onSeeAll?: () => void;
  moments?: MomentCard[];
  /** Sur l’accueil : nombre max de cartes visibles (le reste via « Voir tout »). */
  previewMax?: number;
  /** Appelé quand une carte a une `route` (navigation interne). */
  onMomentPress?: (m: MomentCard) => void;
};

/** Hauteur du carrousel : obligatoire sinon ~0 px une fois imbriqué dans le ScrollView vertical de l’accueil. */
const CAROUSEL_H = 172;

export function HomeMomentsForts({
  onSeeAll,
  moments = FALLBACK_HOME_HIGHLIGHTS,
  previewMax = 2,
  onMomentPress,
}: Props) {
  const cap = previewMax > 0 ? previewMax : moments.length;
  const visible = moments.slice(0, cap);
  const showSeeAll = Boolean(onSeeAll && moments.length > visible.length);

  return (
    <View style={s.section}>
      <View style={s.head}>
        <Text style={s.title}>Moments forts</Text>
        {showSeeAll ? (
          <TouchableOpacity onPress={onSeeAll} hitSlop={8}>
            <Text style={s.seeAll}>Voir tout →</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <Text style={s.legend}>{HIGHLIGHTS_PTS_LEGEND}</Text>
      <ScrollView
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        style={s.carouselScroll}
        contentContainerStyle={s.carouselContent}
      >
        {visible.map(m => (
          <HighlightCard
            key={m.id}
            moment={m}
            layout="carousel"
            onPress={m.route ? () => onMomentPress?.(m) : undefined}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  section: { marginBottom: 22 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 },
  title: { fontSize: 18, fontFamily: FontDisplay, color: Colors.ink },
  seeAll: { fontSize: 13, fontFamily: 'DMSans_600SemiBold', color: Colors.amberDark },
  legend: {
    fontSize: 10,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    paddingHorizontal: 20,
    marginBottom: 10,
    lineHeight: 14,
  },
  carouselScroll: { height: CAROUSEL_H },
  carouselContent: { flexDirection: 'row', paddingLeft: 20, paddingRight: 8, alignItems: 'stretch' },
});
