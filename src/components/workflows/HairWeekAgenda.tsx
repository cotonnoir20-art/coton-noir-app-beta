import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import type { WeekAgendaItem } from '../../lib/hairWeekPlan';

type Props = {
  items: WeekAgendaItem[];
  onPressSlot: (item: WeekAgendaItem) => void;
  compact?: boolean;
};

const STATUS_STYLE: Record<
  WeekAgendaItem['status'],
  { dot: string; bg: string; border: string }
> = {
  done: { dot: Colors.sage, bg: Colors.sageLight, border: Colors.sage },
  planned: { dot: Colors.warmGray, bg: Colors.cream, border: Colors.border },
  today: { dot: Colors.amber, bg: Colors.amberLight, border: Colors.amber },
  upcoming: { dot: Colors.border, bg: Colors.surface, border: Colors.border },
};

export function HairWeekAgenda({ items, onPressSlot, compact }: Props) {
  return (
    <View style={[S.wrap, compact && S.wrapCompact]}>
      <Text style={S.title}>Ma semaine capillaire</Text>
      {!compact ? (
        <Text style={S.sub}>Lundi matin · Mercredi hydratation · Dimanche wash day</Text>
      ) : null}
      {items.map(item => {
        const st = STATUS_STYLE[item.status];
        return (
          <TouchableOpacity
            key={`${item.weekday}-${item.kind}`}
            style={[S.row, { backgroundColor: st.bg, borderColor: st.border }, item.isToday && S.rowToday]}
            onPress={() => onPressSlot(item)}
            activeOpacity={0.85}
          >
            <View style={S.dayCol}>
              <Text style={S.dayLabel}>{item.dayLabel}</Text>
              <Text style={S.dayNum}>{item.dateNum}</Text>
            </View>
            <View style={[S.dot, { backgroundColor: st.dot }]} />
            <View style={S.body}>
              <Text style={S.emoji}>{item.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={S.label}>{item.label}</Text>
                {item.detail ? <Text style={S.detail}>{item.detail}</Text> : null}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.warmGray} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const S = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 14,
  },
  wrapCompact: { marginHorizontal: 0 },
  title: { fontSize: 16, fontFamily: 'Poppins_600SemiBold', color: Colors.ink, marginBottom: 4 },
  sub: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    marginBottom: 8,
  },
  rowToday: { borderWidth: 1.5 },
  dayCol: { width: 28, alignItems: 'center' },
  dayLabel: { fontSize: 10, fontFamily: 'DMSans_700Bold', color: Colors.warmGray },
  dayNum: { fontSize: 14, fontFamily: 'Poppins_700Bold', color: Colors.ink },
  dot: { width: 8, height: 8, borderRadius: 4 },
  body: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  emoji: { fontSize: 18 },
  label: { fontSize: 13, fontFamily: 'DMSans_600SemiBold', color: Colors.ink },
  detail: { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, marginTop: 2 },
});
