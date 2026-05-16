import {
  CC_REFERRAL_SIGNUP,
  CC_ROUTINE_DAILY_NIGHT,
  CC_ROUTINE_WASHDAY,
  CC_STREAK_BONUS_30,
  CC_STREAK_BONUS_7,
  CC_PROFILE_COMPLETE,
  PTS_ROUTINE_DAILY_NIGHT,
  PTS_ROUTINE_WASHDAY,
} from '../lib/cotonCoins';

export const REWARDS = [
  { id: 1, emoji: '🏷️', name: 'Code -5% partenaire',      cost: 200,  locked: false },
  { id: 2, emoji: '🚚', name: 'Livraison offerte',          cost: 300,  locked: false },
  { id: 3, emoji: '📦', name: 'Produit découverte offert',  cost: 500,  locked: false },
  { id: 4, emoji: '🏷️', name: 'Code -15% partenaire',      cost: 750,  locked: false },
  { id: 5, emoji: '🫧', name: 'Mini Masque Karité',         cost: 900,  locked: false },
  { id: 6, emoji: '📦', name: 'Box capillaire surprise',    cost: 1200, locked: true  },
];

export const EARN_WAYS = [
  { emoji: '✅', name: 'Routine daily / night',     freq: 'Quotidien',       amountCc: CC_ROUTINE_DAILY_NIGHT, amountPts: PTS_ROUTINE_DAILY_NIGHT },
  { emoji: '💧', name: 'Wash day complet',          freq: 'Par wash day',    amountCc: CC_ROUTINE_WASHDAY,    amountPts: PTS_ROUTINE_WASHDAY },
  { emoji: '🔥', name: 'Streak 7 jours',            freq: 'Bonus hebdo',     amountCc: CC_STREAK_BONUS_7 },
  { emoji: '🔥', name: 'Streak 30 jours',           freq: 'Bonus mensuel',   amountCc: CC_STREAK_BONUS_30 },
  { emoji: '👤', name: 'Profil complété à 100%',    freq: 'Une fois',        amountCc: CC_PROFILE_COMPLETE },
  { emoji: '🎁', name: 'Inviter une amie',          freq: 'Par inscription', amountCc: CC_REFERRAL_SIGNUP },
];
