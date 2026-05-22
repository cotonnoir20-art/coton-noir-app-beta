/**
 * CotonCoins — équivalence indicative affichée dans l’app.
 * 1500 CC ≈ 1,50 € ⇒ 1000 CC ≈ 1 € (0,001 € / CC).
 * Monnaie virtuelle : pas de valeur fiduciaire contractuelle ; l’équivalent sert au repère mental.
 */
export const CC_PER_EUR = 1000;

export function ccToApproxEur(coins: number): number {
  return coins / CC_PER_EUR;
}

/** Affichage type « 1,50 » pour texte « ≈ x,xx € ». */
export function formatApproxEurCc(coins: number): string {
  return ccToApproxEur(coins).toFixed(2).replace('.', ',');
}

// ── Grille de gains (montants en CC ; l’équivalent € reste indicatif via CC_PER_EUR) ──

/** Routine matin / soir validée (1× par jour par type). */
export const CC_ROUTINE_VALIDATION_REWARD = 10;
/** Alias : routine matin / soir validée */
export const CC_ROUTINE_DAILY_NIGHT = CC_ROUTINE_VALIDATION_REWARD;
/** Wash day complet (onglet Routine ou écran Wash day terminé, 1× / jour). */
export const CC_ROUTINE_WASHDAY = 30;
/** Crédité une fois par jour quand le wash day est effectué. */
export const CC_WASHDAY_COMPLETE = CC_ROUTINE_WASHDAY;

/** Points cumulés — routine matin / soir validée. */
export const PTS_ROUTINE_DAILY_NIGHT = 5;
/** Points cumulés — wash day complet. */
export const PTS_ROUTINE_WASHDAY = 10;
export const PTS_WASHDAY_COMPLETE = PTS_ROUTINE_WASHDAY;
/** Bonus automatique streak 7 jours */
export const CC_STREAK_BONUS_7 = 30;
/** Bonus automatique streak 30 jours */
export const CC_STREAK_BONUS_30 = 50;
/** Analyse capillaire complète (1× logique côté UX) */
export const CC_ANALYSIS_COMPLETE = 10;
/** Points cumulés — analyse complète. */
export const PTS_ANALYSIS_COMPLETE = 10;
/** Filleule qui active un code parrain + marraine */
export const CC_REFERRAL_SIGNUP = 50;
/** Nombre max de filleules rémunérées pour une marraine (plafond CC). */
export const REFERRAL_MAX_REFEREES = 10;
/** Plafond CC parrainage marraine (= REFERRAL_MAX_REFEREES × CC_REFERRAL_SIGNUP). */
export const REFERRAL_MAX_CC_EARNED = REFERRAL_MAX_REFEREES * CC_REFERRAL_SIGNUP;
/** Crédit d’accueil à l’inscription */
export const CC_ONBOARDING_GIFT = 50;
export const ONBOARDING_GIFT_LABEL = 'Bienvenue sur Coton Noir 🎉';

export function hasOnboardingGiftInHistory(
  history: ReadonlyArray<{ label: string; amount: number }>,
): boolean {
  return history.some(
    e =>
      e.amount === CC_ONBOARDING_GIFT &&
      (e.label === ONBOARDING_GIFT_LABEL || e.label.includes('Bienvenue sur Coton Noir')),
  );
}

/** Clé AsyncStorage : bonus d’accueil à appliquer au premier chargement après inscription. */
export const PENDING_ONBOARDING_GIFT_KEY = '@coton_noir_pending_onboarding_gift';

export type CoinHistoryLike = { id: number | string; label: string; amount: number; date: string };

/** Garantit 50 CC si le solde serveur est encore à 0 (même si l’historique « Bienvenue » existe déjà). */
export function ensureOnboardingWallet(args: {
  coins: number;
  totalEarned: number;
  coinHistory: ReadonlyArray<CoinHistoryLike>;
}): {
  coins: number;
  totalEarned: number;
  coinHistory: CoinHistoryLike[];
  granted: boolean;
} {
  const coins = Math.max(0, Math.round(Number(args.coins) || 0));
  const totalEarned = Math.max(0, Math.round(Number(args.totalEarned) || 0));
  let history = [...args.coinHistory];

  if (coins >= CC_ONBOARDING_GIFT) {
    return { coins, totalEarned, coinHistory: history, granted: false };
  }

  const alreadyWelcomed = hasOnboardingGiftInHistory(history);
  const hasSpentCoins = history.some(e => e.amount < 0);
  if (alreadyWelcomed && hasSpentCoins) {
    return { coins, totalEarned, coinHistory: history, granted: false };
  }

  const today = new Date().toISOString().slice(0, 10);
  if (!alreadyWelcomed) {
    history = [
      { id: Date.now(), label: ONBOARDING_GIFT_LABEL, amount: CC_ONBOARDING_GIFT, date: today },
      ...history,
    ];
  }

  return {
    coins: CC_ONBOARDING_GIFT,
    totalEarned: Math.max(totalEarned, CC_ONBOARDING_GIFT),
    coinHistory: history,
    granted: true,
  };
}
/** Profil complété à 100 % (bonus ponctuel, si implémenté côté produit) */
export const CC_PROFILE_COMPLETE = 25;

/** Affichage monnaie (portefeuille, niveaux, catalogue). */
export function formatCc(amount: number): string {
  return `${amount} CC`;
}

export function formatCcSigned(amount: number): string {
  return `${amount > 0 ? '+' : ''}${amount} CC`;
}

/** Points cumulés — progression de niveau (ne baissent pas quand tu dépenses des CC). */
export function formatPoints(amount: number): string {
  const n = Math.max(0, Math.round(amount));
  return `${n.toLocaleString('fr-FR')} pts`;
}

export function formatPointsSigned(amount: number): string {
  const n = Math.round(amount);
  return `${n > 0 ? '+' : ''}${n.toLocaleString('fr-FR')} pts`;
}

/** Libellé double gain (CC + points cumulés, montants indépendants). */
export function formatDualEarnReward(cc: number, pts: number): string {
  return `${formatCcSigned(cc)} · ${formatPointsSigned(pts)}`;
}

export function getRoutineValidationRewards(routineType: 'washday' | 'daily' | 'night'): {
  cc: number;
  pts: number;
} {
  if (routineType === 'washday') {
    return { cc: CC_WASHDAY_COMPLETE, pts: PTS_WASHDAY_COMPLETE };
  }
  return { cc: CC_ROUTINE_VALIDATION_REWARD, pts: PTS_ROUTINE_DAILY_NIGHT };
}
