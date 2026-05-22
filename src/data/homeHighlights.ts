import { CHALLENGE_HYDRA_PTS_PER_DAY, PTS_DEFI_LABEL } from '../constants/productPitch';

/**
 * Cartes « Moments forts » (accueil) — même contrat que la table `public.highlights`.
 */
export type MomentCard = {
  id: string;
  badge: string;
  title: string;
  sub: string;
  footerLeft: string;
  variant: 'live' | 'premium' | 'neutral';
  /** Route Expo interne (ex. /premium, /community). */
  route?: string;
};

/** Données locales si Supabase est vide ou indisponible. */
export const FALLBACK_HOME_HIGHLIGHTS: MomentCard[] = [
  {
    id: 'local-hydra',
    badge: '● LIVE',
    title: 'Hydra Challenge 30',
    sub: '1247 participantes · jour 8 / 30',
    footerLeft: `+${CHALLENGE_HYDRA_PTS_PER_DAY} ${PTS_DEFI_LABEL}/jour`,
    variant: 'live',
    route: '/hydra-challenge',
  },
  {
    id: 'local-box',
    badge: '● 3 J RESTANTS',
    title: 'Box Mai · Karité',
    sub: "Dispo jusqu'au 17 mai",
    footerLeft: 'Premium',
    variant: 'premium',
    route: '/box',
  },
  {
    id: 'local-analyze',
    badge: '● NOUVEAU',
    title: 'Analyse IA express',
    sub: 'Black Cotton · conseils perso en quelques minutes',
    footerLeft: '+10 CC',
    variant: 'neutral',
    route: '/(tabs)/analyze',
  },
  {
    id: 'local-tutos',
    badge: '● 5 MIN',
    title: 'Routine humidité express',
    sub: 'Un tuto court pour lancer la journée sans prise de tête',
    footerLeft: 'Tutos',
    variant: 'neutral',
    route: '/tutorials',
  },
  {
    id: 'local-parrain',
    badge: '● EN COURS',
    title: 'Parrainage x2',
    sub: "Ton amie s'inscrit avec ton code → CC pour vous deux (plafonné)",
    footerLeft: 'Inviter',
    variant: 'live',
    route: '/invite',
  },
];
