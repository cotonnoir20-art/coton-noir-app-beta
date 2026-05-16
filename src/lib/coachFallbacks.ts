import { FLOATING_MESSAGES } from '../components/blackCotton/constants';

/** Conseil statique quand l’API coach est indisponible ou compte démo. */
export const COACH_FALLBACK_ADVICE =
  "Pense à hydrater tes longueurs aujourd'hui — un peu d'eau et de leave-in suffisent 💧";

/** Tips flottants hors ligne / démo (texte uniquement). */
export function getOfflineFloatingTips(): string[] {
  return FLOATING_MESSAGES.map(m => m.text);
}
