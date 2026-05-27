import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

/** Les 4 angles du scan capillaire guidé Coton Noir. */
export const HAIR_SCAN_ZONES = [
  {
    id: 'face',
    label: 'Face',
    emoji: '⬆️',
    kicker: 'ANGLE 1 · FACE',
    title: 'Face',
    instruction: 'Oriente tes cheveux face à la caméra, en bonne lumière naturelle.',
    captureLabel: 'Capturer — Face',
    guideIcon: 'arrow-up-outline' as ComponentProps<typeof Ionicons>['name'],
  },
  {
    id: 'left',
    label: 'Côté gauche',
    emoji: '⬅️',
    kicker: 'ANGLE 2 · CÔTÉ GAUCHE',
    title: 'Côté gauche',
    instruction: 'Tourne légèrement la tête pour montrer le côté gauche.',
    captureLabel: 'Capturer — Côté gauche',
    guideIcon: 'arrow-back-outline' as ComponentProps<typeof Ionicons>['name'],
  },
  {
    id: 'right',
    label: 'Côté droit',
    emoji: '➡️',
    kicker: 'ANGLE 3 · CÔTÉ DROIT',
    title: 'Côté droit',
    instruction: 'Tourne légèrement la tête pour montrer le côté droit.',
    captureLabel: 'Capturer — Côté droit',
    guideIcon: 'arrow-forward-outline' as ComponentProps<typeof Ionicons>['name'],
  },
  {
    id: 'top',
    label: 'Dessus',
    emoji: '⬇️',
    kicker: 'ANGLE 4 · DESSUS',
    title: 'Dessus',
    instruction: 'Incline la tête en avant pour montrer le dessus et les racines.',
    captureLabel: 'Capturer — Dessus',
    guideIcon: 'arrow-down-outline' as ComponentProps<typeof Ionicons>['name'],
  },
] as const;

export type HairScanZoneId = (typeof HAIR_SCAN_ZONES)[number]['id'];
