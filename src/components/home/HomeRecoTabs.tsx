import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppIconBox } from '../AppIconBox';
import type { HairProfile } from '../../context/AppContext';
import { Colors } from '../../theme/colors';
import { Type } from '../../theme/typography';
import { useSupabaseProducts } from '../../lib/useSupabaseProducts';
import {
  buildHomeProductRecommendations,
  type HomeProblemItem,
} from '../../lib/homeProductRecommendations';
import {
  buildOnboardingRecommendations,
  diagnosticSnapshotFromProfile,
  type RecoArticle,
  type RecoRecipe,
  type RecoProduct,
} from '../../lib/onboardingRecommendations';

const TABS = ['Produits', 'Recettes', 'Articles'] as const;
type Tab = (typeof TABS)[number];

type Props = { profile: HairProfile };

// ── Sous-composants ────────────────────────────────────────────────────────

function ProblemTile({ item, variant }: { item: HomeProblemItem; variant: 'main' | 'related' }) {
  const isMain = variant === 'main';
  return (
    <View style={s.problemTile}>
      <AppIconBox
        name={item.ion}
        backgroundColor={isMain ? item.ionBg : Colors.cream}
        color={isMain ? item.ionColor : Colors.warmGray}
        size={44}
        iconSize={20}
        borderRadius={13}
      />
      <Text style={isMain ? s.mainLabel : s.relatedLabel} numberOfLines={3}>
        {item.label}
      </Text>
    </View>
  );
}

function FooterLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={s.footerLink} onPress={onPress} accessibilityRole="button">
      <Text style={s.footerLinkText}>{label}</Text>
      <Ionicons name="chevron-forward" size={15} color={Colors.amberDark} />
    </TouchableOpacity>
  );
}

function EmptyTab({ label }: { label: string }) {
  return (
    <View style={s.emptyWrap}>
      <Text style={s.emptyText}>{label}</Text>
    </View>
  );
}

