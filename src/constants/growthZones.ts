/** Libellés stockés dans `growthHistory.zone` — source unique pour toute l’app. */
export const GROWTH_ZONE_NAMES = [
  'Devant',
  'Derrière',
  'Côté Gauche',
  'Côté Droit',
] as const;

export type GrowthZoneName = (typeof GROWTH_ZONE_NAMES)[number];

/** UI mesure par zone (écran « Ma longueur »). */
export const HAIR_MEASURE_ZONES = [
  {
    key: 'devant',
    label: 'Devant',
    zone: 'Devant' as GrowthZoneName,
    img: require('../../assets/images/zone-devant.png'),
  },
  {
    key: 'gauche',
    label: 'Côté gauche',
    zone: 'Côté Gauche' as GrowthZoneName,
    img: require('../../assets/images/zone-gauche.png'),
  },
  {
    key: 'droite',
    label: 'Côté droit',
    zone: 'Côté Droit' as GrowthZoneName,
    img: require('../../assets/images/zone-droite.png'),
  },
  {
    key: 'derriere',
    label: 'Derrière',
    zone: 'Derrière' as GrowthZoneName,
    img: require('../../assets/images/zone-derriere.png'),
  },
] as const;

export type HairMeasureZoneKey = (typeof HAIR_MEASURE_ZONES)[number]['key'];
