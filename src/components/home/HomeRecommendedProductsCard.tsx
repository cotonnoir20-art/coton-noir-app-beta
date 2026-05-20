import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppIconBox } from '../AppIconBox';
import type { HairProfile } from '../../context/AppContext';
import { Colors } from '../../theme/colors';
import { FontDisplay } from '../../theme/typography';
import {
  buildHomeProductRecommendations,
  type HomeProblemItem,
} from '../../lib/homeProductRecommendations';

type Props = {
  profile: HairProfile;
};

function ProblemTile({ item, variant }: { item: HomeProblemItem; variant: 'main' | 'related' }) {
  const isMain = variant === 'main';
  return (
    <View style={s.problemTile}>
      <AppIconBox
        name={item.ion}
        backgroundColor={isMain ? item.ionBg : Colors.cream}
        color={isMain ? item.ionColor : Colors.warmGray}
        size={48}
        iconSize={22}
        borderRadius={14}
      />
      <Text style={isMain ? s.mainLabel : s.relatedLabel} numberOfLines={3}>
        {item.label}
      </Text>
    </View>
  );
}

export function HomeRecommendedProductsCard({ profile }: Props) {
  const router = useRouter();

  const data = useMemo(() => buildHomeProductRecommendations(profile), [
    profile.hairType,
    profile.porosity,
    profile.density,
    profile.objective,
    profile.region,
    profile.budget,
    profile.careStyle,
  ]);

  if (!data.showSection) return null;

  const openShop = () => router.push('/shop' as any);

  return (
    <View style={s.section}>
      <View style={s.card}>
        <Text style={s.cardTitle}>Produits recommandés</Text>
        <View style={s.titleDivider} />

        <View style={s.problemsRow}>
          <ProblemTile item={data.mainProblem} variant="main" />
          <ProblemTile item={data.relatedProblems[0]} variant="related" />
          <ProblemTile item={data.relatedProblems[1]} variant="related" />
        </View>

        <View style={s.carouselSlot}>
          <ScrollView
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.productScroll}
          >
            {data.products.map((p, i) => (
              <TouchableOpacity
                key={`${p.brand}-${i}`}
                style={[s.productCard, i === data.products.length - 1 && s.productCardLast]}
              onPress={openShop}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel={`${p.brand} ${p.name}`}
            >
              <View style={s.productVisual}>
                <AppIconBox
                  name="bag-handle-outline"
                  backgroundColor={Colors.amberLight}
                  color={Colors.amberDark}
                  size={64}
                  iconSize={30}
                  borderRadius={16}
                />
              </View>
              <Text style={s.productBrand} numberOfLines={1}>
                {p.brand}
              </Text>
              <Text style={s.productName} numberOfLines={2}>
                {p.name}
              </Text>
              <Text style={s.productPrice}>{p.price}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <TouchableOpacity
          style={s.shopBtn}
          onPress={openShop}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Voir la boutique"
        >
          <Text style={s.shopBtnText}>Voir la boutique</Text>
        </TouchableOpacity>
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
    paddingBottom: 16,
    shadowColor: Colors.ink,
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: FontDisplay,
    color: Colors.ink,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  titleDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
    marginBottom: 14,
  },
  problemsRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 8,
    marginBottom: 14,
    marginTop: 2,
  },
  problemTile: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  mainLabel: {
    marginTop: 8,
    fontSize: 11,
    fontFamily: 'DMSans_700Bold',
    color: Colors.amberDark,
    textAlign: 'center',
    lineHeight: 14,
  },
  relatedLabel: {
    marginTop: 8,
    fontSize: 11,
    fontFamily: 'DMSans_500Medium',
    color: Colors.warmGray,
    textAlign: 'center',
    lineHeight: 14,
  },
  carouselSlot: {
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  productScroll: {
    paddingVertical: 2,
  },
  productCard: {
    width: 148,
    minHeight: 196,
    marginRight: 10,
    backgroundColor: Colors.cream,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingTop: 14,
    paddingBottom: 14,
    justifyContent: 'space-between',
  },
  productCardLast: {
    marginRight: 0,
  },
  productVisual: {
    alignItems: 'center',
    marginBottom: 10,
    paddingVertical: 10,
  },
  productBrand: {
    fontSize: 10,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    marginBottom: 2,
  },
  productName: {
    fontSize: 13,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.ink,
    lineHeight: 18,
    minHeight: 40,
  },
  productPrice: {
    fontSize: 12,
    fontFamily: 'DMSans_700Bold',
    color: Colors.amberDark,
    marginTop: 10,
  },
  shopBtn: {
    marginHorizontal: 16,
    marginTop: 14,
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  shopBtnText: {
    fontSize: 15,
    fontFamily: 'DMSans_700Bold',
    color: Colors.ink,
  },
});
