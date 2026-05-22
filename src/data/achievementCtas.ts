import type { AchievementDef } from './achievements';

export type AchievementCta = {
  label: string;
  route: string;
};

/** CTA contextuel après déblocage d’un badge. */
export function getAchievementCta(def: AchievementDef): AchievementCta {
  if (def.id === 'mentor' || def.group === 'community') {
    return { label: 'Inviter une amie', route: '/invite' };
  }
  if (def.group === 'growth' || def.group === 'streak') {
    return { label: 'Voir ma progression', route: '/growth' };
  }
  if (def.group === 'coins') {
    return { label: 'Voir mes récompenses', route: '/rewards' };
  }
  if (def.id === 'first-routine') {
    return { label: 'Voir ma routine', route: '/(tabs)/routine' };
  }
  if (def.id === 'first-recipe-tested') {
    return { label: 'Explorer les recettes', route: '/recipes' };
  }
  if (def.id === 'first-hairstyle') {
    return { label: 'Voir les coiffures', route: '/coiffures' };
  }
  return { label: 'Voir ma collection', route: '/achievements' };
}
