import AsyncStorage from '@react-native-async-storage/async-storage';
import type { HairAnalysis } from '../services/coachApi';

const DRAFT_KEY = '@coton_noir_analysis_draft';

export type AnalysisDraft = {
  analysis: HairAnalysis;
  resultPhotoUri: string | null;
  completedAt: string;
};

export async function saveAnalysisDraft(draft: AnalysisDraft): Promise<void> {
  await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export async function loadAnalysisDraft(): Promise<AnalysisDraft | null> {
  try {
    const raw = await AsyncStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AnalysisDraft;
    if (!parsed?.analysis || typeof parsed.completedAt !== 'string') return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function clearAnalysisDraft(): Promise<void> {
  await AsyncStorage.removeItem(DRAFT_KEY);
}
