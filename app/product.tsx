import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Colors } from '../src/theme/colors';
import { useApp } from '../src/context/AppContext';
import { supabase } from '../src/lib/supabase';
import { AppHeader, CoinsBadge } from '../src/components/AppHeader';
import { getDemoProductById } from '../src/data/demoUsers';
import { isDemoModeAvailable } from '../src/lib/demoMode';
import { normalizeHttpUrl, openSafeUrl } from '../src/lib/safeLinking';

type Review = {
  id:         string;
  author:     string;
  rating:     number;
  text:       string;
  date_label: string | null;
};

const DEFAULT_DESCRIPTION =
  'Formulé spécialement pour les cheveux bouclés, frisés et crépus. Apporte hydratation intense, nutrition en profondeur et définition des boucles.';

export default function ProductScreen() {
  const router = useRouter();
  const { state } = useApp();
  const params = useLocalSearchParams<{
    id?: string;
    brand: string; name: string; emoji: string;
    image?: string;
    price: string; oldPrice?: string; off?: string;
    rating: string; count: string; bg: string; accent: string;
    badge?: string;
  }>();

  const [fav, setFav] = useState(false);
  const [showIngredients, setShowIngredients] = useState(false);

  const [description, setDescription] = useState<string>(DEFAULT_DESCRIPTION);
  const [ingredients, setIngredients] = useState<string>('');
  const [imageUrl, setImageUrl]       = useState<string>(params.image ?? '');
  const [productUrl, setProductUrl]   = useState<string | null>(null);
  const [reviews, setReviews]         = useState<Review[]>([]);
  const [loading, setLoading]         = useState<boolean>(!!params.id);

  useEffect(() => {
    if (!params.id) return;
    const productId = params.id;

    // Produit démo (dev uniquement)
    if (isDemoModeAvailable() && productId.startsWith('demo-prod-')) {
      const demo = getDemoProductById(productId);
      if (demo) {
        setDescription(demo.description ?? DEFAULT_DESCRIPTION);
        setIngredients('');
        if (!params.image && demo.image) setImageUrl(demo.image);
        setProductUrl(demo.url ?? null);
      }
      setReviews([]);
      setLoading(false);
      return;
    }

    Promise.all([
      supabase
        .from('products')
        .select('description, description_full, ingredients, image, url')
        .eq('id', productId)
        .maybeSingle(),
      supabase
        .from('product_reviews')
        .select('id, author, rating, text, date_label')
        .eq('product_id', productId)
        .order('created_at', { ascending: false }),
    ]).then(([prodRes, reviewsRes]) => {
      const prod = prodRes.data as {
        description:      string | null;
        description_full: string | null;
        ingredients:      string | null;
        image:            string | null;
        url:              string | null;
      } | null;
      if (prod) {
        setDescription(prod.description_full ?? prod.description ?? DEFAULT_DESCRIPTION);
        setIngredients(prod.ingredients ?? '');
        if (!params.image && prod.image) setImageUrl(prod.image);
        setProductUrl(prod.url ?? null);
      }
      if (reviewsRes.data) setReviews(reviewsRes.data as Review[]);
      setLoading(false);
    });
  }, [params.id]);

  async function handleBuy() {
    if (!productUrl) {
      Alert.alert('Acheter', "Aucun lien d'achat n'est renseigné pour ce produit.");
      return;
    }
    const u = normalizeHttpUrl(productUrl);
    if (!u) {
      Alert.alert('Acheter', "Lien d'achat invalide.");
      return;
    }
    await openSafeUrl(u, 'product', { alertTitle: 'Acheter' });
  }

  const rating    = parseFloat(params.rating  ?? '4.8');
  const count     = parseInt(params.count    ?? '0', 10);
  const bg        = params.bg     ?? Colors.ink;
  const accent    = params.accent ?? Colors.amber;
  const emoji     = params.emoji  ?? '🧴';
  const badge     = params.badge;
  const off       = params.off;
  const oldPrice  = params.oldPrice;

  return (
    <SafeAreaView style={S.safe} edges={['top']}>

      <AppHeader
        title=""
        rightAction="custom"
        rightSlot={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity
              style={S.iconBtn}
              onPress={() => setFav(f => !f)}
              accessibilityRole="button"
              accessibilityLabel={fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            >
              <Ionicons
                name={fav ? 'heart' : 'heart-outline'}
                size={20}
                color={fav ? Colors.rose : Colors.ink}
              />
            </TouchableOpacity>
            <CoinsBadge />
          </View>
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.content}>

        {/* ── Hero ── */}
        <View style={[S.hero, { backgroundColor: bg }]}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={S.heroImage}
              contentFit="cover"
              transition={250}
            />
          ) : (
            <Text style={S.heroEmoji}>{emoji}</Text>
          )}
          {badge && (
            <View style={[S.heroBadge, { backgroundColor: accent + '33' }]}>
              <Text style={[S.heroBadgeText, { color: accent }]}>★ {badge}</Text>
            </View>
          )}
          {off && (
            <View style={S.offBadge}>
              <Text style={S.offBadgeText}>{off}</Text>
            </View>
          )}
        </View>

        {/* ── Info ── */}
        <View style={S.infoBlock}>
          <Text style={S.brand}>{params.brand?.toUpperCase()}</Text>
          <Text style={S.name}>{params.name}</Text>

          {/* Rating */}
          <View style={S.ratingRow}>
            {[1,2,3,4,5].map(n => (
              <Ionicons key={n} name={n <= Math.round(rating) ? 'star' : 'star-outline'} size={14} color={Colors.amber} />
            ))}
            <Text style={S.ratingText}> {rating} · {count} avis</Text>
          </View>

          {/* Price */}
          <View style={S.priceRow}>
            <Text style={S.price}>{params.price}</Text>
            {oldPrice && <Text style={S.oldPrice}>{oldPrice}</Text>}
            {off && (
              <View style={S.discBadge}>
                <Text style={S.discText}>{off}</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Description ── */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Description</Text>
          <Text style={S.sectionBody}>{description}</Text>
        </View>

        {/* ── Ingrédients ── */}
        {ingredients ? (
          <TouchableOpacity style={S.section} onPress={() => setShowIngredients(v => !v)} activeOpacity={0.7}>
            <View style={S.sectionRow}>
              <Text style={S.sectionTitle}>Ingrédients</Text>
              <Ionicons name={showIngredients ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.warmGray} />
            </View>
            {showIngredients && <Text style={[S.sectionBody, { marginTop: 10 }]}>{ingredients}</Text>}
          </TouchableOpacity>
        ) : null}

        {/* ── Avis ── */}
        <View style={S.section}>
          <Text style={S.sectionTitle}>Avis clients</Text>
          {loading ? (
            <View style={{ paddingVertical: 12 }}>
              <ActivityIndicator color={Colors.amber} />
            </View>
          ) : reviews.length === 0 ? (
            <Text style={[S.sectionBody, { marginTop: 4 }]}>
              Aucun avis pour le moment.
            </Text>
          ) : (
            <>
              {(() => {
                // Breakdown des notes : moyenne calculée + répartition 5★→1★
                const total   = reviews.length;
                const sum     = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
                const avg     = total > 0 ? sum / total : 0;
                const buckets = [5, 4, 3, 2, 1].map(star => ({
                  star,
                  count: reviews.filter(r => Math.round(r.rating) === star).length,
                }));
                return (
                  <View style={S.breakdown}>
                    {/* Bloc note globale */}
                    <View style={S.breakdownScore}>
                      <Text style={S.breakdownAvg}>{avg.toFixed(1)}</Text>
                      <View style={S.breakdownStars}>
                        {[1, 2, 3, 4, 5].map(n => (
                          <Ionicons
                            key={n}
                            name={n <= Math.round(avg) ? 'star' : 'star-outline'}
                            size={13}
                            color={Colors.amber}
                          />
                        ))}
                      </View>
                      <Text style={S.breakdownCount}>{total} avis</Text>
                    </View>

                    {/* Histogramme */}
                    <View style={S.breakdownBars}>
                      {buckets.map(b => {
                        const pct = total > 0 ? Math.round((b.count / total) * 100) : 0;
                        return (
                          <View key={b.star} style={S.barRow}>
                            <Text style={S.barLabel}>{b.star}★</Text>
                            <View style={S.barTrack}>
                              <View
                                style={[
                                  S.barFill,
                                  { width: `${pct}%`, backgroundColor: Colors.amber },
                                ]}
                              />
                            </View>
                            <Text style={S.barPct}>{pct}%</Text>
                          </View>
                        );
                      })}
                    </View>
                  </View>
                );
              })()}

              {/* Liste des avis */}
              {reviews.map(r => (
                <View key={r.id} style={S.reviewCard}>
                  <View style={S.reviewTop}>
                    <Text style={S.reviewAuthor}>{r.author}</Text>
                    <View style={S.reviewStars}>
                      {[1,2,3,4,5].map(n => (
                        <Ionicons key={n} name={n <= r.rating ? 'star' : 'star-outline'} size={11} color={Colors.amber} />
                      ))}
                    </View>
                    {r.date_label ? <Text style={S.reviewDate}>{r.date_label}</Text> : null}
                  </View>
                  <Text style={S.reviewText}>"{r.text}"</Text>
                </View>
              ))}
            </>
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Sticky CTA ── */}
      <View style={S.cta}>
        <TouchableOpacity style={S.ctaBtn} onPress={() => setFav(f => !f)}>
          <Ionicons name={fav ? 'heart' : 'heart-outline'} size={20} color={Colors.ink} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[S.ctaMainBtn, !productUrl && { opacity: 0.6 }]}
          onPress={handleBuy}
          activeOpacity={0.88}
        >
          <Text style={S.ctaMainText}>
            {productUrl ? 'Acheter maintenant' : 'Lien indisponible'}
          </Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.bg },
  content: { paddingBottom: 20 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, gap: 8,
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  coinsBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.ink,
    borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7,
  },
  coinsEmoji: { fontSize: 15 },
  coinsText:  { fontSize: 15, fontFamily: 'DMSans_700Bold', color: Colors.amber },

  // Hero
  hero: {
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  heroBadge: {
    position: 'absolute', top: 16, left: 16, zIndex: 2,
    borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6,
  },
  heroBadgeText: { fontSize: 12, fontFamily: 'DMSans_700Bold' },
  offBadge: {
    position: 'absolute', top: 16, right: 16, zIndex: 2,
    backgroundColor: Colors.rose, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5,
  },
  offBadgeText: { fontSize: 12, fontFamily: 'DMSans_700Bold', color: '#fff' },
  heroEmoji: { fontSize: 80, zIndex: 1 },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
  },

  // Info block
  infoBlock: { padding: 20, paddingBottom: 0 },
  brand: {
    fontSize: 11, fontFamily: 'DMSans_500Medium', color: Colors.warmGray,
    letterSpacing: 1.2, marginBottom: 6,
  },
  name: {
    fontSize: 24, fontFamily: 'Poppins_700Bold', color: Colors.ink,
    lineHeight: 30, marginBottom: 10,
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  ratingText: { fontSize: 13, fontFamily: 'DMSans_400Regular', color: Colors.warmGray },
  priceRow:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  price:      { fontSize: 22, fontFamily: 'DMSans_700Bold', color: Colors.ink },
  oldPrice:   { fontSize: 15, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, textDecorationLine: 'line-through' },
  discBadge:  { backgroundColor: Colors.blush, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  discText:   { fontSize: 11, fontFamily: 'DMSans_700Bold', color: Colors.rose },

  // Sections
  section: {
    marginHorizontal: 20, marginTop: 20,
    backgroundColor: Colors.surface, borderRadius: 18,
    borderWidth: 1, borderColor: Colors.border, padding: 16,
  },
  sectionRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 15, fontFamily: 'DMSans_700Bold', color: Colors.ink, marginBottom: 8 },
  sectionBody:  { fontSize: 13, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, lineHeight: 20 },

  // Reviews
  // Breakdown des avis
  breakdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingBottom: 14,
    marginBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  breakdownScore: {
    alignItems: 'center',
    minWidth: 78,
  },
  breakdownAvg: {
    fontSize: 30,
    fontFamily: 'Poppins_700Bold',
    color: Colors.ink,
    lineHeight: 34,
  },
  breakdownStars: {
    flexDirection: 'row',
    gap: 1,
    marginTop: 2,
  },
  breakdownCount: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    marginTop: 4,
  },
  breakdownBars: {
    flex: 1,
    gap: 5,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  barLabel: {
    fontSize: 11,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.warmGray,
    width: 22,
  },
  barTrack: {
    flex: 1,
    height: 7,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  barPct: {
    fontSize: 10,
    fontFamily: 'DMSans_500Medium',
    color: Colors.warmGray,
    width: 32,
    textAlign: 'right',
  },

  reviewCard: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: Colors.border },
  reviewTop:  { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  reviewAuthor: { fontSize: 13, fontFamily: 'DMSans_600SemiBold', color: Colors.ink },
  reviewStars:  { flexDirection: 'row', gap: 2 },
  reviewDate:   { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, marginLeft: 'auto' },
  reviewText:   { fontSize: 13, fontFamily: 'DMSans_400Regular', color: Colors.ink, lineHeight: 19, fontStyle: 'italic' },

  // CTA
  cta: {
    flexDirection: 'row', gap: 12,
    paddingHorizontal: 20, paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  ctaBtn: {
    width: 50, height: 50, borderRadius: 14,
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  ctaMainBtn: {
    flex: 1, height: 50, borderRadius: 14,
    backgroundColor: Colors.ink, alignItems: 'center', justifyContent: 'center',
  },
  ctaMainText: { fontSize: 15, fontFamily: 'DMSans_700Bold', color: '#fff' },
});
