import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/theme/colors';
import { useApp } from '../src/context/AppContext';
import { supabase } from '../src/lib/supabase';
import { isCatalogPublished } from '../src/lib/catalogStatus';
import { AppHeader } from '../src/components/AppHeader';
import { EmptyAnimation } from '../src/components/animations/EmptyAnimation';

type TabId = 'recent' | 'rated' | 'video';

type Hairstyle = {
  id:           string;
  name:         string;
  duration:     string | null;
  stars:        number;
  likes:        number;
  level:        'débutant' | 'inter' | string;
  bg_color:     string | null;
  emoji:        string | null;
  /** URL visuel carte / détail (Storage ou CDN) */
  image:        string | null;
  card_height:  number;
  tabs:         string[];
  /** absent sur anciennes lignes : traité comme publié */
  status?:      string;
};

const TABS: { id: TabId; label: string }[] = [
  { id: 'recent', label: 'Récentes' },
  { id: 'rated',  label: 'À noter'  },
  { id: 'video',  label: 'Vidéos'   },
];

export default function CoiffuresScreen() {
  const router = useRouter();
  const { state } = useApp();
  const [tab, setTab]       = useState<TabId>('recent');
  const [search, setSearch] = useState('');

  const [styles, setStyles]       = useState<Hairstyle[]>([]);
  const [loading, setLoading]     = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('hairstyles')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          setLoadError(error.message);
          setStyles([]);
        } else {
          setLoadError(null);
          setStyles((data ?? []) as Hairstyle[]);
        }
        setLoading(false);
      });
  }, []);

  const catalog = styles.filter(s => isCatalogPublished(s.status));

  const filtered = catalog.filter(s => {
    const matchTab    = tab === 'recent' || (s.tabs ?? []).includes(tab);
    const matchSearch = !search.trim() || s.name.toLowerCase().includes(search.toLowerCase());
    return matchTab && matchSearch;
  });

  const colA = filtered.filter((_, i) => i % 2 === 0);
  const colB = filtered.filter((_, i) => i % 2 === 1);

  return (
    <SafeAreaView style={S.safe} edges={['top']}>

      {/* ── Header ── */}
      <AppHeader title="Coiffures" />

      {/* ── Search + segmented (warm bg) ── */}
      <LinearGradient
        colors={[Colors.amberLight, Colors.bg]}
        style={S.searchArea}
      >
        {/* Search */}
        <View style={S.searchRow}>
          <Text style={S.searchIcon}>🔍</Text>
          <TextInput
            style={S.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Cherche une coiffure…"
            placeholderTextColor={Colors.warmGray}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close" size={16} color={Colors.warmGray} />
            </TouchableOpacity>
          )}
        </View>

        {/* Segmented */}
        <View style={S.segmented}>
          {TABS.map(t => (
            <TouchableOpacity
              key={t.id}
              style={[S.seg, tab === t.id && S.segActive]}
              onPress={() => setTab(t.id)}
            >
              <Text style={[S.segText, tab === t.id && S.segTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.content}>
        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator color={Colors.amber} />
          </View>
        ) : loadError ? (
          <View style={S.empty}>
            <EmptyAnimation emoji="⚠️" size={88} />
            <Text style={S.emptyTitle}>Connexion coiffures : {loadError}</Text>
            <Text style={S.emptySub}>
              Vérifie dans Supabase : table « hairstyles » + policy SELECT pour anon.
            </Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={S.empty}>
            <EmptyAnimation emoji={search ? '🔍' : '💇'} size={88} />
            <Text style={S.emptyTitle}>
              {search
                ? `Aucune coiffure pour "${search}"`
                : styles.length === 0
                ? 'Aucune coiffure publiée pour le moment'
                : 'Aucune coiffure dans cet onglet'}
            </Text>
            <Text style={S.emptySub}>
              {search ? 'Essaie : Twist, Bantu, Puff…' : 'Reviens bientôt 🌿'}
            </Text>
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Text style={S.emptyAction}>Effacer la recherche</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={S.grid}>
            {[colA, colB].map((col, ci) => (
              <View key={ci} style={S.col}>
                {col.map(item => (
                  <TouchableOpacity
                    key={item.id}
                    style={S.card}
                    activeOpacity={0.88}
                    onPress={() => router.push({
                      pathname: '/coiffure',
                      params: {
                        id:       item.id,
                        name:     item.name ?? '',
                        duration: item.duration ?? '',
                        stars:    String(item.stars ?? 0),
                        likes:    String(item.likes ?? 0),
                        level:    item.level ?? '',
                        bg:       item.bg_color ?? '',
                        emoji:    item.emoji ?? '',
                        image:    item.image?.trim() ?? '',
                      },
                    })}
                  >
                    <View style={[S.cardImg, { height: item.card_height ?? 220 }]}>
                      {item.image?.trim() ? (
                        <>
                          <Image
                            source={{ uri: item.image.trim() }}
                            style={StyleSheet.absoluteFillObject}
                            contentFit="cover"
                            transition={200}
                          />
                          <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.45)']}
                            start={{ x: 0.5, y: 0.35 }}
                            end={{ x: 0.5, y: 1 }}
                            style={StyleSheet.absoluteFillObject}
                            pointerEvents="none"
                          />
                        </>
                      ) : (
                        <LinearGradient
                          colors={[item.bg_color ?? '#3a2530', '#1a1209']}
                          start={{ x: 0.15, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={[StyleSheet.absoluteFillObject, { alignItems: 'center', justifyContent: 'center' }]}
                        >
                          <Text style={S.cardEmoji}>{item.emoji ?? '💇'}</Text>
                        </LinearGradient>
                      )}

                      <View style={S.likesBadge}>
                        <Text style={S.likesBadgeText}>❤️ {item.likes}</Text>
                      </View>

                      <View style={[
                        S.levelBadge,
                        { backgroundColor: item.level === 'débutant' ? Colors.amber : Colors.sage },
                      ]}>
                        <Text style={S.levelBadgeText}>
                          {item.level === 'débutant' ? 'Débutant' : 'Intermédiaire'}
                        </Text>
                      </View>
                    </View>

                    <View style={S.cardInfo}>
                      <Text style={S.cardName}>{item.name}</Text>
                      {item.duration ? <Text style={S.cardDur}>{item.duration}</Text> : null}
                      <Text style={S.cardStars}>★ {item.stars}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },

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

  // ── Search area ──
  searchArea: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14 },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.5)',
    paddingHorizontal: 14, paddingVertical: 10, marginBottom: 14,
  },
  searchIcon:  { fontSize: 16 },
  searchInput: {
    flex: 1, fontSize: 13, fontFamily: 'DMSans_400Regular',
    color: Colors.ink, padding: 0,
  },

  // ── Segmented ──
  segmented: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 14, borderWidth: 1, borderColor: Colors.border,
    padding: 4,
  },
  seg: {
    flex: 1, paddingVertical: 9, borderRadius: 11, alignItems: 'center',
  },
  segActive: {
    backgroundColor: Colors.surface,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  segText:       { fontSize: 13, fontFamily: 'DMSans_500Medium', color: Colors.warmGray },
  segTextActive: { fontFamily: 'DMSans_700Bold', color: Colors.ink },

  // ── Grid ──
  content: { paddingHorizontal: 20, paddingBottom: 16 },
  grid: { flexDirection: 'row', gap: 12 },
  col:  { flex: 1, gap: 12 },

  // ── Cards ──
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16, borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden',
  },
  cardImg: {
    position: 'relative',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardEmoji:  { fontSize: 36 },
  likesBadge: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3,
  },
  likesBadgeText: { fontSize: 10, fontFamily: 'DMSans_600SemiBold', color: '#fff' },
  levelBadge: {
    position: 'absolute', bottom: 8, left: 8,
    borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3,
  },
  levelBadgeText: { fontSize: 9, fontFamily: 'DMSans_700Bold', color: '#fff' },

  cardInfo:  { padding: 10 },
  cardName:  { fontSize: 13, fontFamily: 'DMSans_700Bold', color: Colors.ink },
  cardDur:   { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, marginTop: 2 },
  cardStars: { fontSize: 10, fontFamily: 'DMSans_600SemiBold', color: Colors.amber, marginTop: 4 },

  // ── Empty ──
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyIcon:   { fontSize: 48 },
  emptyTitle:  { fontSize: 15, fontFamily: 'DMSans_600SemiBold', color: Colors.ink, textAlign: 'center' },
  emptySub:    { fontSize: 13, fontFamily: 'DMSans_400Regular', color: Colors.warmGray },
  emptyAction: { fontSize: 14, fontFamily: 'DMSans_600SemiBold', color: Colors.amber },
});
