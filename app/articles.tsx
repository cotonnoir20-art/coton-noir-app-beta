import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Modal, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../src/theme/colors';
import { supabase } from '../src/lib/supabase';
import { useAuth } from '../src/context/AuthContext';
import { AppHeader } from '../src/components/AppHeader';
import { EmptyAnimation } from '../src/components/animations/EmptyAnimation';
import { getDemoArticles } from '../src/data/demoUsers';
import { openSafeMailto, openSafeUrl } from '../src/lib/safeLinking';

// ─────────────────────────────────────────────────────────────────────────────

type Article = {
  id:             string;
  title:          string;
  subtitle:       string | null;
  body:           string;
  category:       string | null;
  image:          string | null;
  read_time:      number;
  author_name:    string;
  author_role:    string;
  author_avatar:  string | null;
  author_contact: string;
  is_sponsored:   boolean;
  sponsor_brand:  string | null;
  likes:          number;
  created_at:     string;
};

const CATEGORIES = ['Tous', 'Routine', 'Pousse', 'Mode protecteur', 'Trichologie', 'Wellness', 'Témoignage'];

const CAT_EMOJI: Record<string, string> = {
  Routine:           '🌿',
  Pousse:            '📏',
  'Mode protecteur': '✨',
  Trichologie:       '🔬',
  Wellness:          '🧘',
  Témoignage:        '💬',
};

const ROLE_EMOJI: Record<string, string> = {
  Coiffeuse:         '✂️',
  Blogueuse:         '✍️',
  Trichologue:       '🔬',
  'Coach capillaire': '🌱',
};

const LIKES_KEY = '@coton_noir_article_likes';

