import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/theme/colors';
import { useApp } from '../src/context/AppContext';

const SOIN_TYPES = [
  { icon: '🫧', label: 'Shampoing' },
  { icon: '🧴', label: 'Masque' },
  { icon: '💧', label: 'Hydratation' },
  { icon: '🥥', label: "Bain d'huile" },
  { icon: '🧪', label: 'Protéines' },
  { icon: '✂️', label: 'Trim' },
  { icon: '🌿', label: 'Soin complet' },
  { icon: '💦', label: 'Soin hydratant' },
  { icon: '🧼', label: 'Soin clarifiant' },
  { icon: '💪', label: 'Soin fortifiant' },
];

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];
const WEEK_DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

function addDays(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

function formatShort(d: Date) {
  const months = ['jan', 'fév', 'mar', 'avr', 'mai', 'jun',
    'jul', 'aoû', 'sep', 'oct', 'nov', 'déc'];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

function formatFull(d: Date) {
  const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function isSameDay(a: Date, b: Date) {
  return a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();
}

const QUICK_DATES = [
  { label: "Aujourd'hui", date: addDays(0) },
  { label: 'Demain',      date: addDays(1) },
];

function MiniCalendar({
  selectedDate, onSelect,
}: { selectedDate: Date | null; onSelect: (d: Date) => void }) {
  const today = new Date();
  const [calDate, setCalDate] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const { width } = useWindowDimensions();
  // sheet paddingH=20 + wrap padding=12 → available = width - 40 - 24, 7 cells
  const cellSize = Math.floor((width - 64) / 7);

  const daysInMonth = new Date(calDate.year, calDate.month + 1, 0).getDate();
  const firstOffset = (new Date(calDate.year, calDate.month, 1).getDay() + 6) % 7;

  function prevMonth() {
    setCalDate(d => d.month === 0 ? { year: d.year - 1, month: 11 } : { ...d, month: d.month - 1 });
  }
  function nextMonth() {
    setCalDate(d => d.month === 11 ? { year: d.year + 1, month: 0 } : { ...d, month: d.month + 1 });
  }

  return (
    <View style={C.wrap}>
      {/* Nav */}
      <View style={C.nav}>
        <TouchableOpacity style={C.navBtn} onPress={prevMonth}>
          <Text style={C.navArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={C.navMonth}>{MONTH_NAMES[calDate.month]} {calDate.year}</Text>
        <TouchableOpacity style={C.navBtn} onPress={nextMonth}>
          <Text style={C.navArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Week labels */}
      <View style={C.weekRow}>
        {WEEK_DAYS.map((d, i) => (
          <Text key={i} style={[C.weekDay, { width: cellSize }]}>{d}</Text>
        ))}
      </View>

      {/* Days grid */}
      <View style={C.grid}>
        {Array.from({ length: firstOffset }).map((_, i) => (
          <View key={`e${i}`} style={{ width: cellSize, height: cellSize }} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
          const date = new Date(calDate.year, calDate.month, d);
          const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
          const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
          const isToday    = isSameDay(date, today);
          return (
            <Pressable
              key={d}
              style={[C.cell, { width: cellSize, height: cellSize }]}
              onPress={() => onSelect(date)}
              disabled={isPast}
            >
              <View style={[
                C.inner,
                isSelected && C.innerSelected,
                !isSelected && isToday && C.innerToday,
              ]}>
                <Text style={[
                  C.dayText,
                  isPast      && C.dayPast,
                  isSelected  && C.daySelected,
                  !isSelected && isToday && C.dayToday,
                ]}>{d}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function PlanSoinModal() {
  const router = useRouter();
  const { dispatch } = useApp();
  const [soinType, setSoinType]         = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(addDays(0));
  const [showCal, setShowCal]           = useState(false);
  const [customDate, setCustomDate]     = useState<Date | null>(null);
  const [saved, setSaved]               = useState(false);

  const isCustom = customDate !== null;
  const displayDate = isCustom ? formatFull(customDate) : formatFull(selectedDate);
  const chosenDate  = isCustom ? customDate! : selectedDate;

  function selectQuick(date: Date) {
    setSelectedDate(date);
    setCustomDate(null);
    setShowCal(false);
  }

  function selectCustom(date: Date) {
    setCustomDate(date);
    setShowCal(false);
  }

  function handlePlanifier() {
    if (!soinType) return;
    dispatch({ type: 'planSoin', soin: { soinType, date: toISO(chosenDate) } });
    setSaved(true);
    setTimeout(() => router.back(), 700);
  }

  return (
    <View style={S.overlay}>
      <TouchableOpacity style={S.backdrop} onPress={() => router.back()} />

      <View style={S.sheet}>
        <View style={S.handle} />

        {/* Header */}
        <View style={S.header}>
          <Text style={S.title}>Planifier un soin</Text>
          <TouchableOpacity style={S.closeBtn} onPress={() => router.back()}>
            <Ionicons name="close" size={18} color={Colors.ink} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Type de soin */}
          <Text style={S.label}>Type de soin</Text>
          <View style={S.pillsGrid}>
            {SOIN_TYPES.map(s => (
              <TouchableOpacity
                key={s.label}
                style={[S.pill, soinType === s.label && S.pillActive]}
                onPress={() => setSoinType(s.label)}
              >
                <Text style={S.pillIcon}>{s.icon}</Text>
                <Text style={[S.pillText, soinType === s.label && S.pillTextActive]}>
                  {s.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Date rapide */}
          <Text style={[S.label, { marginTop: 20 }]}>Quand ?</Text>
          <View style={S.dateRow}>
            {QUICK_DATES.map((d, i) => {
              const active = !isCustom && isSameDay(selectedDate, d.date);
              return (
                <TouchableOpacity
                  key={i}
                  style={[S.dateBtn, active && S.dateBtnActive]}
                  onPress={() => selectQuick(d.date)}
                >
                  <Text style={[S.dateBtnText, active && S.dateBtnTextActive]}>
                    {d.label}
                  </Text>
                </TouchableOpacity>
              );
            })}

            {/* Autre date */}
            <TouchableOpacity
              style={[S.dateBtn, (isCustom || showCal) && S.dateBtnCalActive]}
              onPress={() => setShowCal(v => !v)}
            >
              <Ionicons
                name="calendar-outline"
                size={13}
                color={(isCustom || showCal) ? Colors.rose : Colors.ink}
                style={{ marginRight: 4 }}
              />
              <Text style={[S.dateBtnText, (isCustom || showCal) && S.dateBtnCalText]}>
                {isCustom ? formatShort(customDate!) : 'Autre date'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Mini calendrier */}
          {showCal && (
            <MiniCalendar
              selectedDate={customDate}
              onSelect={selectCustom}
            />
          )}

          {/* Date choisie */}
          <View style={S.dateChosen}>
            <Ionicons name="calendar-outline" size={14} color={Colors.warmGray} />
            <Text style={S.dateChosenText}>{displayDate}</Text>
          </View>

          {/* CTA */}
          <TouchableOpacity
            style={[S.cta, (!soinType || saved) && S.ctaDisabled]}
            onPress={handlePlanifier}
            disabled={!soinType || saved}
          >
            <Text style={S.ctaText}>
              {saved ? 'Planifié ✓' : `Planifier · ${displayDate}`}
            </Text>
          </TouchableOpacity>

          <View style={{ height: 8 }} />
        </ScrollView>
      </View>
    </View>
  );
}

/* Mini calendar styles */
const C = StyleSheet.create({
  wrap:    { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 16, padding: 12, marginTop: 12 },
  nav:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  navBtn:  { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.cream, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  navArrow:{ fontSize: 16, color: Colors.ink },
  navMonth:{ fontSize: 14, fontFamily: 'DMSans_700Bold', color: Colors.ink },
  weekRow: { flexDirection: 'row', marginBottom: 4 },
  weekDay: { textAlign: 'center', fontSize: 10, fontFamily: 'DMSans_500Medium', color: Colors.warmGray },
  grid:    { flexDirection: 'row', flexWrap: 'wrap' },
  cell:    { alignItems: 'center', justifyContent: 'center' },
  inner:   { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  // Date sélectionnée : pastille pleine noire (état actif principal).
  innerSelected: { backgroundColor: Colors.ink },
  // Aujourd'hui (si non sélectionné) : anneau noir, sans remplissage.
  innerToday:    { borderWidth: 1.5, borderColor: Colors.ink },
  dayText:     { fontSize: 12, fontFamily: 'DMSans_500Medium', color: Colors.ink },
  dayPast:     { color: Colors.border },
  daySelected: { color: '#fff', fontFamily: 'DMSans_700Bold' },
  dayToday:    { color: Colors.ink, fontFamily: 'DMSans_700Bold' },
});

const S = StyleSheet.create({
  overlay:  { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },

  sheet: {
    backgroundColor: Colors.bg,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingBottom: 36, paddingTop: 12,
    maxHeight: '90%',
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.border, alignSelf: 'center', marginBottom: 16,
  },

  header:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title:    { fontSize: 18, fontFamily: 'Poppins_600SemiBold', color: Colors.ink },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },

  label: { fontSize: 13, fontFamily: 'DMSans_600SemiBold', color: Colors.ink, marginBottom: 10 },

  pillsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 999, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  pillActive:     { borderColor: Colors.rose, backgroundColor: Colors.blush },
  pillIcon:       { fontSize: 14 },
  pillText:       { fontSize: 13, fontFamily: 'DMSans_500Medium', color: Colors.ink },
  pillTextActive: { fontFamily: 'DMSans_700Bold', color: Colors.rose },

  dateRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dateBtn: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 999, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  dateBtnActive:    { borderColor: Colors.amber, backgroundColor: Colors.amberLight },
  dateBtnCalActive: { borderColor: Colors.rose, backgroundColor: Colors.blush },
  dateBtnText:      { fontSize: 12, fontFamily: 'DMSans_500Medium', color: Colors.ink },
  dateBtnTextActive:{ fontFamily: 'DMSans_700Bold', color: Colors.amber },
  dateBtnCalText:   { fontFamily: 'DMSans_700Bold', color: Colors.rose },

  dateChosen: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 10, marginBottom: 4,
  },
  dateChosenText: { fontSize: 12, fontFamily: 'DMSans_400Regular', color: Colors.warmGray },

  cta: {
    marginTop: 16, backgroundColor: Colors.ink,
    borderRadius: 16, paddingVertical: 15, alignItems: 'center',
  },
  ctaDisabled: { backgroundColor: Colors.border },
  ctaText: { fontSize: 15, fontFamily: 'DMSans_700Bold', color: '#fff' },
});
