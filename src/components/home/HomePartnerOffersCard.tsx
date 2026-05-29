import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { DEMO_BRAND_OFFERS, DEMO_OFFER_THEMES } from '../../data/demoBrandOffers';

function brandInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export function HomePartnerOffersCard() {
  const router = useRouter();
  const navigate = () => router.push('/codes' as any);

  return (
    <View style={s.card}>
      {/* En-tête */}
      <TouchableOpacity style={s.header} onPress={navigate} activeOpacity={0.8}>
        <View style={s.iconBg}>
          <Ionicons name="storefront-outline" size={19} color={Colors.amberDark} />
        </View>
        <View style={s.titleBlock}>
          <Text style={s.title}>Offres partenaires</Text>
          <Text style={s.subtitle}>{DEMO_BRAND_OFFERS.length} codes exclusifs disponibles</Text>
        </View>
        <View style={s.ctaBadge}>
          <Text style={s.ctaText}>Voir</Text>
          <Ionicons name="chevron-forward" size={13} color={Colors.amberDark} />
        </View>
      </TouchableOpacity>

      {/* Séparateur */}
      <View style={s.divider} />

      {/* Scroll horizontal des offres */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.scrollRow}
      >
        {DEMO_BRAND_OFFERS.map(offer => {
          const theme = DEMO_OFFER_THEMES[offer.color_theme] ?? DEMO_OFFER_THEMES.amber;
          const initials = brandInitials(offer.brand);
          return (
            <TouchableOpacity
              key={offer.id}
              style={s.offerChip}
              onPress={navigate}
              activeOpacity={0.82}
            >
              <View style={[s.avatar, { backgroundColor: theme.bg }]}>
                <Text style={[s.avatarText, { color: theme.text }]}>{initials}</Text>
              </View>
              <Text style={s.brandName} numberOfLines={1}>{offer.brand}</Text>
              <View style={[s.discountBadge, { backgroundColor: theme.bg }]}>
                <Text style={[s.discountText, { color: theme.text }]}>{offer.discount}</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Bulle "+" */}
        <TouchableOpacity style={s.moreBubble} onPress={navigate} activeOpacity={0.82}>
          <View style={s.moreCircle}>
            <Ionicons name="arrow-forward" size={16} color={Colors.amberDark} />
          </View>
          <Text style={s.moreLabel}>Tout voir</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: Colors.amberPowder,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.amberLight,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
  },
  iconBg: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: Colors.amberLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  titleBlock: { flex: 1 },
  title: {
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
    color: Colors.ink,
  },
  subtitle: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    marginTop: 2,
  },
  ctaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.amberLight,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  ctaText: {
    fontSize: 12,
    fontFamily: 'DMSans_700Bold',
    color: Colors.amberDark,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.amberLight,
    marginHorizontal: 16,
  },
  scrollRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  offerChip: {
    width: 82,
    alignItems: 'center',
    gap: 6,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontFamily: 'DMSans_700Bold',
  },
  brandName: {
    fontSize: 10,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.ink,
    textAlign: 'center',
    width: '100%',
  },
  discountBadge: {
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  discountText: {
    fontSize: 10,
    fontFamily: 'DMSans_700Bold',
  },
  moreBubble: {
    width: 82,
    alignItems: 'center',
    gap: 6,
    justifyContent: 'flex-start',
    paddingTop: 2,
  },
  moreCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.amberLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreLabel: {
    fontSize: 10,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.amberDark,
    textAlign: 'center',
  },
});