function ProductsTab({
  mainProblem,
  relatedProblems,
  products,
  onOpenShop,
}: {
  mainProblem: HomeProblemItem;
  relatedProblems: [HomeProblemItem, HomeProblemItem];
  products: RecoProduct[];
  onOpenShop: () => void;
}) {
  return (
    <View>
      <View style={s.problemsRow}>
        <ProblemTile item={mainProblem} variant="main" />
        <ProblemTile item={relatedProblems[0]} variant="related" />
        <ProblemTile item={relatedProblems[1]} variant="related" />
      </View>
      <ScrollView
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        style={s.productScrollWrap}
        contentContainerStyle={s.productScroll}
      >
        {products.map((p, i) => (
          <TouchableOpacity
            key={`${p.brand}-${i}`}
            style={[s.productCard, i === products.length - 1 && s.productCardLast]}
            onPress={onOpenShop}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel={`${p.brand} ${p.name}`}
          >
            <View style={[s.productVisual, { backgroundColor: p.bg ?? Colors.amberLight }]}>
              {p.image ? (
                <Image source={{ uri: p.image }} style={s.productImg} contentFit="cover" />
              ) : (
                <Text style={s.productEmoji}>{p.emoji ?? '🧴'}</Text>
              )}
            </View>
            <View style={s.productInfo}>
              <Text style={s.productBrand} numberOfLines={1}>{p.brand}</Text>
              <Text style={s.productName} numberOfLines={2}>{p.name}</Text>
              <Text style={s.productPrice}>{p.price}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={s.footerWrap}>
        <FooterLink label="Voir la boutique" onPress={onOpenShop} />
      </View>
    </View>
  );
}

function RecipesTab({
  recipes,
  onOpen,
}: {
  recipes: RecoRecipe[];
  onOpen: () => void;
}) {
  return (
    <View>
      <ScrollView
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        style={s.recipeScrollWrap}
        contentContainerStyle={s.recipeScroll}
      >
        {recipes.map((r, i) => (
          <TouchableOpacity
            key={r.id}
            style={[s.recipeCard, i === recipes.length - 1 && s.recipeCardLast, { backgroundColor: r.thumb_bg }]}
            onPress={onOpen}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel={r.name}
          >
            <View style={s.recipeCatBadge}>
              <Text style={s.recipeCatText}>{r.category}</Text>
            </View>
            <View style={s.recipeEmojiWrap}>
              <Text style={s.recipeEmoji}>{r.thumb_emoji}</Text>
            </View>
            <Text style={s.recipeCardName} numberOfLines={2}>{r.name}</Text>
            <View style={s.recipeMetaRow}>
              <Ionicons name="time-outline" size={12} color={Colors.ink} />
              <Text style={s.recipeMetaText}>{r.duration} min</Text>
              {r.rating != null && (
                <>
                  <Ionicons name="star" size={11} color={Colors.amberDark} />
                  <Text style={s.recipeMetaText}>{r.rating}</Text>
                </>
              )}
            </View>
            <View style={s.recipeBadgesRow}>
              {r.difficulty ? (
                <View style={s.recipeBadge}>
                  <Text style={s.recipeBadgeText}>{r.difficulty}</Text>
                </View>
              ) : null}
              {r.ingredients && r.ingredients.length > 0 ? (
                <View style={s.recipeBadge}>
                  <Text style={s.recipeBadgeText}>{r.ingredients.length} ingr.</Text>
                </View>
              ) : null}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={s.footerWrap}>
        <FooterLink label="Toutes les recettes" onPress={onOpen} />
      </View>
    </View>
  );
}

function ArticlesTab({
  articles,
  onOpen,
}: {
  articles: RecoArticle[];
  onOpen: () => void;
}) {
  return (
    <View>
      <ScrollView
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        style={s.articleScrollWrap}
        contentContainerStyle={s.articleScroll}
      >
        {articles.map((a, i) => (
          <TouchableOpacity
            key={a.id}
            style={[s.articleCard, i === articles.length - 1 && s.articleCardLast]}
            onPress={onOpen}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel={a.title}
          >
            <View style={[s.articleThumb, { backgroundColor: a.thumb_bg }]}>
              <Text style={s.articleEmoji}>{a.thumb_emoji}</Text>
            </View>
            <Text style={s.articleTitle} numberOfLines={3}>{a.title}</Text>
            <Text style={s.articleMeta}>{a.read_time} min de lecture</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={s.footerWrap}>
        <FooterLink label="Tous les articles" onPress={onOpen} />
      </View>
    </View>
  );
}

// ── Composant principal ────────────────────────────────────────────────────

export function HomeRecoTabs({ profile }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('Produits');
  const { products: shopProducts } = useSupabaseProducts();

  const productData = useMemo(
    () => buildHomeProductRecommendations(profile, shopProducts),
    [
      profile.hairType, profile.porosity, profile.density, profile.objective,
      profile.region, profile.budget, profile.careStyle, shopProducts,
    ],
  );

  const reco = useMemo(
    () => buildOnboardingRecommendations(diagnosticSnapshotFromProfile(profile)),
    [
      profile.hairType, profile.porosity, profile.density, profile.objective,
      profile.region, profile.budget, profile.careStyle,
    ],
  );

  if (!profile.careStyle) return null;

  const hasProducts = productData.showSection && productData.products.length > 0;
  const hasRecipes  = reco.showRecipes && reco.recipes.length > 0;
  const hasArticles = reco.articles.length > 0;

  if (!hasProducts && !hasRecipes && !hasArticles) return null;

  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>Recommandations</Text>

      <View style={s.card}>
        {/* Tab bar */}
        <View style={s.tabBar}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab}
              style={[s.tabBtn, activeTab === tab && s.tabBtnActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.8}
              accessibilityRole="tab"
              accessibilityState={{ selected: activeTab === tab }}
            >
              <Text style={[s.tabLabel, activeTab === tab && s.tabLabelActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.divider} />

        {/* Contenu de l'onglet actif */}
        {activeTab === 'Produits' && (
          hasProducts
            ? <ProductsTab
                mainProblem={productData.mainProblem}
                relatedProblems={productData.relatedProblems}
                products={productData.products}
                onOpenShop={() => router.push('/shop' as any)}
              />
            : <EmptyTab label="Aucun produit recommandé pour le moment." />
        )}

        {activeTab === 'Recettes' && (
          hasRecipes
            ? <RecipesTab
                recipes={reco.recipes}
                onOpen={() => router.push('/recipes' as any)}
              />
            : <EmptyTab label="Aucune recette recommandée pour le moment." />
        )}

        {activeTab === 'Articles' && (
          hasArticles
            ? <ArticlesTab
                articles={reco.articles}
                onOpen={() => router.push('/articles' as any)}
              />
            : <EmptyTab label="Aucun article disponible pour le moment." />
        )}
      </View>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  section: { marginBottom: 22, paddingHorizontal: 14 },
  sectionTitle: {
    ...Type.cardTitle,
    fontFamily: 'Satoshi_700Bold',
    color: Colors.ink,
    marginBottom: 10,
    paddingHorizontal: 2,
  },

  /* Card container */
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
    overflow: 'hidden',
  },

  /* Tab bar */
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 4,
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: Colors.ink,
    borderColor: Colors.ink,
  },
  tabLabel: {
    fontSize: 13,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.warmGray,
  },
  tabLabelActive: {
    color: Colors.white,
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginTop: 10,
    marginBottom: 4,
  },

  /* Empty state */
  emptyWrap: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    textAlign: 'center',
    lineHeight: 19,
  },

  /* Problems row (Produits) */
  problemsRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 8,
    paddingTop: 12,
    paddingBottom: 10,
  },
  problemTile: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  mainLabel: {
    marginTop: 7,
    fontSize: 11,
    fontFamily: 'DMSans_700Bold',
    color: Colors.amberDark,
    textAlign: 'center',
    lineHeight: 14,
  },
  relatedLabel: {
    marginTop: 7,
    fontSize: 11,
    fontFamily: 'DMSans_500Medium',
    color: Colors.warmGray,
    textAlign: 'center',
    lineHeight: 14,
  },

  /* Products carousel */
  productScrollWrap: { paddingHorizontal: 16 },
  productScroll: { paddingVertical: 2 },
  productCard: {
    width: 148,
    marginRight: 10,
    backgroundColor: Colors.cream,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  productCardLast: { marginRight: 0 },
  productVisual: {
    width: '100%',
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImg: { width: '100%', height: '100%' },
  productEmoji: { fontSize: 48 },
  productInfo: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
  },
  productBrand: {
    fontSize: 10,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    marginBottom: 2,
  },
  productName: {
    fontSize: 12,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.ink,
    lineHeight: 16,
    minHeight: 36,
  },
  productPrice: {
    fontSize: 12,
    fontFamily: 'DMSans_700Bold',
    color: Colors.amberDark,
    marginTop: 8,
  },

  /* Recipes carousel */
  recipeScrollWrap: { paddingHorizontal: 16, marginTop: 12 },
  recipeScroll: { paddingVertical: 2 },
  recipeCard: {
    width: 152,
    marginRight: 10,
    borderRadius: 16,
    padding: 12,
    paddingBottom: 14,
  },
  recipeCardLast: { marginRight: 0 },
  recipeCatBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
    marginBottom: 10,
  },
  recipeCatText: {
    fontSize: 10,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.ink,
  },
  recipeEmojiWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    marginBottom: 10,
  },
  recipeEmoji: { fontSize: 42, lineHeight: 50 },
  recipeCardName: {
    fontSize: 13,
    fontFamily: 'DMSans_700Bold',
    color: Colors.ink,
    lineHeight: 18,
    minHeight: 36,
    marginBottom: 8,
  },
  recipeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  recipeMetaText: {
    fontSize: 11,
    fontFamily: 'DMSans_500Medium',
    color: Colors.ink,
  },
  recipeBadgesRow: {
    flexDirection: 'row',
    gap: 5,
    flexWrap: 'wrap',
  },
  recipeBadge: {
    backgroundColor: 'rgba(255,255,255,0.70)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  recipeBadgeText: {
    fontSize: 10,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.ink,
  },

  /* Articles carousel */
  articleScrollWrap: { paddingHorizontal: 16, marginTop: 12 },
  articleScroll: { paddingVertical: 2 },
  articleCard: {
    width: 160,
    minHeight: 188,
    marginRight: 10,
    backgroundColor: Colors.cream,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
    justifyContent: 'space-between',
  },
  articleCardLast: { marginRight: 0 },
  articleThumb: {
    width: '100%',
    height: 68,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  articleEmoji: { fontSize: 30, lineHeight: 36 },
  articleTitle: {
    fontSize: 13,
    fontFamily: 'DMSans_700Bold',
    color: Colors.ink,
    lineHeight: 18,
    minHeight: 54,
  },
  articleMeta: {
    fontSize: 11,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.growth,
    marginTop: 6,
  },

  /* Footer link commun */
  footerWrap: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  footerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 2,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    marginTop: 8,
  },
  footerLinkText: {
    fontSize: 13,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.amberDark,
  },
});
