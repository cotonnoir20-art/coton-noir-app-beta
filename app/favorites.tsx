import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/theme/colors';
import { useApp } from '../src/context/AppContext';
import { AppHeader } from '../src/components/AppHeader';
import { EmptyAnimation } from '../src/components/animations/EmptyAnimation';

type TabId = 'products' | 'brands' | 'pros' | 'recipes';

type FavProduct = { name: string; brand: string; desc: string; emoji: string; iconBg: string };
type FavBrand   = { name: string; desc: string; emoji: string; iconBg: string };
type FavPro     = { name: string; role: string; location: string; emoji: string };
type FavRecipe  = { name: string; type: string; desc: string; emoji: string };

const PRODUCTS: FavProduct[] = [
  { name: 'Masque Hydratant Intense', brand: 'Shea Moisture', desc: 'Masque profondément hydratant pour cheveux crépus',         emoji: '📦', iconBg: '#F5ECD7' },
  { name: 'Curl Definition Gel',      brand: 'Cantu',         desc: 'Gel coiffant pour boucles définies',                        emoji: '🧴', iconBg: '#FCE4EC' },
  { name: 'Co-wash Aloe Vera',        brand: 'As I Am',       desc: "Nettoyant doux sans sulfates à l'aloe vera",                emoji: '🌿', iconBg: '#E8F5E9' },
  { name: 'Leave-in Hydrate',         brand: 'Coton Noir',    desc: 'Soin sans rinçage ultra-léger pour longueurs',              emoji: '💧', iconBg: '#E3F2FD' },
];

const BRANDS: FavBrand[] = [
  { name: 'Maison Curl',   desc: 'Soins naturels pour boucles et frisés', emoji: '🌀', iconBg: '#F5ECD7' },
  { name: 'Shea Moisture', desc: 'Leader des soins afro aux actifs naturels', emoji: '🧡', iconBg: '#FFF3E0' },
  { name: 'Ondine',        desc: 'Marque française spécialisée cheveux ondulés', emoji: '🌊', iconBg: '#E3F2FD' },
];

const PROS: FavPro[] = [
  { name: 'Natural Hair Studio', role: 'Salon afro & texturé',       location: 'Paris 11ème', emoji: '✂️' },
  { name: 'Curl Coach Paris',    role: 'Coaching capillaire en ligne', location: 'En ligne',   emoji: '💬' },
];

const RECIPES: FavRecipe[] = [
  { name: 'Masque banane & miel',     type: 'Masque',       desc: 'Hydratation intense pour cheveux secs',     emoji: '🍌' },
  { name: 'Eau de riz fermentée',     type: 'Rinçage',      desc: 'Fortifiant naturel pour longueurs',         emoji: '🌾' },
  { name: "Pré-poo à l'huile coco",  type: 'Pré-shampooing', desc: 'Protection avant lavage pour pointes',    emoji: '🥥' },
];

const TABS: { id: TabId; label: string }[] = [
  { id: 'products', label: 'Produits' },
  { id: 'brands',   label: 'Marques'  },
  { id: 'pros',     label: 'Pros'     },
  { id: 'recipes',  label: 'Recettes' },
];

