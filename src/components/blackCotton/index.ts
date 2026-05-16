// ── Black Cotton public API ──────────────────────────────────────────────
// Import these in your screens/components to use the mascot system.
//
// Usage:
//   import { useBlackCotton, BlackCottonCoachCard, BlackCottonFloatingAssistant }
//     from '../src/components/blackCotton';
//
//   const { fire } = useBlackCotton();
//   fire('badge_unlocked');
//   fire('manual', { text: 'Mon message custom', mood: 'happy' });

export { BCEmojiAvatar, BCIllustration } from './BCEmojiAvatar';
export { BlackCottonCoachCard } from './BlackCottonCoachCard';
export { BlackCottonFloatingAssistant } from './BlackCottonFloatingAssistant';
export { MOOD_ACCENT, MOOD_TO_EXPRESSION, TRIGGER_CONFIGS } from './constants';
export type {
  BCContextValue,
  BCMessage,
  BlackCottonMood,
  BlackCottonTrigger,
  DisplayMode,
  TriggerContext,
} from './types';

// Hook re-export for convenience
export { useBlackCotton } from '../../context/BlackCottonContext';
