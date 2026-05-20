import { useMemo, type ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { AppIconBox, type IonName } from '../AppIconBox';
import { Colors } from '../../theme/colors';
import type { HairProfile } from '../../context/AppContext';
import {
  buildOnboardingRecommendations,
  diagnosticSnapshotFromProfile,
  type RecoArticle,
} from '../../lib/onboardingRecommendations';

type Props = {
  profile: HairProfile;
};

/** Bol + spatule (DIY / recettes maison). */
function RecipeBowlIconBox({
  backgroundColor,
  color,
  size = 48,
  iconSize = 24,
}: {
  backgroundColor: string;
  color: string;
  size?: number;
  iconSize?: number;
}) {
  return (
    <View
      style={[
        s.recipeIconBox,
        { width: size, height: size, borderRadius: 14, backgroundColor },
      ]}
    >
      <MaterialCommunityIcons name="bowl-mix-outline" size={iconSize} color={color} />
    </View>
  );
}

function ExtraCard({
  children,
  onPress,
  accessibilityLabel,
}: {
  children: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  if (onPress) {
    return (
      <TouchableOpacity
        style={s.card}
        onPress={onPress}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={s.card}>{children}</View>;
}

function CardHeader({ kicker, title }: { kicker: string; title: string }) {
  return (
    <>
      <Text style={s.kicker}>{kicker}</Text>
      <Text style={s.cardTitle}>{title}</Text>
      <View style={s.titleDivider} />
    </>
  );
}

function FooterLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={s.footerLink} onPress={onPress} accessibilityRole="button">
      <Text style={s.footerLinkText}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={Colors.amberDark} />
    </TouchableOpacity>
  );
}

type MediaItem = {
  id: string;
  name: string;
  meta: string;
  icon?: IonName;
  iconBg: string;
  iconColor: string;
};

function MediaCard({
  kicker,
  title,
  items,
  linkLabel,
  onLink,
  recipeIcons,
}: {
  kicker: string;
  title: string;
  items: MediaItem[];
  linkLabel: string;
  onLink: () => void;
  recipeIcons?: boolean;
}) {
  return (
    <ExtraCard>
      <View style={s.cardHeaderWrap}>
        <CardHeader kicker={kicker} title={title} />
      </View>
      <View style={s.mediaList}>
        {items.map((item, i) => (
          <TouchableOpacity
            key={item.id}
            style={[s.mediaRow, i === items.length - 1 && s.mediaRowLast]}
            onPress={onLink}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel={item.name}
          >
            {recipeIcons ? (
              <RecipeBowlIconBox
                backgroundColor={item.iconBg}
                color={item.iconColor}
              />
            ) : item.icon ? (
              <AppIconBox
                name={item.icon}
                backgroundColor={item.iconBg}
                color={item.iconColor}
                size={48}
                iconSize={22}
                borderRadius={14}
              />
            ) : null}
            <View style={s.mediaBody}>
              <Text style={s.mediaName} numberOfLines={2}>
                {item.name}
              </Text>
              <Text style={s.mediaMeta}>{item.meta}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.warmGray} />
          </TouchableOpacity>
        ))}
      </View>
      <View style={s.footerWrap}>
        <FooterLink label={linkLabel} onPress={onLink} />
      </View>
    </ExtraCard>
  );
}

function ArticlesCarouselCard({
  articles,
  onOpenArticles,
}: {
  articles: RecoArticle[];
  onOpenArticles: () => void;
}) {
  return (
    <ExtraCard>
      <View style={s.cardHeaderWrap}>
        <CardHeader kicker="Lecture" title="Mes articles" />
      </View>

      <View style={s.carouselSlot}>
        <ScrollView
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.articleScroll}
        >
          {articles.map((article, i) => (
            <TouchableOpacity
              key={article.id}
              style={[s.articleCard, i === articles.length - 1 && s.articleCardLast]}
            onPress={onOpenArticles}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel={article.title}
          >
            <View style={[s.articleThumb, { backgroundColor: article.thumb_bg }]}>
              <Text style={s.articleEmoji}>{article.thumb_emoji}</Text>
            </View>
            <Text style={s.articleTitle} numberOfLines={3}>
              {article.title}
            </Text>
            {article.subtitle ? (
              <Text style={s.articleSubtitle} numberOfLines={2}>
                {article.subtitle}
              </Text>
            ) : null}
            <Text style={s.articleMeta}>{article.read_time} min de lecture</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={s.footerWrap}>
        <FooterLink label="Tous les articles" onPress={onOpenArticles} />
      </View>
    </ExtraCard>
  );
}

export function HomeRecoExtras({ profile }: Props) {
  const router = useRouter();

  const reco = useMemo(
    () => buildOnboardingRecommendations(diagnosticSnapshotFromProfile(profile)),
    [
      profile.hairType,
      profile.porosity,
      profile.density,
      profile.objective,
      profile.region,
      profile.budget,
      profile.careStyle,
    ],
  );

  if (!profile.careStyle) return null;

  const hasRecipes = reco.showRecipes && reco.recipes.length > 0;
  const hasArticles = reco.articles.length > 0;

  if (!hasRecipes && !hasArticles) {
    return null;
  }

  return (
    <>
      {hasRecipes ? (
        <View style={s.section}>
          <MediaCard
            kicker="DIY"
            title="Mes recettes"
            recipeIcons
            items={reco.recipes.map(r => ({
              id: r.id,
              name: r.name,
              meta: `${r.category} · ${r.duration} min`,
              iconBg: Colors.amberLight,
              iconColor: Colors.amberDark,
            }))}
            linkLabel="Toutes les recettes"
            onLink={() => router.push('/recipes' as any)}
          />
        </View>
      ) : null}

      {hasArticles ? (
        <View style={s.section}>
          <ArticlesCarouselCard
            articles={reco.articles}
            onOpenArticles={() => router.push('/articles' as any)}
          />
        </View>
      ) : null}
    </>
  );
}

const s = StyleSheet.create({
  section: {
    marginBottom: 22,
    paddingHorizontal: 14,
    alignSelf: 'stretch',
  },
  card: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingBottom: 4,
    shadowColor: Colors.ink,
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cardHeaderWrap: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
  },
  kicker: {
    fontSize: 10,
    fontFamily: 'DMSans_700Bold',
    color: Colors.amberDark,
    letterSpacing: 1,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: Colors.ink,
    paddingBottom: 12,
  },
  titleDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginBottom: 4,
  },
  recipeIconBox: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  footerWrap: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  footerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 2,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footerLinkText: {
    fontSize: 13,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.amberDark,
  },
  mediaList: { marginBottom: 2, paddingHorizontal: 16 },
  mediaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  mediaRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  mediaBody: { flex: 1, minWidth: 0 },
  mediaName: {
    fontSize: 14,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.ink,
    lineHeight: 19,
  },
  mediaMeta: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    marginTop: 3,
  },
  carouselSlot: {
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  articleScroll: {
    paddingVertical: 2,
  },
  articleCard: {
    width: 168,
    minHeight: 196,
    marginRight: 10,
    backgroundColor: Colors.cream,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 14,
    justifyContent: 'space-between',
  },
  articleCardLast: {
    marginRight: 0,
  },
  articleThumb: {
    width: '100%',
    height: 72,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  articleEmoji: {
    fontSize: 32,
    lineHeight: 38,
  },
  articleTitle: {
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
    color: Colors.ink,
    lineHeight: 19,
    minHeight: 57,
  },
  articleSubtitle: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    lineHeight: 15,
    marginTop: 4,
    marginBottom: 6,
  },
  articleMeta: {
    fontSize: 11,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.growth,
    marginTop: 8,
  },
});
