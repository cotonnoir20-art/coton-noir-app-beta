import type { AvatarExpression } from '../BlackCottonAvatar';
import type { BlackCottonMood, BlackCottonTrigger, DisplayMode, FloatingMessage } from './types';

// ── Mood → Avatar expression mapping ───────────────────────────────────────
export const MOOD_TO_EXPRESSION: Record<BlackCottonMood, AvatarExpression> = {
  happy:       'happy',
  proud:       'celebrating',
  celebrating: 'celebrating',
  thinking:    'thinking',
  encouraging: 'tip',
  surprised:   'happy',
  playful:     'happy',
  coaching:    'tip',
};

// ── Mood → accent background color ─────────────────────────────────────────
export const MOOD_ACCENT: Record<BlackCottonMood, string> = {
  happy:       '#FDE8C8',
  proud:       '#F2C4CC',
  celebrating: '#F2C4CC',
  thinking:    '#E2EDD8',
  encouraging: '#FDE8C8',
  surprised:   '#FDE8C8',
  playful:     '#F2C4CC',
  coaching:    '#FAF3EC',
};

interface MessageVariant {
  text: string;
  subtext?: string;
  mood: BlackCottonMood;
}

export interface TriggerConfig {
  messages: MessageVariant[];
  displayMode: DisplayMode;
  priority: 1 | 2 | 3;
  duration: number;   // ms for auto-dismiss, 0 = manual
  cooldown: number;   // ms before same trigger can fire again
  once?: boolean;     // store in AsyncStorage, never repeat
}

// ── Per-trigger message variants and behaviour ──────────────────────────────
export const TRIGGER_CONFIGS: Record<BlackCottonTrigger, TriggerConfig> = {

  first_login: {
    messages: [{
      text: 'Bienvenue chez Coton Noir ✨',
      subtext: "Je suis Black Cotton, ta coach capillaire personnelle. Ensemble on va sublimer tes cheveux !",
      mood: 'happy',
    }],
    displayMode: 'popup',
    priority: 1,
    duration: 0,
    cooldown: Infinity,
    once: true,
  },

  onboarding_gift: {
    messages: [{
      text: 'Cadeau de bienvenue 🎁',
      subtext: '+50 CotonCoins offerts pour démarrer ta routine. Utilise-les dans Récompenses !',
      mood: 'celebrating',
    }],
    displayMode: 'popup',
    priority: 1,
    duration: 0,
    cooldown: Infinity,
    once: true,
  },

  onboarding_step: {
    messages: [
      { text: "C'est parti ! 🌱",        subtext: "Quelques questions pour personnaliser ton expérience.", mood: 'encouraging' },
      { text: "Super, on avance ! 💪",    subtext: "Plus je te connais, mieux je peux t'aider.",           mood: 'happy'       },
      { text: "Tu es presque arrivée ✨", subtext: "Encore un effort, ça va vraiment valoir le coup !",    mood: 'playful'     },
      { text: "Dis-moi tout sur toi 💜",  subtext: "Ces infos vont transformer tes recommandations.",      mood: 'coaching'    },
    ],
    displayMode: 'toast',
    priority: 2,
    duration: 4000,
    cooldown: 0,
  },

  first_routine: {
    messages: [
      { text: 'Félicitations ! 🖤', subtext: 'Ta première routine est enregistrée. Tes cheveux te disent merci ✨', mood: 'celebrating' },
      { text: "C'est un grand jour ! 🎉",     subtext: "Ta routine capillaire démarre. Je suis tellement fière de toi !",    mood: 'proud'       },
    ],
    displayMode: 'popup',
    priority: 1,
    duration: 0,
    cooldown: 1000 * 60 * 60 * 24 * 7,
  },

  profile_completed: {
    messages: [{
      text: "Profil complet ! 🌟",
      subtext: "Je peux maintenant te donner des recommandations ultra-personnalisées.",
      mood: 'proud',
    }],
    displayMode: 'popup',
    priority: 1,
    duration: 0,
    cooldown: Infinity,
    once: true,
  },

  badge_unlocked: {
    messages: [
      { text: "Nouveau badge débloqué ! 🏆", subtext: "Tu gères comme une queen 👑",                             mood: 'celebrating' },
      { text: "Badge gagné ! ⭐",            subtext: "Chaque badge témoigne de ta progression. Continue !",     mood: 'proud'       },
      { text: "Incroyable ! 🎊",             subtext: "Un nouveau badge dans ta collection. Tu m'impressionnes !", mood: 'celebrating' },
    ],
    displayMode: 'toast',
    priority: 1,
    duration: 5000,
    cooldown: 1000 * 60 * 60,
  },

  streak_7_days: {
    messages: [
      { text: "7 jours de suite ! 🔥",      subtext: "Ta régularité est la clé de la santé capillaire. Bravo !",          mood: 'proud'       },
      { text: "Une semaine sans faille ! 💪", subtext: "Hydratation + patience = résultats. Tu es sur la bonne voie !",    mood: 'encouraging' },
    ],
    displayMode: 'popup',
    priority: 1,
    duration: 0,
    cooldown: 1000 * 60 * 60 * 24 * 30,
  },

  streak_30_days: {
    messages: [{
      text: "30 jours ! Tu es une QUEEN 👑",
      subtext: "Un mois de régularité, c'est exceptionnel. Tes cheveux s'en souviennent pour toujours !",
      mood: 'celebrating',
    }],
    displayMode: 'popup',
    priority: 1,
    duration: 0,
    cooldown: Infinity,
  },

  washday_added: {
    messages: [
      { text: "Wash day enregistré ! 🧴", subtext: "Prends soin de toi ♡ Tes cheveux méritent cet amour.",         mood: 'happy'       },
      { text: "Jour de soin noté ! ✨",   subtext: "Régularité = résultats. Tu sais exactement comment faire !",    mood: 'encouraging' },
      { text: "Soin enregistré 💧",       subtext: "Hydratation, patience et amour. Tes cheveux te diront merci.",  mood: 'coaching'    },
    ],
    displayMode: 'toast',
    priority: 3,
    duration: 3500,
    cooldown: 1000 * 60 * 60 * 24,
  },

  hair_growth_progress: {
    messages: [
      { text: "Tes cheveux poussent ! 🌱", subtext: "La croissance est là. Continue comme ça, on est sur la bonne route !", mood: 'proud'       },
      { text: "Belle progression ! 📏",    subtext: "Chaque centimètre est une victoire. Je suis fière de toi !",           mood: 'celebrating' },
    ],
    displayMode: 'popup',
    priority: 2,
    duration: 0,
    cooldown: 1000 * 60 * 60 * 24 * 14,
  },

  inactivity: {
    messages: [
      { text: "Tes cheveux te manquent 💜",  subtext: "Ça fait quelques jours… reprends ta routine, tu vas voir la différence !", mood: 'thinking'    },
      { text: "Je t'ai cherchée 🥺",         subtext: "Reviens ! On a tellement de choses à faire ensemble pour tes cheveux.",   mood: 'surprised'   },
      { text: "Petit rappel douceur 🌸",      subtext: "L'hydratation ça s'entretient. Même 5 minutes font la différence !",     mood: 'encouraging' },
    ],
    displayMode: 'toast',
    priority: 2,
    duration: 4000,
    cooldown: 1000 * 60 * 60 * 24 * 2,
  },

  pantry_filled: {
    messages: [{
      text: "Ta garde-robe capillaire est prête ! 🧴",
      subtext: "Je vais adapter toutes mes recommandations à ce que tu as déjà chez toi.",
      mood: 'coaching',
    }],
    displayMode: 'toast',
    priority: 2,
    duration: 4000,
    cooldown: 1000 * 60 * 60 * 24 * 30,
  },

  protective_mode_on: {
    messages: [{
      text: "Mode protecteur activé ! 🛡️",
      subtext: "Ta coiffure protectrice, c'est la meilleure décision pour tes cheveux. Je m'adapte !",
      mood: 'encouraging',
    }],
    displayMode: 'toast',
    priority: 2,
    duration: 4000,
    cooldown: 1000 * 60 * 60 * 24 * 7,
  },

  post_routine: {
    messages: [],
    displayMode: 'toast',
    priority: 2,
    duration: 5000,
    cooldown: 1000 * 60 * 60 * 4,
  },

  post_analysis: {
    messages: [],
    displayMode: 'popup',
    priority: 1,
    duration: 0,
    cooldown: 1000 * 60 * 60 * 24 * 3,
  },

  post_measurement: {
    messages: [],
    displayMode: 'popup',
    priority: 2,
    duration: 0,
    cooldown: 1000 * 60 * 60 * 24 * 7,
  },

  manual: {
    messages: [],
    displayMode: 'toast',
    priority: 2,
    duration: 4000,
    cooldown: 0,
  },
};

