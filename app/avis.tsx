import { useState } from 'react';
import {
  Modal, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/theme/colors';
import { AppHeader } from '../src/components/AppHeader';
import { EmptyAnimation } from '../src/components/animations/EmptyAnimation';

type Avis = {
  id: number;
  produit: string;
  marque: string;
  categorie: string;
  note: number;
  commentaire: string;
  date: string;
  emoji: string;
};

const INITIAL_AVIS: Avis[] = [
  {
    id: 1, produit: 'Curl & Style Milk', marque: 'Shea Moisture',
    categorie: 'Crème coiffante', note: 5, emoji: '🥛',
    commentaire: 'Définition parfaite, pas d\'effet résidu. Je rachète.',
    date: '12 avril 2026',
  },
  {
    id: 2, produit: 'Jamaican Black Castor Oil', marque: 'Tropic Isle Living',
    categorie: 'Huile', note: 4, emoji: '🥥',
    commentaire: 'Excellente pour la croissance, odeur forte mais efficace.',
    date: '3 mars 2026',
  },
  {
    id: 3, produit: 'Deep Treatment Masque', marque: 'Camille Rose',
    categorie: 'Masque', note: 4, emoji: '🧴',
    commentaire: 'Cheveux très doux après utilisation, bonne hydratation.',
    date: '18 févr. 2026',
  },
];

const CATEGORIES = ['Shampoing', 'Après-shampoing', 'Masque', 'Huile', 'Crème coiffante', 'Sérum', 'Spray', 'Autre'];

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
  const router = useRouter();
  const [avisList, setAvisList] = useState<Avis[]>(INITIAL_AVIS);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    produit: '', marque: '', categorie: '', note: 0, commentaire: '',
  });

  function openModal() {
    setForm({ produit: '', marque: '', categorie: '', note: 0, commentaire: '' });
    setShowModal(true);
  }

  function submitAvis() {
    if (!form.produit || !form.note) return;
    const today = new Date();
    const label = today.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    setAvisList(prev => [{
      id: Date.now(),
      produit: form.produit,
      marque: form.marque,
      categorie: form.categorie || 'Autre',
      note: form.note,
      commentaire: form.commentaire,
      date: label,
      emoji: '⭐',
    }, ...prev]);
    setShowModal(false);
  }

  const avgNote = avisList.length
    ? +(avisList.reduce((s, a) => s + a.note, 0) / avisList.length).toFixed(1)
    : 0;

  return (
    <SafeAreaView style={S.safe} edges={['top']}>

      {/* Header */}
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

        {/* Résumé */}
        <View style={S.summaryCard}>
          <View style={S.summaryLeft}>
            <Text style={S.summaryScore}>{avgNote}</Text>
            <Stars note={Math.round(avgNote)} />
            <Text style={S.summaryCount}>{avisList.length} avis</Text>
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

        {/* Liste */}
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
              <Text style={S.cardComment}>"{a.commentaire}"</Text>
            )}
            <Text style={S.cardDate}>{a.date}</Text>
          </View>
        ))}

        {avisList.length === 0 && (
          <View style={S.emptyBox}>
            <EmptyAnimation emoji="⭐" size={92} style={{ marginBottom: 12 }} />
            <Text style={S.emptyTitle}>Aucun avis pour l'instant</Text>
            <Text style={S.emptyBody}>Note les produits que tu utilises pour suivre ce qui fonctionne vraiment pour tes cheveux.</Text>
            <TouchableOpacity style={S.emptyBtn} onPress={openModal}>
              <Text style={S.emptyBtnText}>Ajouter un avis</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Modal Nouvel avis */}
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

                {/* Note */}
                <Text style={S.fieldLabel}>Note *</Text>
                <View style={{ marginBottom: 20 }}>
                  <Stars note={form.note} onSelect={n => setForm(f => ({ ...f, note: n }))} />
                </View>

                {/* Produit */}
                <Text style={S.fieldLabel}>Nom du produit *</Text>
                <TextInput
                  style={S.input}
                  value={form.produit}
                  onChangeText={v => setForm(f => ({ ...f, produit: v }))}
                  placeholder="ex. Curl & Style Milk"
                  placeholderTextColor={Colors.border}
                />

                {/* Marque */}
                <Text style={S.fieldLabel}>Marque</Text>
                <TextInput
                  style={S.input}
                  value={form.marque}
                  onChangeText={v => setForm(f => ({ ...f, marque: v }))}
                  placeholder="ex. Shea Moisture"
                  placeholderTextColor={Colors.border}
                />

                {/* Catégorie */}
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

                {/* Commentaire */}
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
                  onPress={submitAvis}
                  disabled={!form.produit || !form.note}
                >
                  <Text style={S.submitBtnText}>Publier l'avis</Text>
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

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontFamily: 'Poppins_700Bold', color: Colors.ink },
  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.ink, alignItems: 'center', justifyContent: 'center',
  },

  // Summary card
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

  // Avis card
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

  // Empty
  emptyBox:    { alignItems: 'center', paddingTop: 48, paddingHorizontal: 32 },
  emptyTitle:  { fontSize: 17, fontFamily: 'Poppins_600SemiBold', color: Colors.ink, marginBottom: 8 },
  emptyBody:   { fontSize: 13, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  emptyBtn:    { backgroundColor: Colors.ink, borderRadius: 14, paddingHorizontal: 24, paddingVertical: 13 },
  emptyBtnText:{ fontSize: 14, fontFamily: 'DMSans_700Bold', color: '#fff' },

  // Modal
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
