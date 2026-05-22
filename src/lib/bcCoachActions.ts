import type { BCActionRoute, BlackCottonTrigger } from '../components/blackCotton/types';

export const DEFAULT_BC_ACTIONS: Partial<
  Record<BlackCottonTrigger, { label: string; route: BCActionRoute }>
> = {
  first_login:         { label: 'Voir ma routine', route: '/(tabs)/routine' },
  onboarding_gift:     { label: 'Voir mes récompenses', route: '/rewards' },
  first_routine:       { label: 'Continuer ma routine', route: '/(tabs)/routine' },
  profile_completed:   { label: 'Lancer une analyse', route: '/(tabs)/analyze' },
  streak_7_days:       { label: 'Valider ma routine', route: '/(tabs)/routine' },
  streak_30_days:      { label: 'Voir ma progression', route: '/hair-length' },
  washday_added:       { label: 'Préparer mon wash day', route: '/washday' },
  hair_growth_progress:{ label: 'Voir ma pousse', route: '/hair-length' },
  inactivity:          { label: 'Reprendre ma routine', route: '/(tabs)/routine' },
  pantry_filled:       { label: 'Voir ma routine', route: '/(tabs)/routine' },
  protective_mode_on:  { label: 'Routine adaptée', route: '/(tabs)/routine' },
  post_routine:        { label: 'Voir ma routine', route: '/(tabs)/routine' },
  post_analysis:       { label: 'Adapter ma routine', route: '/routine-plan' },
  post_measurement:    { label: 'Voir ma pousse', route: '/hair-length' },
  badge_unlocked:      { label: 'Voir mes badges', route: '/achievements' },
  onboarding_step:     { label: 'Continuer', route: '/onboarding' },
};

export function defaultActionForTrigger(
  trigger: BlackCottonTrigger,
): { label: string; route: BCActionRoute } | null {
  return DEFAULT_BC_ACTIONS[trigger] ?? null;
}
