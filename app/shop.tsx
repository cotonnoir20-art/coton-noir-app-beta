import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
  useWindowDimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/theme/colors';
import { useApp } from '../src/context/AppContext';
import { useAuth } from '../src/context/AuthContext';
import { CATEGORIES, ProductCategory } from '../src/data/products';
import { supabase } from '../src/lib/supabase';
import { AppHeader } from '../src/components/AppHeader';
import { EmptyAnimation } from '../src/components/animations/EmptyAnimation';
import { getDemoProducts, type DemoProduct } from '../src/data/demoUsers';

type Product = {
  id: string;
  brand: string;
  name: string;
  emoji: string | null;
  bg_color: string | null;
  category: string;
  price_cents: number;
  old_price_cents: number | null;
  discount_label: string | null;
  rating: number;
  rating_count: number;
  description: string | null;
  description_full: string | null;
  ingredients: string | null;
  image: string | null;
  url: string | null;
  /** absent sur anciennes lignes : traité comme « publié » */
  status?: string;
  is_featured: boolean;
  featured_badge: string | null;
  featured_bg: string | null;
  featured_accent: string | null;
};

function formatPrice(cents: number | null | undefined): string {
  if (cents == null) return '';
  return (cents / 100).toFixed(2).replace('.', ',') + ' €';
}

/** Convertit un `DemoProduct` au format `Product` attendu par le shop. */
function toShopProduct(p: DemoProduct): Product {
  return {
    id:               p.id,
    brand:            p.brand,
    name:             p.name,
    emoji:            null,                  // on a une vraie image
    bg_color:         Colors.cream,
    category:         p.category,
    price_cents:      p.price_cents,
    old_price_cents:  null,
    discount_label:   null,
    rating:           p.rating,
    rating_count:     p.rating_count,
    description:      p.description,
    description_full: p.description,
    ingredients:      null,
    image:            p.image,
    url:              p.url,
    status:           'active',
    is_featured:      false,
    featured_badge:   null,
    featured_bg:      null,
    featured_accent:  null,
  };
}

function buildDiscountLabel(p: Product): string | null {
  if (p.discount_label) return p.discount_label;
  if (p.old_price_cents && p.price_cents && p.old_price_cents > p.price_cents) {
    const pct = Math.round(((p.old_price_cents - p.price_cents) / p.old_price_cents) * 100);
    return `-${pct}%`;
  }
  return null;
}

/**
 * Calcule la luminance d'une couleur hex (ITU-R BT.709) pour décider
 * si on doit utiliser du texte clair ou foncé par-dessus.
 */
