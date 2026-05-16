// ─────────────────────────────────────────────────────────────────────────────
// Comptes de démonstration (build DEV uniquement — exclu des releases store)
//
// Les emails ci-dessous ne sont pas inclus dans l’APK/IPA production : le bloc
// DEMO_FIXTURES est compilé avec `__DEV__ ? … : {}`. En release, isDemoEmail()
// retourne toujours false.
//
// Mots de passe Supabase : uniquement dans .env.local (voir demoMode.ts).
// ─────────────────────────────────────────────────────────────────────────────

import { isDemoModeAvailable } from '../lib/demoMode';
import type {
  AppState,
  CoinHistoryEntry,
  GrowthEntry,
  HairProfile,
  PlannedSoin,
} from '../context/AppContext';
import type { Notif } from '../context/NotificationsContext';
import {
  CC_REFERRAL_SIGNUP,
  CC_ROUTINE_DAILY_NIGHT,
  CC_ROUTINE_WASHDAY,
  CC_STREAK_BONUS_30,
  CC_STREAK_BONUS_7,
} from '../lib/cotonCoins';

type DemoZone = 'Devant' | 'Derrière' | 'Droite' | 'Gauche';

interface DemoGrowthMeasure {
  /** Combien de jours dans le passé (>= 1). */
  daysAgo: number;
  /** Mesure en cm. */
  cm: number;
  /** Zone mesurée (par défaut "Devant", car c'est elle qui pilote home + chart). */
  zone?: DemoZone;
}

interface DemoFixture {
  email: string;
  /** Affichage principal du nom dans toute l'app. */
  name: string;
  /** Ancienneté du compte (jours) — contrôle l'amplitude de l'historique. */
  ageDays: number;
  coins: number;
  totalEarned: number;
  streak: number;
  /** Nombre de wash days passés ce mois — sert au compteur "X ce mois". */
  washdaysThisMonth: number;
  /** Profil cheveux (les champs Boolean comptent pour le score santé). */
  profile: HairProfile;
  /**
   * Mesures de pousse (chaque entrée = +5 pts au score, plafond 20).
   * Conseil : 3-4 mesures « Devant » étalées dans le temps pour que :
   *  - la home affiche `Pousse ce mois` (diff mois courant / précédent),
   *  - l'écran Pousse trace un vrai chart (3+ mois distincts).
   */
  growth: DemoGrowthMeasure[];
  /** Avatar profile (emoji + couleur du cercle). */
  avatar: { emoji: string; bg: string };
  /** Mode protecteur (tresses, locks, etc.) — visible dans le profil. */
  protective: { active: boolean; type?: string };
  /** Notifications personnalisées (sinon défaut). */
  notifs?: Notif[];
}

// ─── Définitions ────────────────────────────────────────────────────────────
//
// Profil cheveux : 9 champs entrent dans le score :
//   hairType, porosity, density, length, objective, targetLength,
//   routineType, region, budget
// Chacun rempli ajoute 60/9 ≈ 6.7 pts. `name` et `climate` ne comptent pas.
//
// Score final = round(profile_filled/9 * 60) + min(streak*2, 20) + min(growth*5, 20)

