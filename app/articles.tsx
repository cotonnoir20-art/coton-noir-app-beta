import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../src/theme/colors';
import { AppHeader } from '../src/components/AppHeader';
import { supabase } from '../src/lib/supabase';
import { EmptyAnimation } from '../src/components/animations/EmptyAnimation';
import { openSafeMailto, openSafeUrl } from '../src/lib/safeLinking';
import {
  ARTICLE_CATEGORIES,
  ARTICLE_EXPERTS,
  CATALOG_ARTICLES,
  CATEGORY_STYLES,
  formatArticleViews,
  type ArticleCategory,
  type CatalogArticle,
} from '../src/data/articlesCatalog';

// ─────────────────────────────────────────────────────────────────────────────

type Article = CatalogArticle & {
  image?: string | null;
  author_avatar?: string | null;
  is_sponsored?: boolean;
  sponsor_brand?: string | null;
};

const LIKES_KEY = '@coton_noir_article_likes';

function mapSupabaseRow(row: Record<string, unknown>): Article | null {
  const title = typeof row.title === 'string' ? row.title.trim() : '';
  if (!title) return null;
  const catRaw = typeof row.category === 'string' ? row.category : 'Soins';
  const category: ArticleCategory =
    catRaw === 'Science' || catRaw === 'Trichologie'
      ? 'Science'
      : catRaw === 'Coiffage' || catRaw === 'Mode protecteur'
        ? 'Coiffage'
        : 'Soins';
  const author = typeof row.author_name === 'string' ? row.author_name : 'Expert·e';
  const initials = author
    .split(/\s+/)
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return {
    id: String(row.id),
    title,
    subtitle: typeof row.subtitle === 'string' ? row.subtitle : '',
    body: typeof row.body === 'string' ? row.body : '',
    category,
    read_time: typeof row.read_time === 'number' ? row.read_time : 5,
    views: typeof row.likes === 'number' ? row.likes * 3 : 400,
    likes: typeof row.likes === 'number' ? row.likes : 0,
    author_name: author,
    author_role: typeof row.author_role === 'string' ? row.author_role : '',
    author_initials: initials || 'CN',
    author_contact: typeof row.author_contact === 'string' ? row.author_contact : '',
    thumb_emoji: category === 'Science' ? '🔬' : category === 'Coiffage' ? '✂️' : '💧',
    thumb_bg: CATEGORY_STYLES[category].bg,
    image: typeof row.image === 'string' ? row.image : null,
    author_avatar: typeof row.author_avatar === 'string' ? row.author_avatar : null,
    is_sponsored: Boolean(row.is_sponsored),
    sponsor_brand: typeof row.sponsor_brand === 'string' ? row.sponsor_brand : null,
    created_at: typeof row.created_at === 'string' ? row.created_at : new Date().toISOString(),
  };
}

function renderBody(body: string): string[] {
  return body
    .split(/\n\s*\n/)
    .map(p => p.trim())
    .filter(Boolean);
}

// ─────────────────────────────────────────────────────────────────────────────

