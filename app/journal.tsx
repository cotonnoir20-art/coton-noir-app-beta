import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/theme/colors';
import { AppHeader } from '../src/components/AppHeader';
import {
  loadJournalEntries,
  storedToDisplay,
  type JournalDisplayEntry,
} from '../src/lib/journalStorage';

type JournalEntry = {
  id: number;
  day: string;
  month: string;
  year: string;
  type: string;
  tags: string[];
  note: string;
  dur: string;
  stars: number;
};

const ALL_ENTRIES: JournalEntry[] = [
  // 2026
  { id: 1,  day: '26', month: 'avr.', year: '2026', type: 'Hydra-mask',    tags: ['Karité', 'LCO'],           note: 'Cheveux super doux, définition au top.',       dur: '2h10', stars: 5 },
  { id: 2,  day: '17', month: 'avr.', year: '2026', type: 'Protéines',     tags: ['Masque riz'],              note: 'Un peu raide en fin de soin, à doser.',         dur: '1h45', stars: 3 },
  { id: 3,  day: '10', month: 'avr.', year: '2026', type: 'Co-wash',       tags: ['Aloe', 'Leave-in'],        note: 'Routine express, focus pointes.',               dur: '1h00', stars: 4 },
  { id: 4,  day: '28', month: 'mar.', year: '2026', type: 'Hydra-mask',    tags: ['Karité', 'Aloe'],          note: 'Excellent résultat sur les longueurs.',         dur: '2h00', stars: 5 },
  { id: 5,  day: '15', month: 'mar.', year: '2026', type: 'Soin complet',  tags: ['Ricin', 'Masque'],         note: 'Préparation avant coupe chez le coiffeur.',     dur: '2h30', stars: 4 },
  { id: 6,  day: '02', month: 'mar.', year: '2026', type: 'Co-wash',       tags: ['Aloe'],                    note: 'Rapide et efficace.',                           dur: '45min', stars: 4 },
  { id: 7,  day: '22', month: 'fév.', year: '2026', type: 'Protéines',     tags: ['Masque riz', 'Collagène'], note: 'Élasticité retrouvée, très satisfaite.',        dur: '1h50', stars: 5 },
  { id: 8,  day: '08', month: 'fév.', year: '2026', type: 'Hydra-mask',    tags: ['Karité', 'LCO'],           note: 'Bonne rétention hydratation.',                  dur: '2h00', stars: 4 },
  { id: 9,  day: '25', month: 'jan.', year: '2026', type: 'Co-wash',       tags: ['Aloe', 'Leave-in'],        note: 'Cheveux légers et définis.',                    dur: '1h00', stars: 4 },
  { id: 10, day: '11', month: 'jan.', year: '2026', type: 'Hydra-mask',    tags: ['Karité'],                  note: 'Parfait après les fêtes.',                      dur: '1h55', stars: 5 },
  // 2025
  { id: 11, day: '20', month: 'déc.', year: '2025', type: 'Soin complet',  tags: ['Ricin', 'Masque', 'LCO'],  note: 'Grand soin de fin d\'année.',                   dur: '3h00', stars: 5 },
  { id: 12, day: '06', month: 'déc.', year: '2025', type: 'Protéines',     tags: ['Collagène'],               note: 'Casse réduite, bon résultat.',                  dur: '1h40', stars: 4 },
  { id: 13, day: '15', month: 'nov.', year: '2025', type: 'Hydra-mask',    tags: ['Karité', 'Aloe'],          note: 'Transition hiver réussie.',                     dur: '2h10', stars: 4 },
  { id: 14, day: '01', month: 'nov.', year: '2025', type: 'Co-wash',       tags: ['Leave-in'],                note: 'Rapide, cheveux propres.',                      dur: '50min', stars: 3 },
  { id: 15, day: '18', month: 'oct.', year: '2025', type: 'Hydra-mask',    tags: ['Karité', 'LCO'],           note: 'Très bonne hydratation, durée prolongée.',      dur: '2h00', stars: 5 },
  { id: 16, day: '05', month: 'oct.', year: '2025', type: 'Soin complet',  tags: ['Ricin', 'Masque'],         note: 'Cheveux revitalisés après l\'été.',             dur: '2h45', stars: 5 },
  { id: 17, day: '20', month: 'sep.', year: '2025', type: 'Protéines',     tags: ['Masque riz'],              note: 'Bonne reprise post-été.',                       dur: '1h45', stars: 4 },
  { id: 18, day: '07', month: 'sep.', year: '2025', type: 'Co-wash',       tags: ['Aloe'],                    note: 'Après vacances, cheveux doux.',                 dur: '1h00', stars: 4 },
  { id: 19, day: '10', month: 'aoû.', year: '2025', type: 'Hydra-mask',    tags: ['Karité'],                  note: 'Protection chaleur estivale.',                  dur: '1h50', stars: 3 },
  { id: 20, day: '25', month: 'jul.', year: '2025', type: 'Co-wash',       tags: ['Leave-in', 'Aloe'],        note: 'Légèreté parfaite pour l\'été.',                dur: '55min', stars: 4 },
  { id: 21, day: '12', month: 'jul.', year: '2025', type: 'Protéines',     tags: ['Collagène', 'Masque riz'], note: 'Casse estivale maîtrisée.',                     dur: '1h40', stars: 4 },
  { id: 22, day: '28', month: 'jun.', year: '2025', type: 'Soin complet',  tags: ['Ricin', 'Karité', 'LCO'],  note: 'Préparation avant les vacances.',               dur: '3h00', stars: 5 },
  { id: 23, day: '14', month: 'jun.', year: '2025', type: 'Hydra-mask',    tags: ['Karité'],                  note: 'Hydratation intense avant la chaleur.',         dur: '2h00', stars: 5 },
  { id: 24, day: '30', month: 'mai.', year: '2025', type: 'Co-wash',       tags: ['Aloe'],                    note: 'Résultat correct.',                             dur: '1h00', stars: 3 },
  { id: 25, day: '15', month: 'mai.', year: '2025', type: 'Hydra-mask',    tags: ['Karité', 'LCO'],           note: 'Début de printemps réussi.',                    dur: '2h05', stars: 4 },
];

