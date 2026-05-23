import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/theme/colors';
import { AppHeader } from '../src/components/AppHeader';
import { EmptyAnimation } from '../src/components/animations/EmptyAnimation';
import {
  listArticleFavorites,
  listProductFavorites,
  listRecipeFavorites,
  removeArticleFavorite,
  removeProductFavorite,
  removeRecipeFavorite,
  type ArticleFavorite,
  type ProductFavorite,
  type RecipeFavorite,
} from '../src/lib/contentFavorites';
import { CATALOG_ARTICLES } from '../src/data/articlesCatalog';
import { CATALOG_RECIPES } from '../src/data/recipesCatalog';

type TabId = 'articles' | 'products' | 'recipes';

const TABS: { id: TabId; label: string }[] = [
  { id: 'articles', label: 'Articles' },
  { id: 'recipes', label: 'Recettes' },
  { id: 'products', label: 'Produits' },
];

function formatSaved(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function FavoritesScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>('articles');
  const [articles, setArticles] = useState<ArticleFavorite[]>([]);
  const [recipes, setRecipes] = useState<RecipeFavorite[]>([]);
  const [products, setProducts] = useState<ProductFavorite[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const [a, r, p] = await Promise.all([
      listArticleFavorites(),
      listRecipeFavorites(),
      listProductFavorites(),
    ]);
    setArticles(a);
    setRecipes(r);
    setProducts(p);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  async function removeArticle(id: string) {
    await removeArticleFavorite(id);
    setArticles(prev => prev.filter(a => a.id !== id));
  }

  async function removeProduct(id: string) {
    await removeProductFavorite(id);
    setProducts(prev => prev.filter(p => p.id !== id));
  }

  async function removeRecipe(id: string) {
    await removeRecipeFavorite(id);
    setRecipes(prev => prev.filter(r => r.id !== id));
  }

  function openArticle(fav: ArticleFavorite) {
    const catalog = CATALOG_ARTICLES.find(a => a.id === fav.id);
    router.push({
      pathname: '/articles',
      params: { openId: fav.id, openTitle: catalog?.title ?? fav.title },
    } as any);
  }

  function openProduct(fav: ProductFavorite) {
    router.push({
      pathname: '/product',
      params: {
        id: fav.id,
        brand: fav.brand,
        name: fav.name,
        emoji: '🧴',
        price: '—',
        rating: '4.5',
        count: '0',
        bg: Colors.cream,
        accent: Colors.amber,
      },
    } as any);
  }

  const isEmpty =
    !loading &&
    ((tab === 'articles' && articles.length === 0) ||
      (tab === 'recipes' && recipes.length === 0) ||
      (tab === 'products' && products.length === 0));

  return (
    <SafeAreaView style={S.safe} edges={['top']}>
      <AppHeader title="Mes favoris" subtitle="Articles, recettes et produits enregistrés sur cet appareil" />

      <View style={S.tabsBar}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.id}
            style={[S.tabBtn, tab === t.id && S.tabBtnActive]}
            onPress={() => setTab(t.id)}
          >
            <Text style={[S.tabText, tab === t.id && S.tabTextActive]}>{t.label}</Text>
            {t.id === 'articles' && articles.length > 0 ? (
              <View style={S.badge}><Text style={S.badgeText}>{articles.length}</Text></View>
            ) : null}
            {t.id === 'recipes' && recipes.length > 0 ? (
              <View style={S.badge}><Text style={S.badgeText}>{recipes.length}</Text></View>
            ) : null}
            {t.id === 'products' && products.length > 0 ? (
              <View style={S.badge}><Text style={S.badgeText}>{products.length}</Text></View>
            ) : null}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.content}>
        {loading ? (
          <Text style={S.loadingHint}>Chargement…</Text>
        ) : null}

        {isEmpty ? (
          <View style={S.empty}>
            <EmptyAnimation emoji="❤️" size={88} />
            <Text style={S.emptyTitle}>Aucun favori ici</Text>
            <Text style={S.emptySub}>
              {tab === 'articles'
                ? 'Ouvre un article et touche Favori pour le retrouver ici.'
                : tab === 'recipes'
                  ? 'Sur une recette, touche Favori pour l’enregistrer ici.'
                  : 'Sur une fiche produit, ajoute un cœur pour le sauvegarder.'}
            </Text>
            <TouchableOpacity
              style={S.emptyCta}
              onPress={() =>
                router.push(
                  tab === 'articles' ? '/articles' : tab === 'recipes' ? '/recipes' : '/shop',
                )
              }
            >
              <Text style={S.emptyCtaText}>
                {tab === 'articles'
                  ? 'Parcourir les articles'
                  : tab === 'recipes'
                    ? 'Parcourir les recettes'
                    : 'Aller à la boutique'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {tab === 'articles' &&
          articles.map(a => (
            <View key={a.id} style={S.card}>
              <View style={S.cardTop}>
                <View style={[S.iconBox, { backgroundColor: Colors.cream }]}>
                  <Text style={S.iconEmoji}>📰</Text>
                </View>
                <View style={S.cardInfo}>
                  <Text style={S.cardName} numberOfLines={2}>{a.title}</Text>
                  <Text style={S.cardBrand}>{a.category}</Text>
                  <Text style={S.cardDesc}>Ajouté le {formatSaved(a.savedAt)}</Text>
                </View>
                <TouchableOpacity style={S.trashBtn} onPress={() => void removeArticle(a.id)}>
                  <Ionicons name="trash-outline" size={16} color={Colors.warmGray} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={S.viewBtn} onPress={() => openArticle(a)}>
                <Text style={S.viewBtnText}>Lire l’article</Text>
              </TouchableOpacity>
            </View>
          ))}

        {tab === 'recipes' &&
          recipes.map(r => (
            <View key={r.id} style={S.card}>
              <View style={S.cardTop}>
                <View style={[S.iconBox, { backgroundColor: Colors.sageLight }]}>
                  <Text style={S.iconEmoji}>{r.thumbEmoji || '🥛'}</Text>
                </View>
                <View style={S.cardInfo}>
                  <Text style={S.cardName} numberOfLines={2}>{r.name}</Text>
                  <Text style={S.cardBrand}>{r.category}</Text>
                  <Text style={S.cardDesc}>Ajoutée le {formatSaved(r.savedAt)}</Text>
                </View>
                <TouchableOpacity style={S.trashBtn} onPress={() => void removeRecipe(r.id)}>
                  <Ionicons name="trash-outline" size={16} color={Colors.warmGray} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={S.viewBtn} onPress={() => openRecipe(r)}>
                <Text style={S.viewBtnText}>Voir la recette</Text>
              </TouchableOpacity>
            </View>
          ))}

        {tab === 'products' &&
          products.map(p => (
            <View key={p.id} style={S.card}>
              <View style={S.cardTop}>
                <View style={[S.iconBox, { backgroundColor: '#FCE4EC' }]}>
                  <Text style={S.iconEmoji}>🧴</Text>
                </View>
                <View style={S.cardInfo}>
                  <Text style={S.cardName} numberOfLines={2}>{p.name}</Text>
                  <Text style={S.cardBrand}>{p.brand}</Text>
                  <Text style={S.cardDesc}>Ajouté le {formatSaved(p.savedAt)}</Text>
                </View>
                <TouchableOpacity style={S.trashBtn} onPress={() => void removeProduct(p.id)}>
                  <Ionicons name="trash-outline" size={16} color={Colors.warmGray} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={S.viewBtn} onPress={() => openProduct(p)}>
                <Text style={S.viewBtnText}>Voir le produit</Text>
              </TouchableOpacity>
            </View>
          ))}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  loadingHint: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    textAlign: 'center',
    marginBottom: 12,
  },
  tabsBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: { borderBottomColor: Colors.amber },
  tabText: { fontSize: 13, fontFamily: 'DMSans_500Medium', color: Colors.warmGray },
  tabTextActive: { fontFamily: 'DMSans_700Bold', color: Colors.amber },
  badge: {
    backgroundColor: Colors.amberLight,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  badgeText: { fontSize: 10, fontFamily: 'DMSans_700Bold', color: Colors.amberDark },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 12,
  },
  cardTop: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  iconBox: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconEmoji: { fontSize: 26 },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 14, fontFamily: 'DMSans_700Bold', color: Colors.ink, marginBottom: 2 },
  cardBrand: { fontSize: 12, fontFamily: 'DMSans_600SemiBold', color: Colors.amber, marginBottom: 3 },
  cardDesc: { fontSize: 12, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, lineHeight: 17 },
  trashBtn: { padding: 4 },
  viewBtn: {
    backgroundColor: Colors.ink,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center',
  },
  viewBtnText: { fontSize: 13, fontFamily: 'DMSans_700Bold', color: '#fff' },
  empty: { alignItems: 'center', paddingTop: 48, gap: 10, paddingHorizontal: 12 },
  emptyTitle: { fontSize: 16, fontFamily: 'DMSans_700Bold', color: Colors.ink },
  emptySub: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyCta: {
    marginTop: 12,
    backgroundColor: Colors.amber,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  emptyCtaText: { fontSize: 13, fontFamily: 'DMSans_700Bold', color: Colors.ink },
});
