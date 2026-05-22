import AsyncStorage from '@react-native-async-storage/async-storage';

const JOURNEY_KEY = '@coton_noir_analysis_journey';

export type AnalysisJourney = {
  startedAt: string;
  validationDays: string[];
  routineAdoptedAt?: string;
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function loadAnalysisJourney(): Promise<AnalysisJourney | null> {
  try {
    const raw = await AsyncStorage.getItem(JOURNEY_KEY);
    if (!raw) return null;
    const j = JSON.parse(raw) as AnalysisJourney;
    if (!j?.startedAt || !Array.isArray(j.validationDays)) return null;
    const started = new Date(j.startedAt).getTime();
    if (Number.isNaN(started) || Date.now() - started > 21 * 86400000) {
      await AsyncStorage.removeItem(JOURNEY_KEY);
      return null;
    }
    return j;
  } catch {
    return null;
  }
}

export async function startAnalysisJourney(): Promise<AnalysisJourney> {
  const j: AnalysisJourney = { startedAt: new Date().toISOString(), validationDays: [] };
  await AsyncStorage.setItem(JOURNEY_KEY, JSON.stringify(j));
  return j;
}

export async function markAnalysisRoutineAdopted(): Promise<void> {
  const j = (await loadAnalysisJourney()) ?? (await startAnalysisJourney());
  j.routineAdoptedAt = new Date().toISOString();
  await AsyncStorage.setItem(JOURNEY_KEY, JSON.stringify(j));
}

/** Compte un jour de validation routine pendant le parcours post-analyse (max 3 jours distincts). */
export async function recordAnalysisJourneyValidation(): Promise<AnalysisJourney | null> {
  const j = await loadAnalysisJourney();
  if (!j) return null;
  const day = todayIso();
  if (!j.validationDays.includes(day)) {
    j.validationDays = [...j.validationDays, day].slice(-7);
    await AsyncStorage.setItem(JOURNEY_KEY, JSON.stringify(j));
  }
  return j;
}

export function analysisJourneyProgress(j: AnalysisJourney | null): {
  daysValidated: number;
  goalMet: boolean;
  showBanner: boolean;
} {
  if (!j) return { daysValidated: 0, goalMet: false, showBanner: false };
  const days = j.validationDays.length;
  const withinWindow = Date.now() - new Date(j.startedAt).getTime() < 14 * 86400000;
  return {
    daysValidated: Math.min(days, 3),
    goalMet: days >= 3,
    showBanner: withinWindow && days < 3,
  };
}