export default function ArticlesScreen() {
  const router = useRouter();

  const [remoteArticles, setRemoteArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [category, setCategory] = useState<'Tout' | ArticleCategory>('Tout');
  const [selected, setSelected] = useState<Article | null>(null);
  const [likedIds, setLikedIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    supabase
      .from('articles')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          setLoadError(error.message);
          setRemoteArticles([]);
        } else {
          setLoadError(null);
          const mapped = (data ?? [])
            .map(r => mapSupabaseRow(r as Record<string, unknown>))
            .filter((a): a is Article => a != null);
          setRemoteArticles(mapped);
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
  }, []);

  const allArticles = useMemo(() => {
    const ids = new Set(CATALOG_ARTICLES.map(a => a.id));
    const extra = remoteArticles.filter(a => !ids.has(a.id));
    return [...CATALOG_ARTICLES, ...extra] as Article[];
  }, [remoteArticles]);

  const featured = useMemo(
    () => allArticles.find(a => a.featured) ?? allArticles[0] ?? null,
    [allArticles],
  );

  const filtered = useMemo(() => {
    const list = allArticles.filter(a => !a.featured || a.id !== featured?.id);
    if (category === 'Tout') return list;
    return list.filter(a => a.category === category);
  }, [allArticles, category, featured?.id]);

  const totalCount = allArticles.length;

  function toggleLike(id: string) {
    setLikedIds(prev => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = true;
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
      <AppHeader title="Articles" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={S.scroll}
      >
        {/* Hero */}
        <Text style={S.heroTitle}>
          Les pros prennent{'\n'}
          <Text style={S.heroAccent}>la parole</Text>
        </Text>
        <Text style={S.heroSub}>
          {totalCount} articles signés par trichologues, dermatologues et coiffeurs
          experts cheveux texturés.
        </Text>

        {/* Filtres catégories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={S.filtersRow}
          style={S.filtersScroll}
        >
          {ARTICLE_CATEGORIES.map(cat => {
            const active = category === cat.id;
            const count = cat.id === 'Tout' ? totalCount : cat.count;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[S.filterChip, active && S.filterChipActive]}
                onPress={() => setCategory(cat.id)}
                activeOpacity={0.85}
              >
                {cat.emoji ? <Text style={S.filterEmoji}>{cat.emoji}</Text> : null}
                <Text style={[S.filterText, active && S.filterTextActive]}>
                  {cat.label} {count}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {loading && remoteArticles.length === 0 ? (
          <View style={S.loaderWrap}>
            <ActivityIndicator color={Colors.amber} />
          </View>
        ) : null}

        {loadError ? (
          <Text style={S.errorHint}>Connexion articles : {loadError}</Text>
        ) : null}

        {/* À la une */}
        {featured && (category === 'Tout' || featured.category === category) ? (
          <FeaturedCard article={featured} onPress={() => setSelected(featured)} />
        ) : null}

        {/* Lectures recommandées */}
        <Text style={S.sectionTitle}>Lectures recommandées</Text>

        {filtered.length === 0 ? (
          <View style={S.emptyWrap}>
            <EmptyAnimation emoji="📝" size={72} />
            <Text style={S.emptyText}>Aucun article dans cette catégorie</Text>
          </View>
        ) : (
          filtered.map(a => (
            <ArticleRow key={a.id} article={a} onPress={() => setSelected(a)} />
          ))
        )}

        {/* Nos experts */}
        <Text style={[S.sectionTitle, S.sectionTitleExperts]}>Nos experts</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={S.expertsRow}
        >
          {ARTICLE_EXPERTS.map(ex => (
            <View key={ex.id} style={S.expertCard}>
              <View style={[S.expertAvatar, { backgroundColor: ex.color }]}>
                <Text style={S.expertInitials}>{ex.initials}</Text>
              </View>
              <Text style={S.expertName}>{ex.name}</Text>
              <Text style={S.expertRole}>{ex.role}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Détail article */}
      <Modal
        visible={!!selected}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelected(null)}
      >
        {selected ? (
          <SafeAreaView style={S.modalSafe} edges={['top']}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.modalScroll}>
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
                    colors={[selected.thumb_bg, Colors.cream]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={S.heroImg}
                  >
                    <Text style={S.heroEmoji}>{selected.thumb_emoji}</Text>
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
                <View style={S.modalBadges}>
                  <CategoryBadge category={selected.category} />
                  {selected.is_sponsored ? (
                    <View style={S.sponsorBadge}>
                      <Text style={S.sponsorBadgeText}>
                        SPONSO{selected.sponsor_brand ? ` · ${selected.sponsor_brand}` : ''}
                      </Text>
                    </View>
                  ) : null}
                  <View style={S.timeBadge}>
                    <Ionicons name="time-outline" size={12} color={Colors.warmGray} />
                    <Text style={S.timeText}>{selected.read_time} min</Text>
                  </View>
                </View>

                <Text style={S.modalTitle}>{selected.title}</Text>
                {selected.subtitle ? <Text style={S.modalSub}>{selected.subtitle}</Text> : null}

                <View style={S.authorCard}>
                  <View style={[S.authorCardAvatar, { backgroundColor: Colors.ink }]}>
                    {selected.author_avatar ? (
                      <Image source={{ uri: selected.author_avatar }} style={S.authorCardAvatarImg} />
                    ) : (
                      <Text style={S.authorCardInitials}>{selected.author_initials}</Text>
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={S.authorNameRow}>
                      <Text style={S.authorCardName}>{selected.author_name}</Text>
                      <Ionicons name="checkmark-circle" size={16} color={Colors.rose} />
                    </View>
                    <Text style={S.authorCardRole}>{selected.author_role}</Text>
                  </View>
                  {selected.author_contact ? (
                    <TouchableOpacity
                      style={S.contactBtn}
                      onPress={() => openContact(selected.author_contact)}
                      activeOpacity={0.85}
                    >
                      <Text style={S.contactBtnText}>Contact</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                <View style={{ marginBottom: 18 }}>
                  {renderBody(selected.body).map((para, i) => (
                    <Text key={i} style={S.bodyPara}>
                      {para}
                    </Text>
                  ))}
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
                    {likedIds[selected.id] ? 'Aimé' : "J'aime"} · {likeCount(selected)}
                  </Text>
                </TouchableOpacity>

                <View style={{ height: 28 }} />
              </View>
            </ScrollView>
          </SafeAreaView>
        ) : null}
      </Modal>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sous-composants

function CategoryBadge({ category }: { category: ArticleCategory }) {
  const style = CATEGORY_STYLES[category];
  return (
    <View style={[S.catPill, { backgroundColor: style.bg }]}>
      <Text style={[S.catPillText, { color: style.text }]}>{category}</Text>
    </View>
  );
}

function FeaturedCard({
  article,
  onPress,
}: {
  article: Article;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={S.featuredCard} activeOpacity={0.92} onPress={onPress}>
      <View style={[S.featuredHero, { backgroundColor: article.thumb_bg || '#4A306D' }]}>
        <View style={S.featuredPin}>
          <Text style={S.featuredPinText}>📌 À la une · {article.category}</Text>
        </View>
        <View style={S.featuredStats}>
          <Text style={S.featuredStatsText}>
            📖 {formatArticleViews(article.views)} · {article.read_time} min
          </Text>
        </View>
        <Text style={S.featuredHeroEmoji}>{article.thumb_emoji}</Text>
      </View>

      <View style={S.featuredBody}>
        <Text style={S.featuredTitle}>{article.title}</Text>
        <Text style={S.featuredSub} numberOfLines={2}>
          {article.subtitle}
        </Text>

        <View style={S.featuredFooter}>
          <View style={S.featuredAuthor}>
            <View style={[S.featuredAuthorAvatar, { backgroundColor: Colors.ink }]}>
              <Text style={S.featuredAuthorInitials}>{article.author_initials}</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={S.authorNameRow}>
                <Text style={S.featuredAuthorName} numberOfLines={1}>
                  {article.author_name}
                </Text>
                <Ionicons name="checkmark-circle" size={14} color={Colors.rose} />
              </View>
              <Text style={S.featuredAuthorRole} numberOfLines={1}>
                {article.author_role}
              </Text>
            </View>
          </View>
          <View style={S.readBtn}>
            <Text style={S.readBtnText}>Lire →</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function ArticleRow({ article, onPress }: { article: Article; onPress: () => void }) {
  const catStyle = CATEGORY_STYLES[article.category];
  return (
    <TouchableOpacity style={S.rowCard} activeOpacity={0.88} onPress={onPress}>
      <View style={[S.rowThumb, { backgroundColor: article.thumb_bg }]}>
        <Text style={S.rowThumbEmoji}>{article.thumb_emoji}</Text>
      </View>
      <View style={S.rowContent}>
        <View style={S.rowMeta}>
          <View style={[S.catPill, { backgroundColor: catStyle.bg }]}>
            <Text style={[S.catPillText, { color: catStyle.text }]}>{article.category}</Text>
          </View>
          <Text style={S.rowTime}>{article.read_time} min de lecture</Text>
        </View>
        <Text style={S.rowTitle} numberOfLines={2}>
          {article.title}
        </Text>
        <View style={S.rowAuthor}>
          <View style={[S.rowAuthorDot, { backgroundColor: Colors.ink }]}>
            <Text style={S.rowAuthorInitials}>{article.author_initials}</Text>
          </View>
          <Text style={S.rowAuthorName} numberOfLines={1}>
            {article.author_name}
          </Text>
          <Ionicons name="checkmark-circle" size={13} color={Colors.rose} style={{ marginLeft: 2 }} />
          <Text style={S.rowAuthorRole} numberOfLines={1}>
            {article.author_role}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingBottom: 8 },

  heroTitle: {
    fontSize: 28,
    lineHeight: 36,
    fontFamily: 'Poppins_700Bold',
    color: Colors.ink,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  heroAccent: { color: Colors.rose },
  heroSub: {
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    paddingHorizontal: 20,
    marginBottom: 18,
  },

  filtersScroll: { flexGrow: 0, marginBottom: 20 },
  filtersRow: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
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
  filterChipActive: {
    backgroundColor: Colors.ink,
    borderColor: Colors.ink,
  },
  filterEmoji: { fontSize: 13 },
  filterText: {
    fontSize: 13,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.warmGray,
  },
  filterTextActive: { color: '#fff' },

  loaderWrap: { paddingVertical: 24, alignItems: 'center' },
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
    paddingHorizontal: 20,
    marginBottom: 14,
    marginTop: 8,
  },
  sectionTitleExperts: { marginTop: 28 },

  emptyWrap: { alignItems: 'center', paddingVertical: 32 },
  emptyText: {
    fontSize: 14,
    fontFamily: 'DMSans_500Medium',
    color: Colors.warmGray,
    marginTop: 8,
  },

  // Featured
  featuredCard: {
    marginHorizontal: 16,
    marginBottom: 28,
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
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  featuredHeroEmoji: { fontSize: 56 },
  featuredPin: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: Colors.rose,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  featuredPinText: {
    fontSize: 11,
    fontFamily: 'DMSans_700Bold',
    color: '#fff',
  },
  featuredStats: {
    position: 'absolute',
    top: 14,
    right: 14,
    backgroundColor: 'rgba(26,18,9,0.55)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  featuredStatsText: {
    fontSize: 11,
    fontFamily: 'DMSans_600SemiBold',
    color: '#fff',
  },
  featuredBody: { padding: 16 },
  featuredTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: 'Poppins_700Bold',
    color: Colors.ink,
    marginBottom: 8,
  },
  featuredSub: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    marginBottom: 16,
  },
  featuredFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  featuredAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  featuredAuthorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featuredAuthorInitials: {
    fontSize: 12,
    fontFamily: 'DMSans_700Bold',
    color: '#fff',
  },
  featuredAuthorName: {
    fontSize: 13,
    fontFamily: 'DMSans_700Bold',
    color: Colors.ink,
    flexShrink: 1,
  },
  featuredAuthorRole: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    marginTop: 1,
  },
  readBtn: {
    backgroundColor: Colors.cream,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  readBtnText: {
    fontSize: 12,
    fontFamily: 'DMSans_700Bold',
    color: Colors.ink,
  },

  // List row
  rowCard: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
    alignItems: 'flex-start',
  },
  rowThumb: {
    width: 72,
    height: 72,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowThumbEmoji: { fontSize: 32 },
  rowContent: { flex: 1, minWidth: 0 },
  rowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  rowTime: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
  },
  rowTitle: {
    fontSize: 15,
    lineHeight: 21,
    fontFamily: 'DMSans_700Bold',
    color: Colors.ink,
    marginBottom: 8,
  },
  rowAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  rowAuthorDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowAuthorInitials: {
    fontSize: 9,
    fontFamily: 'DMSans_700Bold',
    color: '#fff',
  },
  rowAuthorName: {
    fontSize: 12,
    fontFamily: 'DMSans_700Bold',
    color: Colors.ink,
    maxWidth: 100,
  },
  rowAuthorRole: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    flex: 1,
    minWidth: 60,
  },

  catPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  catPillText: {
    fontSize: 11,
    fontFamily: 'DMSans_700Bold',
  },

  authorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  // Experts
  expertsRow: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 8,
  },
  expertCard: {
    width: 100,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  expertAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  expertInitials: {
    fontSize: 16,
    fontFamily: 'DMSans_700Bold',
    color: '#fff',
  },
  expertName: {
    fontSize: 13,
    fontFamily: 'DMSans_700Bold',
    color: Colors.ink,
    textAlign: 'center',
  },
  expertRole: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    textAlign: 'center',
    marginTop: 2,
  },

  // Modal
  modalSafe: { flex: 1, backgroundColor: Colors.bg },
  modalScroll: { paddingBottom: 0 },
  hero: {
    width: '100%',
    height: 220,
    position: 'relative',
    backgroundColor: Colors.cream,
  },
  heroImg: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroEmoji: { fontSize: 96 },
  heroBackBtn: {
    position: 'absolute',
    top: 12,
    left: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  heroLikeBtn: {
    position: 'absolute',
    top: 12,
    right: 16,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  modalContent: { paddingHorizontal: 20, paddingTop: 20 },
  modalBadges: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 14,
  },
  sponsorBadge: {
    backgroundColor: Colors.amber,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  sponsorBadgeText: {
    fontSize: 10,
    fontFamily: 'DMSans_700Bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timeText: {
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
    color: Colors.warmGray,
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: 'Poppins_700Bold',
    color: Colors.ink,
    lineHeight: 31,
    marginBottom: 8,
  },
  modalSub: {
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    lineHeight: 22,
    marginBottom: 18,
  },
  authorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.cream,
    borderRadius: 14,
    padding: 12,
    marginBottom: 20,
  },
  authorCardAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  authorCardAvatarImg: { width: '100%', height: '100%' },
  authorCardInitials: {
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
    color: '#fff',
  },
  authorCardName: {
    fontSize: 15,
    fontFamily: 'DMSans_700Bold',
    color: Colors.ink,
  },
  authorCardRole: {
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
    color: Colors.warmGray,
    marginTop: 1,
  },
  contactBtn: {
    backgroundColor: Colors.ink,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  contactBtnText: {
    fontSize: 12,
    fontFamily: 'DMSans_700Bold',
    color: '#fff',
  },
  bodyPara: {
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
    color: Colors.ink,
    lineHeight: 24,
    marginBottom: 14,
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
  likeBtnBigText: {
    fontSize: 13,
    fontFamily: 'DMSans_700Bold',
    color: Colors.rose,
  },
});
