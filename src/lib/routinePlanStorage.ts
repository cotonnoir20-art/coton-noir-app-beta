import { secureKV } from './secureStorage';
import { emptyRoutinePlans, parseRoutinePlansState } from './userRoutinePlan';
import type { RoutinePlansState } from '../types/userRoutinePlan';

const ROUTINE_PLANS_KEY = 'coton_noir_routine_plans_v1';

export async function loadRoutinePlans(): Promise<RoutinePlansState> {
  try {
    const raw = await secureKV.getItem(ROUTINE_PLANS_KEY);
    if (!raw) return emptyRoutinePlans();
    const parsed = JSON.parse(raw) as unknown;
    return parseRoutinePlansState(parsed) ?? emptyRoutinePlans();
  } catch {
    return emptyRoutinePlans();
  }
}

export async function saveRoutinePlans(plans: RoutinePlansState): Promise<void> {
  await secureKV.setItem(ROUTINE_PLANS_KEY, JSON.stringify(plans));
}

export async function clearRoutinePlansStorage(): Promise<void> {
  await secureKV.removeItem(ROUTINE_PLANS_KEY);
}
