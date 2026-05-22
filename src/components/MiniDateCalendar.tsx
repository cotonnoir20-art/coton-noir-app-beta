import { useState } from 'react';
import { Pressable, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Colors } from '../theme/colors';
import {
  calendarCellStyle,
  getCalendarGridMetrics,
} from '../lib/calendarGridLayout';

const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];
const WEEK_DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  );
}

type Props = {
  selectedDate: Date | null;
  onSelect: (date: Date) => void;
  /** Jours avant cette date sont désactivés (défaut : aujourd’hui). */
  minimumDate?: Date;
  /** Largeur utile si le calendrier est dans un conteneur plus étroit que l’écran. */
  contentWidth?: number;
};

export function MiniDateCalendar({
  selectedDate,
  onSelect,
  minimumDate,
  contentWidth,
}: Props) {
  const today = startOfDay(new Date());
  const minDay = startOfDay(minimumDate ?? today);
  const { width: screenWidth } = useWindowDimensions();
  const innerW = contentWidth ?? screenWidth - 64;
  const { cellSize, gridWidth, cellMargin } = getCalendarGridMetrics(innerW);

  const [calDate, setCalDate] = useState(() => {
    const base = selectedDate ?? today;
    return { year: base.getFullYear(), month: base.getMonth() };
  });

  const daysInMonth = new Date(calDate.year, calDate.month + 1, 0).getDate();
  const firstOffset = (new Date(calDate.year, calDate.month, 1).getDay() + 6) % 7;

  function prevMonth() {
    setCalDate(d => (d.month === 0 ? { year: d.year - 1, month: 11 } : { ...d, month: d.month - 1 }));
  }

  function nextMonth() {
    setCalDate(d => (d.month === 11 ? { year: d.year + 1, month: 0 } : { ...d, month: d.month + 1 }));
  }

  return (
    <View style={s.wrap}>
      <View style={s.nav}>
        <TouchableOpacity style={s.navBtn} onPress={prevMonth} accessibilityRole="button">
          <Text style={s.navArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={s.navMonth}>
          {MONTH_NAMES[calDate.month]} {calDate.year}
        </Text>
        <TouchableOpacity style={s.navBtn} onPress={nextMonth} accessibilityRole="button">
          <Text style={s.navArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={[s.weekRow, { width: gridWidth }]}>
        {WEEK_DAYS.map((label, i) => (
          <Text
            key={i}
            style={[s.weekDay, calendarCellStyle, { width: cellSize, margin: cellMargin }]}
          >
            {label}
          </Text>
        ))}
      </View>

      <View style={[s.grid, { width: gridWidth }]}>
        {Array.from({ length: firstOffset }).map((_, i) => (
          <View
            key={`e-${i}`}
            style={[calendarCellStyle, { width: cellSize, height: cellSize, margin: cellMargin }]}
          />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(dayNum => {
          const date = new Date(calDate.year, calDate.month, dayNum);
          const isPast = startOfDay(date) < minDay;
          const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
          const isToday = isSameDay(date, today);

          return (
            <Pressable
              key={dayNum}
              style={[s.cell, calendarCellStyle, { width: cellSize, height: cellSize, margin: cellMargin }]}
              onPress={() => onSelect(date)}
              disabled={isPast}
              accessibilityRole="button"
              accessibilityLabel={`${dayNum} ${MONTH_NAMES[calDate.month]}`}
            >
              <View
                style={[
                  s.inner,
                  isSelected && s.innerSelected,
                  !isSelected && isToday && s.innerToday,
                ]}
              >
                <Text
                  style={[
                    s.dayText,
                    isPast && s.dayPast,
                    isSelected && s.daySelected,
                    !isSelected && isToday && s.dayToday,
                  ]}
                >
                  {dayNum}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    padding: 12,
    width: '100%',
  },
  nav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  navBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navArrow: { fontSize: 16, color: Colors.ink },
  navMonth: { fontSize: 14, fontFamily: 'DMSans_700Bold', color: Colors.ink },
  weekRow: { flexDirection: 'row', flexWrap: 'nowrap', marginBottom: 4, alignSelf: 'center' },
  weekDay: {
    textAlign: 'center',
    fontSize: 10,
    fontFamily: 'DMSans_500Medium',
    color: Colors.warmGray,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', alignSelf: 'center' },
  cell: { alignItems: 'center', justifyContent: 'center' },
  inner: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerSelected: { backgroundColor: Colors.ink },
  innerToday: { borderWidth: 1.5, borderColor: Colors.ink },
  dayText: { fontSize: 12, fontFamily: 'DMSans_500Medium', color: Colors.ink },
  dayPast: { color: Colors.border },
  daySelected: { color: '#fff', fontFamily: 'DMSans_700Bold' },
  dayToday: { color: Colors.ink, fontFamily: 'DMSans_700Bold' },
});
