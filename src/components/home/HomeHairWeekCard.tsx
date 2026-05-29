import { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import type { CoinHistoryEntry, PlannedSoin } from '../../context/AppContext';
import {
  buildHairWeekAgenda,
  getMondayWeekStart,
  DEFAULT_HAIR_WEEK,
  type WeekAgendaItem,
} from '../../lib/hairWeekPlan';
import { HairWeekAgenda } from '../workflows/HairWeekAgenda';
import { Colors } from '../../theme/colors';

const MIN_DAYS_REGISTERED = 6;

type Props = {
  coinHistory: CoinHistoryEntry[];
  plannedSoins: PlannedSoin[];
};

function daysSince(isoDate: string): number {
  return Math.floor((Date.now() - new Date(isoDate).getTime()) / 86_400_000);
}

// ── Nouvelle utilisatrice : semaine type + routine du jour + wash day CTA ──

const DAY_LABELS = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

function buildTypicalSlots() {
  const weekStart = getMondayWeekStart();
  return DEFAULT_HAIR_WEEK.map(template => {
    const offset = template.weekday === 0 ? 6 : template.weekday - 1;
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + offset);
    return { ...template, dayLabel: DAY_LABELS[d.getDay()], dateNum: d.getDate() };
  });
}

function HomeNewUserWeekCard() {
  const router = useRouter();
  const { state } = useApp();

  const slots = useMemo(buildTypicalSlots, []);
  const todayWeekday = new Date().getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
  const todaySlot = DEFAULT_HAIR_WEEK.find(s => s.weekday === todayWeekday)
    ?? { emoji: '🌤️', label: 'Routine du matin', routineType: 'daily' as const };
  const todaySteps = state.routineSteps.daily.slice(0, 3);

  return (
    <View style={N.wrap}>
      <Text style={N.title}>Ta semaine capillaire</Text>
      <Text style={N.sub}>Voici a quoi va ressembler ta routine ideale</Text>

      {/* Routine du jour */}
      <TouchableOpacity
        style={N.todayRow}
        onPress={() =>
          router.push({
            pathname: '/(tabs)/routine',
            params: { routine: todaySlot.routineType },
          } as any)
        }
        activeOpacity={0.85}
      >
        <View style={{ flex: 1 }}>
          <Text style={N.todayKicker}>AUJOURD'HUI</Text>
          <View style={N.todayMain}>
            <Text style={N.todayEmoji}>{todaySlot.emoji}</Text>
            <Text style={N.todayLabel}>{todaySlot.label}</Text>
          </View>
          {todaySteps.length > 0 && (
            <View style={N.stepsRow}>
              {todaySteps.map(step => (
                <View key={step.id} style={N.stepChip}>
                  <Text style={N.stepChipText}>{step.title}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
        <Ionicons name="chevron-forward" size={16} color={Colors.amberDark} />
      </TouchableOpacity>

      {/* Semaine type */}
      <Text style={N.sectionLabel}>TA SEMAINE TYPE</Text>
      {slots.map(slot => (
        <TouchableOpacity
          key={slot.weekday}
          style={N.slotRow}
          onPress={() =>
            router.push({
              pathname: '/(tabs)/routine',
              params: { routine: slot.routineType },
            } as any)
          }
          activeOpacity={0.85}
        >
          <View style={N.dayCol}>
            <Text style={N.dayLabel}>{slot.dayLabel}</Text>
            <Text style={N.dayNum}>{slot.dateNum}</Text>
          </View>
          <View style={N.slotDot} />
          <View style={N.slotBody}>
            <Text style={N.slotEmoji}>{slot.emoji}</Text>
            <Text style={N.slotName}>{slot.label}</Text>
          </View>
          <Ionicons name="chevron-forward" size={14} color={Colors.warmGray} />
        </TouchableOpacity>
      ))}

      {/* CTA planifier wash day */}
      <TouchableOpacity
        style={N.washdayCta}
        onPress={() => router.push('/add-washday' as any)}
        activeOpacity={0.85}
      >
        <View style={N.washdayIcon}>
          <Ionicons name="water-outline" size={20} color={Colors.amberDark} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={N.washdayTitle}>Planifie ton 1er wash day</Text>
          <Text style={N.washdaySub}>La base de toute bonne routine capillaire</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={Colors.amberDark} />
      </TouchableOpacity>
    </View>
  );
}

// ── Carte existante (6+ jours, historique) ──────────────────────────────────

export function HomeHairWeekCard({ coinHistory, plannedSoins }: Props) {
  const router = useRouter();
  const { session } = useAuth();

  const items = useMemo(
    () => buildHairWeekAgenda({ coinHistory, plannedSoins }),
    [coinHistory, plannedSoins],
  );

  const createdAt = session?.user?.created_at;
  const isNew = !createdAt || daysSince(createdAt) < MIN_DAYS_REGISTERED;

  if (isNew) return <HomeNewUserWeekCard />;
  if (items.length === 0) return null;

  function onPressSlot(item: WeekAgendaItem) {
    if (item.kind === 'washday' && item.detail === 'A planifier') {
      router.push({ pathname: '/add-washday', params: { date: item.dateIso } } as any);
      return;
    }
    router.push({
      pathname: '/(tabs)/routine',
      params: { routine: item.routineType, period: 'week' },
    } as any);
  }

  return <HairWeekAgenda items={items} onPressSlot={onPressSlot} compact />;
}

// ── Styles nouvelle utilisatrice ─────────────────────────────────────────────

const N = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 20,
    marginBottom: 14,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Satoshi_700Bold',
    color: Colors.ink,
    marginBottom: 4,
  },
  sub: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    marginBottom: 16,
  },
  todayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.amberLight,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.amber,
    padding: 14,
    marginBottom: 16,
    gap: 8,
  },
  todayKicker: {
    fontSize: 10,
    fontFamily: 'DMSans_700Bold',
    color: Colors.amberDark,
    letterSpacing: 1,
    marginBottom: 6,
  },
  todayMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  todayEmoji: { fontSize: 20 },
  todayLabel: {
    fontSize: 14,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.ink,
  },
  stepsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  stepChip: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.amber,
  },
  stepChipText: {
    fontSize: 11,
    fontFamily: 'DMSans_500Medium',
    color: Colors.amberDark,
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: 'DMSans_700Bold',
    color: Colors.warmGray,
    letterSpacing: 1,
    marginBottom: 10,
  },
  slotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bg,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  dayCol: { width: 28, alignItems: 'center' },
  dayLabel: {
    fontSize: 10,
    fontFamily: 'DMSans_700Bold',
    color: Colors.warmGray,
  },
  dayNum: {
    fontSize: 14,
    fontFamily: 'Satoshi_500Medium',
    color: Colors.ink,
  },
  slotDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  slotBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  slotEmoji: { fontSize: 16 },
  slotName: {
    fontSize: 13,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.ink,
  },
  washdayCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.amberPowder,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.amberLight,
    padding: 14,
    marginTop: 6,
  },
  washdayIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.amberLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  washdayTitle: {
    fontSize: 13,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.ink,
    marginBottom: 2,
  },
  washdaySub: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
  },
});
