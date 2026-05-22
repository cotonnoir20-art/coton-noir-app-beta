import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import type { CoinHistoryEntry, PlannedSoin } from '../../context/AppContext';
import { buildHairWeekAgenda, type WeekAgendaItem } from '../../lib/hairWeekPlan';
import { HairWeekAgenda } from '../workflows/HairWeekAgenda';

type Props = {
  coinHistory: CoinHistoryEntry[];
  plannedSoins: PlannedSoin[];
};

export function HomeHairWeekCard({ coinHistory, plannedSoins }: Props) {
  const router = useRouter();
  const items = useMemo(
    () => buildHairWeekAgenda({ coinHistory, plannedSoins }),
    [coinHistory, plannedSoins],
  );

  function onPressSlot(item: WeekAgendaItem) {
    if (item.kind === 'washday' && item.detail === 'À planifier') {
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
