import {
  areAllPremiumFeaturesReady,
  getPendingPremiumFeatures,
  PREMIUM_FEATURE_LABELS,
  type PremiumFeatureKey,
} from '../constants/premiumCatalog';
import { isRevenueCatConfigured } from './revenueCat';

/** QA interne : bypass catalogue (dev build uniquement, jamais en prod stores :
 * EXPO_PUBLIC_PREMIUM_PURCHASES_FORCE=true). */
function isForcePurchasesEnv(): boolean {
  return (
    typeof process !== 'undefined' &&
    process.env?.EXPO_PUBLIC_PREMIUM_PURCHASES_FORCE === 'true'
  );
}

/**
 * Paiements autorisés (bouton S'abonner, checkout RevenueCat / web).
 * FALSE tant que toutes les features Premium ne sont pas prêtes.
 */
export function isPremiumPurchasesEnabled(): boolean {
  if (isForcePurchasesEnv()) return true;
  return areAllPremiumFeaturesReady();
}

export function getPremiumPurchasesBlockReason(): string | null {
  if (isPremiumPurchasesEnabled()) return null;

  const pending = getPendingPremiumFeatures();
  if (pending.length > 0) {
    const labels = pending.slice(0, 3).map(k => PREMIUM_FEATURE_LABELS[k]);
    const extra = pending.length > 3 ? ` (+${pending.length - 3} autres)` : '';
    return `Premium arrive bientôt — en cours : ${labels.join(', ')}${extra}.`;
  }

  return 'Les abonnements Premium ne sont pas encore disponibles.';
}

export function canStartNativePurchase(): boolean {
  return isPremiumPurchasesEnabled() && isRevenueCatConfigured();
}

export function canStartWebCheckout(): boolean {
  if (!isPremiumPurchasesEnabled()) return false;
  const url =
    typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_PREMIUM_CHECKOUT_URL;
  return typeof url === 'string' && !!url.trim();
}

export function listPendingFeatureLabels(limit = 5): string[] {
  return getPendingPremiumFeatures()
    .slice(0, limit)
    .map((k: PremiumFeatureKey) => PREMIUM_FEATURE_LABELS[k]);
}
