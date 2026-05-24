/**
 * Textes marketing — welcome, stores, landing.
 * Positionnement : copilote capillaire (pas laboratoire biométrique).
 */

/** Accroche principale — welcome & hero stores. */
export const MARKETING_HERO_TITLE =
  'Ta copilote capillaire pour mieux prendre soin de tes cheveux.';

/** Sous-titre welcome — promesse concrète. */
export const MARKETING_HERO_SUBTITLE =
  'Diagnostic, routines, wash day et pousse — cheveux texturés de type 3 à 4.';

/** Tagline courte (App Store, accueil connecté). */
export const MARKETING_TAGLINE =
  'Ton copilote capillaire — pour mieux prendre soin de tes cheveux.';

/** CTA welcome — entrée onboarding. */
export const MARKETING_CTA_PRIMARY = 'Commencer mon diagnostic';

/** CTA secondaire — login. */
export const MARKETING_CTA_SECONDARY = "J'ai déjà un compte";

/** Blocs « tout ce qu'il te faut » — forces réelles livrées en app. */
export const MARKETING_WELCOME_FEATURES = [
  {
    icon: 'sparkles-outline' as const,
    title: 'Analyse & routine',
    subtitle: 'Black Cotton lit tes photos et te propose un plan sur mesure.',
  },
  {
    icon: 'calendar-outline' as const,
    title: 'Routines & wash day',
    subtitle: 'Matin, soir et wash day guidés — étapes, minuteurs, rappels.',
  },
  {
    icon: 'trending-up-outline' as const,
    title: 'Pousse, récompense en CC & communauté',
    subtitle: 'Suis ta longueur en cm, gagne des CotonCoins, partage ta progression.',
  },
] as const;

/** App Store — sous-titre (30 car. max). */
export const STORE_SUBTITLE_IOS = 'Copilote capillaire afro';

/** Google Play — titre (30 car. max). */
export const STORE_TITLE_ANDROID = 'Coton Noir — Copilote Afro';

/** Google Play — description courte (80 car. max). */
export const STORE_SHORT_DESC_ANDROID =
  'Ta copilote capillaire : diagnostic, routines, pousse en cm & communauté.';

/** App Store — texte promotionnel (170 car. max). */
export const STORE_PROMO_IOS =
  'Diagnostic capillaire, wash day guidé, analyse Black Cotton et pousse en cm. Ta copilote afro, dans ta poche.';

/** App Store / Play — description longue (extrait header). */
export const STORE_DESCRIPTION_INTRO = `Coton Noir — ta copilote capillaire dans ton smartphone.

Fini les conseils génériques qui ne collent pas à ta texture. Ici, tu comprends tes cheveux, tu sais quoi faire aujourd'hui, et tu vois ta progression semaine après semaine — routines, wash day, mesures et communauté, dans une seule app pensée pour les cheveux afro, crépus, bouclés et frisés (3C à 4C).`;

/** Footer stores — closing line. */
export const STORE_DESCRIPTION_CLOSER =
  'Télécharge Coton Noir. Black Cotton t\'accompagne — de la première analyse à ta prochaine longueur.';