export default function ArticlesScreen() {
  const { session } = useAuth();
  const email = session?.user?.email;

  const [articles, setArticles]   = useState<Article[]>([]);
  const [loading, setLoading]     = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch]       = useState('');
  const [category, setCategory]   = useState('Tous');
  const [selected, setSelected]   = useState<Article | null>(null);
  const [likedIds, setLikedIds]   = useState<Record<string, boolean>>({});

  useEffect(() => {
    supabase
      .from('articles')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          setLoadError(error.message);
          setArticles([]);
        } else {
          setLoadError(null);
          setArticles((data ?? []) as Article[]);
        }
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(LIKES_KEY).then(raw => {
      if (raw) {
        try { setLikedIds(JSON.parse(raw)); } catch {}
      }
    });
  }, []);

  const demoArticles = getDemoArticles(email) as Article[];
  const allArticles  = useMemo(() => [...demoArticles, ...articles], [demoArticles, articles]);

  const filtered = useMemo(() => {
    return allArticles.filter(a => {
      const matchCat = category === 'Tous' || a.category === category;
      const q        = search.trim().toLowerCase();
      const matchSearch = !q
        || a.title.toLowerCase().includes(q)
        || (a.subtitle?.toLowerCase().includes(q) ?? false)
        || a.author_name.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [allArticles, category, search]);

  function toggleLike(id: string) {
    setLikedIds(prev => {
      const next = { ...prev };
      if (next[id]) delete next[id]; else next[id] = true;
      AsyncStorage.setItem(LIKES_KEY, JSON.stringify(next));
      return next;
    });
  }

  function likeCount(a: Article): number {
    return (a.likes ?? 0) + (likedIds[a.id] ? 1 : 0);
  }

  async function openContact(contact: string) {
    const trimmed = contact.trim();
    if (!trimmed) return;
    if (trimmed.startsWith('@')) {
      await openSafeUrl(`https://www.instagram.com/${trimmed.slice(1)}/`, 'social', {
        alertTitle: 'Contact',
      });
      return;
    }
    if (trimmed.includes('@') && !trimmed.startsWith('http')) {
      await openSafeMailto(trimmed.replace(/^mailto:/i, ''));
      return;
    }
    await openSafeUrl(trimmed, 'partner', { alertTitle: 'Contact' });
  }

  return (
    <SafeAreaView style={S.safe} edges={['top']}>
      <AppHeader title="Articles & conseils pro" />

      {/* Search */}
      <View style={S.searchRow}>
        <Ionicons name="search-outline" size={16} color={Colors.warmGray} style={S.searchIcon} />
        <TextInput
          style={S.searchInput}
          placeholder="Titre, sujet, auteur…"
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

      {/* Filtres */}
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
              {cat !== 'Tous' && (
                <Text style={S.filterChipEmoji}>{CAT_EMOJI[cat] ?? '🧪'}</Text>
              )}
              <Text style={[S.filterChipText, active && S.filterChipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Liste */}
      {loading && allArticles.length === 0 ? (
        <View style={S.center}>
          <ActivityIndicator color={Colors.amber} size="large" />
        </View>
      ) : filtered.length === 0 ? (
        <View style={S.center}>
          <EmptyAnimation emoji={loadError ? '⚠️' : '📝'} size={96} />
          <Text style={S.emptyText}>
            {loadError
              ? `Connexion articles : ${loadError}`
              : 'Aucun article pour cette recherche'}
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.list}>
          {filtered.map(a => (
            <TouchableOpacity
              key={a.id}
              style={S.card}
              activeOpacity={0.85}
              onPress={() => setSelected(a)}
            >
              {/* Top row */}
              <View style={S.cardTop}>
                <View style={S.catBadge}>
                  <Text style={S.catBadgeText}>
                    {CAT_EMOJI[a.category ?? ''] ?? '📝'} {a.category ?? 'Autre'}
                  </Text>
                </View>
                {a.is_sponsored && (
                  <View style={S.sponsorBadge}>
                    <Text style={S.sponsorBadgeText}>SPONSO{a.sponsor_brand ? ` · ${a.sponsor_brand}` : ''}</Text>
                  </View>
                )}
              </View>

              {/* Titre + sous-titre */}
              <Text style={S.cardTitle}>{a.title}</Text>
              {a.subtitle && (
                <Text style={S.cardSub} numberOfLines={2}>{a.subtitle}</Text>
              )}

              {/* Auteur + meta */}
              <View style={S.cardFooter}>
                <View style={S.authorRow}>
                  <View style={S.authorAvatar}>
                    {a.author_avatar ? (
                      <Image source={{ uri: a.author_avatar }} style={S.authorAvatarImg} />
                    ) : (
                      <Text style={{ fontSize: 14 }}>
                        {ROLE_EMOJI[a.author_role] ?? '👤'}
                      </Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={S.authorName} numberOfLines={1}>{a.author_name}</Text>
                    <Text style={S.authorRole} numberOfLines={1}>{a.author_role}</Text>
                  </View>
                </View>
                <View style={S.cardMeta}>
                  <View style={S.metaItem}>
                    <Ionicons name="time-outline" size={11} color={Colors.warmGray} />
                    <Text style={S.metaText}>{a.read_time} min</Text>
                  </View>
                  <View style={S.metaItem}>
                    <Ionicons
                      name={likedIds[a.id] ? 'heart' : 'heart-outline'}
                      size={12}
                      color={likedIds[a.id] ? Colors.rose : Colors.warmGray}
                    />
                    <Text style={S.metaText}>{likeCount(a)}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
          <View style={{ height: 20 }} />
        </ScrollView>
      )}

      {/* Modal détail article */}
      <Modal visible={!!selected} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setSelected(null)}>
        {selected && (
          <SafeAreaView style={S.modalSafe} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.modalScroll}>

              {/* Hero */}
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
                      {CAT_EMOJI[selected.category ?? ''] ?? '📝'}
                    </Text>
                  </LinearGradient>
                )}

                <TouchableOpacity style={S.heroBackBtn} onPress={() => setSelected(null)}>
                  <Ionicons name="close" size={20} color={Colors.ink} />
                </TouchableOpacity>

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

              <View style={S.modalContent}>

                {/* Badges */}
                <View style={S.modalBadges}>
                  <View style={S.catBadge}>
                    <Text style={S.catBadgeText}>
                      {CAT_EMOJI[selected.category ?? ''] ?? '📝'} {selected.category ?? 'Autre'}
                    </Text>
                  </View>
                  {selected.is_sponsored && (
                    <View style={S.sponsorBadge}>
                      <Text style={S.sponsorBadgeText}>
                        SPONSO{selected.sponsor_brand ? ` · ${selected.sponsor_brand}` : ''}
                      </Text>
                    </View>
                  )}
                  <View style={S.timeBadge}>
                    <Ionicons name="time-outline" size={12} color={Colors.warmGray} />
                    <Text style={S.timeText}>{selected.read_time} min</Text>
                  </View>
                </View>

                {/* Titre + sous-titre */}
                <Text style={S.modalTitle}>{selected.title}</Text>
                {selected.subtitle && (
                  <Text style={S.modalSub}>{selected.subtitle}</Text>
                )}

                {/* Auteur card */}
                <View style={S.authorCard}>
                  <View style={S.authorCardAvatar}>
                    {selected.author_avatar ? (
                      <Image source={{ uri: selected.author_avatar }} style={S.authorCardAvatarImg} />
                    ) : (
                      <Text style={{ fontSize: 22 }}>
                        {ROLE_EMOJI[selected.author_role] ?? '👤'}
                      </Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={S.authorCardName}>{selected.author_name}</Text>
                    <Text style={S.authorCardRole}>{selected.author_role}</Text>
                  </View>
                  {selected.author_contact ? (
                    <TouchableOpacity
                      style={S.contactBtn}
                      onPress={() => openContact(selected.author_contact)}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="mail-outline" size={13} color="#fff" />
                      <Text style={S.contactBtnText}>Contact</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                {/* Corps de l'article */}
                <View style={{ marginBottom: 18 }}>
                  {renderBody(selected.body).map((para, i) => (
                    <Text key={i} style={S.bodyPara}>{para}</Text>
                  ))}
                </View>

                {/* Likes pill */}
                <View style={S.likesRow}>
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
                      {likedIds[selected.id] ? 'Aimé' : 'J\'aime'} · {likeCount(selected)}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={{ height: 28 }} />
              </View>
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers

/** Découpe le corps en paragraphes (sépare sur double saut de ligne). */
function renderBody(body: string): string[] {
  return body
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(Boolean);
}

// ─────────────────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.bg },
  center:  { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 60 },
  emptyText: { fontSize: 15, fontFamily: 'DMSans_500Medium', color: Colors.warmGray, textAlign: 'center', paddingHorizontal: 32 },

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
  filtersScroll: { flexGrow: 0, marginBottom: 8 },
  filtersRow: {
    paddingHorizontal: 16, gap: 8,
    alignItems: 'center', paddingVertical: 6,
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
    padding: 16, marginBottom: 12,
  },
  cardTop: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  catBadge: {
    backgroundColor: Colors.cream, borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  catBadgeText: { fontSize: 12, fontFamily: 'DMSans_600SemiBold', color: Colors.warmGray },
  sponsorBadge: {
    backgroundColor: Colors.amber, borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  sponsorBadgeText: {
    fontSize: 10, fontFamily: 'DMSans_700Bold', color: '#fff', letterSpacing: 0.5,
  },

  cardTitle: { fontSize: 17, fontFamily: 'Poppins_700Bold', color: Colors.ink, marginBottom: 6, lineHeight: 23 },
  cardSub:   { fontSize: 13, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, lineHeight: 18, marginBottom: 12 },

  cardFooter: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12,
  },
  authorRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0,
  },
  authorAvatar: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: Colors.cream,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  authorAvatarImg: { width: '100%', height: '100%' },
  authorName: { fontSize: 12, fontFamily: 'DMSans_700Bold', color: Colors.ink, lineHeight: 16 },
  authorRole: { fontSize: 10, fontFamily: 'DMSans_500Medium', color: Colors.warmGray, lineHeight: 14 },

  cardMeta:   { flexDirection: 'row', gap: 10, alignItems: 'center' },
  metaItem:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText:   { fontSize: 11, fontFamily: 'DMSans_500Medium', color: Colors.warmGray },

  // ── Modal ──
  modalSafe:    { flex: 1, backgroundColor: Colors.bg },
  modalScroll:  { paddingBottom: 0 },

  hero: { width: '100%', height: 220, position: 'relative', backgroundColor: Colors.cream },
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

  modalContent: { paddingHorizontal: 20, paddingTop: 20 },
  modalBadges:  { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 14 },
  timeBadge:    { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.surface, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: Colors.border },
  timeText:     { fontSize: 12, fontFamily: 'DMSans_500Medium', color: Colors.warmGray },

  modalTitle: { fontSize: 24, fontFamily: 'Poppins_700Bold', color: Colors.ink, lineHeight: 31, marginBottom: 8 },
  modalSub:   { fontSize: 15, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, lineHeight: 22, marginBottom: 18 },

  // Auteur card
  authorCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.cream, borderRadius: 14,
    padding: 12, marginBottom: 20,
  },
  authorCardAvatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: Colors.surface,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.border,
  },
  authorCardAvatarImg: { width: '100%', height: '100%' },
  authorCardName: { fontSize: 15, fontFamily: 'DMSans_700Bold', color: Colors.ink, lineHeight: 19 },
  authorCardRole: { fontSize: 12, fontFamily: 'DMSans_500Medium', color: Colors.warmGray, lineHeight: 16, marginTop: 1 },
  contactBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.ink, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  contactBtnText: { fontSize: 12, fontFamily: 'DMSans_700Bold', color: '#fff' },

  // Body
  bodyPara: {
    fontSize: 15, fontFamily: 'DMSans_400Regular', color: Colors.ink,
    lineHeight: 24, marginBottom: 14,
  },

  // Likes row
  likesRow: { alignItems: 'flex-start', marginBottom: 12 },
  likeBtnBig: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: '#FEE2E2',
    borderRadius: 999,
  },
  likeBtnBigActive: { backgroundColor: Colors.rose },
  likeBtnBigText: {
    fontSize: 13, fontFamily: 'DMSans_700Bold', color: Colors.rose,
  },
});
