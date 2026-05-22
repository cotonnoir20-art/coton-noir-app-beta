import type { GrowthEntry, HairProfile } from '../context/AppContext';
import { averageLatestCmByZone, parseCmFromText, toLocalISODate } from './homeGrowth';

export type GrowthProjection = {
  targetCm: number;
  currentCm: number;
  palierPct: number;
  remaining: number;
  monthsToTarget: number | null;
  growthPerMonth: number;
  growth3m: number | null;
  hasMeasurements: boolean;
};

export function computeGrowthProjection(
  history: GrowthEntry[],
  profile: HairProfile,
  today: Date = new Date(),
): GrowthProjection {
  const todayIso = toLocalISODate(today);
  const primaryH = history
    .filter(h => h.zone === 'Devant')
    .sort((a, b) => a.date.localeCompare(b.date));
  const latestM = primaryH[primaryH.length - 1];
  const ref3mAgo = new Date(today);
  ref3mAgo.setMonth(ref3mAgo.getMonth() - 3);
  const refPoint3m = [...primaryH].reverse().find(h => h.date <= toLocalISODate(ref3mAgo));
  const growth3m =
    latestM && refPoint3m ? +(latestM.cm - refPoint3m.cm).toFixed(1) : null;
  const growthPerMonth = growth3m !== null ? +(growth3m / 3).toFixed(1) : 0;

  const targetCm = parseFloat(profile.targetLength ?? '') || 40;
  const avgCurrentCm = averageLatestCmByZone(history);
  const currentCm =
    avgCurrentCm || (latestM?.cm ?? parseCmFromText(profile.length) ?? 0);
  const palierPct =
    currentCm > 0 ? Math.min(100, Math.round((currentCm / targetCm) * 100)) : 0;
  const remaining = Math.max(0, +(targetCm - currentCm).toFixed(1));
  const monthsToTarget =
    growthPerMonth > 0 && remaining > 0
      ? +(remaining / growthPerMonth).toFixed(1)
      : null;

  return {
    targetCm,
    currentCm,
    palierPct,
    remaining,
    monthsToTarget,
    growthPerMonth,
    growth3m,
    hasMeasurements: history.length > 0 || !!parseCmFromText(profile.length),
  };
}