const DEMO_FIXTURES: Record<string, DemoFixture> = __DEV__ ? {
  // ── Britta · 1 mois · 560 CC · streak 25 · score 75 · 4 washdays ────────
  'cotonnoir20@gmail.com': {
    email: 'cotonnoir20@gmail.com',
    name: 'Britta',
    ageDays: 30,
    coins: 560,
    totalEarned: 850,
    streak: 25,
    washdaysThisMonth: 4,
    // 3 mesures "Devant" → 15 pts bonus + 40 profil + 20 streak = 75
    // Étalées sur les 2 derniers mois pour afficher la diff "Pousse ce mois"
    growth: [
      { daysAgo: 25, cm: 22.0 }, // mois précédent
      { daysAgo: 12, cm: 22.6 }, // début du mois courant
      { daysAgo: 3,  cm: 23.1 }, // mesure la plus récente
    ],
    profile: {
      name: 'Britta',
      hairType: '4B',
      porosity: 'Haute',
      density: 'Épaisse',
      length: 'Mi-longs',
      objective: 'longueur',
      targetLength: '25 cm',
      // 3 champs laissés vides pour atterrir à 6/9 → 40 pts
      routineType: '',
      region: '',
      climate: 'tropical',
      budget: '',
      careStyle: 'mix',
      problematics: ['Sécheresse', 'Fourches'],
    },
    avatar: { emoji: '👩🏿‍🦱', bg: '#4C1D95' },
    protective: { active: false },
    notifs: [
      {
        id: 1, type: 'tip', read: false, time: "Il y a 2 h",
        title: "Astuce du jour pour toi, Britta",
        body: "Avec ta porosité haute, scelle toujours ton hydratation avec une huile lourde (ricin, brocoli).",
      },
      {
        id: 2, type: 'coins', read: false, time: "Hier",
        title: `+${CC_ROUTINE_WASHDAY} CC · Wash day validé`,
        body: "Bravo, ta routine cette semaine est nickel. Continue !",
        route: '/rewards',
      },
      {
        id: 3, type: 'routine', read: false, time: "Il y a 2 jours",
        title: "Rappel : démêlage avant ton wash day",
        body: "Un démêlage en sections évite la casse au shampoing.",
        route: '/(tabs)/routine',
      },
      {
        id: 4, type: 'coins', read: true, time: "Il y a 4 jours",
        title: "Streak 21 jours 🔥",
        body: "3 semaines de régularité. Tes cheveux te disent merci.",
        route: '/rewards',
      },
      {
        id: 5, type: 'promo', read: true, time: "Il y a 1 semaine",
        title: "-15 % sur les huiles capillaires",
        body: "Code BRITTA15 chez nos partenaires jusqu'à dimanche.",
        route: '/partners',
      },
      {
        id: 6, type: 'system', read: true, time: "Il y a 1 mois",
        title: "Bienvenue chez Coton Noir ✨",
        body: "Ton profil 4B · Haute porosité est créé. Black Cotton t'accompagne.",
        route: '/(tabs)',
      },
    ],
  },

  // ── Lola · 3 mois · 1500 CC · streak 90 · score 60 · 2 washdays ─────────
  'test@cotonnoir.app': {
    email: 'test@cotonnoir.app',
    name: 'Lola',
    ageDays: 100,
    coins: 1500,
    totalEarned: 2400,
    streak: 90,
    washdaysThisMonth: 2,
    // 4 mesures "Devant" sur 4 mois distincts → vrai chart pousse + 20 pts bonus
    // 20 profil + 20 streak + 20 growth = 60
    // La première mesure est à > 3 mois pour activer la stat "Pousse totale"
    growth: [
      { daysAgo: 95, cm: 28.0 }, // > 3 mois → ref pour totalPousse
      { daysAgo: 65, cm: 28.8 }, // -2 mois
      { daysAgo: 30, cm: 29.6 }, // mois précédent
      { daysAgo: 5,  cm: 30.5 }, // mois en cours
    ],
    profile: {
      name: 'Lola',
      hairType: '4A',
      length: 'Longs',
      objective: 'force',
      // 6 champs vides → 3/9 → 20 pts
      porosity: '',
      density: '',
      targetLength: '',
      routineType: '',
      region: '',
      climate: 'continental',
      budget: '',
      careStyle: 'shop',
      problematics: ['Casse', 'Nœuds'],
    },
    avatar: { emoji: '🌺', bg: '#831843' },
    protective: { active: false },
    notifs: [
      {
        id: 1, type: 'coins', read: false, time: "Aujourd'hui",
        title: "Streak 90 jours · +100 CC bonus 🏆",
        body: "3 mois sans pause ! Tu es officiellement queen capillaire.",
        route: '/rewards',
      },
      {
        id: 2, type: 'tip', read: false, time: "Hier",
        title: "Pense à mesurer ta pousse",
        body: "Tu n'as pas encore relevé tes cm — fais-le ce week-end pour suivre tes progrès.",
        route: '/(tabs)/growth',
      },
      {
        id: 3, type: 'routine', read: true, time: "Il y a 3 jours",
        title: "Wash day du dimanche",
        body: "Pense à ton bain d'huile la veille pour préparer tes longueurs.",
        route: '/(tabs)/routine',
      },
      {
        id: 4, type: 'promo', read: true, time: "Il y a 1 semaine",
        title: "Box du mois · Édition pousse",
        body: "Ta box pousse longueur est prête à être commandée (-20 % avec ton niveau Or).",
        route: '/box',
      },
      {
        id: 5, type: 'coins', read: true, time: "Il y a 2 semaines",
        title: "Streak 60 jours · +60 CC",
        body: "Régularité = résultats. Tu connais la chanson.",
        route: '/rewards',
      },
      {
        id: 6, type: 'system', read: true, time: "Il y a 3 mois",
        title: "Bienvenue chez Coton Noir ✨",
        body: "Ton parcours capillaire démarre aujourd'hui. On y va ensemble.",
        route: '/(tabs)',
      },
    ],
  },

  // ── Paula · 3 mois · 1500 CC · streak 90 · score ~45 · 1 washday ────────
  'pauleflora.kouame@gmail.com': {
    email: 'pauleflora.kouame@gmail.com',
    name: 'Paula',
    ageDays: 90,
    coins: 1500,
    totalEarned: 2200,
    streak: 90,
    washdaysThisMonth: 1,
    // 3 mesures "Devant" sur 3 mois → diff "Pousse ce mois" + 15 pts bonus
    // 13 profil + 20 streak + 15 growth = 48 (cible 45, écart +3)
    growth: [
      { daysAgo: 70, cm: 14.0 }, // -2 mois
      { daysAgo: 35, cm: 14.4 }, // mois précédent
      { daysAgo: 6,  cm: 14.7 }, // mois en cours
    ],
    profile: {
      name: 'Paula',
      hairType: '3C',
      length: 'Courts',
      // 7 champs vides → 2/9 → 13 pts (+ streak 20 + growth 15 = 48 ≈ 45)
      porosity: '',
      density: '',
      objective: '',
      targetLength: '',
      routineType: '',
      region: '',
      climate: '',
      budget: '',
      careStyle: 'diy',
      problematics: ['Sécheresse', 'Rétraction'],
    },
    avatar: { emoji: '✨', bg: '#1A4731' },
    protective: { active: true, type: 'Tresses' },
    notifs: [
      {
        id: 1, type: 'tip', read: false, time: "Il y a 1 h",
        title: "Mode protecteur · Hydratation des tresses",
        body: "Vaporise un mélange eau + glycérine 1 fois par jour pour garder tes longueurs souples.",
      },
      {
        id: 2, type: 'system', read: false, time: "Aujourd'hui",
        title: 'Complète ton profil pour +25 CC',
        body: "Il te manque ta porosité et ton objectif. 1 minute, gros impact sur le score.",
        route: '/hair-profile',
      },
      {
        id: 3, type: 'coins', read: false, time: "Hier",
        title: "Streak 90 jours 🏆 +100 CC",
        body: "Tu n'as pas raté un jour depuis l'inscription. Inarrêtable.",
        route: '/rewards',
      },
      {
        id: 4, type: 'routine', read: true, time: "Il y a 4 jours",
        title: "Wash day plus dur pour toi",
        body: "Tu n'as fait qu'un wash day ce mois — laisse pas filer la routine !",
        route: '/(tabs)/routine',
      },
      {
        id: 5, type: 'promo', read: true, time: "Il y a 2 semaines",
        title: "Tes 1500 CC peuvent partir en cadeau",
        body: "Catalogue de récompenses mis à jour — vois ce que tu peux débloquer.",
        route: '/rewards',
      },
      {
        id: 6, type: 'system', read: true, time: "Il y a 3 mois",
        title: "Bienvenue chez Coton Noir ✨",
        body: "Black Cotton va t'accompagner dans ta routine 3C.",
        route: '/(tabs)',
      },
    ],
  },
} : {};

