import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/theme/colors';
import { useApp } from '../src/context/AppContext';
import { AppHeader } from '../src/components/AppHeader';

const WASH_TYPES = [
  'Shampoing classique',
  'Co-wash',
  'No-poo',
  'Shampoing clarifiant',
  'Shampoing doux',
];

const HAIR_STATES = ['Normal', 'Sec', 'Très sec', 'Gras', 'Cassant', 'Élastique'];


function Dropdown({
  label, options, value, onChange,
}: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={D.wrap}>
      <Text style={D.label}>{label}</Text>
      <TouchableOpacity style={D.trigger} onPress={() => setOpen(o => !o)}>
        <Text style={[D.triggerText, { color: label === 'État des cheveux' && value !== '' ? '#3B82F6' : Colors.ink }]}>
          {value}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.warmGray} />
      </TouchableOpacity>
      {open && (
        <View style={D.menu}>
          {options.map(opt => (
            <TouchableOpacity
              key={opt}
              style={[D.option, opt === value && D.optionActive]}
              onPress={() => { onChange(opt); setOpen(false); }}
            >
              <Text style={[D.optionText, opt === value && D.optionTextActive]}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

export default function AddWashDayScreen() {
  const router = useRouter();
  const { dispatch } = useApp();

  const [washType, setWashType]       = useState(WASH_TYPES[0]);
  const [products, setProducts]       = useState('');
  const [hairState, setHairState]     = useState(HAIR_STATES[0]);
  const [notes, setNotes]             = useState('');
  const [saved, setSaved]             = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showPicker, setShowPicker]   = useState(false);

  function onDateChange(_: any, date?: Date) {
    if (date) setSelectedDate(date);
  }

  function handleSave() {
    const iso = selectedDate.toISOString().slice(0, 10);
    dispatch({ type: 'planSoin', soin: { soinType: washType, date: iso } });
    setSaved(true);
    setTimeout(() => router.back(), 800);
  }

  return (
    <SafeAreaView style={S.safe} edges={['top']}>

      {/* Header */}
      <AppHeader
        title="Ajouter un wash day"
        subtitle="Enregistre ta routine de lavage du jour"
        rightAction="none"
      />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.content}>

          {/* Date */}
          <Text style={S.label}>Date</Text>
          <TouchableOpacity style={S.dateRow} onPress={() => setShowPicker(true)}>
            <Ionicons name="calendar-outline" size={18} color={Colors.amber} />
            <Text style={S.dateText}>
              {selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.warmGray} style={{ marginLeft: 'auto' as any }} />
          </TouchableOpacity>

          {/* Picker : même bottom sheet sur iOS et Android (le picker inline Android ne s’affiche pas bien dans un ScrollView). */}
          <Modal visible={showPicker} transparent animationType="slide" onRequestClose={() => setShowPicker(false)}>
            <View style={{ flex: 1, justifyContent: 'flex-end' }}>
              <Pressable style={S.pickerBackdrop} onPress={() => setShowPicker(false)} />
              <View style={S.pickerSheet}>
                <View style={S.pickerHandle} />
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
                  minimumDate={new Date()}
                  onChange={onDateChange}
                  locale="fr-FR"
                  style={Platform.OS === 'ios' ? { width: '100%' } : { alignSelf: 'stretch' }}
                />
                <TouchableOpacity style={S.pickerConfirm} onPress={() => setShowPicker(false)}>
                  <Text style={S.pickerConfirmText}>Confirmer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* Type de lavage */}
          <Dropdown
            label="Type de lavage"
            options={WASH_TYPES}
            value={washType}
            onChange={setWashType}
          />

          {/* Produits utilisés */}
          <Text style={S.label}>Produits utilisés</Text>
          <TextInput
            style={S.input}
            placeholder="Ex: Shampoing hydratant, masque karité..."
            placeholderTextColor={Colors.warmGray}
            value={products}
            onChangeText={setProducts}
          />

          {/* État des cheveux */}
          <Dropdown
            label="État des cheveux"
            options={HAIR_STATES}
            value={hairState}
            onChange={setHairState}
          />

          {/* Notes */}
          <Text style={S.label}>Notes (optionnel)</Text>
          <TextInput
            style={[S.input, S.inputMulti]}
            placeholder="Observations, résultats, changements..."
            placeholderTextColor={Colors.warmGray}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* CTA */}
      <View style={S.ctaWrap}>
        <TouchableOpacity
          style={[S.cta, saved && S.ctaSaved]}
          onPress={handleSave}
          disabled={saved}
        >
          <Text style={S.ctaText}>
            {saved ? 'Wash day enregistré ✓' : 'Enregistrer le wash day'}
          </Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

/* Dropdown styles */
const D = StyleSheet.create({
  wrap:  { marginBottom: 20 },
  label: { fontSize: 13, fontFamily: 'DMSans_600SemiBold', color: Colors.ink, marginBottom: 8 },
  trigger: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14,
  },
  triggerText: { fontSize: 14, fontFamily: 'DMSans_400Regular' },
  menu: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 12, marginTop: 4, overflow: 'hidden',
  },
  option:         { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  optionActive:   { backgroundColor: Colors.amberLight },
  optionText:     { fontSize: 14, fontFamily: 'DMSans_400Regular', color: Colors.ink },
  optionTextActive: { fontFamily: 'DMSans_600SemiBold', color: Colors.amber },
});

const S = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: 20, paddingTop: 16 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: Colors.bg,
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontFamily: 'Poppins_600SemiBold', color: Colors.ink },
  headerSub: {
    fontSize: 13, fontFamily: 'DMSans_400Regular', color: '#3B82F6',
    paddingHorizontal: 20, marginBottom: 16,
  },

  label: { fontSize: 13, fontFamily: 'DMSans_600SemiBold', color: Colors.ink, marginBottom: 8 },

  dateRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14,
    marginBottom: 20,
  },
  dateText: { fontSize: 14, fontFamily: 'DMSans_400Regular', color: Colors.ink },

  input: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14,
    fontSize: 14, fontFamily: 'DMSans_400Regular', color: Colors.ink,
    marginBottom: 20,
  },
  inputMulti: { minHeight: 100, paddingTop: 14 },

  ctaWrap: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20, paddingBottom: 30, paddingTop: 12,
    backgroundColor: Colors.bg,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  cta: {
    backgroundColor: Colors.ink, borderRadius: 16,
    paddingVertical: 16, alignItems: 'center',
  },
  ctaSaved: { backgroundColor: Colors.sage },
  ctaText: { fontSize: 15, fontFamily: 'DMSans_700Bold', color: '#fff' },

  pickerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  pickerSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 36, alignItems: 'center',
  },
  pickerHandle: {
    width: 40, height: 4, borderRadius: 999,
    backgroundColor: Colors.border, marginBottom: 12,
  },
  pickerConfirm: {
    marginTop: 12, backgroundColor: Colors.ink, borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 40, alignItems: 'center',
  },
  pickerConfirmText: { fontSize: 15, fontFamily: 'DMSans_700Bold', color: '#fff' },
});