type FilterType = 'tous' | 'Hydra-mask' | 'Protéines' | 'Co-wash' | 'Soin complet';
const FILTERS: { label: string; value: FilterType }[] = [
  { label: 'Tous',         value: 'tous' },
  { label: 'Hydra-mask',   value: 'Hydra-mask' },
  { label: 'Protéines',    value: 'Protéines' },
  { label: 'Co-wash',      value: 'Co-wash' },
  { label: 'Soin complet', value: 'Soin complet' },
];

function groupByMonthYear(entries: JournalEntry[]) {
  const map = new Map<string, JournalEntry[]>();
  for (const e of entries) {
    const key = `${e.month} ${e.year}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(e);
  }
  return Array.from(map.entries());
}

export default function JournalScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>('tous');
  const [userEntries, setUserEntries] = useState<JournalDisplayEntry[]>([]);

  const reload = useCallback(() => {
    void loadJournalEntries().then(list => {
      setUserEntries(list.map(storedToDisplay));
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const allEntries: JournalEntry[] = userEntries.length > 0
    ? userEntries
    : ALL_ENTRIES;

  const filtered = filter === 'tous'
    ? allEntries
    : allEntries.filter(e => e.type === filter);

  const groups = groupByMonthYear(filtered);

  return (
    <SafeAreaView style={S.safe} edges={['top']}>

      {/* Header */}
      <AppHeader
        title="Journal de soins"
        subtitle={
          userEntries.length > 0
            ? `${userEntries.length} entrée${userEntries.length > 1 ? 's' : ''}`
            : `${ALL_ENTRIES.length} entrées · démo`
        }
        rightAction="custom"
        rightSlot={
          <TouchableOpacity
            style={S.addBtn}
            onPress={() => router.push('/add-entry')}
            accessibilityRole="button"
            accessibilityLabel="Ajouter une entrée"
          >
            <Ionicons name="add" size={18} color="#fff" />
          </TouchableOpacity>
        }
      />

      {/* Filtres */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={S.filtersRow}
        style={S.filtersScroll}
      >
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.value}
            style={[S.filterPill, filter === f.value && S.filterPillActive]}
            onPress={() => setFilter(f.value)}
          >
            <Text style={[S.filterText, filter === f.value && S.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.content} style={{ flex: 1 }}>

        {filtered.length === 0 && (
          <View style={S.emptyBox}>
            <Text style={S.emptyText}>Aucune entrée pour ce filtre.</Text>
          </View>
        )}

        {groups.map(([monthYear, entries]) => (
          <View key={monthYear}>
            {/* Séparateur mois */}
            <View style={S.monthSep}>
              <View style={S.monthLine} />
              <Text style={S.monthLabel}>{monthYear}</Text>
              <View style={S.monthLine} />
            </View>

            {/* Entrées du mois */}
            {entries.map((entry, i) => (
              <View key={entry.id} style={S.row}>
                {/* Date colonne */}
                <View style={S.dateCol}>
                  <Text style={S.dateDay}>{entry.day}</Text>
                  <Text style={S.dateMon}>{entry.month}</Text>
                  {i < entries.length - 1 && <View style={S.dateLine} />}
                </View>

                {/* Carte */}
                <View style={S.card}>
                  <View style={S.cardTop}>
                    <View style={S.typePill}>
                      <Text style={S.typePillText}>{entry.type}</Text>
                    </View>
                    <Text style={S.dur}>{entry.dur}</Text>
                  </View>
                  <View style={S.tags}>
                    {entry.tags.map((t, j) => (
                      <View key={j} style={S.tag}><Text style={S.tagText}>{t}</Text></View>
                    ))}
                  </View>
                  <Text style={S.note}>« {entry.note} »</Text>
                  <Text style={S.stars}>
                    <Text style={{ color: Colors.amber }}>{'★'.repeat(entry.stars)}</Text>
                    <Text style={{ color: Colors.border }}>{'★'.repeat(5 - entry.stars)}</Text>
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: 20 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontFamily: 'Poppins_600SemiBold', color: Colors.ink },
  headerSub:   { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, marginTop: 1 },
  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.ink,
    alignItems: 'center', justifyContent: 'center',
  },

  filtersScroll: { flexGrow: 0, flexShrink: 0 },
  filtersRow: { paddingHorizontal: 20, paddingVertical: 10, gap: 8, alignItems: 'center' },
  filterPill: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 999, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.surface, flexShrink: 0,
  },
  filterPillActive: { borderColor: Colors.rose, backgroundColor: Colors.blush },
  filterText:       { fontSize: 12, fontFamily: 'DMSans_500Medium', color: Colors.ink },
  filterTextActive: { fontFamily: 'DMSans_700Bold', color: Colors.rose },

  emptyBox:  { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 14, fontFamily: 'DMSans_400Regular', color: Colors.warmGray },

  monthSep: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 24, marginBottom: 14 },
  monthLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  monthLabel: { fontSize: 11, fontFamily: 'DMSans_700Bold', color: Colors.warmGray, textTransform: 'uppercase', letterSpacing: 0.8 },

  row: { flexDirection: 'row', gap: 14, marginBottom: 12 },

  dateCol:  { width: 44, alignItems: 'center', paddingTop: 12 },
  dateDay:  { fontSize: 20, fontFamily: 'Poppins_700Bold', color: Colors.ink, lineHeight: 24 },
  dateMon:  { fontSize: 10, fontFamily: 'DMSans_400Regular', color: Colors.warmGray },
  dateLine: { flex: 1, width: 2, backgroundColor: Colors.border, marginTop: 6, minHeight: 20 },

  card: {
    flex: 1, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: 16, padding: 14,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  typePill: { backgroundColor: Colors.blush, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  typePillText: { fontSize: 11, fontFamily: 'DMSans_700Bold', color: Colors.rose },
  dur: { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray },

  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  tag:  { backgroundColor: Colors.cream, borderWidth: 1, borderColor: Colors.border, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  tagText: { fontSize: 10, fontFamily: 'DMSans_400Regular', color: Colors.warmGray },

  note:  { fontSize: 12, fontFamily: 'DMSans_400Regular', fontStyle: 'italic', color: Colors.warmGray, marginBottom: 8, lineHeight: 18 },
  stars: { fontSize: 13 },
});