// ─── Helpers publics ────────────────────────────────────────────────────────

export function isDemoEmail(email: string | undefined | null): boolean {
  if (!isDemoModeAvailable() || !email) return false;
  return Object.prototype.hasOwnProperty.call(
    DEMO_FIXTURES,
    email.toLowerCase().trim(),
  );
}

export function getDemoFixture(email: string): DemoFixture | null {
  return DEMO_FIXTURES[email.toLowerCase().trim()] ?? null;
}

export type DemoPopinVariant = 'premium';

/** Textes popin d’exemple (comptes démo — pas de paiement réel). */
export function getDemoPopinContent(
  email: string,
  variant: DemoPopinVariant,
): {
  label: string;
  title: string;
  body: string;
  ctaText: string;
  hint: string;
} | null {
  const fixture = getDemoFixture(email);
  if (!fixture) return null;

  if (variant === 'premium') {
    return {
      label: 'MODE DÉMO · PREMIUM',
      title: `Salut ${fixture.name}, ceci est un aperçu`,
      body:
        `Sur ce compte démo, aucun paiement n’est déclenché. Tu peux tester les offres annuelle (−67 %) et mensuelle, l’essai gratuit et le bouton « S’abonner » — tout reste simulé. Tes données (${fixture.coins} CC, streak ${fixture.streak} j) sont locales et ne partent pas sur la boutique.`,
      ctaText: 'Compris, continuer la démo ✓',
      hint: 'Abonnement simulé · aucun prélèvement',
    };
  }

  return null;
}

// ─── Builders internes ──────────────────────────────────────────────────────

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysAgoISO(n: number): string {
  return isoDate(new Date(Date.now() - n * 86400000));
}

/**
 * Construit un historique de CC réaliste réparti sur la vie du compte démo.
 * Mélange routines matin/soir, washdays, bonus de streak et ponctuels.
 */
