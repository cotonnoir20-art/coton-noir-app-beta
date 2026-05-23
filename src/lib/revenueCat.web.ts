import type { PremiumPlanId } from './premiumPlans';

/** RevenueCat natif indisponible sur web — checkout via EXPO_PUBLIC_PREMIUM_CHECKOUT_URL. */

export function isRevenueCatConfigured(): boolean {
  return false;
}

export function getRevenueCatEntitlementId(): string {
  return (
    (typeof process !== 'undefined' &&
      process.env?.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID?.trim()) ||
    'premium'
  );
}

export async function configureRevenueCat(_appUserId?: string | null): Promise<boolean> {
  return false;
}

export async function logOutRevenueCat(): Promise<void> {
  /* noop */
}

export function isCustomerPremium(_customerInfo: unknown): boolean {
  return false;
}

export async function fetchRevenueCatPremiumActive(): Promise<boolean> {
  return false;
}

export type RevenueCatPurchaseResult =
  | { ok: true; customerInfo: unknown }
  | { ok: false; error: string; cancelled?: boolean };

export async function purchasePremiumPackage(
  _plan: PremiumPlanId,
): Promise<RevenueCatPurchaseResult> {
  return { ok: false, error: 'platform_not_supported' };
}

export async function restoreRevenueCatPurchases(): Promise<{
  ok: boolean;
  isPremium: boolean;
  error?: string;
}> {
  return { ok: false, isPremium: false, error: 'platform_not_supported' };
}
