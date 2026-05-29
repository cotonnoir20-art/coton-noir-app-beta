import { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { CoinHistoryEntry, PlannedSoin, RoutineStep } from '../../context/AppContext';
import { Colors } from '../../theme/colors';
import { Type } from '../../theme/typography';
import { buildHomeWashdaySessions } from '../../lib/washdayHistory';
import { HomeWashdayCalendar } from './HomeWashdayCalendar';

const DOT_COLORS = [Colors.sage, Colors.amber, Colors.growth] as const;

type Props = {
  coinHistory: CoinHistoryEntry[];
  plannedSoins: PlannedSoin[];
  washdaySteps: RoutineStep[];
};

function WashdayDots({ total, done }: { total: number; done: number }) {
  return (
    <View style={s.dotsRow}>
      {Array.from({ length: total }, (_, i) => {
        const filled = i < done;
        const color = DOT_COLORS[i % DOT_COLORS.length];
        return (
          <View
            key={i}
            style={[s.dot, filled ? { backgroundColor: color } : s.dotEmpty]}
          />
        );
      })}
    </View>
  );
}

function SoinRow({
  title,
  subtitle,
  dotTotal,
  dotDone,
  showDivider,
  onPress,
}: {
  title: string;
  subtitle: string;
  dotTotal: number;
  dotDone: number;
  showDivider: boolean;
  onPress: () => void;
}) {
  return (
    <>
      <TouchableOpacity
        style={s.row}
        onPress={onPress}
        activeOpacity={0.88}
        accessibilityRole="button"
      >
        <View style={s.rowBody}>
          <Text style={s.rowTitle}>{title}</Text>
          <Text style={s.rowSubtitle}>{subtitle}</Text>
          <WashdayDots total={dotTotal} done={dotDone} />
        </View>
        <Ionicons name="chevron-forward" size={18} color={Colors.warmGray} />
      </TouchableOpacity>
      {showDivider ? <View style={s.rowDivider} /> : null}
    </>
  );
}

export function HomeSoinsHistoryCard({ coinHistory, plannedSoins, washdaySteps }: Props) {
  const router = useRouter();

  const sessions = useMemo(
    () =>
      buildHomeWashdaySessions(coinHistory, plannedSoins, {
        washdayStepCount: washdaySteps.length,
      }),
    [coinHistory, plannedSoins, washdaySteps.length],
  );

  const openWashday = () => router.push('/washday' as any);
  const openPlanWashday = () => router.push('/add-washday' as any);

  return (
    <View style={s.section}>
      <View style={s.card}>
        <View style={s.cardHead}>
          <Text style={s.cardTitle}>Historique de soins</Text>
          <TouchableOpacity
            style={s.seeAll}
            onPress={openWashday}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel="Voir tout l'historique de soins"
          >
            <Text style={s.seeAllText}>Tout voir</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.warmGray} />
          </TouchableOpacity>
        </View>
        <View style={s.headDivider} />

        {sessions.length === 0 ? (
          <TouchableOpacity style={s.empty} onPress={openWashday} activeOpacity={0.88}>
            <Text style={s.emptyTitle}>Aucun wash day planifié</Text>
            <Text style={s.emptyHint}>Planifie ou valide un wash day pour le retrouver ici.</Text>
          </TouchableOpacity>
        ) : (
          sessions.map((session, i) => (
            <SoinRow
              key={session.id}
              title={session.title}
              subtitle={session.subtitle}
              dotTotal={session.dotTotal}
              dotDone={session.dotDone}
              showDivider={i < sessions.length - 1}
              onPress={openWashday}
            />
          ))
        )}

        <View style={s.calDivider} />
        <HomeWashdayCalendar plannedSoins={plannedSoins} coinHistory={coinHistory} />

        <View style={s.planBtnDivider} />
        <TouchableOpacity
          style={s.planBtn}
          onPress={openPlanWashday}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Planifier un washday"
        >
          <Ionicons name="calendar-outline" size={16} color={Colors.amberDark} />
          <Text style={s.planBtnText}>Planifier un washday</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  section: { marginBottom: 22, paddingHorizontal: 14 },
  card: {
    backgroundColor: Colors.white,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    shadowColor: Colors.ink,
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  cardTitle: {
    ...Type.sectionTitle,
    fontSize: 17,
    fontFamily: 'Satoshi_700Bold',
    color: Colors.ink,
  },
  seeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
    color: Colors.warmGray,
  },
  headDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
  },
  empty: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.ink,
    marginBottom: 6,
  },
  emptyHint: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    lineHeight: 19,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
  },
  rowBody: { flex: 1, minWidth: 0 },
  rowTitle: {
    fontSize: 16,
    fontFamily: 'DMSans_700Bold',
    color: Colors.ink,
    marginBottom: 4,
  },
  rowSubtitle: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    marginBottom: 10,
  },
  dotsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  dotEmpty: {
    backgroundColor: Colors.border,
  },
  calDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
    marginTop: 4,
  },
  planBtnDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
    marginTop: 8,
  },
  planBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 16,
    paddingVertical: 14,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: Colors.amber,
    backgroundColor: Colors.amberPowder,
    shadowColor: Colors.amberDark,
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  planBtnText: {
    fontSize: 15,
    fontFamily: 'DMSans_700Bold',
    color: Colors.amberDark,
  },
});