// Rotation index tracker (index into messages[] per trigger, to avoid repetition)
export const MESSAGE_ROTATION: Partial<Record<BlackCottonTrigger, number>> = {};

// ── System limits ───────────────────────────────────────────────────────────
export const MAX_DAILY_MESSAGES = 8;
export const MIN_BETWEEN_ANY_MS = 30_000; // min 30s between any two messages

// ── Floating button tip messages ────────────────────────────────────────────
export const FLOATING_MESSAGES: FloatingMessage[] = [
  { text: "Besoin d'un conseil ? Je suis là ! 💜",              mood: 'coaching'    },
  { text: "Prends soin de toi aujourd'hui 🌸",                   mood: 'encouraging' },
  { text: "Hydratation + patience = résultats 💧",               mood: 'happy'       },
  { text: "Tu es sur la bonne voie, continue ! ✨",              mood: 'proud'       },
  { text: "Dis-moi tout, je suis là pour toi 🤍",               mood: 'happy'       },
  { text: "N'oublie pas de sceller ton hydratation ! 🧴",        mood: 'coaching'    },
  { text: "Tes cheveux méritent cet amour ♡",                   mood: 'playful'     },
  { text: "Régularité + bienveillance = cheveux sublimes 🌿",   mood: 'coaching'    },
];

// ── Coach cards for embedding in screens ────────────────────────────────────
export const HOME_COACH_MESSAGES: MessageVariant[] = [
  { text: "Commence par enregistrer ton premier soin 🌱", subtext: "Une routine bien documentée te donnera des résultats visibles en 8 semaines.", mood: 'encouraging' },
  { text: "Pense à hydrater aujourd'hui 💧",              subtext: "Tes cheveux crépus ont besoin d'hydratation quotidienne pour rester souples.",  mood: 'coaching'    },
  { text: "Bienvenue chez Coton Noir ✨",                  subtext: "Je suis Black Cotton et je vais t'accompagner à chaque étape de ton parcours.", mood: 'happy'       },
];
