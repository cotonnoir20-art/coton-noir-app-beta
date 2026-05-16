import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../theme/colors';

export type WeekDayCell = {
  dayLabel: string;
  dateNum: number;
  isToday: boolean;
  isPast: boolean;
  hasRoutine: boolean;
  hasSoin: boolean;
};

type Props = {
  /** Les 7 jours de la semaine courante (L → D). */
  days: WeekDayCell[];
};

/** Ligne type maquette : 7 cercles (validé · aujourd’hui · à venir). */
export function HomeWeekStrip({ days }: Props) {
  const week = days.slice(0, 7);

  return (
    <View style={s.wrap}>
      <View style={s.row}>
        {week.map((d, i) => {
          const done = d.isPast && d.hasRoutine;
          const today = d.isToday;
          const future = !d.isPast && !d.isToday;

          return (
            <View
              key={`${d.dayLabel}-${i}`}
              style={[
                s.circle,
                done && s.circleDone,
                today && !done && s.circleToday,
                (future || (d.isPast && !d.hasRoutine && !d.isToday)) && s.circleFuture,
              ]}
            >
              {done ? (
                <View style={s.doneInner}>
                  <Text style={s.letterDone}>{d.dayLabel}</Text>
                  <Ionicons name="checkmark" size={12} color={Colors.amber} />
                </View>
              ) : today ? (
                <View style={s.todayDotWrap}>
                  <Text style={s.letterToday}>{d.dayLabel}</Text>
                  <View style={s.todayDot} />
                </View>
              ) : (
                <Text style={s.letterFuture}>{d.dayLabel}</Text>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const CIRCLE = 40;

const s = StyleSheet.create({
  wrap: { marginBottom: 16, paddingHorizontal: 8 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  circle: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  circleDone: {
    backgroundColor: Colors.ink,
    borderColor: Colors.ink,
  },
  circleToday: {
    backgroundColor: Colors.amber,
    borderColor: Colors.amberDark,
  },
  circleFuture: {
    backgroundColor: Colors.surface,
    borderColor: 'rgba(26, 18, 9, 0.12)',
  },
  letterDone: {
    fontSize: 12,
    fontFamily: 'DMSans_700Bold',
    color: '#FDF8F4',
  },
  letterToday: {
    fontSize: 11,
    fontFamily: 'DMSans_700Bold',
    color: Colors.ink,
    marginBottom: 2,
  },
  letterFuture: {
    fontSize: 12,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.warmGray,
  },
  doneInner: { alignItems: 'center', justifyContent: 'center', gap: 1 },
  todayDotWrap: { alignItems: 'center', justifyContent: 'center' },
  todayDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: Colors.ink,
    marginTop: 1,
  },
});
