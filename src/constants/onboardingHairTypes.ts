import type { ImageSourcePropType } from 'react-native';

/**
 * Types proposés à l’étape diagnostic « cheveux ».
 * Remplace les visuels dans `assets/images/hair-types/` (fichiers 3A.png … 4C.png).
 */
export type OnboardingHairType = {
  code: string;
  desc: string;
  curl: string;
  image: ImageSourcePropType;
};

export const ONBOARDING_HAIR_TYPES: OnboardingHairType[] = [
  { code: '3A', desc: 'Boucles larges', curl: '◯', image: require('../../assets/images/hair-types/3A.png') },
  { code: '3B', desc: 'Boucles serrées', curl: '●', image: require('../../assets/images/hair-types/3B.png') },
  { code: '3C', desc: 'Boucles très serrées', curl: '⊕', image: require('../../assets/images/hair-types/3C.png') },
  { code: '4A', desc: 'Coils souples', curl: '◎', image: require('../../assets/images/hair-types/4A.png') },
  { code: '4B', desc: 'Coils anguleux', curl: '⟐', image: require('../../assets/images/hair-types/4B.png') },
  { code: '4C', desc: 'Afro serré', curl: '✦', image: require('../../assets/images/hair-types/4C.png') },
];
