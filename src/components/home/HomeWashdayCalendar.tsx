import { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import type { CoinHistoryEntry, PlannedSoin } from '../../context/AppContext';
import { Colors } from '../../theme/colors';
import {
  buildWashdayCalendarMonthMarkers,
  isWashdayCalendarToday,
} from '../../lib/washdayHistory';
import { toLocalISODate } from '../../lib/homeGrowth';
import {
  calendarCellStyle,
  getCalendarGridMetrics,
} from '../../lib/calendarGridLayout';

const WEEK_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

type Props = {
  plannedSoins: PlannedSoin[];
  coinHistory: CoinHistoryEntry[];
};

export function HomeWashdayCalendar({ plannedSoins, coinHistory }: Props) {
  const { width } = useWindowDimensions();
  const today = useMemo(() => new Date(), []);
  const todayStr = toLocalISODate(today);

  const [calMonth, setCalMonth] = useState(() => ({
    year: today.getFullYear(),
    month: today.getMonth(),
  }));

  const markers = useMemo(
    () =>
      buildWashdayCalendarMonthMarkers(
        calMonth.year,
        calMonth.month,
        plannedSoins,
        coinHistory,
      ),
    [calMonth.year, calMonth.month, plannedSoins, coinHistory],
  );

  const daysInMonth = new Date(calMonth.year, calMonth.month + 1, 0).getDate();
  const firstOffset = (new Date(calMonth.year, calMonth.month, 1).getDay() + 6) % 7;

  const { cellSize, gridWidth, cellMargin } = getCalendarGridMetrics(width - 60);

  function prevMonth() {
    setCalMonth(d =>
      d.month === 0 ? { year: d.year - 1, month: 11 } : { ...d, month: d.month - 1 },
    );
  }

  function nextMonth() {
    setCalMonth(d =>
      d.month === 11 ? { year: d.year + 1, month: 0 } : { ...d, month: d.month + 1 },
    );
  }

  return (
    <View style={s.root}>
      <View style={s.calNav}>
        <TouchableOpacity style={s.calNavBtn} onPress={prevMonth} hitSlop={8} accessibilityRole="button">
          <Text style={s.calNavArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={s.calMonth}>
          {MONTH_NAMES[calMonth.month]} {calMonth.year}
        </Text>
        <TouchableOpacity style={s.calNavBtn} onPress={nextMonth} hitSlop={8} accessibilityRole="button">
          <Text style={s.calNavArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={s.legendRow}>
        <View style={s.legendItem}>
          <View style={[s.legendDot, { backgroundColor: Colors.rose }]} />
          <Text style={s.legendText}>Effectué</Text>
        </View>
        <View style={s.legendItem}>
          <View style={[s.legendDot, s.legendDotPlanned]} />
          <Text style={s.legendText}>Planifié</Text>
        </View>
        <View style={s.legendItem}>
          <View style={[s.legendDot, s.legendDotMissed]} />
          <Text style={s.legendText}>Non fait</Text>
        </View>
      </View>

      <View style={[s.weekRow, { width: gridWidth }]}>
        {WEEK_LABELS.map((label, i) => (
          <View
            key={i}
            style={[s.weekCell, calendarCellStyle, { width: cellSize, margin: cellMargin }]}
          >
            <Text style={s.weekLabel}>{label}</Text>
          </View>
        ))}
      </View>

      <View style={[s.daysGrid, { width: gridWidth }]}>
        {Array.from({ length: firstOffset }).map((_, i) => (
          <View
            key={`e-${i}`}
            style={[calendarCellStyle, { width: cellSize, height: cellSize, margin: cellMargin }]}
          />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(dayNum => {
          const isToday = isWashdayCalendarToday(calMonth.year, calMonth.month, dayNum, todayStr);
          const isCompleted = markers.completedDays.has(dayNum);
          const isPlanned = markers.plannedDays.has(dayNum);
          const isMissed = markers.missedDays.has(dayNum);

          return (
            <View
              key={dayNum}
              style={[
                s.dayCell,
                calendarCellStyle,
                { width: cellSize, height: cellSize, margin: cellMargin, borderRadius: cellSize / 2 },
                isToday && s.dayToday,
                isCompleted && s.dayCompleted,
                isPlanned && !isCompleted && s.dayPlanned,
                isMissed && !isCompleted && s.dayMissed,
              ]}
            >
              <Text
                style={[
                  s.dayText,
                  (isToday || isCompleted) && s.dayTextLight,
                  isMissed && !isCompleted && s.dayTextMissed,
                ]}
              >
                {dayNum}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
  },
  calNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  calNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calNavArrow: {
    fontSize: 20,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.ink,
  },
  calMonth: {
    fontSize: 14,
    fontFamily: 'Satoshi_500Medium',
    color: Colors.ink,
  },
  legendRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendDotPlanned: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.amber,
  },
  legendDotMissed: {
    backgroundColor: Colors.cream,
    borderWidth: 1.5,
    borderColor: Colors.warmGray,
  },
  legendText: {
    fontSize: 10,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
  },
  weekRow: { flexDirection: 'row', flexWrap: 'nowrap', alignSelf: 'center' },
  weekCell: { alignItems: 'center', justifyContent: 'center' },
  weekLabel: {
    fontSize: 10,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.warmGray,
  },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', alignSelf: 'center' },
  dayCell: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayToday: {
    backgroundColor: Colors.ink,
  },
  dayCompleted: {
    backgroundColor: Colors.rose,
  },
  dayPlanned: {
    borderWidth: 2,
    borderColor: Colors.amber,
  },
  dayMissed: {
    backgroundColor: Colors.cream,
    borderWidth: 1.5,
    borderColor: Colors.warmGray,
  },
  dayTextMissed: {
    color: Colors.warmGray,
    textDecorationLine: 'line-through',
  },
  dayText: {
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
    color: Colors.ink,
  },
  dayTextLight: { color: '#fff' },
});
