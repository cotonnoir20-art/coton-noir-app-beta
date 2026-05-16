import { Alert, Platform } from 'react-native';
import Constants from 'expo-constants';
import {
  getPremiumSku,
  isPremiumIapConfigured,
  purchasePremiumWithIap,
  type PremiumPlanId,
} from './premiumIap';
import { openSafeUrl, validateExternalUrl } from './safeLinking';

export type PremiumCheckoutResult =
  | { ok: true; channel: 'iap' | 'web' }
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

function alertIapNotReady(): void {
  Alert.alert(
    'Abonnement Premium',
    "Les achats intégrés (App Store / Google Play) nécessitent une build de développement ou production avec les identifiants produits configurés (EXPO_PUBLIC_IAP_PREMIUM_MONTHLY et EXPO_PUBLIC_IAP_PREMIUM_ANNUAL).",
  );
}

function alertCheckoutNotConfigured(): void {
  Alert.alert(
    'Abonnement Premium',
    "Paiement non configuré. Sur mobile, configure les SKU in-app. Sur le web, définis EXPO_PUBLIC_PREMIUM_CHECKOUT_URL vers une page Stripe / site Coton Noir allowlistée.",
  );
}

/**
 * Point d’entrée unique pour souscrire : IAP natif sur iOS/Android, checkout web allowlisté sur web uniquement.
 */
export async function startPremiumCheckout(
  plan: PremiumPlanId,
): Promise<PremiumCheckoutResult> {
  const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

  if (isNative) {
    if (!isPremiumIapConfigured()) {
      alertIapNotReady();
      return { ok: false, error: 'iap_not_configured' };
    }

    const sku = getPremiumSku(plan);
    if (!sku) {
      alertIapNotReady();
      return { ok: false, error: 'iap_sku_missing' };
    }

    const result = await purchasePremiumWithIap(plan);
    if (result.ok) {
      Alert.alert(
        'Merci !',
        "Ton achat est enregistré. L'activation Premium sur ton compte sera confirmée après vérification serveur.",
      );
      return { ok: true, channel: 'iap' };
    }

    if (result.cancelled) {
      return { ok: false, error: 'cancelled', cancelled: true };
    }

    if (result.error === 'iap_native_unavailable') {
      Alert.alert(
        'Premium',
        "Les achats in-app ne sont pas disponibles dans Expo Go. Utilise une development build (eas build).",
      );
    } else if (result.error === 'product_not_found') {
      Alert.alert(
        'Premium',
        `Produit « ${sku} » introuvable dans la boutique. Vérifie App Store Connect / Play Console.`,
      );
    } else {
      Alert.alert('Premium', "L'achat n'a pas pu être finalisé. Réessaie plus tard.");
    }
    return { ok: false, error: result.error };
  }

  // Web : pas d’IAP ici — uniquement URL allowlistée (jamais de lien arbitraire)
  const webResult = await openWebCheckout(plan);
  if (!webResult.ok && webResult.error === 'checkout_not_configured') {
    alertCheckoutNotConfigured();
  }
  return webResult;
}