function buildCoinHistory(fixture: DemoFixture): CoinHistoryEntry[] {
  const entries: CoinHistoryEntry[] = [];
  let id = Date.now();

  // Cap à 30 jours d'historique visible (les écrans n'affichent pas plus)
  const span = Math.min(fixture.ageDays, 30);

  for (let i = 1; i <= span; i++) {
    const dateISO = daysAgoISO(i);
    // Routine matin tous les jours, soir un jour sur deux
    entries.push({
      id: id++,
      label: 'Routine Matin complétée',
      amount: CC_ROUTINE_DAILY_NIGHT,
      date: dateISO,
    });
    if (i % 2 === 0) {
      entries.push({
        id: id++,
        label: 'Routine Soir complétée',
        amount: CC_ROUTINE_DAILY_NIGHT,
        date: dateISO,
      });
    }
  }

  // Washdays — environ un toutes les ~9 jours
  const washCount = Math.max(1, Math.floor(fixture.ageDays / 9));
  for (let i = 0; i < washCount; i++) {
    entries.push({
      id: id++,
      label: 'Routine Wash day complétée',
      amount: CC_ROUTINE_WASHDAY,
      date: daysAgoISO(i * 9 + 2),
    });
  }

  // Bonus de palier de streak (les paliers réellement atteints)
  if (fixture.streak >= 7) {
    entries.push({
      id: id++,
      label: 'Streak 7 jours 🔥',
      amount: CC_STREAK_BONUS_7,
      date: daysAgoISO(Math.max(1, fixture.streak - 7)),
    });
  }
  if (fixture.streak >= 30) {
    entries.push({
      id: id++,
      label: 'Streak 30 jours 🔥',
      amount: CC_STREAK_BONUS_30,
      date: daysAgoISO(Math.max(1, fixture.streak - 30)),
    });
  }
  if (fixture.streak >= 90) {
    entries.push({
      id: id++,
      label: 'Streak 90 jours 🔥',
      amount: CC_STREAK_BONUS_30,
      date: daysAgoISO(2),
    });
  }

  // Quelques bonus communauté pour Lola/Paula (vieux comptes)
  if (fixture.ageDays >= 60) {
    entries.push({
      id: id++,
      label: 'Bonus parrainage',
      amount: CC_REFERRAL_SIGNUP,
      date: daysAgoISO(12),
    });
    entries.push({
      id: id++,
      label: "Tutoriel terminé",
      amount: 20,
      date: daysAgoISO(18),
    });
  }

  // Tri du plus récent au plus ancien, on garde 40 entries max
  entries.sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return b.id - a.id;
  });
  return entries.slice(0, 40);
}

/**
 * Pose `washdaysThisMonth` wash days dans le passé du mois courant,
 * et ajoute un wash day futur (semaine prochaine) pour la section
 * « Prochain soin ».
 */
function buildPlannedSoins(fixture: DemoFixture): PlannedSoin[] {
  const result: PlannedSoin[] = [];
  let id = Date.now() + 100_000;

  const now = new Date();
  const todayDay = now.getDate(); // 1-31
  const year = now.getFullYear();
  const month = now.getMonth();

  // Si on est au début du mois et qu'on demande plus de washdays que de jours
  // déjà écoulés, on serre les dates.
  const maxPastDay = Math.max(1, todayDay - 1);
  const stepCount = Math.max(1, fixture.washdaysThisMonth);

  for (let i = 0; i < fixture.washdaysThisMonth; i++) {
    // Répartit les dates entre 1 et today-1
    const day = Math.max(
      1,
      Math.min(
        maxPastDay,
        Math.floor(((i + 0.5) * maxPastDay) / stepCount),
      ),
    );
    const d = new Date(year, month, day);
    result.push({
      id: id++,
      soinType: 'Wash day',
      date: isoDate(d),
    });
  }

  // Un soin futur (dans 6-7 jours) pour la card "Prochain soin"
  const upcoming = new Date(Date.now() + 6 * 86400000);
  result.push({
    id: id++,
    soinType: 'Wash day',
    date: isoDate(upcoming),
  });

  return result;
}

/**
 * Construit l'historique de pousse à partir de la liste explicite déclarée
 * dans la fixture. Par défaut chaque mesure est posée sur la zone "Devant"
 * (utilisée par la home et le chart de l'écran Pousse).
 */
function buildGrowthHistory(fixture: DemoFixture): GrowthEntry[] {
  let id = Date.now() + 200_000;
  // Tri du plus ancien au plus récent pour un historique chronologique propre
  const sorted = [...fixture.growth].sort((a, b) => b.daysAgo - a.daysAgo);
  return sorted.map(m => ({
    id: id++,
    date: daysAgoISO(Math.max(1, m.daysAgo)),
    zone: m.zone ?? 'Devant',
    cm: m.cm,
  }));
}

/**
 * Génère un AppState complet à partir d'une fixture. À fusionner avec
 * l'état local (routineSteps notamment) — voir AppContext.tsx.
 */
