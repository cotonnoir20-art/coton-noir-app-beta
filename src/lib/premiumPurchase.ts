import { Alert, Platform } from 'react-native';
import Constants from 'expo-constants';
import type { PremiumPlanId } from './premiumPlans';
import {
  canStartNativePurchase,
  canStartWebCheckout,
  getPremiumPurchasesBlockReason,
  isPremiumPurchasesEnabled,
} from './premiumPaymentsGate';
import {
  isRevenueCatConfigured,
  purchasePremiumPackage,
  restoreRevenueCatPurchases,
} from './revenueCat';
import { openSafeUrl, validateExternalUrl } from './safeLinking';

export type PremiumCheckoutResult =
  | { ok: true; channel: 'revenuecat' | 'web' }
  | { ok: false; error: string; cancelled?: boolean };

function readCheckoutUrl(): string | null {
  const fromEnv =
    typeof process !== 'undefined' &&
    process.env?.EXPO_PUBLIC_PREMIUM_CHECKOUT_URL;
  const extra = Constants.expoConfig?.extra as
    | { premiumCheckoutUrl?: string }
    | undefined;
  const url =
    (typeof fromEnv === 'string' && fromEnv.trim()) ||
    extra?.premiumCheckoutUrl?.trim() ||
    '';
  return url || null;
}

function buildCheckoutUrl(base: string, plan: PremiumPlanId): string {
  const validated = validateExternalUrl(base, 'premium_checkout');
  if (!validated.ok) return base;
  try {
    const u = new URL(validated.url);
    u.searchParams.set('plan', plan);
    const revalidated = validateExternalUrl(u.toString(), 'premium_checkout');
    return revalidated.ok ? revalidated.url : validated.url;
  } catch {
    return validated.url;
  }
}

async function openWebCheckout(plan: PremiumPlanId): Promise<PremiumCheckoutResult> {
  const base = readCheckoutUrl();
  if (!base) {
    return { ok: false, error: 'checkout_not_configured' };
  }

  const url = buildCheckoutUrl(base, plan);
  const opened = await openSafeUrl(url, 'premium_checkout', {
    alertTitle: 'Abonnement Premium',
  });
  return opened ? { ok: true, channel: 'web' } : { ok: false, error: 'url_blocked' };
}

function alertPurchasesNotReady(): void {
  Alert.alert(
    'Premium bientôt disponible',
    getPremiumPurchasesBlockReason() ??
      "Les abonnements seront activés dès que toutes les fonctionnalités Premium seront prêtes.",
  );
}

function alertRevenueCatNotConfigured(): void {
  Alert.alert(
    'Abonnement Premium',
    'RevenueCat n’est pas encore configuré. Ajoute EXPO_PUBLIC_REVENUECAT_API_KEY_IOS et EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID, puis rebuild avec EAS (development build).',
  );
}

function alertCheckoutNotConfigured(): void {
  Alert.alert(
    'Abonnement Premium',
    'Paiement web non configuré. Définis EXPO_PUBLIC_PREMIUM_CHECKOUT_URL vers une page Stripe allowlistée.',
  );
}

/**
 * Point d’entrée unique pour souscrire : RevenueCat sur iOS/Android, checkout web allowlisté sur web.
 * Bloqué tant que le catalogue Premium n’est pas entièrement livré.
 */
export async function startPremiumCheckout(
  plan: PremiumPlanId,
): Promise<PremiumCheckoutResult> {
  if (!isPremiumPurchasesEnabled()) {
    alertPurchasesNotReady();
    return { ok: false, error: 'purchases_gated' };
  }

  const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

  if (isNative) {
    if (!canStartNativePurchase()) {
      if (!isRevenueCatConfigured()) {
        alertRevenueCatNotConfigured();
        return { ok: false, error: 'revenuecat_not_configured' };
      }
      alertPurchasesNotReady();
      return { ok: false, error: 'purchases_gated' };
    }

    const result = await purchasePremiumPackage(plan);
    if (result.ok) {
      Alert.alert(
        'Merci !',
        'Ton abonnement Premium est actif. Profite de toutes les fonctionnalités incluses.',
      );
      return { ok: true, channel: 'revenuecat' };
    }

    if (result.cancelled) {
      return { ok: false, error: 'cancelled', cancelled: true };
    }

    if (result.error === 'offering_not_found') {
      Alert.alert(
        'Premium',
        'Offre introuvable dans RevenueCat. Vérifie l’offering « default » et les packages mensuel / annuel.',
      );
    } else if (result.error === 'revenuecat_not_configured') {
      alertRevenueCatNotConfigured();
    } else {
      Alert.alert('Premium', "L'achat n'a pas pu être finalisé. Réessaie plus tard.");
    }
    return { ok: false, error: result.error };
  }

  if (!canStartWebCheckout()) {
    alertCheckoutNotConfigured();
    return { ok: false, error: 'checkout_not_configured' };
  }

  const webResult = await openWebCheckout(plan);
  if (!webResult.ok && webResult.error === 'checkout_not_configured') {
    alertCheckoutNotConfigured();
  }
  return webResult;
}

export async function restorePremiumPurchases(): Promise<{
  ok: boolean;
  isPremium: boolean;
  error?: string;
}> {
  if (!isPremiumPurchasesEnabled()) {
    alertPurchasesNotReady();
    return { ok: false, isPremium: false, error: 'purchases_gated' };
  }

  const result = await restoreRevenueCatPurchases();
  if (result.ok && result.isPremium) {
    Alert.alert('Restauré', 'Ton abonnement Premium a été retrouvé sur cet appareil.');
  } else if (result.ok) {
    Alert.alert('Restauration', 'Aucun abonnement actif trouvé pour ce compte.');
  } else if (result.error === 'revenuecat_not_configured') {
    alertRevenueCatNotConfigured();
  } else {
    Alert.alert('Restauration', 'Impossible de restaurer les achats pour le moment.');
  }
  return result;
}
