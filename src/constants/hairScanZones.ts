import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

/** Les 3 zones capillaires Coton Noir (scan guidé). */
export const HAIR_SCAN_ZONES = [
  {
    id: 'roots',
    label: 'Racines',
    emoji: '🌱',
    kicker: 'ZONE 1 · RACINES',
    title: 'Racines & cuir chevelu',
    instruction: 'Cadre tes racines de près — écarte légèrement les mèches pour montrer le cuir chevelu.',
    captureLabel: 'Capturer les racines',
    guideIcon: 'arrow-down-outline' as ComponentProps<typeof Ionicons>['name'],
  },
  {
    id: 'lengths',
    label: 'Longueurs',
    emoji: '💇',
    kicker: 'ZONE 2 · LONGUEURS',
    title: 'Milieu des mèches',
    instruction: 'Photographie le milieu de tes cheveux sur plusieurs mèches bien visibles.',
    captureLabel: 'Capturer les longueurs',
    guideIcon: 'scan-outline' as ComponentProps<typeof Ionicons>['name'],
  },
  {
    id: 'ends',
    label: 'Pointes',
    emoji: '✂️',
    kicker: 'ZONE 3 · POINTES',
    title: 'Pointes & extrémités',
    instruction: 'Cadre les pointes de tes cheveux — l’objectif est de voir l’état des extrémités.',
    captureLabel: 'Capturer les pointes',
    guideIcon: 'arrow-up-outline' as ComponentProps<typeof Ionicons>['name'],
  },
] as const;

export type HairScanZoneId = (typeof HAIR_SCAN_ZONES)[number]['id'];