export default function FavoritesScreen() {
  const router  = useRouter();
  const { state } = useApp();
  const [tab, setTab] = useState<TabId>('products');

  const [products, setProducts] = useState(PRODUCTS);
  const [brands,   setBrands]   = useState(BRANDS);
  const [pros,     setPros]     = useState(PROS);
  const [recipes,  setRecipes]  = useState(RECIPES);

  function removeProduct(i: number) { setProducts(p => p.filter((_, idx) => idx !== i)); }
  function removeBrand(i: number)   { setBrands(p => p.filter((_, idx) => idx !== i));   }
  function removePro(i: number)     { setPros(p => p.filter((_, idx) => idx !== i));     }
  function removeRecipe(i: number)  { setRecipes(p => p.filter((_, idx) => idx !== i));  }

  const isEmpty = (
    (tab === 'products' && products.length === 0) ||
    (tab === 'brands'   && brands.length === 0)   ||
    (tab === 'pros'     && pros.length === 0)     ||
    (tab === 'recipes'  && recipes.length === 0)
  );

  return (
    <SafeAreaView style={S.safe} edges={['top']}>

      {/* ── Header ── */}
      <AppHeader title="Mes favoris" />

      {/* ── Tabs ── */}
      <View style={S.tabsBar}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.id}
            style={[S.tabBtn, tab === t.id && S.tabBtnActive]}
            onPress={() => setTab(t.id)}
          >
            <Text style={[S.tabText, tab === t.id && S.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.content}>

        {isEmpty ? (
          <View style={S.empty}>
            <EmptyAnimation emoji="❤️" size={88} />
            <Text style={S.emptyTitle}>Aucun favori ici</Text>
            <Text style={S.emptySub}>Explore l'app et ajoute tes coups de cœur !</Text>
          </View>
        ) : null}

        {/* ── Produits ── */}
        {tab === 'products' && products.map((p, i) => (
          <View key={i} style={S.card}>
            <View style={S.cardTop}>
              <View style={[S.iconBox, { backgroundColor: p.iconBg }]}>
                <Text style={S.iconEmoji}>{p.emoji}</Text>
              </View>
              <View style={S.cardInfo}>
                <Text style={S.cardName}>{p.name}</Text>
                <Text style={S.cardBrand}>{p.brand}</Text>
                <Text style={S.cardDesc}>{p.desc}</Text>
              </View>
              <TouchableOpacity style={S.trashBtn} onPress={() => removeProduct(i)}>
                <Ionicons name="trash-outline" size={16} color={Colors.warmGray} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={S.viewBtn} onPress={() => router.push('/shop')}>
              <Text style={S.viewBtnText}>🔗 Voir le produit</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* ── Marques ── */}
        {tab === 'brands' && brands.map((b, i) => (
          <View key={i} style={S.card}>
            <View style={S.cardTop}>
              <View style={[S.iconBox, { backgroundColor: b.iconBg }]}>
                <Text style={S.iconEmoji}>{b.emoji}</Text>
              </View>
              <View style={S.cardInfo}>
                <Text style={S.cardName}>{b.name}</Text>
                <Text style={S.cardDesc}>{b.desc}</Text>
              </View>
              <TouchableOpacity style={S.trashBtn} onPress={() => removeBrand(i)}>
                <Ionicons name="trash-outline" size={16} color={Colors.warmGray} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={S.viewBtn}>
              <Text style={S.viewBtnText}>🔗 Voir la marque</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* ── Pros ── */}
        {tab === 'pros' && pros.map((p, i) => (
          <View key={i} style={S.card}>
            <View style={S.cardTop}>
              <View style={[S.iconBox, { backgroundColor: Colors.sageLight }]}>
                <Text style={S.iconEmoji}>{p.emoji}</Text>
              </View>
              <View style={S.cardInfo}>
                <Text style={S.cardName}>{p.name}</Text>
                <Text style={S.cardBrand}>{p.role}</Text>
                <Text style={S.cardDesc}>📍 {p.location}</Text>
              </View>
              <TouchableOpacity style={S.trashBtn} onPress={() => removePro(i)}>
                <Ionicons name="trash-outline" size={16} color={Colors.warmGray} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={S.viewBtn}>
              <Text style={S.viewBtnText}>🔗 Voir le profil</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* ── Recettes ── */}
        {tab === 'recipes' && recipes.map((r, i) => (
          <View key={i} style={S.card}>
            <View style={S.cardTop}>
              <View style={[S.iconBox, { backgroundColor: Colors.amberLight }]}>
                <Text style={S.iconEmoji}>{r.emoji}</Text>
              </View>
              <View style={S.cardInfo}>
                <Text style={S.cardName}>{r.name}</Text>
                <Text style={S.cardBrand}>{r.type}</Text>
                <Text style={S.cardDesc}>{r.desc}</Text>
              </View>
              <TouchableOpacity style={S.trashBtn} onPress={() => removeRecipe(i)}>
                <Ionicons name="trash-outline" size={16} color={Colors.warmGray} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={S.viewBtn}>
              <Text style={S.viewBtnText}>🔗 Voir la recette</Text>
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
  headerTitle: { flex: 1, fontSize: 20, fontFamily: 'Poppins_700Bold', color: Colors.ink },
  coinsBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.ink,
    borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7,
  },
  coinsEmoji: { fontSize: 15 },
  coinsText:  { fontSize: 15, fontFamily: 'DMSans_700Bold', color: Colors.amber },

  // ── Tabs ──
  tabsBar: {
    flexDirection: 'row',
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  tabBtn: {
    flex: 1, paddingVertical: 12, alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabBtnActive: { borderBottomColor: Colors.amber },
  tabText:       { fontSize: 13, fontFamily: 'DMSans_500Medium', color: Colors.warmGray },
  tabTextActive: { fontFamily: 'DMSans_700Bold', color: Colors.amber },

  // ── Cards ──
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18, borderWidth: 1, borderColor: Colors.border,
    padding: 14, marginBottom: 12,
  },
  cardTop: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  iconBox: {
    width: 52, height: 52, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  iconEmoji: { fontSize: 26 },
  cardInfo:  { flex: 1 },
  cardName:  { fontSize: 14, fontFamily: 'DMSans_700Bold', color: Colors.ink, marginBottom: 2 },
  cardBrand: { fontSize: 12, fontFamily: 'DMSans_600SemiBold', color: Colors.amber, marginBottom: 3 },
  cardDesc:  { fontSize: 12, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, lineHeight: 17 },
  trashBtn:  { padding: 4 },

  viewBtn: {
    backgroundColor: Colors.amber,
    borderRadius: 12, paddingVertical: 11,
    alignItems: 'center',
  },
  viewBtnText: { fontSize: 13, fontFamily: 'DMSans_700Bold', color: '#fff' },

  // ── Empty ──
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyIcon:  { fontSize: 44 },
  emptyTitle: { fontSize: 16, fontFamily: 'DMSans_700Bold', color: Colors.ink },
  emptySub:   { fontSize: 13, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, textAlign: 'center' },
});
