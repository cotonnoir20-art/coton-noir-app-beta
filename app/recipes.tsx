import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../src/theme/colors';
import { supabase } from '../src/lib/supabase';
import { useApp } from '../src/context/AppContext';
import { useAuth } from '../src/context/AuthContext';
import { AppHeader } from '../src/components/AppHeader';
import { EmptyAnimation } from '../src/components/animations/EmptyAnimation';
import { getDemoRecipes } from '../src/data/demoUsers';

// Stockage local des likes / avis (per device, pas de Supabase)
const LIKES_KEY    = '@coton_noir_recipe_likes';
const REVIEWS_KEY  = '@coton_noir_recipe_reviews';

type Review = {
  id:     string;
  author: string;
  rating: number;
  text:   string;
  date:   string;
};

type Recipe = {
  id:          string;
  name:        string;
  description: string | null;
  category:    string | null;
  difficulty:  string;
  duration:    number | null;
  hair_types:  string[];
  ingredients: string[];
  steps:       string[];
  image:       string | null;
  likes:       number;
  created_at:  string;
};

const CATEGORIES = ['Toutes', 'Masque', 'Huile', 'Traitement', 'Rinçage', 'Spray'];

const DIFF_COLOR: Record<string, string> = {
  Facile:   Colors.sage,
  Moyen:    Colors.amber,
  Difficile: Colors.rose,
};

const CAT_EMOJI: Record<string, string> = {
  Masque:     '🧴',
  Huile:      '🫒',
  Traitement: '✨',
  Rinçage:    '💧',
  Spray:      '🌿',
};

type SortKey = 'recent' | 'popular' | 'fastest' | 'easiest' | 'az';

const SORT_OPTIONS: { key: SortKey; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { key: 'recent',  label: 'Récentes',     icon: 'time-outline'        },
  { key: 'popular', label: 'Plus aimées',  icon: 'heart-outline'       },
  { key: 'fastest', label: 'Plus rapides', icon: 'flash-outline'       },
  { key: 'easiest', label: 'Plus faciles', icon: 'happy-outline'       },
  { key: 'az',      label: 'A - Z',        icon: 'text-outline'        },
];

const DIFF_RANK: Record<string, number> = {
  Facile:    0,
  Moyen:     1,
  Difficile: 2,
};

