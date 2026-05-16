import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Colors } from '../theme/colors';

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];
const WEEK_DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export function isSameDay(a: Date, b: Date) {
  return a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();
}

export function formatFull(d: Date) {
  const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatShort(d: Date) {
  const months = ['jan', 'fév', 'mar', 'avr', 'mai', 'jun',
    'jul', 'aoû', 'sep', 'oct', 'nov', 'déc'];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

export function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Total horizontal space taken by containers wrapping the calendar. */
interface Props {
  selectedDate: Date | null;
  onSelect: (d: Date) => void;
  /** Sum of all horizontal padding/margin from screen edge to calendar (default 40). */
  horizontalOffset?: number;
  /** If true, past dates are selectable (default false). */
  allowPast?: boolean;
}

export function MiniCalendar({ selectedDate, onSelect, horizontalOffset = 40, allowPast = false }: Props) {
  const today = new Date();
  const [calDate, setCalDate] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const { width } = useWindowDimensions();
  const cellSize = Math.floor((width - horizontalOffset) / 7);

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
          const isPast = !allowPast && date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
          const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
          const isToday    = isSameDay(date, today);
          return (
            <TouchableOpacity
              key={d}
              style={[C.cell, { width: cellSize, height: cellSize }]}
              onPress={() => !isPast && onSelect(date)}
              disabled={isPast}
            >
              <View style={[
                C.inner,
                isSelected && C.innerSelected,
                !isSelected && isToday && C.innerToday,
              ]}>
                <Text style={[
                  C.dayText,
                  isPast     && C.dayPast,
                  isSelected && C.daySelected,
                  !isSelected && isToday && C.dayToday,
                ]}>{d}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

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