export function buildDemoAppState(
  fixture: DemoFixture,
  baseState: AppState,
): AppState {
  return {
    ...baseState,
    coins: fixture.coins,
    totalEarned: fixture.totalEarned,
    streak: fixture.streak,
    // Validation d'hier pour que le streak reste actif (sinon recalculé à 1)
    lastRoutineDate: daysAgoISO(1),
    // Date d'inscription (ageDays auparavant)
    memberSince: daysAgoISO(fixture.ageDays),
    profile: { ...fixture.profile },
    coinHistory: buildCoinHistory(fixture),
    plannedSoins: buildPlannedSoins(fixture),
    growthHistory: buildGrowthHistory(fixture),
    // Aujourd'hui démarre frais : la démo peut tap "valider" et voir les gains
    validated: { washday: false, daily: false, night: false },
  };
}

/**
 * Récupère les préférences (avatar + mode protecteur) à écrire dans
 * AsyncStorage sous la clé `@coton_noir_prefs`, pour que profile.tsx
 * et la home les affichent.
 */
export function buildDemoPrefs(fixture: DemoFixture): Record<string, unknown> {
  return {
    avatarEmoji:    fixture.avatar.emoji,
    avatarBg:       fixture.avatar.bg,
    avatarPhoto:    null,
    isProtective:   fixture.protective.active,
    protectiveType: fixture.protective.type ?? '',
    rappelHour:     19,
    rappelMin:      30,
    notifEnabled:   true,
    langue:         'Français',
  };
}

/** Notifications custom (sinon défaut vu dans NotificationsContext). */
export function getDemoNotifs(fixture: DemoFixture): Notif[] | null {
  return fixture.notifs ?? null;
}

// ─── Recettes démo ──────────────────────────────────────────────────────────
//
// Recettes fictives injectées uniquement pour les comptes démo (Britta, Lola,
// Paula) en plus de celles publiées dans Supabase. Le shape correspond à la
// table `recipes` (cf. app/recipes.tsx → type Recipe).

export type DemoRecipe = {
  id:          string;
  name:        string;
  description: string | null;
  category:    string | null;
  difficulty:  string;
  duration:    number | null;
  hair_types:  string[];
  ingredients: string[];
  steps:       string[];
  image:       string | null;
  likes:       number;
  created_at:  string;
};

export const DEMO_RECIPES: DemoRecipe[] = __DEV__ ? [
  {
    id:          'demo-recipe-masque-avocat-miel',
    name:        'Masque avocat-miel hydratant',
    description:
      "Masque ultra-nourrissant pour cheveux assoiffés. L'avocat apporte les bons gras, le miel scelle l'hydratation.",
    category:    'Masque',
    difficulty:  'Facile',
    duration:    30,
    hair_types:  ['3C', '4A', '4B', '4C'],
    ingredients: [
      '1 avocat bien mûr',
      '2 c. à soupe de miel liquide',
      '1 c. à soupe d\'huile de coco vierge',
      '2 c. à soupe de yaourt nature (facultatif)',
    ],
    steps: [
      'Écrase l\'avocat à la fourchette jusqu\'à obtenir une purée lisse, sans grumeaux.',
      'Ajoute le miel, l\'huile de coco fondue et le yaourt. Mélange bien.',
      'Applique sur cheveux humides, des racines aux pointes, en sections.',
      'Couvre d\'une charlotte ou d\'une serviette chaude. Laisse poser 20 min.',
      'Rince à l\'eau tiède, puis shampouine doucement.',
    ],
    image:      null,
    likes:      42,
    created_at: '2026-05-08T10:00:00.000Z',
  },
  {
    id:          'demo-recipe-lotion-tonique',
    name:        'Lotion tonique fraîcheur',
    description:
      'Spray rafraîchissant quotidien à base de thé vert et romarin. Réveille la fibre et hydrate sans alourdir.',
    category:    'Spray',
    difficulty:  'Facile',
    duration:    15,
    hair_types:  ['3A', '3B', '3C', '4A', '4B', '4C'],
    ingredients: [
      '200 ml de thé vert infusé puis refroidi',
      '1 branche de romarin frais',
      '1 c. à café de glycérine végétale',
      '2 c. à soupe d\'eau de rose',
      '3 gouttes d\'huile essentielle de menthe poivrée (facultatif)',
    ],
    steps: [
      'Infuse le thé vert 5 min avec le romarin frais, puis laisse refroidir complètement.',
      'Filtre l\'infusion dans un vaporisateur propre.',
      'Ajoute la glycérine, l\'eau de rose et l\'huile essentielle si tu en utilises.',
      'Secoue avant chaque utilisation. Vaporise sur cheveux humides ou secs, longueurs et pointes.',
      'Conserve au frigo et utilise dans les 5 jours.',
    ],
    image:      null,
    likes:      28,
    created_at: '2026-05-06T14:30:00.000Z',
  },
  {
    id:          'demo-recipe-prepoo',
    name:        'Prépoo huile chaude',
    description:
      'Soin pré-shampoing à l\'huile chaude. Protège la fibre du dessèchement du shampoing et facilite le démêlage.',
    category:    'Traitement',
    difficulty:  'Moyen',
    duration:    45,
    hair_types:  ['4A', '4B', '4C'],
    ingredients: [
      '3 c. à soupe d\'huile d\'olive vierge extra',
      '2 c. à soupe d\'huile de coco',
      '1 c. à soupe d\'huile de ricin',
      '1 c. à café de miel',
    ],
    steps: [
      'Dans un bol résistant à la chaleur, mélange toutes les huiles avec le miel.',
      'Chauffe au bain-marie 2-3 min, jusqu\'à ce que le mélange soit tiède (pas brûlant).',
      'Sépare tes cheveux en 4 sections sur cheveux secs.',
      'Applique l\'huile section par section, du cuir chevelu aux pointes. Masse 5 min.',
      'Couvre d\'une charlotte et laisse poser 30 min (ou toute la nuit pour plus d\'efficacité).',
      'Procède à ton shampoing habituel ensuite.',
    ],
    image:      null,
    likes:      57,
    created_at: '2026-05-02T09:15:00.000Z',
  },
] : [];