function getLuma(hex: string): number {
  const m = hex.replace('#', '').match(/^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!m) return 0;
  const r = parseInt(m[1], 16);
  const g = parseInt(m[2], 16);
  const b = parseInt(m[3], 16);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Retourne une palette de couleurs adaptée à la luminance d'un fond. */
function getSlidePalette(bg: string) {
  const isLight = getLuma(bg) > 165;
  return isLight
    ? {
        isLight: true,
        text:        '#1A1209',
        textSoft:    'rgba(26,18,9,0.78)',
        textMuted:   'rgba(26,18,9,0.55)',
        textInverse: '#FFFFFF',
        ctaBg:       '#1A1209',
        ctaFg:       '#FFFFFF',
        badgeBg:     'rgba(26,18,9,0.10)',
      }
    : {
        isLight: false,
        text:        '#FFFFFF',
        textSoft:    'rgba(255,255,255,0.88)',
        textMuted:   'rgba(255,255,255,0.65)',
        textInverse: '#1A1209',
        ctaBg:       '#FFFFFF',
        ctaFg:       '#1A1209',
        badgeBg:     'rgba(255,255,255,0.18)',
      };
}

type SortKey = 'recommended' | 'rating' | 'price_asc' | 'price_desc' | 'popular';

const SORT_OPTIONS: { key: SortKey; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { key: 'recommended', label: 'Recommandés',     icon: 'sparkles-outline'     },
  { key: 'rating',      label: 'Mieux notés',     icon: 'star-outline'          },
  { key: 'popular',     label: 'Plus populaires', icon: 'flame-outline'         },
  { key: 'price_asc',   label: 'Prix croissant',  icon: 'arrow-up-outline'      },
  { key: 'price_desc',  label: 'Prix décroissant',icon: 'arrow-down-outline'    },
];

export default function ShopScreen() {
  const router = useRouter();
  const { state } = useApp();
  const [cat, setCat]       = useState<ProductCategory>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort]         = useState<SortKey>('recommended');
  const [sortOpen, setSortOpen] = useState(false);
  const { width } = useWindowDimensions();
  const cardWidth = Math.floor((width - 40 - 12) / 2);

  const { session } = useAuth();
  const userEmail   = session?.user?.email;

  const [products, setProducts]   = useState<Product[]>([]);
  const [loading, setLoading]     = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          setLoadError(error.message);
          setProducts([]);
        } else {
          setLoadError(null);
          setProducts((data ?? []) as Product[]);
        }
        setLoading(false);
      });
  }, []);

  // Produits démo (uniquement pour comptes de test) injectés dans la liste,
  // dédupliqués par id avec le contenu Supabase.
  const demoProducts = getDemoProducts(userEmail).map(toShopProduct);
  const allProducts  = (() => {
    const seen = new Set<string>();
    return [...demoProducts, ...products].filter(p => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  })();

  const catalog = allProducts.filter(p => !p.status || p.status === 'active');

  const filteredRaw = catalog.filter(p => {
    const matchCat    = cat === 'all' || p.category === cat;
    const q           = search.trim().toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const filtered = (() => {
    const arr = [...filteredRaw];
    switch (sort) {
      case 'rating':
        return arr.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      case 'popular':
        return arr.sort((a, b) => (b.rating_count ?? 0) - (a.rating_count ?? 0));
      case 'price_asc':
        return arr.sort((a, b) => (a.price_cents ?? 0) - (b.price_cents ?? 0));
      case 'price_desc':
        return arr.sort((a, b) => (b.price_cents ?? 0) - (a.price_cents ?? 0));
      case 'recommended':
      default:
        // Coups de cœur en tête, puis note décroissante, puis nombre d'avis
        return arr.sort((a, b) => {
          if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
          if ((b.rating ?? 0) !== (a.rating ?? 0)) return (b.rating ?? 0) - (a.rating ?? 0);
          return (b.rating_count ?? 0) - (a.rating_count ?? 0);
        });
    }
  })();

  const sortLabel = SORT_OPTIONS.find(o => o.key === sort)?.label ?? 'Recommandés';

  const featuredSlides = catalog.filter(p => p.is_featured).slice(0, 5);
  const showFeatured = cat === 'all' && search.trim() === '' && featuredSlides.length > 0;
  const [slideIndex, setSlideIndex] = useState(0);
  const carouselRef = useRef<ScrollView>(null);
  const slideWidth  = width - 40;

  function onCarouselScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const x = e.nativeEvent.contentOffset.x;
    setSlideIndex(Math.round(x / slideWidth));
  }

  return (
    <SafeAreaView style={S.safe} edges={['top']}>

      {/* ── Header ── */}
      <AppHeader title="Produits" />

      {/* ── Search ── */}
      <View style={S.searchRow}>
        <Text style={S.searchIcon}>🔍</Text>
        <TextInput
          style={S.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Rechercher un produit, une marque…"
          placeholderTextColor={Colors.warmGray}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close" size={16} color={Colors.warmGray} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={S.content}>

        {/* ── Filter pills ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={S.pillsScroll}
          contentContainerStyle={S.pillsRow}
        >
          {CATEGORIES.map(c => (
            <TouchableOpacity
              key={c.id}
              style={[S.pill, cat === c.id && S.pillActive]}
              onPress={() => setCat(c.id)}
            >
              <Text style={[S.pillText, cat === c.id && S.pillTextActive]}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Carrousel "À la une" ── */}
        {showFeatured && (
          <View style={S.featuredBlock}>
            <View style={S.featuredHeader}>
              <View style={S.featuredHeaderLeft}>
                <Text style={S.featuredKicker}>SÉLECTION</Text>
                <Text style={S.featuredTitle}>À la une</Text>
              </View>
              <Text style={S.featuredCount}>
                {slideIndex + 1} / {featuredSlides.length}
              </Text>
            </View>

            <ScrollView
              ref={carouselRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              snapToInterval={slideWidth + 12}
              decelerationRate="fast"
              onMomentumScrollEnd={onCarouselScroll}
              contentContainerStyle={{ gap: 12, paddingHorizontal: 20 }}
            >
              {featuredSlides.map(p => {
                const bg      = p.featured_bg     ?? p.bg_color ?? Colors.ink;
                const accent  = p.featured_accent ?? Colors.amber;
                const badge   = p.featured_badge  ?? 'Coup de cœur';
                const off     = buildDiscountLabel(p);
                const palette = getSlidePalette(bg);
                // Accent affichable : si fond clair, on s'assure que l'accent
                // ne soit pas trop pâle (sinon prix illisible)
                const accentSafe = palette.isLight && getLuma(accent) > 200
                  ? Colors.amberDark
                  : accent;
                return (
                  <TouchableOpacity
                    key={p.id}
                    activeOpacity={0.9}
                    style={[S.slide, { width: slideWidth, backgroundColor: bg }]}
                    onPress={() => router.push({
                      pathname: '/product',
                      params: {
                        id: p.id,
                        brand: p.brand, name: p.name, emoji: p.emoji ?? '🧴',
                        image: p.image ?? '',
                        price: formatPrice(p.price_cents),
                        oldPrice: p.old_price_cents ? formatPrice(p.old_price_cents) : '',
                        off: off ?? '',
                        rating: String(p.rating), count: String(p.rating_count),
                        bg, accent, badge,
                      },
                    })}
                  >
                    {/* Photo produit — bandeau droit avec fondu vers le bg */}
                    {p.image ? (
                      <View style={S.slidePhotoWrap}>
                        <Image
                          source={{ uri: p.image }}
                          style={S.slidePhoto}
                          contentFit="cover"
                          transition={200}
                        />
                        {/* Fondu doux uniquement sur le tiers gauche de la photo */}
                        <LinearGradient
                          colors={[bg + 'E6', bg + '00']}
                          start={{ x: 0, y: 0.5 }}
                          end={{ x: 0.45, y: 0.5 }}
                          style={S.slidePhotoFade}
                          pointerEvents="none"
                        />
                      </View>
                    ) : null}

                    {/* Bloc texte (gauche) */}
                    <View style={S.slideContent}>
                      <View style={[S.badgePill, { backgroundColor: palette.badgeBg }]}>
                        <Ionicons name="sparkles" size={11} color={accentSafe} />
                        <Text style={[S.badgeText, { color: accentSafe }]}>{badge}</Text>
                      </View>

                      <View>
                        <Text
                          style={[S.slideBrand, { color: palette.textMuted }]}
                          numberOfLines={1}
                        >
                          {p.brand.toUpperCase()}
                        </Text>
                        <Text
                          style={[S.slideName, { color: palette.text }]}
                          numberOfLines={2}
                        >
                          {p.name}
                        </Text>
                      </View>

                      <View style={S.slideRating}>
                        <Ionicons name="star" size={11} color={accentSafe} />
                        <Text style={[S.slideRatingText, { color: palette.textSoft }]}>
                          {p.rating.toFixed(1)} · {p.rating_count}
                        </Text>
                      </View>

                      <View style={S.slidePriceRow}>
                        <Text style={[S.slidePrice, { color: accentSafe }]}>
                          {formatPrice(p.price_cents)}
                        </Text>
                        {p.old_price_cents ? (
                          <Text style={[S.slideOldPrice, { color: palette.textMuted }]}>
                            {formatPrice(p.old_price_cents)}
                          </Text>
                        ) : null}
                        {off ? (
                          <View style={S.offBadge}>
                            <Text style={S.offBadgeText}>{off}</Text>
                          </View>
                        ) : null}
                      </View>

                      <View style={[S.slideBtn, { backgroundColor: palette.ctaBg }]}>
                        <Text style={[S.slideBtnText, { color: palette.ctaFg }]}>Découvrir</Text>
                        <Ionicons name="arrow-forward" size={14} color={palette.ctaFg} />
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Dots */}
            <View style={S.dots}>
              {featuredSlides.map((_, i) => (
                <View key={i} style={[S.dot, i === slideIndex && S.dotActive]} />
              ))}
            </View>
          </View>
        )}

        {/* ── Section title + Sort ── */}
        <View style={S.secTitleRow}>
          <Text style={S.secTitle}>
            {search.trim()
              ? `Résultats pour "${search.trim()}"`
              : `Recommandés pour ${state.profile?.hairType ?? '3C'}`}
          </Text>
          <TouchableOpacity
            style={S.sortBtn}
            onPress={() => setSortOpen(true)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Trier les produits"
          >
            <Ionicons name="swap-vertical-outline" size={14} color={Colors.ink} />
            <Text style={S.sortBtnText} numberOfLines={1}>{sortLabel}</Text>
            <Ionicons name="chevron-down" size={13} color={Colors.warmGray} />
          </TouchableOpacity>
        </View>

        {/* ── Product grid ── */}
        {loading ? (
          <View style={{ paddingVertical: 24, alignItems: 'center' }}>
            <ActivityIndicator color={Colors.amber} />
          </View>
        ) : loadError ? (
          <View style={S.empty}>
            <EmptyAnimation emoji="⚠️" size={88} />
            <Text style={S.emptyText}>Connexion produits : {loadError}</Text>
            <Text style={[S.emptyText, { fontSize: 12, marginTop: 4 }]}>
              Vérifie dans Supabase : table « products » + policy SELECT pour anon.
            </Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={S.empty}>
            <EmptyAnimation emoji="🔍" size={88} />
            <Text style={S.emptyText}>
              {products.length === 0
                ? 'Aucun produit publié pour le moment.'
                : 'Aucun produit trouvé'}
            </Text>
            {products.length > 0 && (
              <TouchableOpacity onPress={() => { setSearch(''); setCat('all'); }}>
                <Text style={S.emptyAction}>Effacer les filtres</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={S.grid}>
            {filtered.map(p => {
              const off = buildDiscountLabel(p);
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[S.card, { width: cardWidth }]}
                  activeOpacity={0.85}
                  onPress={() => router.push({
                    pathname: '/product',
                    params: {
                      id: p.id,
                      brand: p.brand, name: p.name, emoji: p.emoji ?? '🧴',
                      image: p.image ?? '',
                      price: formatPrice(p.price_cents),
                      oldPrice: p.old_price_cents ? formatPrice(p.old_price_cents) : '',
                      off: off ?? '',
                      rating: String(p.rating), count: String(p.rating_count),
                      bg: p.bg_color ?? Colors.cream,
                      accent: Colors.amber,
                    },
                  })}
                >
                  <View style={[S.imgBox, { backgroundColor: p.bg_color ?? Colors.cream }]}>
                    {p.image ? (
                      <Image
                        source={{ uri: p.image }}
                        style={S.imgPhoto}
                        contentFit="cover"
                        transition={150}
                      />
                    ) : (
                      <Text style={S.imgEmoji}>{p.emoji ?? '🧴'}</Text>
                    )}
                  </View>
                  <View style={S.cardInfo}>
                    <Text style={S.brand}>{p.brand}</Text>
                    <Text style={S.name} numberOfLines={2}>{p.name}</Text>
                    <View style={S.priceRow}>
                      <Text style={S.price}>{formatPrice(p.price_cents)}</Text>
                      {off && (
                        <View style={S.discBadge}>
                          <Text style={S.discText}>{off}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={S.ratingLine}>
                      <Text style={S.star}>★</Text>
                      {` ${p.rating} · ${p.rating_count}`}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Sort modal ── */}
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
  safe:    { flex: 1, backgroundColor: Colors.bg },
  content: { paddingBottom: 20 },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  backBtn: {
    width: 36, height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { flex: 1, fontSize: 20, fontFamily: 'Poppins_700Bold', color: Colors.ink },
  coinsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.ink,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  coinsEmoji: { fontSize: 15 },
  coinsText:  { fontSize: 15, fontFamily: 'DMSans_700Bold', color: Colors.amber },

  // ── Search ──
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  searchIcon:  { fontSize: 16 },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: Colors.ink,
    padding: 0,
  },

  // ── Pills ──
  pillsScroll: { marginBottom: 4 },
  pillsRow: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  pillActive:     { backgroundColor: Colors.ink, borderColor: Colors.ink },
  pillText:       { fontSize: 13, fontFamily: 'DMSans_500Medium', color: Colors.ink },
  pillTextActive: { color: '#fff', fontFamily: 'DMSans_600SemiBold' },

  // ── Carrousel "À la une" ──
  featuredBlock: { marginBottom: 24 },
  featuredHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  featuredHeaderLeft: { flexDirection: 'column' },
  featuredKicker: {
    fontSize: 10,
    fontFamily: 'DMSans_700Bold',
    color: Colors.amber,
    letterSpacing: 1.4,
    marginBottom: 2,
  },
  featuredTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: Colors.ink,
  },
  featuredCount: {
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
    color: Colors.warmGray,
  },

  slide: {
    borderRadius: 22,
    overflow: 'hidden',
    position: 'relative',
    height: 220,
    flexDirection: 'row',
  },
  slidePhotoWrap: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: '60%',
  },
  slidePhoto: {
    width: '100%',
    height: '100%',
  },
  slidePhotoFade: {
    ...StyleSheet.absoluteFillObject,
  },
  slideContent: {
    flex: 1,
    padding: 18,
    paddingRight: 12,
    justifyContent: 'space-between',
    maxWidth: '60%',
    zIndex: 2,
  },

  badgePill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: 'DMSans_700Bold',
    letterSpacing: 0.3,
  },

  slideBrand: {
    fontSize: 10,
    fontFamily: 'DMSans_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    marginBottom: 4,
  },
  slideName: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    lineHeight: 23,
  },

  slideRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  slideRatingText: {
    fontSize: 12,
    fontFamily: 'DMSans_600SemiBold',
  },

  slidePriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  slidePrice: {
    fontSize: 19,
    fontFamily: 'DMSans_700Bold',
  },
  slideOldPrice: {
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
    textDecorationLine: 'line-through',
  },
  offBadge: {
    backgroundColor: Colors.rose,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  offBadgeText: {
    fontSize: 9,
    fontFamily: 'DMSans_700Bold',
    color: '#fff',
  },

  slideBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  slideBtnText: {
    fontSize: 12,
    fontFamily: 'DMSans_700Bold',
  },

  // Pagination dots
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.border,
  },
  dotActive: {
    width: 18,
    backgroundColor: Colors.ink,
  },

  // ── Section title ──
  secTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 14,
    gap: 10,
  },
  secTitle: {
    flex: 1,
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.ink,
  },

  // ── Sort button + sheet ──
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
    maxWidth: 200,
  },
  sortBtnText: {
    fontSize: 12,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.ink,
    maxWidth: 130,
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

  // ── Product grid ──
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  imgBox: {
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  imgPhoto: {
    ...StyleSheet.absoluteFillObject,
  },
  imgEmoji: { fontSize: 42 },
  cardInfo:  { padding: 10 },
  brand: {
    fontSize: 9,
    fontFamily: 'DMSans_500Medium',
    color: Colors.warmGray,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  name: {
    fontSize: 12,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.ink,
    lineHeight: 16,
    marginBottom: 6,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  price: { fontSize: 13, fontFamily: 'DMSans_700Bold', color: Colors.ink },
  discBadge: {
    backgroundColor: Colors.blush,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  discText: { fontSize: 9, fontFamily: 'DMSans_700Bold', color: Colors.rose },
  ratingLine: {
    fontSize: 10,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
  },
  star: { color: Colors.amber },

  // ── Empty state ──
  empty: { alignItems: 'center', paddingTop: 60, gap: 10, paddingHorizontal: 20 },
  emptyIcon:   { fontSize: 48 },
  emptyText:   { fontSize: 16, fontFamily: 'DMSans_500Medium', color: Colors.warmGray },
  emptyAction: { fontSize: 14, fontFamily: 'DMSans_600SemiBold', color: Colors.amber },
});
