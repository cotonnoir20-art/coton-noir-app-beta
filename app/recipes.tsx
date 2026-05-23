import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../src/theme/colors';
import { AppHeader } from '../src/components/AppHeader';
import { supabase } from '../src/lib/supabase';
import { useApp } from '../src/context/AppContext';
import { useAchievements } from '../src/context/AchievementsContext';
import { EmptyAnimation } from '../src/components/animations/EmptyAnimation';
import {
  CATALOG_RECIPES,
  CATEGORY_STYLES,
  DIFFICULTY_STYLES,
  RECIPE_CATEGORIES,
  RECIPES_HERO_STATS,
  formatRecipeLikes,
  type CatalogRecipe,
  type RecipeCategory,
} from '../src/data/recipesCatalog';

const LIKES_KEY = '@coton_noir_recipe_likes';
const REVIEWS_KEY = '@coton_noir_recipe_reviews';

const GRID_GAP = 12;
const GRID_PAD = 16;
const CARD_W = (Dimensions.get('window').width - GRID_PAD * 2 - GRID_GAP) / 2;

type Review = {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string;
};

type Recipe = CatalogRecipe & { image?: string | null };

function mapSupabaseRow(row: Record<string, unknown>): Recipe | null {
  const name = typeof row.name === 'string' ? row.name.trim() : '';
  if (!name) return null;
  const catRaw = typeof row.category === 'string' ? row.category : 'Masque';
  let category: RecipeCategory = 'Masque';
  if (catRaw === 'Huile' || catRaw === 'Traitement') category = 'Huile';
  else if (catRaw === 'Spray' || catRaw === 'Rinçage') category = 'Spray';
  else if (catRaw.toLowerCase().includes('cuir')) category = 'Cuir chevelu';

  const diffRaw = typeof row.difficulty === 'string' ? row.difficulty : 'Facile';
  const difficulty: CatalogRecipe['difficulty'] =
    diffRaw === 'Moyen' ? 'Moyen' : diffRaw === 'Difficile' ? 'Moyen' : 'Facile';

  const style = CATEGORY_STYLES[category];
  const ingredients = Array.isArray(row.ingredients)
    ? (row.ingredients as string[])
  : [];
  const steps = Array.isArray(row.steps) ? (row.steps as string[]) : [];

  return {
    id: String(row.id),
    name,
    description: typeof row.description === 'string' ? row.description : '',
    category,
    difficulty,
    duration: typeof row.duration === 'number' ? row.duration : 20,
    prep_minutes: Math.max(5, Math.round((typeof row.duration === 'number' ? row.duration : 20) * 0.35)),
    pose_minutes: Math.max(0, (typeof row.duration === 'number' ? row.duration : 20) - 10),
    rating: 4.5,
    likes: typeof row.likes === 'number' ? row.likes : 0,
    ingredient_count: ingredients.length || 3,
    avg_cost_eur: 2.5,
    thumb_emoji: category === 'Huile' ? '🌿' : category === 'Spray' ? '💧' : '🥛',
    thumb_bg: style.cardBg,
    hair_types: Array.isArray(row.hair_types) ? (row.hair_types as string[]) : [],
    ingredients,
    steps,
    image: typeof row.image === 'string' ? row.image : null,
    created_at: typeof row.created_at === 'string' ? row.created_at : new Date().toISOString(),
  };
}

