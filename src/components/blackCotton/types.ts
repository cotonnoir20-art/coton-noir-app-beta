export type BlackCottonMood =
  | 'happy'
  | 'proud'
  | 'celebrating'
  | 'thinking'
  | 'encouraging'
  | 'surprised'
  | 'playful'
  | 'coaching';

export type BlackCottonTrigger =
  | 'first_login'
  | 'first_routine'
  | 'profile_completed'
  | 'badge_unlocked'
  | 'streak_7_days'
  | 'streak_30_days'
  | 'washday_added'
  | 'hair_growth_progress'
  | 'inactivity'
  | 'onboarding_step'
  | 'pantry_filled'
  | 'protective_mode_on'
  | 'manual';

export type DisplayMode = 'toast' | 'popup';

export interface TriggerContext {
  badgeName?: string;
  streak?: number;
  onboardingStep?: number;
  text?: string;
  mood?: BlackCottonMood;
  displayMode?: DisplayMode;
  actionLabel?: string;
  onAction?: () => void;
}

export interface BCMessage {
  id: string;
  text: string;
  subtext?: string;
  mood: BlackCottonMood;
  trigger: BlackCottonTrigger;
  priority: 1 | 2 | 3;
  displayMode: DisplayMode;
  duration: number; // ms, 0 = manual dismiss only
  actionLabel?: string;
  onAction?: () => void;
}

export interface FloatingMessage {
  text: string;
  mood: BlackCottonMood;
}

export interface BCContextValue {
  current: BCMessage | null;
  isVisible: boolean;
  isFloatingOpen: boolean;
  floatingMsg: FloatingMessage;
  floatingLoading: boolean;
  fire: (trigger: BlackCottonTrigger, ctx?: TriggerContext) => void;
  dismiss: () => void;
  toggleFloating: () => void;
  showManual: (text: string, mood?: BlackCottonMood, displayMode?: DisplayMode) => void;
}
