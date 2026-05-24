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

/** CTA landing web — entrée onboarding (étape 1). */
export const MARKETING_LANDING_CTA_PRIMARY = 'Commencer mon diagnostic';

/** CTA landing web — connexion. */
export const MARKETING_LANDING_CTA_SECONDARY = 'Connexion';

/** CTA welcome app native. */
export const MARKETING_WELCOME_CTA_PRIMARY = 'Commencer mon diagnostic';

export const MARKETING_WELCOME_CTA_SECONDARY = "J'ai déjà un compte";

/** Titre section features — landing web. */
export const MARKETING_LANDING_FEATURES_TITLE = 'Tout ce dont tes cheveux ont besoin';

/** Proposition de valeur — hero landing web (sous le logo, avant les CTAs). */
export const MARKETING_LANDING_HERO_TITLE =
  'La copilote n°1 pensée pour les cheveux afros et texturés.';

export const MARKETING_LANDING_HERO_SUBTITLE =
  'Pour celles qui recherchent une routine claire, plus adaptée et des cheveux en meilleure santé — types 3A à 4C.';

/** Cartes landing (style IrunCoil) — forces Coton Noir. */
export const MARKETING_LANDING_FEATURES = [
  {
    icon: 'scan-outline' as const,
    iconBg: '#FDE9D0',
    iconColor: '#D07A12',
    title: 'Diagnostic capillaire',
    subtitle:
      'Un parcours guidé pour les cheveux texturés : analyse, profil et routine personnalisée.',
  },
  {
    icon: 'calendar-outline' as const,
    iconBg: '#D9EBE5',
    iconColor: '#3D6B5C',
    title: 'Routines et coaching capillaire',
    subtitle:
      'Programmes wash day, rappels et conseils Black Cotton adaptés à ta texture.',
  },
  {
    icon: 'bag-outline' as const,
    iconBg: '#FDE9D0',
    iconColor: '#D07A12',
    title: 'Produits et recettes',
    subtitle:
      'Recommandations dans ton budget — produits du commerce, DIY ou mixte.',
  },
  {
    icon: 'trophy-outline' as const,
    iconBg: '#F5D8DA',
    iconColor: '#631617',
    title: 'Récompenses et CotonCoins',
    subtitle:
      'Gagne des CC en suivant ta routine, tes wash days et tes défis — débloque des récompenses au fil de ta progression.',
  },
  {
    icon: 'medical-outline' as const,
    iconBg: '#DCE4E8',
    iconColor: '#2F4B59',
    title: 'Accompagnement Black Cotton',
    subtitle:
      'Ta coach dans l’app : réponses concrètes sur hydratation, casse, cuir chevelu et pousse.',
  },
  {
    icon: 'sparkles-outline' as const,
    iconBg: '#D9EBE5',
    iconColor: '#3D6B5C',
    title: 'Passer au naturel',
    subtitle: 'Un plan progressif pour renouer avec tes cheveux naturels à ton rythme.',
  },
  {
    icon: 'people-outline' as const,
    iconBg: '#DCE4E8',
    iconColor: '#2F4B59',
    title: 'Communauté',
    subtitle:
      'Partage, défis et échanges avec d’autres femmes qui vivent la même expérience capillaire.',
  },
] as const;

/** Footer landing. */
export const MARKETING_LANDING_FOOTER_LINE =
  'Conçu avec amour pour les cheveux texturés.';
export const MARKETING_LANDING_COPYRIGHT = `© ${new Date().getFullYear()} Coton Noir. Tous droits réservés.`;

/** Blocs « tout ce qu'il te faut » — welcome in-app (3 cartes compactes). */
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
