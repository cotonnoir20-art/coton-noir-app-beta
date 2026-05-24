import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/theme/colors';
import { useApp } from '../src/context/AppContext';
import { appendJournalEntry } from '../src/lib/journalStorage';
import { AppHeader } from '../src/components/AppHeader';
import {
  CompletionLottieOverlay,
  type CompletionLottieVariant,
} from '../src/components/animations/CompletionLottieOverlay';
import {
  CC_ROUTINE_DAILY_NIGHT,
  CC_ROUTINE_WASHDAY,
} from '../src/lib/cotonCoins';

type EntryType = 'soin' | 'routine';

const COINS: Record<EntryType, number> = { soin: CC_ROUTINE_WASHDAY, routine: CC_ROUTINE_DAILY_NIGHT };

const TITLE_PLACEHOLDER: Record<EntryType, string> = {
  soin:    'Ex: Masque hydratant',
  routine: 'Ex: Routine du soir',
};

const NOTES_PLACEHOLDER: Record<EntryType, string> = {
  soin:    "Décris ton soin, les produits utilisés, tes impressions...",
  routine: "Décris ta routine, les produits utilisés, tes impressions...",
};


export default function AddEntryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    type?: string | string[];
    title?: string | string[];
    notes?: string | string[];
  }>();
  const { grantJournalEntrySecure } = useApp();

  const paramType = Array.isArray(params.type) ? params.type[0] : params.type;
  const paramTitle = Array.isArray(params.title) ? params.title[0] : params.title;
  const paramNotes = Array.isArray(params.notes) ? params.notes[0] : params.notes;

  const [type, setType]         = useState<EntryType>(
    paramType === 'routine' ? 'routine' : 'soin',
  );
  const [title, setTitle]       = useState(paramTitle?.trim() ?? '');
  const [notes, setNotes]       = useState(paramNotes?.trim() ?? '');
  const [saved, setSaved]       = useState(false);
  const [completionOpen, setCompletionOpen] = useState(false);
  const [completionVariant, setCompletionVariant] = useState<CompletionLottieVariant>('light');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showPicker, setShowPicker]     = useState(false);

  function onDateChange(_: any, date?: Date) {
    if (Platform.OS === 'android') setShowPicker(false);
    if (date) setSelectedDate(date);
  }

  function formatDate(d: Date) {
    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  const coins = COINS[type];

  async function handleSave() {
    if (!title.trim()) return;
    const entryDate = selectedDate.toISOString().slice(0, 10);
    const grant = await grantJournalEntrySecure({
      kind: type,
      label: title.trim(),
      entryDate,
    });
    await appendJournalEntry({
      entryDate,
      title: title.trim(),
      notes: notes.trim(),
      kind: type,
    });
    if (!grant.ok) return;
    if (grant.alreadyDone) {
      Alert.alert('Déjà récompensé', 'Entrée enregistrée dans ton journal. Les CotonCoins du jour étaient déjà crédités.');
      setTimeout(() => router.back(), 700);
      return;
    }
    setSaved(true);
    setCompletionVariant(type === 'soin' ? 'strong' : 'light');
    setCompletionOpen(true);
  }

  function onCompletionClose() {
    setCompletionOpen(false);
    setTimeout(() => router.back(), 280);
  }

  return (
    <SafeAreaView style={S.safe} edges={['top']}>

      {/* Header */}
      <AppHeader title="Ajouter un soin" />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.content}>

          {/* Info box */}
          <View style={S.infoBox}>
            <Text style={S.infoIcon}>💡</Text>
            <View style={S.infoTexts}>
              <Text style={S.infoTitle}>Quelle différence ?</Text>
              <View style={S.infoRow}>
                <View style={[S.infoPill, { backgroundColor: Colors.rose }]}>
                  <Text style={S.infoPillText}>🧴</Text>
                </View>
                <Text style={S.infoBody}>
                  <Text style={S.infoBold}>Soin : </Text>
                  Traitement spécifique et complet (shampooing, masque, huile, traitement profond...)
                </Text>
              </View>
              <View style={S.infoRow}>
                <View style={[S.infoPill, { backgroundColor: Colors.sage }]}>
                  <Text style={S.infoPillText}>🌿</Text>
                </View>
                <Text style={S.infoBody}>
                  <Text style={S.infoBold}>Routine : </Text>
                  Gestes quotidiens simples (LOC, LCO, démêlage, coiffage...)
                </Text>
              </View>
            </View>
          </View>

          {/* Type toggle */}
          <Text style={S.label}>Type</Text>
          <View style={S.typeRow}>
            <TouchableOpacity
              style={[S.typeBtn, type === 'soin' && S.typeBtnActive]}
              onPress={() => setType('soin')}
            >
              <Text style={[S.typeBtnText, type === 'soin' && S.typeBtnTextActive]}>
                Soin (+{CC_ROUTINE_WASHDAY} CC)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[S.typeBtn, type === 'routine' && S.typeBtnActive]}
              onPress={() => setType('routine')}
            >
              <Text style={[S.typeBtnText, type === 'routine' && S.typeBtnTextActive]}>
                Routine (+{CC_ROUTINE_DAILY_NIGHT} CC)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Title */}
          <Text style={S.label}>Titre <Text style={{ color: Colors.rose }}>*</Text></Text>
          <TextInput
            style={S.input}
            placeholder={TITLE_PLACEHOLDER[type]}
            placeholderTextColor={Colors.warmGray}
            value={title}
            onChangeText={setTitle}
          />

          {/* Date */}
          <Text style={S.label}>Date</Text>
          <TouchableOpacity style={S.dateRow} onPress={() => setShowPicker(true)}>
            <Ionicons name="calendar-outline" size={18} color={Colors.amber} />
            <Text style={S.dateText}>{formatDate(selectedDate)}</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.warmGray} style={{ marginLeft: 'auto' as any }} />
          </TouchableOpacity>

          {/* Picker Android */}
          {showPicker && Platform.OS === 'android' && (
            <DateTimePicker value={selectedDate} mode="date" onChange={onDateChange} />
          )}

          {/* Picker iOS */}
          {Platform.OS === 'ios' && (
            <Modal visible={showPicker} transparent animationType="slide" onRequestClose={() => setShowPicker(false)}>
              <TouchableOpacity style={S.pickerOverlay} activeOpacity={1} onPress={() => setShowPicker(false)}>
                <View style={S.pickerSheet}>
                  <View style={S.pickerHandle} />
                  <DateTimePicker
                    value={selectedDate} mode="date" display="spinner"
                    onChange={onDateChange} locale="fr-FR" style={{ width: '100%' }}
                  />
                  <TouchableOpacity style={S.pickerConfirm} onPress={() => setShowPicker(false)}>
                    <Text style={S.pickerConfirmText}>Confirmer</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </Modal>
          )}

          {/* Notes */}
          <Text style={S.label}>Notes</Text>
          <TextInput
            style={[S.input, S.inputMulti]}
            placeholder={NOTES_PLACEHOLDER[type]}
            placeholderTextColor={Colors.warmGray}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Save CTA */}
      <View style={S.ctaWrap}>
        <TouchableOpacity
          style={[S.cta, (!title.trim() || saved) && S.ctaDisabled]}
          onPress={handleSave}
          disabled={!title.trim() || saved}
        >
          <Text style={S.ctaText}>
            {saved ? "Enregistré ✓" : `📋 Enregistrer (+${coins} CC)`}
          </Text>
        </TouchableOpacity>
      </View>

      <CompletionLottieOverlay
        visible={completionOpen}
        variant={completionVariant}
        onClose={onCompletionClose}
        caption={type === 'soin' ? 'Soin enregistré !' : 'Routine enregistrée !'}
      />

    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: 20, paddingTop: 16 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontFamily: 'Satoshi_500Medium', color: Colors.ink },
  coinsBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.ink,
    borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6,
  },
  coinsEmoji: { fontSize: 14 },
  coinsText:  { fontSize: 14, fontFamily: 'DMSans_700Bold', color: Colors.amber },

  /* Info box */
  infoBox: {
    flexDirection: 'row', gap: 10,
    backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A',
    borderRadius: 14, padding: 14, marginBottom: 24,
  },
  infoIcon:   { fontSize: 18 },
  infoTexts:  { flex: 1, gap: 8 },
  infoTitle:  { fontSize: 13, fontFamily: 'DMSans_700Bold', color: '#92400E', marginBottom: 4 },
  infoRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  infoPill:   { width: 20, height: 20, borderRadius: 6, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 },
  infoPillText: { fontSize: 10 },
  infoBody:   { fontSize: 12, fontFamily: 'DMSans_400Regular', color: '#78350F', lineHeight: 18, flex: 1 },
  infoBold:   { fontFamily: 'DMSans_700Bold' },

  /* Type toggle */
  typeRow: {
    flexDirection: 'row', backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: 14, padding: 4, marginBottom: 20, gap: 4,
  },
  typeBtn: {
    flex: 1, paddingVertical: 11, borderRadius: 10,
    alignItems: 'center',
  },
  typeBtnActive: { backgroundColor: Colors.ink },
  typeBtnText:   { fontSize: 13, fontFamily: 'DMSans_600SemiBold', color: Colors.warmGray },
  typeBtnTextActive: { color: '#fff' },

  /* Fields */
  label: { fontSize: 13, fontFamily: 'DMSans_600SemiBold', color: Colors.ink, marginBottom: 8 },
  input: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 14, fontFamily: 'DMSans_400Regular', color: Colors.ink,
    marginBottom: 20,
  },
  inputMulti: { minHeight: 110, paddingTop: 13 },

  dateRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13,
    marginBottom: 20,
  },
  dateText: { fontSize: 14, fontFamily: 'DMSans_400Regular', color: Colors.ink },

  /* CTA */
  ctaWrap: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20, paddingBottom: 28, paddingTop: 12,
    backgroundColor: Colors.bg,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  cta: {
    backgroundColor: Colors.ink, borderRadius: 16,
    paddingVertical: 16, alignItems: 'center',
  },
  ctaDisabled: { backgroundColor: Colors.border },
  ctaText: { fontSize: 15, fontFamily: 'DMSans_700Bold', color: '#fff' },

  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  pickerSheet: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36, alignItems: 'center' },
  pickerHandle: { width: 40, height: 4, borderRadius: 999, backgroundColor: Colors.border, marginBottom: 12 },
  pickerConfirm: { marginTop: 12, backgroundColor: Colors.ink, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 40, alignItems: 'center' },
  pickerConfirmText: { fontSize: 15, fontFamily: 'DMSans_700Bold', color: '#fff' },
});
