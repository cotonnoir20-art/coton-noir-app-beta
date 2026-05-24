import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/theme/colors';
import { useApp } from '../src/context/AppContext';
import { supabase } from '../src/lib/supabase';
import { AppHeader } from '../src/components/AppHeader';
import { normalizeHttpUrl, openSafeUrl } from '../src/lib/safeLinking';

type CatId = 'all' | 'products' | 'salons' | 'services';

type PartnerKind = 'salon' | 'product' | 'service' | string;

type Partner = {
  id:          string;
  name:        string;
  kind:        PartnerKind;
  description: string | null;
  city:        string | null;
  country:     string | null;
  offer:       string | null;
  website:     string | null;
  instagram:   string | null;
  rating:      number;
  /** Colonne admin hub / migration récente (`partners.image`). */
  image?:      string | null;
  /** Ancienne colonne app (`image_url`). */
  image_url?:  string | null;
  logo_url?:   string | null;
  status?:     string;
};

/** URL affichée sur la card : priorité `image` (hub admin), puis `image_url`, puis `logo_url`. */
function partnerHeroImageUrl(p: Partner): string {
  const a = (p.image ?? '').trim();
  if (a) return a;
  const b = (p.image_url ?? '').trim();
  if (b) return b;
  return (p.logo_url ?? '').trim();
}

