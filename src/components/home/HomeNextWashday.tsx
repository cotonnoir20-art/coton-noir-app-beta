import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useApp } from '../../context/AppContext';
import { Colors } from '../../theme/colors';
import { FontDisplay } from '../../theme/typography';

const WEEK_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const MONTH_NAMES = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

function toLocalISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatSoinDateLong(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

type Props = {
  /** Dates ISO des routines validées (coin_history positif). */
  routineDates?: Set<string>;
};

export function HomeNextWashday({ routineDates }: Props) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { state } = useApp();
  const today = useMemo(() => new Date(), []);
  const todayStr = toLocalISODate(today);

  const [calMonth, setCalMonth] = useState(() => ({
    year: today.getFullYear(),
    month: today.getMonth(),
  }));

  const todayMs = useMemo(() => {
    const d = new Date(today);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, [today]);

  const nextSoin = useMemo(() => {
    return [...state.plannedSoins]
      .filter(s => s.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date))[0] ?? null;
  }, [state.plannedSoins, todayStr]);

  const daysUntil = useMemo(() => {
    if (!nextSoin) return null;
    const t = new Date(`${nextSoin.date}T00:00:00`).getTime();
    return Math.max(0, Math.round((t - todayMs) / 86400000));
  }, [nextSoin, todayMs]);

  const daysInMonth = new Date(calMonth.year, calMonth.month + 1, 0).getDate();
  const firstOffset = (new Date(calMonth.year, calMonth.month, 1).getDay() + 6) % 7;
  const isCurrentMonth =
    calMonth.year === today.getFullYear() && calMonth.month === today.getMonth();

  const plannedByIso = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of state.plannedSoins) {
      m.set(s.date, s.soinType);
    }
    return m;
  }, [state.plannedSoins]);

  const calInnerW = width - 40 - 28;
  const cellSize = Math.floor((calInnerW - 7 * 6) / 7);

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

  const countdownLabel =
    daysUntil === null
      ? 'Non planifié'
      : daysUntil === 0
        ? "Aujourd'hui"
        : `Dans ${daysUntil} jour${daysUntil > 1 ? 's' : ''}`;

  return (
    <View style={s.wrap}>
      <TouchableOpacity
        style={s.headerRow}
        onPress={() => router.push('/washday' as any)}
        activeOpacity={0.85}
      >
        <View style={s.headerLeft}>
          <View style={s.iconBox}>
            <Ionicons name="water-outline" size={20} color={Colors.amber} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>Prochain washday</Text>
            <Text style={s.countdown}>{countdownLabel}</Text>
            {nextSoin ? (
              <Text style={s.dateLine} numberOfLines={2}>
                {formatSoinDateLong(nextSoin.date)} · {nextSoin.soinType}
              </Text>
            ) : (
              <Text style={s.dateLine}>Planifie ton prochain lavage</Text>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={Colors.warmGray} />
      </TouchableOpacity>

      <View style={s.calCard}>
        <View style={s.calNav}>
          <TouchableOpacity style={s.calNavBtn} onPress={prevMonth} hitSlop={8}>
            <Text style={s.calNavArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={s.calMonth}>
            {MONTH_NAMES[calMonth.month]} {calMonth.year}
          </Text>
          <TouchableOpacity style={s.calNavBtn} onPress={nextMonth} hitSlop={8}>
            <Text style={s.calNavArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={s.legendRow}>
          <View style={s.legendItem}>
            <View style={[s.legendDot, s.legendDotPlanned]} />
            <Text style={s.legendText}>Planifié</Text>
          </View>
          <View style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: Colors.rose }]} />
            <Text style={s.legendText}>Effectué</Text>
          </View>
        </View>

        <View style={s.weekRow}>
          {WEEK_LABELS.map((label, i) => (
            <View key={i} style={[s.weekCell, { width: cellSize, margin: 3 }]}>
              <Text style={s.weekLabel}>{label}</Text>
            </View>
          ))}
        </View>

        <View style={s.daysGrid}>
          {Array.from({ length: firstOffset }).map((_, i) => (
            <View key={`e-${i}`} style={{ width: cellSize, height: cellSize, margin: 3 }} />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(dayNum => {
            const iso = `${calMonth.year}-${String(calMonth.month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const isToday = isCurrentMonth && dayNum === today.getDate();
            const isPlanned = plannedByIso.has(iso);
            const isPast = iso < todayStr;
            const isDone = isPlanned && isPast && (routineDates?.has(iso) ?? false);

            return (
              <View
                key={dayNum}
                style={[
                  s.dayCell,
                  { width: cellSize, height: cellSize, borderRadius: cellSize / 2 },
                  isToday && s.dayToday,
                  isPlanned && !isDone && s.dayPlanned,
                  isDone && s.dayDone,
                ]}
              >
                <Text
                  style={[
                    s.dayText,
                    (isToday || isDone) && s.dayTextLight,
                    isPlanned && !isDone && !isToday && s.dayTextPlanned,
                  ]}
                >
                  {dayNum}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={s.actions}>
          <TouchableOpacity
            style={s.btnPrimary}
            onPress={() => router.push('/add-washday' as any)}
            activeOpacity={0.9}
          >
            <Text style={s.btnPrimaryText}>+ Planifier</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.btnSecondary}
            onPress={() => router.push('/washday' as any)}
            activeOpacity={0.9}
          >
            <Text style={s.btnSecondaryText}>Voir tout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 10,
    gap: 8,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.amberLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontFamily: FontDisplay,
    color: Colors.ink,
    marginBottom: 2,
  },
  countdown: {
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
    color: Colors.amber,
    marginBottom: 2,
  },
  dateLine: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    lineHeight: 17,
  },
  calCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
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
    fontFamily: 'Poppins_600SemiBold',
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
    borderColor: Colors.rose,
  },
  legendText: {
    fontSize: 10,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
  },
  weekRow: { flexDirection: 'row', justifyContent: 'center' },
  weekCell: { alignItems: 'center', justifyContent: 'center' },
  weekLabel: {
    fontSize: 10,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.warmGray,
  },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  dayCell: {
    margin: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayToday: {
    borderWidth: 2,
    borderColor: Colors.amber,
  },
  dayPlanned: {
    borderWidth: 2,
    borderColor: Colors.rose,
    borderStyle: 'dashed',
  },
  dayDone: {
    backgroundColor: Colors.rose,
  },
  dayText: {
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
    color: Colors.ink,
  },
  dayTextLight: { color: '#fff' },
  dayTextPlanned: { color: Colors.rose },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  btnPrimary: {
    flex: 1,
    backgroundColor: Colors.ink,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnPrimaryText: {
    fontSize: 13,
    fontFamily: 'DMSans_700Bold',
    color: '#fff',
  },
  btnSecondary: {
    flex: 1,
    backgroundColor: Colors.cream,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  btnSecondaryText: {
    fontSize: 13,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.ink,
  },
});
