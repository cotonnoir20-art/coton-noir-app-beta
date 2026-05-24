import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, TouchableOpacity, View, type ViewStyle } from 'react-native';
import { Colors, HighlightGradients } from '../../theme/colors';
import type { MomentCard } from '../../data/homeHighlights';

function gradientColors(m: MomentCard): [string, string] {
  return [...HighlightGradients[m.variant]] as [string, string];
}

type Props = {
  moment: MomentCard;
  /** Carrousel accueil (largeur fixe) ou liste pleine largeur. */
  layout: 'carousel' | 'list';
  onPress?: () => void;
};

export function HighlightCard({ moment: m, layout, onPress }: Props) {
  const wrapStyle: ViewStyle = layout === 'carousel' ? s.wrapCarousel : s.wrapList;
  const cardStyle = layout === 'carousel' ? s.cardCarousel : s.cardList;

  return (
    <TouchableOpacity
      style={wrapStyle}
      activeOpacity={0.9}
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={m.title}
    >
      <LinearGradient
        colors={gradientColors(m)}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={cardStyle}
      >
        <Text style={s.badge}>{m.badge}</Text>
        <Text style={s.cardTitle}>{m.title}</Text>
        <Text style={s.cardSub}>{m.sub}</Text>
        <View style={s.footer}>
          <Text style={s.footerLeft}>{m.footerLeft}</Text>
          <Text style={s.footerArrow}>{onPress ? '→' : ''}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  /** `marginRight` évite `gap` sur ScrollView horizontal (largeur / rendu instable sur Android). */
  wrapCarousel: { width: 260, marginRight: 12, borderRadius: 20, overflow: 'hidden' },
  wrapList: {
    marginHorizontal: 20,
    marginBottom: 14,
    borderRadius: 20,
    overflow: 'hidden',
  },
  cardCarousel: { borderRadius: 20, padding: 16, minHeight: 160, justifyContent: 'space-between' },
  cardList: { borderRadius: 20, padding: 16, minHeight: 140, justifyContent: 'space-between' },
  badge: { fontSize: 10, fontFamily: 'DMSans_700Bold', color: 'rgba(255,255,255,0.95)', letterSpacing: 0.5 },
  cardTitle: { fontSize: 20, fontFamily: 'Satoshi_500Medium', color: Colors.white, marginTop: 8 },
  cardSub: { fontSize: 12, fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.9)', marginTop: 4, lineHeight: 17 },
  footer: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(29, 29, 27, 0.28)',
    marginHorizontal: -16,
    marginBottom: -16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  footerLeft: { fontSize: 12, fontFamily: 'DMSans_700Bold', color: Colors.white },
  footerArrow: { fontSize: 16, color: Colors.white },
});