export default function RecipesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ openId?: string; openName?: string }>();
  const { state } = useApp();

  const [remoteRecipes, setRemoteRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [category, setCategory] = useState<'Toutes' | RecipeCategory>('Toutes');
  const [selected, setSelected] = useState<Recipe | null>(null);
  const [likedIds, setLikedIds] = useState<Record<string, boolean>>({});
  const [favIds, setFavIds] = useState<Record<string, boolean>>({});
  const [reviews, setReviews] = useState<Record<string, Review[]>>({});
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');

  useEffect(() => {
    supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          setLoadError(error.message);
          setRemoteRecipes([]);
        } else {
          setLoadError(null);
          const mapped = (data ?? [])
            .map(r => mapSupabaseRow(r as Record<string, unknown>))
            .filter((r): r is Recipe => r != null);
          setRemoteRecipes(mapped);
        }
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(LIKES_KEY).then(raw => {
      if (raw) {
        try {
          setLikedIds(JSON.parse(raw));
        } catch {
          /* ignore */
        }
      }
    });
    AsyncStorage.getItem(REVIEWS_KEY).then(raw => {
      if (raw) {
        try {
          setReviews(JSON.parse(raw));
        } catch {
          /* ignore */
        }
      }
    });
  }, []);

  useEffect(() => {
    setReviewRating(0);
    setReviewText('');
  }, [selected?.id]);

  useEffect(() => {
    if (!selected) return;
    void isRecipeFavorite(selected.id).then(on => {
      setFavIds(prev => ({ ...prev, [selected.id]: on }));
    });
  }, [selected?.id]);

  const allRecipes = useMemo(() => {
    const ids = new Set(CATALOG_RECIPES.map(r => r.id));
    const extra = remoteRecipes.filter(r => !ids.has(r.id));
    return [...CATALOG_RECIPES, ...extra] as Recipe[];
  }, [remoteRecipes]);

  const featured = useMemo(
    () => allRecipes.find(r => r.featured) ?? allRecipes[0] ?? null,
    [allRecipes],
  );

  const filtered = useMemo(() => {
    const list = allRecipes.filter(r => !r.featured || r.id !== featured?.id);
    if (category === 'Toutes') return list;
    return list.filter(r => r.category === category);
  }, [allRecipes, category, featured?.id]);

  useEffect(() => {
    const openId = params.openId?.trim();
    if (!openId || loading) return;
    const found = allRecipes.find(r => r.id === openId);
    if (found) setSelected(found);
  }, [params.openId, allRecipes, loading]);

  const { refreshExtras } = useAchievements();

  async function toggleFavorite(recipe: Recipe) {
    const on = await toggleRecipeFavorite({
      id: recipe.id,
      name: recipe.name,
      category: recipe.category,
      thumbEmoji: recipe.thumb_emoji,
    });
    setFavIds(prev => {
      const next = { ...prev };
      if (on) next[recipe.id] = true;
      else delete next[recipe.id];
      return next;
    });
    void refreshExtras();
  }

  function toggleLike(id: string) {
    setLikedIds(prev => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = true;
      AsyncStorage.setItem(LIKES_KEY, JSON.stringify(next)).then(() => refreshExtras());
      return next;
    });
  }

  function likeCount(r: Recipe): number {
    return (r.likes ?? 0) + (likedIds[r.id] ? 1 : 0);
  }

  function submitReview() {
    if (!selected || reviewRating < 1) return;
    const review: Review = {
      id: `${Date.now()}`,
      author: state.profile?.name?.trim() || 'Anonyme',
      rating: reviewRating,
      text: reviewText.trim(),
      date: new Date().toISOString(),
    };
    setReviews(prev => {
      const list = prev[selected.id] ?? [];
      const next = { ...prev, [selected.id]: [review, ...list] };
      AsyncStorage.setItem(REVIEWS_KEY, JSON.stringify(next));
      return next;
    });
    setReviewRating(0);
    setReviewText('');
  }

  const selectedReviews = selected ? reviews[selected.id] ?? [] : [];
  const avgRating =
    selectedReviews.length > 0
      ? selectedReviews.reduce((a, r) => a + r.rating, 0) / selectedReviews.length
      : selected?.rating ?? 0;

  return (
    <SafeAreaView style={S.safe} edges={['top']}>
      <AppHeader title="Recettes" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.scroll}>
        {/* Hero */}
        <View style={S.heroCard}>
          <Text style={S.heroLabel}>🌿 Recettes naturelles</Text>
          <Text style={S.heroTitle}>Du frigo aux cheveux</Text>
          <Text style={S.heroDesc}>
            {RECIPES_HERO_STATS.count} recettes 100 % naturelles validées par notre experte.
            Économiques, écolos, et efficaces.
          </Text>
          <View style={S.heroStats}>
            <Text style={S.heroStat}>
              <Text style={S.heroStatBold}>{RECIPES_HERO_STATS.count}</Text> recettes
            </Text>
            <Text style={S.heroStat}>
              <Text style={S.heroStatBold}>{RECIPES_HERO_STATS.avgCost}</Text> coût moyen
            </Text>
            <Text style={S.heroStat}>
              <Text style={S.heroStatBold}>{RECIPES_HERO_STATS.avgMinutes} min</Text> en moyenne
            </Text>
          </View>
          <Text style={S.heroLeaf} pointerEvents="none">
            🍃
          </Text>
        </View>

        {/* Filtres */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={S.filtersRow}
          style={S.filtersScroll}
        >
          {RECIPE_CATEGORIES.map(cat => {
            const active = category === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[S.filterChip, active && S.filterChipActive]}
                onPress={() => setCategory(cat.id)}
                activeOpacity={0.85}
              >
                {cat.emoji ? <Text style={S.filterEmoji}>{cat.emoji}</Text> : null}
                <Text style={[S.filterText, active && S.filterTextActive]}>{cat.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {loading && remoteRecipes.length === 0 ? (
          <View style={S.loaderWrap}>
            <ActivityIndicator color={Colors.sage} />
          </View>
        ) : null}

        {loadError ? <Text style={S.errorHint}>Connexion recettes : {loadError}</Text> : null}

        {/* Signature */}
        {featured && (category === 'Toutes' || featured.category === category) ? (
          <FeaturedRecipeCard
            recipe={featured}
            likeCount={likeCount(featured)}
            onPress={() => setSelected(featured)}
          />
        ) : null}

        {/* Grille populaires */}
        <Text style={S.sectionTitle}>Recettes populaires</Text>

        {filtered.length === 0 ? (
          <View style={S.emptyWrap}>
            <EmptyAnimation emoji="🔍" size={72} />
            <Text style={S.emptyText}>Aucune recette dans cette catégorie</Text>
          </View>
        ) : (
          <View style={S.grid}>
            {filtered.map(r => (
              <RecipeGridCard key={r.id} recipe={r} onPress={() => setSelected(r)} />
            ))}
          </View>
        )}

        {/* CTA communauté */}
        <View style={S.ctaBanner}>
          <Text style={S.ctaEmoji}>📖</Text>
          <View style={S.ctaTextWrap}>
            <Text style={S.ctaTitle}>Tu as ta propre recette ?</Text>
            <Text style={S.ctaSub}>Partage-la avec la communauté · +30 pts</Text>
          </View>
          <TouchableOpacity
            style={S.ctaBtn}
            onPress={() => router.push('/community')}
            activeOpacity={0.88}
          >
            <Text style={S.ctaBtnText}>Ajouter</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 28 }} />
      </ScrollView>

      {/* Détail recette */}
      <Modal
        visible={!!selected}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelected(null)}
      >
        {selected ? (
          <SafeAreaView style={S.modalSafe} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.modalScroll}>
              <View style={S.modalHero}>
                {selected.image ? (
                  <Image source={{ uri: selected.image }} style={S.modalHeroImg} contentFit="cover" />
                ) : (
                  <LinearGradient
                    colors={[selected.thumb_bg, Colors.cream]}
                    style={S.modalHeroImg}
                  >
                    <Text style={S.modalHeroEmoji}>{selected.thumb_emoji}</Text>
                  </LinearGradient>
                )}
                <TouchableOpacity style={S.modalClose} onPress={() => setSelected(null)}>
                  <Ionicons name="close" size={20} color={Colors.ink} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={S.modalLike}
                  onPress={() => toggleLike(selected.id)}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name={likedIds[selected.id] ? 'heart' : 'heart-outline'}
                    size={22}
                    color={likedIds[selected.id] ? Colors.rose : Colors.ink}
                  />
                </TouchableOpacity>
              </View>

              <View style={S.modalBody}>
                <Text style={S.modalTitle}>{selected.name}</Text>

                <View style={S.modalPills}>
                  <View style={S.timePill}>
                    <Text style={S.timePillText}>
                      ⏱️ {selected.prep_minutes} min de prep
                      {selected.pose_minutes > 0 ? ` + ${selected.pose_minutes} min de pose` : ''}
                    </Text>
                  </View>
                  <DifficultyBadge difficulty={selected.difficulty} />
                  <View style={S.ratingPill}>
                    <Text style={S.ratingPillText}>⭐ {selected.rating.toFixed(1)}</Text>
                  </View>
                </View>

                {selected.description ? (
                  <Text style={S.modalDesc}>{selected.description}</Text>
                ) : null}

                {selected.hair_types?.length > 0 ? (
                  <View style={S.block}>
                    <Text style={S.blockTitle}>Types de cheveux</Text>
                    <View style={S.tagsRow}>
                      {selected.hair_types.map((t, i) => (
                        <View key={i} style={S.tag}>
                          <Text style={S.tagText}>{t}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}

                {selected.ingredients.length > 0 ? (
                  <View style={S.block}>
                    <Text style={S.blockTitle}>🧴 Ingrédients</Text>
                    {selected.ingredients.map((ing, i) => (
                      <View key={i} style={S.ingredRow}>
                        <View style={S.ingredDot} />
                        <Text style={S.ingredText}>{ing}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                <TouchableOpacity
                  style={S.routineCta}
                  onPress={() => {
                    setSelected(null);
                    router.push({
                      pathname: '/routine-plan',
                      params: { kind: 'washday', source: 'recipe', recipeId: selected.id },
                    } as any);
                  }}
                  activeOpacity={0.88}
                >
                  <Text style={S.routineCtaText}>🧴 Noter dans ma routine</Text>
                </TouchableOpacity>

                {selected.steps.length > 0 ? (
                  <View style={S.block}>
                    <Text style={S.blockTitle}>📋 Étapes</Text>
                    {selected.steps.map((step, i) => (
                      <View key={i} style={S.stepRow}>
                        <View style={S.stepNum}>
                          <Text style={S.stepNumText}>{i + 1}</Text>
                        </View>
                        <Text style={S.stepText}>{step}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}

                <View style={S.block}>
                  <View style={S.reviewsHead}>
                    <Text style={S.blockTitle}>⭐ Avis ({selectedReviews.length})</Text>
                    {selectedReviews.length > 0 ? (
                      <Text style={S.avgRating}>{avgRating.toFixed(1)} / 5</Text>
                    ) : null}
                  </View>

                  <View style={S.reviewForm}>
                    <Text style={S.reviewFormLabel}>Donne ton avis</Text>
                    <View style={S.starRow}>
                      {[1, 2, 3, 4, 5].map(n => (
                        <TouchableOpacity key={n} onPress={() => setReviewRating(n)} hitSlop={6}>
                          <Ionicons
                            name={n <= reviewRating ? 'star' : 'star-outline'}
                            size={26}
                            color={Colors.amber}
                          />
                        </TouchableOpacity>
                      ))}
                    </View>
                    <TextInput
                      style={S.reviewInput}
                      placeholder="Comment as-tu trouvé cette recette ?"
                      placeholderTextColor={Colors.warmGray}
                      value={reviewText}
                      onChangeText={setReviewText}
                      multiline
                      maxLength={300}
                    />
                    <TouchableOpacity
                      style={[S.reviewSubmit, reviewRating === 0 && S.reviewSubmitOff]}
                      onPress={submitReview}
                      disabled={reviewRating === 0}
                    >
                      <Text style={S.reviewSubmitText}>Publier mon avis</Text>
                    </TouchableOpacity>
                  </View>

                  {selectedReviews.length > 0 ? (
                    selectedReviews.map(rev => (
                      <View key={rev.id} style={S.reviewCard}>
                        <View style={S.reviewTop}>
                          <Text style={S.reviewAuthor}>{rev.author}</Text>
                          <View style={S.reviewStars}>
                            {[1, 2, 3, 4, 5].map(n => (
                              <Ionicons
                                key={n}
                                name={n <= rev.rating ? 'star' : 'star-outline'}
                                size={12}
                                color={Colors.amber}
                              />
                            ))}
                          </View>
                        </View>
                        {rev.text ? <Text style={S.reviewText}>{rev.text}</Text> : null}
                        <Text style={S.reviewDate}>
                          {new Date(rev.date).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={S.reviewsEmpty}>
                      Sois le 1ᵉʳ à donner ton avis sur cette recette.
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  style={[S.likeBtnBig, likedIds[selected.id] && S.likeBtnBigActive]}
                  onPress={() => toggleLike(selected.id)}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name={likedIds[selected.id] ? 'heart' : 'heart-outline'}
                    size={16}
                    color={likedIds[selected.id] ? '#fff' : Colors.rose}
                  />
                  <Text style={[S.likeBtnBigText, likedIds[selected.id] && { color: '#fff' }]}>
                    {likedIds[selected.id] ? 'Aimée' : "J'aime"} · {likeCount(selected)}
                  </Text>
                </TouchableOpacity>

                <View style={{ height: 32 }} />
              </View>
            </ScrollView>
          </SafeAreaView>
        ) : null}
      </Modal>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

function DifficultyBadge({ difficulty }: { difficulty: CatalogRecipe['difficulty'] }) {
  const d = DIFFICULTY_STYLES[difficulty];
  return (
    <View style={[S.diffPill, { backgroundColor: d.bg }]}>
      <Text style={[S.diffPillText, { color: d.text }]}>{difficulty}</Text>
    </View>
  );
}

function FeaturedRecipeCard({
  recipe,
  likeCount: likes,
  onPress,
}: {
  recipe: Recipe;
  likeCount: number;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={S.featuredCard} activeOpacity={0.92} onPress={onPress}>
      <View style={[S.featuredHero, { backgroundColor: recipe.thumb_bg }]}>
        {recipe.signature ? (
          <View style={S.sigBadge}>
            <Text style={S.sigBadgeText}>⭐ Signature</Text>
          </View>
        ) : null}
        <View style={S.likesBadge}>
          <Ionicons name="heart" size={11} color="#fff" />
          <Text style={S.likesBadgeText}>{formatRecipeLikes(likes)}</Text>
        </View>
        <Text style={S.featuredEmoji}>{recipe.thumb_emoji}</Text>
      </View>
      <View style={S.featuredBody}>
        <Text style={S.featuredTitle}>{recipe.name}</Text>
        <Text style={S.featuredDesc} numberOfLines={2}>
          {recipe.description}
        </Text>
        <View style={S.featuredPills}>
          <View style={S.timePill}>
            <Text style={S.timePillText} numberOfLines={1}>
              ⏱️ {recipe.prep_minutes} min de prep
              {recipe.pose_minutes > 0 ? ` + ${recipe.pose_minutes} min de pose` : ''}
            </Text>
          </View>
          <DifficultyBadge difficulty={recipe.difficulty} />
          <View style={S.ratingPill}>
            <Text style={S.ratingPillText}>⭐ {recipe.rating.toFixed(1)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function RecipeGridCard({ recipe, onPress }: { recipe: Recipe; onPress: () => void }) {
  const catStyle = CATEGORY_STYLES[recipe.category];
  const diffStyle = DIFFICULTY_STYLES[recipe.difficulty];
  return (
    <TouchableOpacity
      style={[S.gridCard, { width: CARD_W }]}
      activeOpacity={0.88}
      onPress={onPress}
    >
      <View style={[S.gridHero, { backgroundColor: recipe.thumb_bg }]}>
        <Text style={S.gridEmoji}>{recipe.thumb_emoji}</Text>
        <View style={[S.gridCatBadge, { backgroundColor: Colors.surface }]}>
          <Text style={[S.gridCatText, { color: catStyle.text }]}>{recipe.category}</Text>
        </View>
      </View>
      <View style={S.gridBody}>
        <Text style={S.gridTitle} numberOfLines={2}>
          {recipe.name}
        </Text>
        <View style={S.gridMeta}>
          <View style={S.gridMetaItem}>
            <Ionicons name="time-outline" size={11} color={Colors.warmGray} />
            <Text style={S.gridMetaText}>{recipe.duration} min</Text>
          </View>
          <View style={S.gridMetaItem}>
            <Ionicons name="star" size={11} color={Colors.amber} />
            <Text style={S.gridMetaText}>{recipe.rating.toFixed(1)}</Text>
          </View>
        </View>
        <View style={S.gridBadges}>
          <View style={[S.diffPillSmall, { backgroundColor: diffStyle.bg }]}>
            <Text style={[S.diffPillSmallText, { color: diffStyle.text }]}>
              {recipe.difficulty}
            </Text>
          </View>
          <View style={S.ingPill}>
            <Text style={S.ingPillText}>{recipe.ingredient_count} ingrédients</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingBottom: 8 },

  heroCard: {
    marginHorizontal: 16,
    marginBottom: 18,
    backgroundColor: '#E2EDD8',
    borderRadius: 22,
    padding: 18,
    overflow: 'hidden',
    position: 'relative',
  },
  heroLabel: {
    fontSize: 12,
    fontFamily: 'DMSans_600SemiBold',
    color: '#3A6B2A',
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontFamily: 'Poppins_700Bold',
    color: '#1A3D12',
    marginBottom: 8,
  },
  heroDesc: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: 'DMSans_400Regular',
    color: '#3A6B2A',
    marginBottom: 14,
    paddingRight: 48,
  },
  heroStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  heroStat: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: '#3A6B2A',
  },
  heroStatBold: {
    fontFamily: 'DMSans_700Bold',
    color: '#1A3D12',
  },
  heroLeaf: {
    position: 'absolute',
    right: 12,
    bottom: 8,
    fontSize: 56,
    opacity: 0.35,
  },

  filtersScroll: { flexGrow: 0, marginBottom: 18 },
  filtersRow: { paddingHorizontal: 16, gap: 8, alignItems: 'center' },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 5,
  },
  filterChipActive: { backgroundColor: Colors.ink, borderColor: Colors.ink },
  filterEmoji: { fontSize: 13 },
  filterText: { fontSize: 13, fontFamily: 'DMSans_600SemiBold', color: Colors.warmGray },
  filterTextActive: { color: '#fff' },

  loaderWrap: { paddingVertical: 20, alignItems: 'center' },
  errorHint: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    paddingHorizontal: 20,
    marginBottom: 8,
  },

  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: Colors.ink,
    paddingHorizontal: 16,
    marginBottom: 14,
  },

  emptyWrap: { alignItems: 'center', paddingVertical: 32 },
  emptyText: {
    fontSize: 14,
    fontFamily: 'DMSans_500Medium',
    color: Colors.warmGray,
    marginTop: 8,
  },

  featuredCard: {
    marginHorizontal: 16,
    marginBottom: 24,
    backgroundColor: Colors.surface,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#1A1209',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 3,
  },
  featuredHero: {
    height: 168,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  featuredEmoji: { fontSize: 64 },
  sigBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: '#FDE8C8',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  sigBadgeText: { fontSize: 11, fontFamily: 'DMSans_700Bold', color: Colors.ink },
  likesBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(74,48,109,0.85)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  likesBadgeText: { fontSize: 11, fontFamily: 'DMSans_600SemiBold', color: '#fff' },
  featuredBody: { padding: 16 },
  featuredTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: 'Poppins_700Bold',
    color: Colors.ink,
    marginBottom: 8,
  },
  featuredDesc: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    marginBottom: 12,
  },
  featuredPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  timePill: {
    backgroundColor: Colors.cream,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    maxWidth: '100%',
  },
  timePillText: { fontSize: 11, fontFamily: 'DMSans_500Medium', color: Colors.warmGray },
  diffPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  diffPillText: { fontSize: 11, fontFamily: 'DMSans_700Bold' },
  ratingPill: {
    backgroundColor: Colors.amberLight,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  ratingPillText: { fontSize: 11, fontFamily: 'DMSans_700Bold', color: Colors.amberDark },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: GRID_PAD,
    gap: GRID_GAP,
    marginBottom: 24,
  },
  gridCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  gridHero: {
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  gridEmoji: { fontSize: 40 },
  gridCatBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  gridCatText: { fontSize: 10, fontFamily: 'DMSans_700Bold' },
  gridBody: { padding: 10 },
  gridTitle: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'DMSans_700Bold',
    color: Colors.ink,
    marginBottom: 6,
    minHeight: 36,
  },
  gridMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  gridMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  gridMetaText: { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray },
  gridBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  diffPillSmall: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  diffPillSmallText: { fontSize: 10, fontFamily: 'DMSans_700Bold' },
  ingPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  ingPillText: { fontSize: 10, fontFamily: 'DMSans_500Medium', color: Colors.warmGray },

  ctaBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    backgroundColor: Colors.amberPowder,
    borderRadius: 18,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ctaEmoji: { fontSize: 28 },
  ctaTextWrap: { flex: 1, minWidth: 0 },
  ctaTitle: { fontSize: 14, fontFamily: 'DMSans_700Bold', color: Colors.ink },
  ctaSub: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    marginTop: 2,
  },
  ctaBtn: {
    backgroundColor: Colors.ink,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  ctaBtnText: { fontSize: 13, fontFamily: 'DMSans_700Bold', color: '#fff' },

  modalSafe: { flex: 1, backgroundColor: Colors.bg },
  modalScroll: { paddingBottom: 0 },
  modalHero: { height: 220, position: 'relative', backgroundColor: Colors.cream },
  modalHeroImg: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  modalHeroEmoji: { fontSize: 96 },
  modalClose: {
    position: 'absolute',
    top: 12,
    left: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalLike: {
    position: 'absolute',
    top: 12,
    right: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: { paddingHorizontal: 20, paddingTop: 20 },
  modalTitle: {
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    color: Colors.ink,
    lineHeight: 28,
    marginBottom: 12,
  },
  modalPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  modalDesc: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    lineHeight: 21,
    marginBottom: 18,
  },
  block: { marginBottom: 20 },
  blockTitle: { fontSize: 15, fontFamily: 'DMSans_700Bold', color: Colors.ink, marginBottom: 10 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { backgroundColor: Colors.amberLight, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  tagText: { fontSize: 12, fontFamily: 'DMSans_600SemiBold', color: Colors.amberDark },
  ingredRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  ingredDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.sage,
    marginTop: 6,
  },
  ingredText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: Colors.ink,
    lineHeight: 20,
  },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  stepNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: { fontSize: 12, fontFamily: 'DMSans_700Bold', color: '#fff' },
  stepText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: Colors.ink,
    lineHeight: 20,
  },
  reviewsHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  avgRating: { fontSize: 13, fontFamily: 'DMSans_700Bold', color: Colors.amber },
  reviewForm: {
    backgroundColor: Colors.cream,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  reviewFormLabel: { fontSize: 13, fontFamily: 'DMSans_700Bold', color: Colors.ink, marginBottom: 8 },
  starRow: { flexDirection: 'row', gap: 4, marginBottom: 10 },
  reviewInput: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: Colors.ink,
    minHeight: 64,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  reviewSubmit: {
    backgroundColor: Colors.ink,
    borderRadius: 10,
    paddingVertical: 11,
    alignItems: 'center',
  },
  reviewSubmitOff: { backgroundColor: Colors.warmGray, opacity: 0.6 },
  reviewSubmitText: { fontSize: 13, fontFamily: 'DMSans_700Bold', color: '#fff' },
  routineCta: {
    backgroundColor: Colors.ink,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  routineCtaText: {
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
    color: '#fff',
  },
  reviewCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    marginBottom: 8,
  },
  reviewTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  reviewAuthor: { fontSize: 13, fontFamily: 'DMSans_700Bold', color: Colors.ink },
  reviewStars: { flexDirection: 'row', gap: 2 },
  reviewText: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: Colors.ink,
    lineHeight: 19,
    marginBottom: 6,
  },
  reviewDate: { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray },
  reviewsEmpty: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
  likeBtnBig: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#FEE2E2',
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  likeBtnBigActive: { backgroundColor: Colors.rose },
  likeBtnBigText: { fontSize: 13, fontFamily: 'DMSans_700Bold', color: Colors.rose },
  recipeActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.cream,
  },
  secondaryActionBtnActive: {
    borderColor: Colors.ink,
    backgroundColor: Colors.amberLight,
  },
  secondaryActionText: {
    fontSize: 12,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.ink,
  },
});