/**
 * Retourne les recettes démo si l'email correspond à un compte démo, sinon
 * un tableau vide. À fusionner avec les recettes publiées côté Supabase.
 */
export function getDemoRecipes(email: string | undefined | null): DemoRecipe[] {
  return isDemoEmail(email) ? DEMO_RECIPES : [];
}

// ─── Articles démo ──────────────────────────────────────────────────────────
//
// Articles éditoriaux fictifs (par des pros) injectés uniquement pour les
// comptes démo. Même shape que la table Supabase `articles`.

export type DemoArticle = {
  id:             string;
  title:          string;
  subtitle:       string | null;
  body:           string;
  category:       string | null;
  image:          string | null;
  read_time:      number;
  author_name:    string;
  author_role:    string;
  author_avatar:  string | null;
  author_contact: string;
  is_sponsored:   boolean;
  sponsor_brand:  string | null;
  likes:          number;
  created_at:     string;
};

export const DEMO_ARTICLES: DemoArticle[] = __DEV__ ? [
  {
    id:        'demo-article-trichologue-pousse',
    title:     "5 erreurs qui freinent la pousse de tes cheveux",
    subtitle:  "Notre trichologue partage les pièges les plus courants à éviter.",
    body:
      "La pousse capillaire dépend de bien plus que de la génétique. En consultation, je vois revenir les mêmes 5 erreurs qui sabotent les efforts de mes patientes.\n\n" +
      "**1. Sur-shampouiner.** Laver tes cheveux 3 fois par semaine quand tu as des cheveux crépus, c'est trop. Ça décape le sébum protecteur et fragilise les longueurs. 1 fois par semaine est largement suffisant pour la plupart des textures 4.\n\n" +
      "**2. Oublier le scalp.** Tu mets du leave-in sur les longueurs mais le cuir chevelu reste sec ? La pousse vient de la racine. Masse 5 min par jour avec une huile légère (jojoba, brocoli) pour stimuler la circulation.\n\n" +
      "**3. Tirer trop fort.** Les coiffures protectrices sont géniales — sauf quand elles sont trop tendues. Si ça pique en sortant du salon, c'est déjà trop. Demande à ta coiffeuse de relâcher la traction.\n\n" +
      "**4. Skipper le pré-poo.** Un soin avant shampoing protège la fibre du dessèchement. 15-30 min d'huile chaude avant le lavage = jeu, set et match.\n\n" +
      "**5. Ne pas trim assez.** Couper 0,5 cm tous les 3-4 mois ne ralentit pas la pousse — ça l'accélère, en éliminant les fourches qui remontent et cassent la fibre.\n\n" +
      "Si tu coches 2 ou 3 erreurs sur cette liste, pas de panique : un audit de ta routine sur 2 mois suffit pour voir la différence.",
    category:       'Pousse',
    image:          null,
    read_time:      6,
    author_name:    'Dr. Nadia Sangaré',
    author_role:    'Trichologue',
    author_avatar:  null,
    author_contact: 'contact@trichologie-paris.fr',
    is_sponsored:   false,
    sponsor_brand:  null,
    likes:          124,
    created_at:     '2026-05-09T11:00:00.000Z',
  },
  {
    id:        'demo-article-coiffeuse-tresses',
    title:     "Tresses : combien de temps les garder pour préserver tes cheveux",
    subtitle:  "Les bons gestes pour profiter du mode protecteur sans casse.",
    body:
      "Les tresses sont l'arme secrète des cheveux crépus pour pousser tranquillement. Mais mal utilisées, elles font plus de mal que de bien.\n\n" +
      "**Durée idéale.** Pour des tresses simples (box braids, knotless), 6 à 8 semaines est le max. Au-delà, les pointes commencent à se feutrer et la repousse à s'emmêler à la base.\n\n" +
      "**Twists et locks temporaires.** 4 à 6 semaines suffisent. Le poids plus léger les rend plus douces pour les racines, mais elles se défont plus vite.\n\n" +
      "**Pendant le port.** Hydrate 2 fois par semaine avec un spray à base d'eau et glycérine. Couvre la nuit avec un foulard en satin. Évite les queues de cheval trop hautes qui tirent sur les tempes.\n\n" +
      "**À la sortie.** Démêle TOUJOURS sur cheveux humides, en sections, avec ton conditioner. Une masque protéiné après dépose est un must pour réparer.\n\n" +
      "Astuce de coiffeuse : laisse passer 7-10 jours minimum entre deux poses de tresses pour donner aux cheveux le temps de respirer.",
    category:       'Mode protecteur',
    image:          null,
    read_time:      4,
    author_name:    'Mariam K.',
    author_role:    'Coiffeuse',
    author_avatar:  null,
    author_contact: '@mariam.tresses',
    is_sponsored:   true,
    sponsor_brand:  'Cantu',
    likes:          87,
    created_at:     '2026-05-07T08:30:00.000Z',
  },
  {
    id:        'demo-article-coach-mindset',
    title:     "Mindset capillaire : arrêter de comparer tes cheveux à ceux des autres",
    subtitle:  "Les conseils d'une coach pour cultiver l'amour de tes textures.",
    body:
      "Les réseaux sociaux ont créé une nouvelle pression : celle d'avoir des cheveux \"goals\". Mais qu'est-ce qu'on poursuit vraiment ?\n\n" +
      "**La comparaison vole la joie.** Chaque tête est unique. Type, densité, porosité, héritage génétique, climat — tout ça compose un cocktail qu'aucune routine miracle ne peut copier d'une influenceuse à toi.\n\n" +
      "**Apprends ta texture.** Plutôt que de viser des boucles 3B parfaites quand tu as un 4B, prends 4 semaines à observer comment TES cheveux réagissent à chaque produit, chaque méthode. C'est ça la base d'une routine qui marche.\n\n" +
      "**Le journaling capillaire.** Note 3 choses par semaine : ce que tu as fait, comment tes cheveux ont réagi, ce que tu ressens. En 2 mois, tu auras une map précise de ta texture.\n\n" +
      "**Célèbre les petites victoires.** Une mèche moins sèche, un démêlage plus rapide, moins de casse au shampoing. C'est ça les vrais signes que tu progresses, pas la longueur sur la photo Instagram.\n\n" +
      "Ton coton noir n'a pas besoin d'être autre chose qu'il n'est. Il a juste besoin que tu l'écoutes.",
    category:       'Wellness',
    image:          null,
    read_time:      5,
    author_name:    'Aïcha Diallo',
    author_role:    'Coach capillaire',
    author_avatar:  null,
    author_contact: 'aicha@cotoncoach.com',
    is_sponsored:   false,
    sponsor_brand:  null,
    likes:          203,
    created_at:     '2026-05-04T16:15:00.000Z',
  },
] : [];

