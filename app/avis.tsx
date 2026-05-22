import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/theme/colors';
import { AppHeader } from '../src/components/AppHeader';
import { EmptyAnimation } from '../src/components/animations/EmptyAnimation';
import {
  addUserProductReview,
  averageReviewNote,
  loadUserProductReviews,
  type UserProductReview,
} from '../src/lib/userProductReviews';
import { trackProductEvent } from '../src/lib/productAnalytics';

const CATEGORIES = ['Shampoing', 'Après-shampoing', 'Masque', 'Huile', 'Crème coiffante', 'Sérum', 'Spray', 'Autre'];

const STORE_URL = Platform.select({
  ios: 'https://apps.apple.com/app/id0000000000?action=write-review',
  android: 'market://details?id=com.cotonnoir.app',
  default: 'https://cotonnoir.app',
});

function Stars({ note, onSelect }: { note: number; onSelect?: (n: number) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 3 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <TouchableOpacity key={n} onPress={() => onSelect?.(n)} disabled={!onSelect}>
          <Ionicons
            name={n <= note ? 'star' : 'star-outline'}
            size={onSelect ? 28 : 16}
            color={n <= note ? Colors.amber : Colors.border}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function AvisScreen() {
  const [avisList, setAvisList] = useState<UserProductReview[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    produit: '', marque: '', categorie: '', note: 0, commentaire: '',
  });

  const reload = useCallback(async () => {
    const list = await loadUserProductReviews();
    setAvisList(list);
    setHydrated(true);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  function openModal() {
    setForm({ produit: '', marque: '', categorie: '', note: 0, commentaire: '' });
    setShowModal(true);
  }

  async function submitAvis() {
    if (!form.produit || !form.note) return;
    const next = await addUserProductReview({
      produit: form.produit,
      marque: form.marque,
      categorie: form.categorie,
      note: form.note,
      commentaire: form.commentaire,
    });
    setAvisList(next);
    setShowModal(false);
    void trackProductEvent('product_review_saved', {
      note: form.note,
      categorie: form.categorie || 'Autre',
    });
  }

  async function openStoreReview() {
    if (!STORE_URL) return;
    try {
      const can = await Linking.canOpenURL(STORE_URL);
      if (can) await Linking.openURL(STORE_URL);
      else Alert.alert('Bientôt disponible', 'Le lien App Store / Play Store sera activé à la publication.');
    } catch {
      Alert.alert('Impossible d\'ouvrir la boutique', 'Réessaie plus tard.');
    }
  }

  const avgNote = averageReviewNote(avisList);

  return (
    <SafeAreaView style={S.safe} edges={['top']}>

      <AppHeader
        title="Mes Avis"
        rightAction="custom"
        rightSlot={
          <TouchableOpacity
            style={S.addBtn}
            onPress={openModal}
            accessibilityRole="button"
            accessibilityLabel="Ajouter un avis"
          >
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.content}>

        <View style={S.storeCard}>
          <Text style={S.storeTitle}>Aider la communauté sur les stores</Text>
          <Text style={S.storeSub}>
            Tes avis produits restent privés dans l&apos;app. Pour la confiance sur App Store / Play Store, laisse une note publique quand tu es prête.
          </Text>
          <TouchableOpacity style={S.storeBtn} onPress={() => void openStoreReview()}>
            <Ionicons name="star" size={16} color={Colors.ink} />
            <Text style={S.storeBtnText}>Noter Coton Noir sur le store</Text>
          </TouchableOpacity>
        </View>

        {hydrated && avisList.length > 0 ? (
          <View style={S.summaryCard}>
            <View style={S.summaryLeft}>
              <Text style={S.summaryScore}>{avgNote}</Text>
              <Stars note={Math.round(avgNote)} />
              <Text style={S.summaryCount}>{avisList.length} avis enregistrés</Text>
            </View>
            <View style={S.summaryDivider} />
            <View style={S.summaryRight}>
              {[5, 4, 3, 2, 1].map(n => {
                const count = avisList.filter(a => a.note === n).length;
                const pct   = avisList.length ? (count / avisList.length) * 100 : 0;
                return (
                  <View key={n} style={S.barRow}>
                    <Text style={S.barLabel}>{n}</Text>
                    <Ionicons name="star" size={10} color={Colors.amber} />
                    <View style={S.barBg}>
                      <View style={[S.barFill, { width: `${pct}%` }]} />
                    </View>
                    <Text style={S.barCount}>{count}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}

        <Text style={S.secTitle}>Tous les avis</Text>
        {avisList.map(a => (
          <View key={a.id} style={S.card}>
            <View style={S.cardTop}>
              <View style={S.cardIcon}>
                <Text style={{ fontSize: 22 }}>{a.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={S.cardProduit}>{a.produit}</Text>
                <Text style={S.cardMarque}>{a.marque} · {a.categorie}</Text>
              </View>
              <Stars note={a.note} />
            </View>
            {!!a.commentaire && (
              <Text style={S.cardComment}>&quot;{a.commentaire}&quot;</Text>
            )}
            <Text style={S.cardDate}>{a.date}</Text>
          </View>
        ))}

        {hydrated && avisList.length === 0 && (
          <View style={S.emptyBox}>
            <EmptyAnimation emoji="⭐" size={92} style={{ marginBottom: 12 }} />
            <Text style={S.emptyTitle}>Aucun avis pour l&apos;instant</Text>
            <Text style={S.emptyBody}>Note les produits que tu utilises pour suivre ce qui fonctionne vraiment pour tes cheveux.</Text>
            <TouchableOpacity style={S.emptyBtn} onPress={openModal}>
              <Text style={S.emptyBtnText}>Ajouter un avis</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={S.modalOverlay}>
          <TouchableOpacity style={S.modalBackdrop} activeOpacity={1} onPress={() => setShowModal(false)} />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={S.modalWrap}>
            <View style={S.modalSheet}>
              <View style={S.modalHandle} />

              <View style={S.modalHeader}>
                <Text style={S.modalTitle}>Nouvel avis</Text>
                <TouchableOpacity onPress={() => setShowModal(false)} style={S.modalClose}>
                  <Ionicons name="close" size={18} color={Colors.ink} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>

                <Text style={S.fieldLabel}>Note *</Text>
                <View style={{ marginBottom: 20 }}>
                  <Stars note={form.note} onSelect={n => setForm(f => ({ ...f, note: n }))} />
                </View>

                <Text style={S.fieldLabel}>Nom du produit *</Text>
                <TextInput
                  style={S.input}
                  value={form.produit}
                  onChangeText={v => setForm(f => ({ ...f, produit: v }))}
                  placeholder="ex. Curl & Style Milk"
                  placeholderTextColor={Colors.border}
                />

                <Text style={S.fieldLabel}>Marque</Text>
                <TextInput
                  style={S.input}
                  value={form.marque}
                  onChangeText={v => setForm(f => ({ ...f, marque: v }))}
                  placeholder="ex. Shea Moisture"
                  placeholderTextColor={Colors.border}
                />

                <Text style={S.fieldLabel}>Catégorie</Text>
                <View style={S.pillsRow}>
                  {CATEGORIES.map(c => (
                    <TouchableOpacity
                      key={c}
                      style={[S.pill, form.categorie === c && S.pillActive]}
                      onPress={() => setForm(f => ({ ...f, categorie: c }))}
                    >
                      <Text style={[S.pillText, form.categorie === c && S.pillTextActive]}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={S.fieldLabel}>Commentaire</Text>
                <TextInput
                  style={[S.input, S.inputMulti]}
                  value={form.commentaire}
                  onChangeText={v => setForm(f => ({ ...f, commentaire: v }))}
                  placeholder="Ce que tu as aimé ou non..."
                  placeholderTextColor={Colors.border}
                  multiline
                />

                <TouchableOpacity
                  style={[S.submitBtn, (!form.produit || !form.note) && S.submitBtnDisabled]}
                  onPress={() => void submitAvis()}
                  disabled={!form.produit || !form.note}
                >
                  <Text style={S.submitBtnText}>Enregistrer l&apos;avis</Text>
                </TouchableOpacity>

                <View style={{ height: 16 }} />
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: 20, paddingTop: 8 },

  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.ink, alignItems: 'center', justifyContent: 'center',
  },

  storeCard: {
    backgroundColor: Colors.ink,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  storeTitle: {
    fontSize: 15,
    fontFamily: 'DMSans_700Bold',
    color: '#fff',
    marginBottom: 6,
  },
  storeSub: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(255,255,255,0.65)',
    lineHeight: 18,
    marginBottom: 12,
  },
  storeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: Colors.amber,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  storeBtnText: { fontSize: 13, fontFamily: 'DMSans_700Bold', color: Colors.ink },

  summaryCard: {
    backgroundColor: Colors.surface, borderRadius: 18, borderWidth: 1, borderColor: Colors.border,
    padding: 18, flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24,
  },
  summaryLeft:    { alignItems: 'center', gap: 6 },
  summaryScore:   { fontSize: 40, fontFamily: 'Poppins_700Bold', color: Colors.ink },
  summaryCount:   { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray },
  summaryDivider: { width: 1, height: 80, backgroundColor: Colors.border },
  summaryRight:   { flex: 1, gap: 5 },
  barRow:   { flexDirection: 'row', alignItems: 'center', gap: 5 },
  barLabel: { fontSize: 11, fontFamily: 'DMSans_500Medium', color: Colors.ink, width: 10, textAlign: 'right' },
  barBg:    { flex: 1, height: 6, backgroundColor: Colors.cream, borderRadius: 999, overflow: 'hidden' },
  barFill:  { height: 6, backgroundColor: Colors.amber, borderRadius: 999 },
  barCount: { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, width: 14, textAlign: 'right' },

  secTitle: { fontSize: 17, fontFamily: 'Poppins_600SemiBold', color: Colors.ink, marginBottom: 12 },

  card: {
    backgroundColor: Colors.surface, borderRadius: 16, borderWidth: 1, borderColor: Colors.border,
    padding: 16, marginBottom: 12,
  },
  cardTop:    { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  cardIcon:   { width: 42, height: 42, borderRadius: 12, backgroundColor: Colors.cream, alignItems: 'center', justifyContent: 'center' },
  cardProduit:{ fontSize: 14, fontFamily: 'DMSans_700Bold', color: Colors.ink },
  cardMarque: { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, marginTop: 2 },
  cardComment:{ fontSize: 13, fontFamily: 'DMSans_400Regular', color: Colors.ink, lineHeight: 20, fontStyle: 'italic', marginBottom: 8 },
  cardDate:   { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray },

  emptyBox:    { alignItems: 'center', paddingTop: 48, paddingHorizontal: 32 },
  emptyTitle:  { fontSize: 17, fontFamily: 'Poppins_600SemiBold', color: Colors.ink, marginBottom: 8 },
  emptyBody:   { fontSize: 13, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  emptyBtn:    { backgroundColor: Colors.ink, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 13 },
  emptyBtnText:{ fontSize: 14, fontFamily: 'DMSans_700Bold', color: '#fff' },

  modalOverlay:  { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalWrap:     { justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: Colors.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingBottom: 36, paddingTop: 12, maxHeight: '90%',
  },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle:  { fontSize: 18, fontFamily: 'Poppins_600SemiBold', color: Colors.ink },
  modalClose:  { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },

  fieldLabel: { fontSize: 13, fontFamily: 'DMSans_600SemiBold', color: Colors.ink, marginBottom: 8 },
  input: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 14, fontFamily: 'DMSans_400Regular', color: Colors.ink,
    backgroundColor: Colors.cream, marginBottom: 16,
  },
  inputMulti: { minHeight: 90, textAlignVertical: 'top' },

  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  pill: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 999, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  pillActive:    { borderColor: Colors.rose, backgroundColor: Colors.blush },
  pillText:      { fontSize: 12, fontFamily: 'DMSans_500Medium', color: Colors.ink },
  pillTextActive:{ fontFamily: 'DMSans_700Bold', color: Colors.rose },

  submitBtn:         { backgroundColor: Colors.ink, borderRadius: 14, paddingVertical: 15, alignItems: 'center' },
  submitBtnDisabled: { backgroundColor: Colors.border },
  submitBtnText:     { fontSize: 15, fontFamily: 'DMSans_700Bold', color: '#fff' },
});
