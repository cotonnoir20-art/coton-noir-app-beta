import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView,
  Modal, Platform, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/theme/colors';
import {
  addToTrousse, listTrousse, removeFromTrousse,
  TROUSSE_CATEGORIES, TrousseCategory, TrousseProduct,
} from '../src/lib/trousseStorage';

// ─── Fetch OBF ───────────────────────────────────────────────────────────────

async function fetchProductByBarcode(
  barcode: string,
): Promise<{ name: string; brand: string } | null> {
  try {
    const res = await fetch(
      `https://world.openbeautyfacts.org/api/v2/product/${barcode}.json`,
    );
    const json = await res.json();
    if (json.status !== 1 || !json.product) return null;
    const p = json.product;
    return {
      name:  (p.product_name_fr || p.product_name || '').trim(),
      brand: (p.brands || '').split(',')[0].trim(),
    };
  } catch {
    return null;
  }
}

// ─── Product card ────────────────────────────────────────────────────────────

function ProductCard({
  product,
  onDelete,
}: {
  product: TrousseProduct;
  onDelete: () => void;
}) {
  const cat = TROUSSE_CATEGORIES.find(c => c.id === product.category) ?? TROUSSE_CATEGORIES[6];
  return (
    <View style={S.card}>
      <View style={S.cardBadge}>
        <Text style={S.cardBadgeEmoji}>{cat.emoji}</Text>
      </View>
      <View style={S.cardBody}>
        {product.brand ? <Text style={S.cardBrand}>{product.brand}</Text> : null}
        <Text style={S.cardName}>{product.name}</Text>
        <View style={S.cardStars}>
          {[1, 2, 3, 4, 5].map(s => (
            <Ionicons
              key={s}
              name={s <= product.rating ? 'star' : 'star-outline'}
              size={12}
              color={s <= product.rating ? Colors.amber : Colors.border}
            />
          ))}
        </View>
        {product.memo ? (
          <Text style={S.cardMemo} numberOfLines={2}>{product.memo}</Text>
        ) : null}
      </View>
      <TouchableOpacity
        style={S.cardDeleteBtn}
        onPress={onDelete}
        hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
      >
        <Ionicons name="trash-outline" size={17} color={Colors.warmGray} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function MaTrousseScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();

  const [products, setProducts] = useState<TrousseProduct[]>([]);
  const [loading, setLoading]   = useState(true);

  // Modal states
  const [formOpen,   setFormOpen]   = useState(false);
  const [scanOpen,   setScanOpen]   = useState(false);
  const [formStep,   setFormStep]   = useState<'choice' | 'form'>('choice');
  const [scanLoading, setScanLoading] = useState(false);
  const scannedRef = useRef(false);

  // Form fields
  const [newName,     setNewName]     = useState('');
  const [newBrand,    setNewBrand]    = useState('');
  const [newCategory, setNewCategory] = useState<TrousseCategory>('autre');
  const [newRating,   setNewRating]   = useState(3);
  const [newMemo,     setNewMemo]     = useState('');
  const [newBarcode,  setNewBarcode]  = useState('');
  const [saving,      setSaving]      = useState(false);

  const load = useCallback(async () => {
    setProducts(await listTrousse());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function resetForm() {
    setNewName(''); setNewBrand(''); setNewCategory('autre');
    setNewRating(3); setNewMemo(''); setNewBarcode('');
  }

  function openAdd() {
    resetForm();
    setFormStep('choice');
    setFormOpen(true);
  }

  async function goToScan() {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) { setFormStep('form'); return; }
    }
    setFormOpen(false);
    setTimeout(() => {
      scannedRef.current = false;
      setScanLoading(false);
      setScanOpen(true);
    }, 320);
  }

  async function handleBarcode(barcode: string) {
    if (scannedRef.current) return;
    scannedRef.current = true;
    setScanLoading(true);
    const product = await fetchProductByBarcode(barcode);
    if (product) {
      setNewName(product.name);
      setNewBrand(product.brand);
    }
    setNewBarcode(barcode);
    setScanLoading(false);
    setScanOpen(false);
    setTimeout(() => {
      setFormStep('form');
      setFormOpen(true);
    }, 320);
  }

  async function handleSave() {
    if (!newName.trim() || saving) return;
    setSaving(true);
    await addToTrousse({
      name:     newName.trim(),
      brand:    newBrand.trim(),
      category: newCategory,
      rating:   newRating,
      memo:     newMemo.trim(),
      barcode:  newBarcode || undefined,
    });
    await load();
    setSaving(false);
    setFormOpen(false);
  }

  function handleDelete(id: string) {
    Alert.alert('Supprimer ?', 'Retirer ce produit de ta trousse ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => { await removeFromTrousse(id); await load(); },
      },
    ]);
  }

  const grouped = TROUSSE_CATEGORIES
    .map(cat => ({ ...cat, items: products.filter(p => p.category === cat.id) }))
    .filter(g => g.items.length > 0);

  const ratingLabel = ['', 'Mauvais', 'Moyen', 'Bien', 'Très bien', 'Excellent'][newRating];

  return (
    <SafeAreaView style={S.safe} edges={['top']}>

      {/* ── Header ── */}
      <View style={S.header}>
        <TouchableOpacity style={S.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={Colors.ink} />
        </TouchableOpacity>
        <Text style={S.headerTitle}>Ma trousse</Text>
        {products.length > 0 && (
          <View style={S.countBadge}>
            <Text style={S.countText}>{products.length}</Text>
          </View>
        )}
      </View>

      {/* ── Bannière scanner ingrédients ── */}
      <TouchableOpacity
        style={S.scanBanner}
        onPress={() => router.push('/ingredient-scan')}
        activeOpacity={0.85}
      >
        <Text style={S.scanEmoji}>🔬</Text>
        <View style={{ flex: 1 }}>
          <Text style={S.scanTitle}>Analyser les ingrédients</Text>
          <Text style={S.scanSub}>Scanner un produit de ta trousse</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={Colors.amber} />
      </TouchableOpacity>

      {/* ── Contenu ── */}
      {loading ? (
        <View style={S.centered}>
          <ActivityIndicator color={Colors.amber} />
        </View>
      ) : products.length === 0 ? (
        <View style={S.empty}>
          <Text style={S.emptyEmoji}>🧴</Text>
          <Text style={S.emptyTitle}>Ta trousse est vide</Text>
          <Text style={S.emptySub}>
            Ajoute les produits que tu utilises pour garder une trace de ta routine capillaire
          </Text>
          <TouchableOpacity style={S.emptyBtn} onPress={openAdd} activeOpacity={0.85}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={S.emptyBtnText}>Ajouter mon premier produit</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.listContent}>
          {grouped.map(group => (
            <View key={group.id} style={S.section}>
              <View style={S.sectionHeader}>
                <Text style={S.sectionEmoji}>{group.emoji}</Text>
                <Text style={S.sectionLabel}>{group.label}</Text>
                <Text style={S.sectionCount}>{group.items.length}</Text>
              </View>
              {group.items.map(p => (
                <ProductCard key={p.id} product={p} onDelete={() => handleDelete(p.id)} />
              ))}
            </View>
          ))}
          <View style={{ height: 100 }} />
        </ScrollView>
      )}

      {/* ── FAB ── */}
      {products.length > 0 && (
        <TouchableOpacity style={S.fab} onPress={openAdd} activeOpacity={0.85}>
          <Ionicons name="add" size={22} color="#fff" />
          <Text style={S.fabText}>Ajouter</Text>
        </TouchableOpacity>
      )}

      {/* ════════════════════════════════════════════
          Modal formulaire (choix + saisie)
      ════════════════════════════════════════════ */}
      <Modal
        visible={formOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setFormOpen(false)}
      >
        {formStep === 'choice' ? (
          /* ── Vue choix ── */
          <SafeAreaView style={S.modal} edges={['top', 'bottom']}>
            <View style={S.choiceHeader}>
              <TouchableOpacity onPress={() => setFormOpen(false)}>
                <Ionicons name="close" size={22} color={Colors.warmGray} />
              </TouchableOpacity>
            </View>

            <View style={S.choiceBody}>
              <Text style={S.choiceTitle}>Ajouter un produit</Text>
              <Text style={S.choiceSub}>Comment veux-tu l'ajouter ?</Text>

              <TouchableOpacity style={S.choiceCard} onPress={goToScan} activeOpacity={0.85}>
                <View style={[S.choiceIconBox, { backgroundColor: Colors.amberPowder }]}>
                  <Ionicons name="barcode-outline" size={28} color={Colors.amberDark} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={S.choiceCardTitle}>Scanner le code-barres</Text>
                  <Text style={S.choiceCardSub}>
                    Retrouve le nom et la marque automatiquement
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.border} />
              </TouchableOpacity>

              <TouchableOpacity
                style={S.choiceCard}
                onPress={() => setFormStep('form')}
                activeOpacity={0.85}
              >
                <View style={[S.choiceIconBox, { backgroundColor: Colors.cream }]}>
                  <Ionicons name="create-outline" size={28} color={Colors.ink} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={S.choiceCardTitle}>Saisir manuellement</Text>
                  <Text style={S.choiceCardSub}>Entre les informations toi-même</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.border} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        ) : (
          /* ── Vue formulaire ── */
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <SafeAreaView style={S.modal} edges={['top', 'bottom']}>
              <View style={S.modalHeader}>
                <TouchableOpacity onPress={() => setFormStep('choice')}>
                  <Text style={S.modalCancel}>Retour</Text>
                </TouchableOpacity>
                <Text style={S.modalTitle}>Nouveau produit</Text>
                <TouchableOpacity onPress={handleSave} disabled={!newName.trim() || saving}>
                  <Text style={[S.modalSave, (!newName.trim() || saving) && S.modalSaveDisabled]}>
                    {saving ? '…' : 'Ajouter'}
                  </Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                style={S.modalScroll}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {/* Badge code-barres scanné */}
                {newBarcode ? (
                  <View style={S.barcodeBadge}>
                    <Ionicons name="barcode-outline" size={15} color={Colors.sage} />
                    <Text style={S.barcodeBadgeText}>Code scanné · {newBarcode}</Text>
                    {newName ? (
                      <View style={S.foundBadge}>
                        <Text style={S.foundBadgeText}>Trouvé</Text>
                      </View>
                    ) : (
                      <View style={[S.foundBadge, { backgroundColor: Colors.amberLight }]}>
                        <Text style={[S.foundBadgeText, { color: Colors.amberDark }]}>
                          Non trouvé
                        </Text>
                      </View>
                    )}
                  </View>
                ) : null}

                {/* Marque */}
                <Text style={S.fieldLabel}>Marque</Text>
                <TextInput
                  style={S.fieldInput}
                  value={newBrand}
                  onChangeText={setNewBrand}
                  placeholder="ex : Shea Moisture"
                  placeholderTextColor={Colors.warmGray}
                  autoCapitalize="words"
                />

                {/* Nom */}
                <Text style={S.fieldLabel}>
                  Nom du produit <Text style={S.required}>*</Text>
                </Text>
                <TextInput
                  style={S.fieldInput}
                  value={newName}
                  onChangeText={setNewName}
                  placeholder="ex : Curl & Shine Shampoo"
                  placeholderTextColor={Colors.warmGray}
                  autoCapitalize="words"
                />

                {/* Catégorie */}
                <Text style={S.fieldLabel}>Catégorie</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={S.catScroll}
                  contentContainerStyle={S.catRow}
                >
                  {TROUSSE_CATEGORIES.map(cat => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[S.catChip, newCategory === cat.id && S.catChipActive]}
                      onPress={() => setNewCategory(cat.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={S.catChipEmoji}>{cat.emoji}</Text>
                      <Text style={[S.catChipText, newCategory === cat.id && S.catChipTextActive]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Avis */}
                <Text style={S.fieldLabel}>Mon avis</Text>
                <View style={S.starsRow}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <TouchableOpacity key={star} onPress={() => setNewRating(star)} activeOpacity={0.7}>
                      <Ionicons
                        name={star <= newRating ? 'star' : 'star-outline'}
                        size={34}
                        color={star <= newRating ? Colors.amber : Colors.border}
                      />
                    </TouchableOpacity>
                  ))}
                  <Text style={S.ratingLabel}>{ratingLabel}</Text>
                </View>

                {/* Note perso */}
                <Text style={S.fieldLabel}>Note perso (optionnel)</Text>
                <TextInput
                  style={[S.fieldInput, S.fieldMemo]}
                  value={newMemo}
                  onChangeText={setNewMemo}
                  placeholder="ex : Parfait pour le co-wash estival…"
                  placeholderTextColor={Colors.warmGray}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />

                <View style={{ height: 48 }} />
              </ScrollView>
            </SafeAreaView>
          </KeyboardAvoidingView>
        )}
      </Modal>

      {/* ════════════════════════════════════════════
          Modal scanner (fullscreen)
      ════════════════════════════════════════════ */}
      <Modal
        visible={scanOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setScanOpen(false)}
      >
        <View style={S.scanScreen}>
          {permission?.granted ? (
            <CameraView
              style={StyleSheet.absoluteFillObject}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'qr'] }}
              onBarcodeScanned={({ data }) => handleBarcode(data)}
            />
          ) : null}

          {/* Header transparent */}
          <SafeAreaView style={S.scanSafeArea} edges={['top']}>
            <TouchableOpacity
              style={S.scanBack}
              onPress={() => {
                setScanOpen(false);
                setTimeout(() => { setFormStep('choice'); setFormOpen(true); }, 320);
              }}
            >
              <Ionicons name="chevron-back" size={22} color="#fff" />
              <Text style={S.scanBackText}>Annuler</Text>
            </TouchableOpacity>
          </SafeAreaView>

          {/* Viseur */}
          <View style={S.viewfinder} pointerEvents="none">
            <View style={S.vCorner} />
            <View style={[S.vCorner, S.vCornerTR]} />
            <View style={[S.vCorner, S.vCornerBL]} />
            <View style={[S.vCorner, S.vCornerBR]} />
          </View>

          {/* Loading / instruction */}
          <View style={S.scanBottomArea} pointerEvents="none">
            {scanLoading ? (
              <View style={S.scanPill}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={S.scanPillText}>Recherche en cours…</Text>
              </View>
            ) : (
              <View style={S.scanPill}>
                <Ionicons name="barcode-outline" size={16} color="#fff" />
                <Text style={S.scanPillText}>Vise le code-barres du produit</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const VIEWFINDER_SIZE = 220;
const CORNER_SIZE     = 24;
const CORNER_WIDTH    = 3;

const S = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.bg },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // ── Header ──
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, gap: 10,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { flex: 1, fontSize: 20, fontFamily: 'Satoshi_500Medium', color: Colors.ink },
  countBadge:  { backgroundColor: Colors.ink, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  countText:   { fontSize: 13, fontFamily: 'DMSans_700Bold', color: '#fff' },

  // ── Bannière scanner ingrédients ──
  scanBanner: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginBottom: 12,
    backgroundColor: Colors.amberPowder, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.amberLight,
    paddingHorizontal: 14, paddingVertical: 11, gap: 10,
  },
  scanEmoji: { fontSize: 20 },
  scanTitle: { fontSize: 13, fontFamily: 'DMSans_600SemiBold', color: Colors.amberInk },
  scanSub:   { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.amberInk, opacity: 0.75, marginTop: 1 },

  // ── Empty ──
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 10 },
  emptyEmoji: { fontSize: 56, marginBottom: 4 },
  emptyTitle: { fontSize: 20, fontFamily: 'Satoshi_500Medium', color: Colors.ink, textAlign: 'center' },
  emptySub:   { fontSize: 14, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, textAlign: 'center', lineHeight: 20 },
  emptyBtn:   {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8,
    backgroundColor: Colors.ink, borderRadius: 999, paddingHorizontal: 20, paddingVertical: 12,
  },
  emptyBtnText: { fontSize: 14, fontFamily: 'DMSans_700Bold', color: '#fff' },

  // ── List ──
  listContent: { paddingHorizontal: 16, paddingTop: 4 },
  section:     { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  sectionEmoji:  { fontSize: 18 },
  sectionLabel:  { flex: 1, fontSize: 15, fontFamily: 'DMSans_600SemiBold', color: Colors.ink },
  sectionCount:  {
    fontSize: 12, fontFamily: 'DMSans_500Medium', color: Colors.warmGray,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2,
  },

  // ── Product card ──
  card: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: Colors.surface, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border,
    padding: 14, marginBottom: 10, gap: 12,
  },
  cardBadge: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.cream, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  cardBadgeEmoji: { fontSize: 20 },
  cardBody:  { flex: 1, gap: 3 },
  cardBrand: { fontSize: 10, fontFamily: 'DMSans_500Medium', color: Colors.warmGray, textTransform: 'uppercase', letterSpacing: 0.5 },
  cardName:  { fontSize: 14, fontFamily: 'DMSans_600SemiBold', color: Colors.ink },
  cardStars: { flexDirection: 'row', gap: 2 },
  cardMemo:  { fontSize: 12, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, lineHeight: 17 },
  cardDeleteBtn: { padding: 2, flexShrink: 0 },

  // ── FAB ──
  fab: {
    position: 'absolute', bottom: 28, right: 20,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.ink, borderRadius: 999,
    paddingHorizontal: 20, paddingVertical: 13,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 6,
  },
  fabText: { fontSize: 14, fontFamily: 'DMSans_700Bold', color: '#fff' },

  // ── Modal commun ──
  modal:       { flex: 1, backgroundColor: Colors.bg },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  modalTitle:        { fontSize: 16, fontFamily: 'Satoshi_500Medium', color: Colors.ink },
  modalCancel:       { fontSize: 14, fontFamily: 'DMSans_500Medium', color: Colors.warmGray },
  modalSave:         { fontSize: 14, fontFamily: 'DMSans_700Bold', color: Colors.amberDark },
  modalSaveDisabled: { opacity: 0.35 },
  modalScroll:       { flex: 1, paddingHorizontal: 20, paddingTop: 20 },

  // ── Vue choix ──
  choiceHeader: {
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 4, alignItems: 'flex-end',
  },
  choiceBody: {
    flex: 1, paddingHorizontal: 20, paddingTop: 8,
  },
  choiceTitle: { fontSize: 22, fontFamily: 'Satoshi_500Medium', color: Colors.ink, marginBottom: 6 },
  choiceSub:   { fontSize: 14, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, marginBottom: 28 },
  choiceCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.surface, borderRadius: 18,
    borderWidth: 1.5, borderColor: Colors.border,
    padding: 18, marginBottom: 14,
  },
  choiceIconBox: {
    width: 52, height: 52, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  choiceCardTitle: { fontSize: 15, fontFamily: 'DMSans_600SemiBold', color: Colors.ink, marginBottom: 2 },
  choiceCardSub:   { fontSize: 12, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, lineHeight: 17 },

  // ── Formulaire — barcode badge ──
  barcodeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.sageLight, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 9, marginBottom: 4,
  },
  barcodeBadgeText: { flex: 1, fontSize: 12, fontFamily: 'DMSans_500Medium', color: Colors.sageDark },
  foundBadge:       { backgroundColor: Colors.sageLight, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  foundBadgeText:   { fontSize: 11, fontFamily: 'DMSans_700Bold', color: Colors.sageDark },

  // ── Champs formulaire ──
  fieldLabel: {
    fontSize: 13, fontFamily: 'DMSans_600SemiBold', color: Colors.ink,
    marginBottom: 8, marginTop: 16,
  },
  required:   { color: Colors.rose },
  fieldInput: {
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, fontFamily: 'DMSans_400Regular', color: Colors.ink,
  },
  fieldMemo: { minHeight: 80, paddingTop: 12 },

  // ── Chips catégorie ──
  catScroll: { marginLeft: -20, marginRight: -20 },
  catRow:    { paddingHorizontal: 20, gap: 8 },
  catChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border,
  },
  catChipActive:     { backgroundColor: Colors.ink, borderColor: Colors.ink },
  catChipEmoji:      { fontSize: 14 },
  catChipText:       { fontSize: 12, fontFamily: 'DMSans_500Medium', color: Colors.ink },
  catChipTextActive: { color: '#fff', fontFamily: 'DMSans_600SemiBold' },

  // ── Étoiles ──
  starsRow:    { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ratingLabel: { marginLeft: 6, fontSize: 13, fontFamily: 'DMSans_500Medium', color: Colors.warmGray },

  // ── Scanner modal ──
  scanScreen:    { flex: 1, backgroundColor: '#000' },
  scanSafeArea:  { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  scanBack: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  scanBackText: { fontSize: 16, fontFamily: 'DMSans_500Medium', color: '#fff' },

  // Viewfinder (cadre amber)
  viewfinder: {
    position: 'absolute',
    width: VIEWFINDER_SIZE, height: VIEWFINDER_SIZE,
    top: '50%', left: '50%',
    marginTop: -VIEWFINDER_SIZE / 2 - 20,
    marginLeft: -VIEWFINDER_SIZE / 2,
  },
  vCorner: {
    position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE,
    borderColor: Colors.amber,
    borderTopWidth: CORNER_WIDTH, borderLeftWidth: CORNER_WIDTH,
    top: 0, left: 0,
  },
  vCornerTR: { left: undefined, right: 0, borderLeftWidth: 0, borderRightWidth: CORNER_WIDTH },
  vCornerBL: { top: undefined, bottom: 0, borderTopWidth: 0, borderBottomWidth: CORNER_WIDTH },
  vCornerBR: {
    top: undefined, left: undefined, right: 0, bottom: 0,
    borderTopWidth: 0, borderLeftWidth: 0,
    borderRightWidth: CORNER_WIDTH, borderBottomWidth: CORNER_WIDTH,
  },

  // Bottom info pill
  scanBottomArea: {
    position: 'absolute', bottom: 60, left: 0, right: 0,
    alignItems: 'center',
  },
  scanPill: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 999,
    paddingHorizontal: 18, paddingVertical: 10,
  },
  scanPillText: { fontSize: 14, fontFamily: 'DMSans_500Medium', color: '#fff' },
});