export function getDemoArticles(email: string | undefined | null): DemoArticle[] {
  return isDemoEmail(email) ? DEMO_ARTICLES : [];
}

// ─── Produits démo ──────────────────────────────────────────────────────────
//
// Sélection de produits fictifs partagés par tous les comptes démo. Ils sont
// pensés pour matcher les problématiques de Britta/Lola (Sécheresse, Casse,
// Nœuds, Fourches…) afin que le carrousel "Pour tes besoins" + le carrousel
// "Produits recommandés" se remplissent automatiquement, même si la table
// `products` côté Supabase est encore vide.

export type DemoProduct = {
  id:           string;
  name:         string;
  brand:        string;
  category:     string;
  tags:         string[];
  description:  string;
  price_cents:  number;
  currency:     string;
  image:        string | null;
  url:          string | null;
  rating:       number;
  rating_count: number;
};

// `category` utilise les IDs courts du shop (`mask`, `sham`, `oil`, `style`,
// `compl`) pour que les produits apparaissent sous les bons filtres dans
// `app/shop.tsx`. Les `tags` restent en mots-clés français pour le scoring.
export const DEMO_PRODUCTS: DemoProduct[] = __DEV__ ? [
  {
    id:    'demo-prod-mask-avocat-deep',
    name:  'Masque hydratant intense Avocat',
    brand: 'Cantu',
    category: 'mask',
    tags: ['hydratation', 'masque', 'sécheresse', 'avocat', 'leave-in'],
    description: "Masque ultra-nourrissant à l'huile d'avocat et beurre de karité. Restaure l'hydratation des longueurs assoiffées et scelle la fibre.",
    price_cents: 1290, currency: 'EUR',
    image: 'https://images.unsplash.com/photo-1631730486572-226d1f595b68?w=600',
    url: 'https://www.cantubeauty.com/',
    rating: 4.6, rating_count: 238,
  },
  {
    id:    'demo-prod-leave-in-coco',
    name:  'Leave-in crème hydratante Coco',
    brand: 'SheaMoisture',
    category: 'sham',
    tags: ['leave-in', 'hydratation', 'démêlant', 'coco', 'crème'],
    description: "Crème leave-in à l'eau de coco. Hydrate, démêle et apporte de la définition aux boucles 3C/4C.",
    price_cents: 1450, currency: 'EUR',
    image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600',
    url: 'https://www.sheamoisture.com/',
    rating: 4.5, rating_count: 412,
  },
  {
    id:    'demo-prod-protein-spray',
    name:  'Spray protéiné réparateur',
    brand: 'Aphogee',
    category: 'mask',
    tags: ['protéine', 'fortifiant', 'casse', 'réparateur', 'spray'],
    description: "Spray fortifiant aux protéines de soie. Renforce la fibre fragilisée par les coiffures protectrices et limite la casse.",
    price_cents: 1690, currency: 'EUR',
    image: 'https://images.unsplash.com/photo-1597854407453-8c3c46be0c7d?w=600',
    url: 'https://aphogee.com/',
    rating: 4.7, rating_count: 156,
  },
  {
    id:    'demo-prod-conditioner-glisse',
    name:  'Conditioner démêlant glissant',
    brand: 'Mielle',
    category: 'sham',
    tags: ['conditioner', 'démêlant', 'glisse', 'après-shampoing', 'nœuds'],
    description: "Après-shampoing à la mangue qui démêle les nœuds rebelles sans casse. Glisse facile sur cheveux mouillés.",
    price_cents: 1190, currency: 'EUR',
    image: 'https://images.unsplash.com/photo-1574180566232-aaad1b5b8450?w=600',
    url: 'https://mielleorganics.com/',
    rating: 4.4, rating_count: 287,
  },
  {
    id:    'demo-prod-serum-pointes',
    name:  'Sérum sealant anti-fourches',
    brand: 'Camille Rose',
    category: 'style',
    tags: ['sérum', 'sealant', 'fourches', 'pointes', 'sealing'],
    description: "Sérum léger qui scelle les pointes et prévient les fourches. À appliquer après hydratation pour finir la routine LOC/LCO.",
    price_cents: 1890, currency: 'EUR',
    image: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600',
    url: 'https://www.camillerose.com/',
    rating: 4.8, rating_count: 94,
  },
  {
    id:    'demo-prod-beurre-karite',
    name:  'Beurre de karité brut',
    brand: 'AfroAnit',
    category: 'oil',
    tags: ['beurre', 'karité', 'hydratation', 'sealing', 'longueur'],
    description: "Beurre de karité 100% naturel non raffiné. Idéal pour sceller l'hydratation et étirer la définition sur cheveux crépus.",
    price_cents: 990, currency: 'EUR',
    image: 'https://images.unsplash.com/photo-1599492816471-21d72c1e3f87?w=600',
    url: 'https://www.afroanit.com/',
    rating: 4.6, rating_count: 521,
  },
  {
    id:    'demo-prod-gel-definition',
    name:  'Gel coiffant définition boucle',
    brand: 'Eco Styler',
    category: 'style',
    tags: ['gel', 'définition', 'curl', 'boucle', 'rétraction'],
    description: "Gel coiffant qui définit la boucle et étire le cheveu sans alourdir. Tenue longue durée sans effet carton.",
    price_cents: 690, currency: 'EUR',
    image: 'https://images.unsplash.com/photo-1626120032630-b51c96a544a3?w=600',
    url: 'https://www.ecostyler.com/',
    rating: 4.3, rating_count: 632,
  },
  {
    id:    'demo-prod-huile-ricin',
    name:  'Huile de ricin pressée à froid',
    brand: 'CN Naturels',
    category: 'oil',
    tags: ['huile', 'ricin', 'pousse', 'scalp', 'cuir chevelu'],
    description: "Huile de ricin pressée à froid. Stimule le cuir chevelu, fortifie les longueurs et booste la pousse en massage.",
    price_cents: 1290, currency: 'EUR',
    image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600',
    url: 'https://www.cotonnoir.com/',
    rating: 4.7, rating_count: 348,
  },
] : [];

export function getDemoProducts(email: string | undefined | null): DemoProduct[] {
  return isDemoEmail(email) ? DEMO_PRODUCTS : [];
}

export function getDemoProductById(productId: string): DemoProduct | undefined {
  if (!isDemoModeAvailable() || !productId.startsWith('demo-prod-')) return undefined;
  return DEMO_PRODUCTS.find(p => p.id === productId);
}