function instagramOpenUrl(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const t = raw.trim();
  if (/^https?:\/\//i.test(t)) return normalizeHttpUrl(t);
  const h = t.replace(/^@/, '').replace(/^\/?(www\.)?instagram\.com\/?/i, '').replace(/\/$/, '');
  if (!h) return null;
  return `https://www.instagram.com/${h}/`;
}

async function openExternalUrl(
  label: string,
  url: string | null,
  policy: 'partner' | 'social' = 'partner',
) {
  if (!url) {
    Alert.alert(label, 'Aucun lien renseigné pour ce partenaire.');
    return;
  }
  await openSafeUrl(url, policy, { alertTitle: label });
}

const KIND_TO_CAT: Record<string, Exclude<CatId, 'all'>> = {
  salon:   'salons',
  product: 'products',
  service: 'services',
};

const KIND_META: Record<string, { emoji: string; bg: string; catLabel: string }> = {
  salon:   { emoji: '✂️', bg: '#3a2010', catLabel: 'Salons'   },
  product: { emoji: '🧴', bg: '#1a3020', catLabel: 'Produits' },
  service: { emoji: '✨', bg: '#1a2a2a', catLabel: 'Services' },
};

function stars(r: number) {
  const full = Math.floor(r);
  const half = r % 1 >= 0.5;
  return '★'.repeat(full) + (half ? '½' : '');
}

function locationLabel(p: Partner): string {
  if (p.city && p.country) return `${p.city}, ${p.country}`;
  return p.city ?? p.country ?? 'En ligne';
}

export default function PartnersScreen() {
  const router = useRouter();
  const { state } = useApp();
  const [cat, setCat]       = useState<CatId>('all');
  const [liked, setLiked]   = useState<Set<string>>(new Set());

  const [partners, setPartners]   = useState<Partner[]>([]);
  const [loading, setLoading]     = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('partners')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          setLoadError(error.message);
          setPartners([]);
        } else {
          setLoadError(null);
          setPartners((data ?? []) as Partner[]);
        }
        setLoading(false);
      });
  }, []);

  const catalog = partners.filter(p => !p.status || p.status === 'active');

  const counts: Record<Exclude<CatId, 'all'>, number> = {
    products: catalog.filter(p => p.kind === 'product').length,
    salons:   catalog.filter(p => p.kind === 'salon').length,
    services: catalog.filter(p => p.kind === 'service').length,
  };

  const CATS: { id: CatId; label: string; count: number }[] = [
    { id: 'all',      label: 'Tous',     count: catalog.length          },
    { id: 'products', label: 'Produits', count: counts.products          },
    { id: 'salons',   label: 'Salons',   count: counts.salons            },
    { id: 'services', label: 'Services', count: counts.services          },
  ];

  const ratingAvg = catalog.length === 0
    ? 0
    : catalog.reduce((acc, p) => acc + (p.rating ?? 0), 0) / catalog.length;

  const STATS = [
    { val: String(catalog.length),                                   label: 'Partenaires'  },
    { val: ratingAvg ? ratingAvg.toFixed(1) : '–',                    label: 'Note moyenne' },
    { val: counts.products + counts.salons + counts.services + ' actifs', label: 'Catégories' },
  ];

  const filtered = catalog.filter(p => cat === 'all' || KIND_TO_CAT[p.kind] === cat);

  function toggleLike(id: string) {
    setLiked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <SafeAreaView style={S.safe} edges={['top']}>

      {/* ── Header ── */}
      <AppHeader title="Partenaires" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.content}>

        {/* ── CotonCoins banner ── */}
        <View style={S.banner}>
          <View style={S.bannerLeft}>
            <View style={S.bannerIconBox}>
              <Ionicons name="gift-outline" size={22} color={Colors.amber} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={S.bannerTitle}>Offres CotonCoins</Text>
              <Text style={S.bannerDesc}>
                Échange tes CotonCoins contre des avantages exclusifs
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={S.bannerBtn}
            activeOpacity={0.85}
            onPress={() => router.push('/rewards')}
          >
            <Text style={S.bannerBtnText}>Voir les offres</Text>
            <Ionicons name="arrow-forward" size={16} color={Colors.amber} />
          </TouchableOpacity>
        </View>

        {/* ── Stats ── */}
        <View style={S.statsRow}>
          {STATS.map((s, i) => (
            <View key={i} style={[S.statBox, i > 0 && { borderLeftWidth: 1, borderLeftColor: Colors.border }]}>
              <Text style={S.statVal}>{s.val}</Text>
              <Text style={S.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Categories ── */}
        <Text style={S.secTitle}>Catégories</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={S.catsRow}
        >
          {CATS.map(c => {
            const active = cat === c.id;
            return (
              <TouchableOpacity
                key={c.id}
                style={[S.catPill, active && S.catPillActive]}
                onPress={() => setCat(c.id)}
              >
                <Text style={[S.catLabel, active && S.catLabelActive]}>{c.label}</Text>
                <Text style={[S.catCount, active && S.catCountActive]}>{c.count}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Partner list ── */}
        <Text style={S.secTitle}>Tous les partenaires</Text>

        {loading ? (
          <View style={{ paddingVertical: 24, alignItems: 'center' }}>
            <ActivityIndicator color={Colors.amber} />
          </View>
        ) : loadError ? (
          <View style={{
            paddingVertical: 24, alignItems: 'center',
            backgroundColor: Colors.cream, borderRadius: 14,
          }}>
            <Text style={{ fontSize: 32 }}>⚠️</Text>
            <Text style={{
              fontSize: 14, fontFamily: 'DMSans_500Medium',
              color: Colors.ink, marginTop: 8, textAlign: 'center',
              paddingHorizontal: 16,
            }}>
              Connexion partenaires : {loadError}
            </Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={{
            paddingVertical: 28, alignItems: 'center',
            backgroundColor: Colors.cream, borderRadius: 14,
          }}>
            <Text style={{ fontSize: 32 }}>🤝</Text>
            <Text style={{
              fontSize: 14, fontFamily: 'DMSans_500Medium',
              color: Colors.ink, marginTop: 8,
            }}>
              {catalog.length === 0
                ? 'Aucun partenaire publié pour le moment.'
                : 'Aucun partenaire pour cette catégorie.'}
            </Text>
          </View>
        ) : (
          filtered.map(p => {
            const meta = KIND_META[p.kind] ?? KIND_META.service;
            const heroUri = partnerHeroImageUrl(p);
            const hasImage = heroUri.length > 0;
            const websiteUrl = p.website ? normalizeHttpUrl(p.website) : null;
            const igUrl = instagramOpenUrl(p.instagram);
            const canVisit = !!websiteUrl;
            const canContact = !!igUrl;
            return (
              <View key={p.id} style={S.card}>
                <View style={S.cardImg}>
                  {hasImage ? (
                    <Image
                      source={{ uri: heroUri }}
                      style={S.cardPhoto}
                      contentFit="cover"
                      transition={200}
                    />
                  ) : (
                    <LinearGradient
                      colors={[meta.bg, '#0d0804']}
                      start={{ x: 0.2, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={S.cardPhoto}
                    >
                      <Text style={S.cardEmoji}>{meta.emoji}</Text>
                    </LinearGradient>
                  )}

                  <View style={S.catBadge}>
                    <Text style={S.catBadgeText}>{meta.catLabel}</Text>
                  </View>

                  <TouchableOpacity
                    style={S.heartBtn}
                    onPress={() => toggleLike(p.id)}
                  >
                    <Ionicons
                      name={liked.has(p.id) ? 'heart' : 'heart-outline'}
                      size={16}
                      color={liked.has(p.id) ? Colors.rose : Colors.warmGray}
                    />
                  </TouchableOpacity>
                </View>

                <View style={S.cardInfo}>
                  <View style={S.cardTitleRow}>
                    <Text style={S.cardName}>{p.name}</Text>
                    <View style={S.ratingRow}>
                      <Text style={S.ratingStars}>{stars(p.rating)}</Text>
                      <Text style={S.ratingVal}> {p.rating}</Text>
                    </View>
                  </View>

                  {p.description ? (
                    <Text style={S.cardDesc}>{p.description}</Text>
                  ) : null}

                  <View style={S.metaRow}>
                    <Text style={S.metaLocation}>📍 {locationLabel(p)}</Text>
                  </View>
                  {p.offer ? (
                    <Text style={S.offerText}>🏷️ {p.offer}</Text>
                  ) : null}

                  <View style={S.cardBtnRow}>
                    <TouchableOpacity
                      style={[S.visitBtn, !canVisit && S.cardBtnDisabled]}
                      disabled={!canVisit}
                      onPress={() => openExternalUrl('Site web', websiteUrl)}
                    >
                      <Ionicons name="globe-outline" size={14} color="#fff" />
                      <Text style={S.visitBtnText}>Visiter</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[S.contactBtn, !canContact && S.cardBtnDisabled]}
                      disabled={!canContact}
                      onPress={() => openExternalUrl('Instagram', igUrl, 'social')}
                    >
                      <Ionicons name="logo-instagram" size={14} color={Colors.ink} />
                      <Text style={S.contactBtnText}>Instagram</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: 20, paddingBottom: 16 },

  // ── Header ──
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, gap: 8,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { flex: 1, fontSize: 20, fontFamily: 'Satoshi_500Medium', color: Colors.ink },
  coinsBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.ink,
    borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7,
  },
  coinsEmoji: { fontSize: 15 },
  coinsText:  { fontSize: 15, fontFamily: 'DMSans_700Bold', color: Colors.amber },

  // ── Banner ──
  banner: {
    backgroundColor: Colors.ink,
    borderRadius: 18, padding: 16, marginBottom: 16, gap: 14,
  },
  bannerLeft: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  bannerIconBox: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: 'rgba(245,178,68,0.18)',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  bannerTitle: {
    fontSize: 15, fontFamily: 'DMSans_700Bold',
    color: '#fff', marginBottom: 3,
  },
  bannerDesc: {
    fontSize: 12, fontFamily: 'DMSans_400Regular',
    color: 'rgba(255,255,255,0.72)', lineHeight: 17,
  },
  bannerBtn: {
    backgroundColor: '#fff',
    borderRadius: 12, paddingVertical: 12,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  bannerBtnText: {
    fontSize: 13, fontFamily: 'DMSans_700Bold', color: Colors.amber,
  },

  // ── Stats ──
  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 16, borderWidth: 1, borderColor: Colors.border,
    marginBottom: 20, overflow: 'hidden',
  },
  statBox:  { flex: 1, alignItems: 'center', paddingVertical: 16 },
  statVal:  { fontSize: 22, fontFamily: 'Satoshi_500Medium', color: Colors.ink },
  statLabel:{ fontSize: 10, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, marginTop: 3 },

  // ── Categories ──
  secTitle: {
    fontSize: 18, fontFamily: 'Satoshi_500Medium',
    color: Colors.ink, marginBottom: 12,
  },
  catsRow: { gap: 8, paddingBottom: 16 },
  catPill: {
    alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 14, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border, minWidth: 64,
  },
  catPillActive:   { backgroundColor: Colors.amber, borderColor: Colors.amber },
  catLabel:        { fontSize: 13, fontFamily: 'DMSans_600SemiBold', color: Colors.warmGray },
  catLabelActive:  { color: '#fff' },
  catCount:        { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, marginTop: 1 },
  catCountActive:  { color: 'rgba(255,255,255,0.75)' },

  // ── Partner cards ──
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18, borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden', marginBottom: 14,
  },
  cardImg: {
    height: 160, position: 'relative', overflow: 'hidden',
    backgroundColor: Colors.cream,
  },
  cardPhoto: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
  },
  cardEmoji: { fontSize: 44 },
  catBadge: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: Colors.amber,
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4,
  },
  catBadgeText: { fontSize: 10, fontFamily: 'DMSans_700Bold', color: '#fff' },
  heartBtn: {
    position: 'absolute', bottom: 12, right: 12,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center', justifyContent: 'center',
  },

  cardInfo: { padding: 14 },
  cardTitleRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 4,
  },
  cardName: { fontSize: 15, fontFamily: 'DMSans_700Bold', color: Colors.ink, flex: 1 },
  ratingRow: { flexDirection: 'row', alignItems: 'center' },
  ratingStars: { fontSize: 11, color: Colors.amber },
  ratingVal:   { fontSize: 11, fontFamily: 'DMSans_700Bold', color: Colors.ink },

  cardDesc:     { fontSize: 12, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, lineHeight: 17, marginBottom: 8 },
  metaRow:      { marginBottom: 4 },
  metaLocation: { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray },
  offerText:    { fontSize: 12, fontFamily: 'DMSans_600SemiBold', color: Colors.amber, marginBottom: 12 },

  cardBtnRow: { flexDirection: 'row', gap: 10 },
  cardBtnDisabled: { opacity: 0.45 },
  visitBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: Colors.ink,
    borderRadius: 12, paddingVertical: 11,
  },
  visitBtnText: { fontSize: 13, fontFamily: 'DMSans_700Bold', color: '#fff' },
  contactBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: Colors.surface,
    borderRadius: 12, paddingVertical: 11,
    borderWidth: 1, borderColor: Colors.border,
  },
  contactBtnText: { fontSize: 13, fontFamily: 'DMSans_700Bold', color: Colors.ink },
});