export default function RecipesScreen() {
  const router = useRouter();
  const { state } = useApp();
  const { session } = useAuth();
  const email = session?.user?.email;

  const [recipes, setRecipes]     = useState<Recipe[]>([]);
  const [loading, setLoading]     = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch]       = useState('');
  const [category, setCategory]   = useState('Toutes');
  const [selected, setSelected]   = useState<Recipe | null>(null);
  const [sort, setSort]           = useState<SortKey>('recent');
  const [sortOpen, setSortOpen]   = useState(false);

  // Likes (per recipe, persisté sur l'appareil)
  const [likedIds, setLikedIds] = useState<Record<string, boolean>>({});
  // Reviews (per recipe id → liste d'avis)
  const [reviews, setReviews]   = useState<Record<string, Review[]>>({});
  // Form d'ajout d'avis
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText,   setReviewText]   = useState('');

  useEffect(() => {
    supabase.from('recipes').select('*').order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          setLoadError(error.message);
          setRecipes([]);
        } else {
          setLoadError(null);
          setRecipes((data ?? []) as Recipe[]);
        }
        setLoading(false);
      });
  }, []);

  // Chargement initial des likes et avis depuis AsyncStorage
  useEffect(() => {
    AsyncStorage.getItem(LIKES_KEY).then(raw => {
      if (raw) {
        try { setLikedIds(JSON.parse(raw)); } catch {}
      }
    });
    AsyncStorage.getItem(REVIEWS_KEY).then(raw => {
      if (raw) {
        try { setReviews(JSON.parse(raw)); } catch {}
      }
    });
  }, []);

  // Reset form quand on change de recette
  useEffect(() => {
    setReviewRating(0);
    setReviewText('');
  }, [selected?.id]);

  // Recettes démo (Britta, Lola, Paula) en plus de celles de Supabase
  const demoRecipes = getDemoRecipes(email) as Recipe[];
  const allRecipes  = [...demoRecipes, ...recipes];

  const filteredRaw = allRecipes.filter(r => {
    const matchCat    = category === 'Toutes' || r.category === category;
    const matchSearch = !search || r.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  function toggleLike(id: string) {
    setLikedIds(prev => {
      const next = { ...prev };
      if (next[id]) delete next[id]; else next[id] = true;
      AsyncStorage.setItem(LIKES_KEY, JSON.stringify(next));
      return next;
    });
  }

  function likeCount(r: Recipe): number {
    return (r.likes ?? 0) + (likedIds[r.id] ? 1 : 0);
  }

  const filtered = useMemo(() => {
    const arr = [...filteredRaw];
    switch (sort) {
      case 'popular':
        return arr.sort((a, b) => likeCount(b) - likeCount(a));
      case 'fastest':
        return arr.sort((a, b) => (a.duration ?? 9999) - (b.duration ?? 9999));
      case 'easiest':
        return arr.sort((a, b) => (DIFF_RANK[a.difficulty] ?? 1) - (DIFF_RANK[b.difficulty] ?? 1));
      case 'az':
        return arr.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
      case 'recent':
      default:
        return arr.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
    }
    // filteredRaw recomputé via useState/recipes, on inclut explicitement les déps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredRaw, sort, likedIds]);

  const sortLabel = SORT_OPTIONS.find(o => o.key === sort)?.label ?? 'Récentes';

  function submitReview() {
    if (!selected) return;
    if (reviewRating < 1) return;
    const review: Review = {
      id:     `${Date.now()}`,
      author: state.profile?.name?.trim() || 'Anonyme',
      rating: reviewRating,
      text:   reviewText.trim(),
      date:   new Date().toISOString(),
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

  const selectedReviews: Review[] = useMemo(
    () => (selected ? reviews[selected.id] ?? [] : []),
    [selected, reviews],
  );

  const avgRating = useMemo(() => {
    if (selectedReviews.length === 0) return 0;
    const sum = selectedReviews.reduce((acc, r) => acc + r.rating, 0);
    return sum / selectedReviews.length;
  }, [selectedReviews]);

  return (
    <SafeAreaView style={S.safe} edges={['top']}>

      <AppHeader title="Recettes maison" />

      {/* Search */}
      <View style={S.searchRow}>
        <Ionicons name="search-outline" size={16} color={Colors.warmGray} style={S.searchIcon} />
        <TextInput
          style={S.searchInput}
          placeholder="Rechercher une recette..."
          placeholderTextColor={Colors.warmGray}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={Colors.warmGray} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filtres catégories + Tri */}
      <View style={S.filtersBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={S.filtersRow}
          style={S.filtersScroll}
        >
          {CATEGORIES.map(cat => {
            const active = category === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[S.filterChip, active && S.filterChipActive]}
                onPress={() => setCategory(cat)}
              >
                {cat !== 'Toutes' && (
                  <Text style={S.filterChipEmoji}>{CAT_EMOJI[cat] ?? '🧪'}</Text>
                )}
                <Text style={[S.filterChipText, active && S.filterChipTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <TouchableOpacity
          style={S.sortBtn}
          onPress={() => setSortOpen(true)}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Trier les recettes"
        >
          <Ionicons name="swap-vertical-outline" size={14} color={Colors.ink} />
          <Text style={S.sortBtnText} numberOfLines={1}>{sortLabel}</Text>
          <Ionicons name="chevron-down" size={13} color={Colors.warmGray} />
        </TouchableOpacity>
      </View>

      {/* Liste */}
      {loading && allRecipes.length === 0 ? (
        <View style={S.center}>
          <ActivityIndicator color={Colors.amber} size="large" />
        </View>
      ) : filtered.length === 0 ? (
        <View style={S.center}>
          <EmptyAnimation emoji={loadError ? '⚠️' : '🔍'} size={96} />
          <Text style={S.emptyText}>
            {loadError
              ? `Connexion recettes : ${loadError}`
              : 'Aucune recette trouvée'}
          </Text>
          {loadError ? (
            <Text style={S.emptyHint}>
              Vérifie dans Supabase : table « recipes » + policy SELECT pour anon (voir supabase/recipes-rls-fix.sql).
            </Text>
          ) : null}
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.list}>
          {filtered.map(r => (
            <TouchableOpacity
              key={r.id}
              style={S.card}
              activeOpacity={0.85}
              onPress={() => setSelected(r)}
            >
              {r.image?.trim() ? (
                <Image
                  source={{ uri: r.image.trim() }}
                  style={S.cardThumb}
                  contentFit="cover"
                  transition={200}
                />
              ) : null}
              <View style={S.cardPad}>
              {/* Top row */}
              <View style={S.cardTop}>
                <View style={S.catBadge}>
                  <Text style={S.catBadgeText}>
                    {CAT_EMOJI[r.category ?? ''] ?? '🧪'} {r.category ?? 'Autre'}
                  </Text>
                </View>
                <View style={[S.diffBadge, { backgroundColor: (DIFF_COLOR[r.difficulty] ?? Colors.sage) + '22' }]}>
                  <Text style={[S.diffText, { color: DIFF_COLOR[r.difficulty] ?? Colors.sage }]}>
                    {r.difficulty}
                  </Text>
                </View>
              </View>

              {/* Nom + description */}
              <Text style={S.cardName}>{r.name}</Text>
              {r.description && (
                <Text style={S.cardDesc} numberOfLines={2}>{r.description}</Text>
              )}

              {/* Infos bas */}
              <View style={S.cardFooter}>
                {r.duration && (
                  <View style={S.footerItem}>
                    <Ionicons name="time-outline" size={13} color={Colors.warmGray} />
                    <Text style={S.footerText}>{r.duration} min</Text>
                  </View>
                )}
                <View style={S.footerItem}>
                  <Ionicons name="flask-outline" size={13} color={Colors.warmGray} />
                  <Text style={S.footerText}>{(r.ingredients ?? []).length} ingrédients</Text>
                </View>
                {r.hair_types?.length > 0 && (
                  <View style={S.footerItem}>
                    <Ionicons name="person-outline" size={13} color={Colors.warmGray} />
                    <Text style={S.footerText}>{r.hair_types.slice(0, 2).join(', ')}{r.hair_types.length > 2 ? '…' : ''}</Text>
                  </View>
                )}
                <View style={[S.footerItem, { marginLeft: 'auto' }]}>
                  <Ionicons
                    name={likedIds[r.id] ? 'heart' : 'heart-outline'}
                    size={13}
                    color={likedIds[r.id] ? Colors.rose : Colors.warmGray}
                  />
                  <Text style={S.footerText}>{likeCount(r)}</Text>
                </View>
              </View>
              </View>
            </TouchableOpacity>
          ))}
          <View style={{ height: 20 }} />
        </ScrollView>
      )}

      {/* Modal détail recette */}
      <Modal visible={!!selected} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelected(null)}>
        {selected && (
          <SafeAreaView style={S.modalSafe} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.modalScroll}>

              {/* ── Hero image ── */}
              <View style={S.hero}>
                {selected.image ? (
                  <Image
                    source={{ uri: selected.image }}
                    style={S.heroImg}
                    contentFit="cover"
                    transition={200}
                  />
                ) : (
                  <LinearGradient
                    colors={[Colors.amberLight, Colors.cream]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={S.heroImg}
                  >
                    <Text style={S.heroEmoji}>
                      {CAT_EMOJI[selected.category ?? ''] ?? '🧪'}
                    </Text>
                  </LinearGradient>
                )}

                {/* Bouton fermer */}
                <TouchableOpacity style={S.heroBackBtn} onPress={() => setSelected(null)}>
                  <Ionicons name="close" size={20} color={Colors.ink} />
                </TouchableOpacity>

                {/* Bouton like */}
                <TouchableOpacity
                  style={S.heroLikeBtn}
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

              {/* ── Body ── */}
              <View style={S.modalContent}>

                {/* Titre + likes */}
                <View style={S.titleRow}>
                  <Text style={S.modalTitle}>{selected.name}</Text>
                  <View style={S.likesPill}>
                    <Ionicons name="heart" size={13} color={Colors.rose} />
                    <Text style={S.likesPillText}>{likeCount(selected)}</Text>
                  </View>
                </View>

                {/* Badges */}
                <View style={S.modalBadges}>
                  <View style={S.catBadge}>
                    <Text style={S.catBadgeText}>
                      {CAT_EMOJI[selected.category ?? ''] ?? '🧪'} {selected.category ?? 'Autre'}
                    </Text>
                  </View>
                  <View style={[S.diffBadge, { backgroundColor: (DIFF_COLOR[selected.difficulty] ?? Colors.sage) + '22' }]}>
                    <Text style={[S.diffText, { color: DIFF_COLOR[selected.difficulty] ?? Colors.sage }]}>
                      {selected.difficulty}
                    </Text>
                  </View>
                  {selected.duration && (
                    <View style={S.timeBadge}>
                      <Ionicons name="time-outline" size={12} color={Colors.warmGray} />
                      <Text style={S.timeText}>{selected.duration} min</Text>
                    </View>
                  )}
                </View>

                {/* Description */}
                {selected.description && (
                  <Text style={S.modalDesc}>{selected.description}</Text>
                )}

                {/* Types de cheveux */}
                {selected.hair_types?.length > 0 && (
                  <View style={S.section}>
                    <Text style={S.sectionTitle}>Types de cheveux</Text>
                    <View style={S.tagsRow}>
                      {selected.hair_types.map((t, i) => (
                        <View key={i} style={S.tag}>
                          <Text style={S.tagText}>{t}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Ingrédients */}
                {selected.ingredients?.length > 0 && (
                  <View style={S.section}>
                    <Text style={S.sectionTitle}>🧴 Ingrédients</Text>
                    {selected.ingredients.map((ing, i) => (
                      <View key={i} style={S.ingredRow}>
                        <View style={S.ingredDot} />
                        <Text style={S.ingredText}>{ing}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Étapes */}
                {selected.steps?.length > 0 && (
                  <View style={S.section}>
                    <Text style={S.sectionTitle}>📋 Étapes</Text>
                    {selected.steps.map((step, i) => (
                      <View key={i} style={S.stepRow}>
                        <View style={S.stepNum}>
                          <Text style={S.stepNumText}>{i + 1}</Text>
                        </View>
                        <Text style={S.stepText}>{step}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* ── Avis ── */}
                <View style={S.section}>
                  <View style={S.reviewsHeader}>
                    <Text style={S.sectionTitle}>
                      ⭐ Avis ({selectedReviews.length})
                    </Text>
                    {selectedReviews.length > 0 && (
                      <Text style={S.avgRating}>
                        {avgRating.toFixed(1)} / 5
                      </Text>
                    )}
                  </View>

                  {/* Form d'ajout */}
                  <View style={S.reviewForm}>
                    <Text style={S.reviewFormLabel}>Donne ton avis</Text>

                    {/* Étoiles */}
                    <View style={S.starRow}>
                      {[1, 2, 3, 4, 5].map(n => (
                        <TouchableOpacity
                          key={n}
                          onPress={() => setReviewRating(n)}
                          hitSlop={6}
                        >
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
                      style={[
                        S.reviewSubmit,
                        reviewRating === 0 && S.reviewSubmitDisabled,
                      ]}
                      onPress={submitReview}
                      disabled={reviewRating === 0}
                      activeOpacity={0.85}
                    >
                      <Text style={S.reviewSubmitText}>Publier mon avis</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Liste des avis */}
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
                        {rev.text ? (
                          <Text style={S.reviewText}>{rev.text}</Text>
                        ) : null}
                        <Text style={S.reviewDate}>
                          {new Date(rev.date).toLocaleDateString('fr-FR', {
                            day: 'numeric', month: 'short', year: 'numeric',
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

                <View style={{ height: 32 }} />
              </View>
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>

      {/* Sort modal */}
      <Modal
        visible={sortOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSortOpen(false)}
      >
        <Pressable style={S.sortBackdrop} onPress={() => setSortOpen(false)}>
          <Pressable style={S.sortSheet} onPress={() => {}}>
            <View style={S.sortHandle} />
            <Text style={S.sortTitle}>Trier par</Text>
            {SORT_OPTIONS.map(opt => {
              const active = opt.key === sort;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[S.sortRow, active && S.sortRowActive]}
                  onPress={() => { setSort(opt.key); setSortOpen(false); }}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name={opt.icon}
                    size={18}
                    color={active ? Colors.amber : Colors.warmGray}
                  />
                  <Text style={[S.sortRowText, active && S.sortRowTextActive]}>
                    {opt.label}
                  </Text>
                  {active && (
                    <Ionicons name="checkmark" size={18} color={Colors.amber} style={{ marginLeft: 'auto' }} />
                  )}
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={S.sortClose}
              onPress={() => setSortOpen(false)}
              activeOpacity={0.85}
            >
              <Text style={S.sortCloseText}>Fermer</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 60 },
  emptyText: { fontSize: 15, fontFamily: 'DMSans_500Medium', color: Colors.warmGray },
  emptyHint: {
    marginTop: 12,
    paddingHorizontal: 28,
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    textAlign: 'center',
    lineHeight: 19,
  },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, gap: 10,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { flex: 1, fontSize: 20, fontFamily: 'Poppins_600SemiBold', color: Colors.ink },
  coinsBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.ink, borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  coinsEmoji: { fontSize: 14 },
  coinsText:  { fontSize: 14, fontFamily: 'DMSans_700Bold', color: Colors.amber },

  // Search
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginBottom: 10,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 14, paddingHorizontal: 12, paddingVertical: 10,
  },
  searchIcon:  { marginRight: 2 },
  searchInput: {
    flex: 1, fontSize: 14, fontFamily: 'DMSans_400Regular', color: Colors.ink,
  },

  // Filtres
  filtersBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
    marginBottom: 8,
    gap: 8,
  },
  filtersScroll: { flex: 1, flexGrow: 1 },
  filtersRow: {
    paddingHorizontal: 16, gap: 8,
    alignItems: 'center', paddingVertical: 6,
  },

  // Sort button + sheet
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    maxWidth: 160,
  },
  sortBtnText: {
    fontSize: 12,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.ink,
    maxWidth: 100,
  },
  sortBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sortSheet: {
    backgroundColor: Colors.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
  },
  sortHandle: {
    alignSelf: 'center',
    width: 42, height: 4, borderRadius: 2,
    backgroundColor: Colors.border,
    marginBottom: 14,
  },
  sortTitle: {
    fontSize: 17,
    fontFamily: 'Poppins_700Bold',
    color: Colors.ink,
    marginBottom: 12,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  sortRowActive: {
    backgroundColor: Colors.amberLight,
  },
  sortRowText: {
    fontSize: 14,
    fontFamily: 'DMSans_500Medium',
    color: Colors.ink,
  },
  sortRowTextActive: {
    fontFamily: 'DMSans_700Bold',
    color: Colors.amberDark,
  },
  sortClose: {
    marginTop: 14,
    alignItems: 'center',
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sortCloseText: {
    fontSize: 14,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.ink,
  },
  filterChip: {
    flexDirection: 'row',
    paddingHorizontal: 14, paddingVertical: 9,
    minHeight: 38,
    backgroundColor: Colors.surface, borderRadius: 999,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
    gap: 5,
  },
  filterChipActive: { backgroundColor: Colors.ink, borderColor: Colors.ink },
  filterChipEmoji: {
    fontSize: 14,
  },
  filterChipText: {
    fontSize: 13, fontFamily: 'DMSans_500Medium', color: Colors.warmGray,
    includeFontPadding: false as any,
  },
  filterChipTextActive: { color: '#fff' },

  // Liste
  list: { paddingHorizontal: 16, paddingTop: 4 },
  card: {
    backgroundColor: Colors.surface, borderRadius: 18,
    borderWidth: 1, borderColor: Colors.border,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardThumb: {
    width: '100%',
    height: 140,
    backgroundColor: Colors.cream,
  },
  cardPad: {
    padding: 16,
    paddingTop: 14,
  },
  cardTop: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  catBadge: {
    backgroundColor: Colors.cream, borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  catBadgeText: { fontSize: 12, fontFamily: 'DMSans_600SemiBold', color: Colors.warmGray },
  diffBadge: {
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4,
  },
  diffText: { fontSize: 12, fontFamily: 'DMSans_600SemiBold' },
  cardName: { fontSize: 16, fontFamily: 'DMSans_700Bold', color: Colors.ink, marginBottom: 4 },
  cardDesc: { fontSize: 13, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, lineHeight: 18, marginBottom: 10 },
  cardFooter: { flexDirection: 'row', gap: 14, flexWrap: 'wrap' },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontSize: 12, fontFamily: 'DMSans_400Regular', color: Colors.warmGray },

  // Modal
  modalSafe:    { flex: 1, backgroundColor: Colors.bg },
  modalScroll:  { paddingBottom: 0 },

  // Hero (image header dans le modal)
  hero: {
    width: '100%', height: 220, position: 'relative', backgroundColor: Colors.cream,
  },
  heroImg: {
    width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center',
  },
  heroEmoji: { fontSize: 96 },
  heroBackBtn: {
    position: 'absolute', top: 12, left: 16,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 2,
  },
  heroLikeBtn: {
    position: 'absolute', top: 12, right: 16,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4, elevation: 2,
  },

  titleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12,
  },
  modalTitle: {
    flex: 1, fontSize: 22, fontFamily: 'Poppins_600SemiBold', color: Colors.ink, lineHeight: 28,
  },
  likesPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#FEE2E2', borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  likesPillText: {
    fontSize: 12, fontFamily: 'DMSans_700Bold', color: Colors.rose,
  },

  modalContent: { paddingHorizontal: 20, paddingTop: 20 },
  modalBadges:  { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 14 },
  modalDesc:    { fontSize: 14, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, lineHeight: 20, marginBottom: 20 },
  timeBadge:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.surface, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: Colors.border },
  timeText:     { fontSize: 12, fontFamily: 'DMSans_500Medium', color: Colors.warmGray },

  section:      { marginBottom: 22 },
  sectionTitle: { fontSize: 15, fontFamily: 'DMSans_700Bold', color: Colors.ink, marginBottom: 12 },

  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag:     { backgroundColor: Colors.amberLight, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  tagText: { fontSize: 12, fontFamily: 'DMSans_600SemiBold', color: Colors.amber },

  ingredRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  ingredDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.amber, marginTop: 6, flexShrink: 0 },
  ingredText: { flex: 1, fontSize: 14, fontFamily: 'DMSans_400Regular', color: Colors.ink, lineHeight: 20 },

  stepRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  stepNum:     { width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.ink, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stepNumText: { fontSize: 12, fontFamily: 'DMSans_700Bold', color: '#fff' },
  stepText:    { flex: 1, fontSize: 14, fontFamily: 'DMSans_400Regular', color: Colors.ink, lineHeight: 20 },

  // ── Avis ──
  reviewsHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 12,
  },
  avgRating: {
    fontSize: 13, fontFamily: 'DMSans_700Bold', color: Colors.amber,
  },
  reviewForm: {
    backgroundColor: Colors.cream, borderRadius: 14, padding: 14,
    marginBottom: 16,
  },
  reviewFormLabel: {
    fontSize: 13, fontFamily: 'DMSans_700Bold', color: Colors.ink, marginBottom: 8,
  },
  starRow: {
    flexDirection: 'row', gap: 4, marginBottom: 10,
  },
  reviewInput: {
    backgroundColor: '#fff', borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14, fontFamily: 'DMSans_400Regular', color: Colors.ink,
    minHeight: 64, maxHeight: 110, textAlignVertical: 'top',
    marginBottom: 10,
  },
  reviewSubmit: {
    backgroundColor: Colors.ink, borderRadius: 10,
    paddingVertical: 11, alignItems: 'center',
  },
  reviewSubmitDisabled: {
    backgroundColor: Colors.warmGray, opacity: 0.6,
  },
  reviewSubmitText: {
    fontSize: 13, fontFamily: 'DMSans_700Bold', color: '#fff',
  },

  reviewCard: {
    backgroundColor: Colors.surface, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border,
    padding: 12, marginBottom: 8,
  },
  reviewTop: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 6,
  },
  reviewAuthor: {
    fontSize: 13, fontFamily: 'DMSans_700Bold', color: Colors.ink,
  },
  reviewStars: {
    flexDirection: 'row', gap: 2,
  },
  reviewText: {
    fontSize: 13, fontFamily: 'DMSans_400Regular', color: Colors.ink,
    lineHeight: 19, marginBottom: 6,
  },
  reviewDate: {
    fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray,
  },
  reviewsEmpty: {
    fontSize: 13, fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray, fontStyle: 'italic',
    textAlign: 'center', paddingVertical: 12,
  },
});
