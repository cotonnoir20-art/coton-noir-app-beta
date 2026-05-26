import { useMemo, useState } from 'react';
import { useSupabaseProducts } from '../../lib/useSupabaseProducts';
import { Image } from 'expo-image';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import type { HairProfile } from '../../context/AppContext';
import { Colors } from '../../theme/colors';
import { Type } from '../../theme/typography';
import {
  FOR_YOU_FILTER_LABELS,
  buildForYouDiscoverFeed,
  type ForYouFilter,
  type ForYouItem,
} from '../../lib/forYouDiscover';

const GRID_PAD = 16;
const GRID_GAP = 12;

type Props = {
  profile: HairProfile;
  contentPaddingBottom?: number;
};

function ForYouGridCard({
  item,
  width,
  onPress,
}: {
  item: ForYouItem;
  width: number;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[s.gridCard, { width }]}
      onPress={onPress}
      activeOpacity={0.88}
      accessibilityRole="button"
      accessibilityLabel={item.title}
    >
      <View style={[s.gridVisual, { backgroundColor: item.thumbBg }]}>
        {item.thumbImage ? (
          <Image source={{ uri: item.thumbImage }} style={s.gridImg} contentFit="cover" />
        ) : (
          <Text style={s.gridEmoji}>{item.thumbEmoji}</Text>
        )}
      </View>

      <View style={s.gridBody}>
        <View style={s.badgeRow}>
          {item.highlightBadge ? (
            <View style={s.highlightBadge}>
              <Text style={s.highlightBadgeText} numberOfLines={1}>
                {item.highlightBadge}
              </Text>
            </View>
          ) : null}
          <View style={s.categoryBadge}>
            <Text style={s.categoryBadgeText} numberOfLines={1}>
              {item.categoryLabel}
            </Text>
          </View>
        </View>

        <Text style={s.gridTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={s.gridBrand} numberOfLines={1}>
          {item.subtitle}
        </Text>
        <Text style={s.gridDesc} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={s.ctaBtn}>
          <Text style={s.ctaBtnText}>Découvrir</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function ForYouDiscoverFeed({ profile, contentPaddingBottom = 32 }: Props) {
  const router = useRouter();
  const { width: screenW } = useWindowDimensions();
  const [filter, setFilter] = useState<ForYouFilter>('product');
  const { products } = useSupabaseProducts();

  const cardW = (screenW - GRID_PAD * 2 - GRID_GAP) / 2;

  const feed = useMemo(
    () => buildForYouDiscoverFeed(profile, products),
    [
      profile.hairType,
      profile.porosity,
      profile.objective,
      profile.problematics,
      profile.careStyle,
      profile.region,
      profile.budget,
      products,
    ],
  );

  const visibleItems = useMemo(
    () => feed.items.filter(i => i.type === filter),
    [feed.items, filter],
  );

  const openItem = (item: ForYouItem) => {
    router.push(item.route as any);
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: contentPaddingBottom }}
    >
      <View style={s.hero}>
        <Text style={s.heroTitle}>Pour toi</Text>
        <Text style={s.heroSubtitle}>
          Sélection catalogue selon ton profil — objectifs et problématiques capillaires.
        </Text>
        <Text style={s.profileLine} numberOfLines={2}>
          {feed.profileSummary}
        </Text>
        {feed.problematics.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.chipRow}
          >
            {feed.problematics.map(p => (
              <View key={p} style={s.chip}>
                <Text style={s.chipText}>{p}</Text>
              </View>
            ))}
          </ScrollView>
        ) : null}
        {!feed.hasPersonalization ? (
          <TouchableOpacity
            style={s.profileCta}
            onPress={() => router.push('/hair-profile' as any)}
            activeOpacity={0.85}
          >
            <Text style={s.profileCtaText}>Compléter mon profil capillaire →</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.filterRow}
      >
        {FOR_YOU_FILTER_LABELS.map(f => {
          const active = filter === f.id;
          const count = feed.items.filter(i => i.type === f.id).length;
          if (count === 0) return null;
          return (
            <TouchableOpacity
              key={f.id}
              style={[s.filterChip, active && s.filterChipActive]}
              onPress={() => setFilter(f.id)}
              activeOpacity={0.85}
            >
              <Text style={[s.filterChipText, active && s.filterChipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {visibleItems.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyTitle}>Aucun contenu pour ce filtre</Text>
          <Text style={s.emptyBody}>
            Choisis une autre catégorie ou mets à jour ton profil capillaire.
          </Text>
        </View>
      ) : (
        <View style={s.grid}>
          {visibleItems.map(item => (
            <ForYouGridCard
              key={item.id}
              item={item}
              width={cardW}
              onPress={() => openItem(item)}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  hero: {
    paddingHorizontal: GRID_PAD,
    paddingTop: 4,
    paddingBottom: 12,
  },
  heroTitle: {
    ...Type.sectionTitle,
    fontSize: 22,
    color: Colors.ink,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    lineHeight: 20,
    marginBottom: 10,
  },
  profileLine: {
    fontSize: 13,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.amberDark,
    marginBottom: 8,
  },
  chipRow: { gap: 8, paddingVertical: 4 },
  chip: {
    backgroundColor: Colors.cream,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipText: {
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
    color: Colors.ink,
  },
  profileCta: {
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  profileCtaText: {
    fontSize: 13,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.amberDark,
  },
  filterRow: {
    paddingHorizontal: GRID_PAD,
    gap: 8,
    paddingBottom: 14,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.amber,
    borderColor: Colors.amber,
  },
  filterChipText: {
    fontSize: 12,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.warmGray,
  },
  filterChipTextActive: {
    color: Colors.ink,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: GRID_PAD,
    gap: GRID_GAP,
  },
  gridCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  gridVisual: {
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 10,
    borderRadius: 14,
  },
  gridEmoji: { fontSize: 44 },
  gridImg: { width: '100%', height: '100%' },
  gridBody: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  highlightBadge: {
    backgroundColor: Colors.amberLight,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxWidth: '100%',
  },
  highlightBadgeText: {
    fontSize: 9,
    fontFamily: 'DMSans_700Bold',
    color: Colors.amberDark,
  },
  categoryBadge: {
    backgroundColor: Colors.cream,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  categoryBadgeText: {
    fontSize: 9,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.warmGray,
  },
  gridTitle: {
    fontSize: 14,
    lineHeight: 18,
    fontFamily: 'Satoshi_500Medium',
    color: Colors.ink,
    marginBottom: 4,
    minHeight: 36,
  },
  gridBrand: {
    fontSize: 11,
    fontFamily: 'DMSans_500Medium',
    color: Colors.warmGray,
    marginBottom: 4,
  },
  gridDesc: {
    fontSize: 11,
    lineHeight: 15,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    marginBottom: 10,
    minHeight: 30,
  },
  ctaBtn: {
    backgroundColor: Colors.ink,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: 'center',
  },
  ctaBtnText: {
    fontSize: 12,
    fontFamily: 'DMSans_700Bold',
    color: Colors.white,
  },
  empty: {
    paddingVertical: 32,
    paddingHorizontal: GRID_PAD + 8,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.ink,
    marginBottom: 6,
  },
  emptyBody: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    textAlign: 'center',
    lineHeight: 18,
  },
});
