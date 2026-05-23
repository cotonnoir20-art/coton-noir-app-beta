import { Platform } from 'react-native';
import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
  type PurchasesOfferings,
  type PurchasesPackage,
} from 'react-native-purchases';
import type { PremiumPlanId } from './premiumPlans';

const ENTITLEMENT_ID =
  (typeof process !== 'undefined' &&
    process.env?.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID?.trim()) ||
  'premium';

let configured = false;

function readApiKey(): string | null {
  const ios =
    typeof process !== 'undefined' &&
    process.env?.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS?.trim();
  const android =
    typeof process !== 'undefined' &&
    process.env?.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID?.trim();

  if (Platform.OS === 'ios' && ios) return ios;
  if (Platform.OS === 'android' && android) return android;
  return null;
}

export function isRevenueCatConfigured(): boolean {
  return !!readApiKey();
}

export function getRevenueCatEntitlementId(): string {
  return ENTITLEMENT_ID;
}

function isNativeStore(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

/** Initialise RevenueCat (idempotent). Safe en Expo Go (Preview API Mode). */
export async function configureRevenueCat(appUserId?: string | null): Promise<boolean> {
  if (!isNativeStore()) return false;
  const apiKey = readApiKey();
  if (!apiKey) return false;

  if (!configured) {
    if (__DEV__) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }
    Purchases.configure({
      apiKey,
      appUserID: appUserId ?? undefined,
    });
    configured = true;
    return true;
  }

  if (appUserId) {
    try {
      const { customerInfo } = await Purchases.logIn(appUserId);
      return isCustomerPremium(customerInfo);
    } catch {
      return false;
    }
  }

  return true;
}

export async function logOutRevenueCat(): Promise<void> {
  if (!configured || !isNativeStore()) return;
  try {
    await Purchases.logOut();
  } catch {
    /* guest */
  }
}

export function isCustomerPremium(customerInfo: CustomerInfo): boolean {
  const active = customerInfo.entitlements.active[ENTITLEMENT_ID];
  return !!active?.isActive;
}

export async function fetchRevenueCatPremiumActive(): Promise<boolean> {
  if (!isNativeStore() || !configured) return false;
  try {
    const info = await Purchases.getCustomerInfo();
    return isCustomerPremium(info);
  } catch {
    return false;
  }
}

function pickPackage(
  offerings: PurchasesOfferings,
  plan: PremiumPlanId,
): PurchasesPackage | null {
  const current = offerings.current;
  if (!current) return null;

  if (plan === 'annual') {
    return current.annual ?? current.availablePackages.find(p => p.packageType === 'ANNUAL') ?? null;
  }
  return current.monthly ?? current.availablePackages.find(p => p.packageType === 'MONTHLY') ?? null;
}

export type RevenueCatPurchaseResult =
  | { ok: true; customerInfo: CustomerInfo }
  | { ok: false; error: string; cancelled?: boolean };

export async function purchasePremiumPackage(
  plan: PremiumPlanId,
): Promise<RevenueCatPurchaseResult> {
  if (!isNativeStore()) {
    return { ok: false, error: 'platform_not_supported' };
  }
  if (!configured) {
    const ok = await configureRevenueCat();
    if (!ok) return { ok: false, error: 'revenuecat_not_configured' };
  }

  try {
    const offerings = await Purchases.getOfferings();
    const pkg = pickPackage(offerings, plan);
    if (!pkg) {
      return { ok: false, error: 'offering_not_found' };
    }

    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return { ok: true, customerInfo };
  } catch (e: unknown) {
    const err = e as { userCancelled?: boolean; message?: string };
    if (err?.userCancelled) {
      return { ok: false, error: 'cancelled', cancelled: true };
    }
    return {
      ok: false,
      error: err?.message ?? 'purchase_failed',
    };
  }
}

export async function restoreRevenueCatPurchases(): Promise<{
  ok: boolean;
  isPremium: boolean;
  error?: string;
}> {
  if (!configured) {
    return { ok: false, isPremium: false, error: 'revenuecat_not_configured' };
  }
  try {
    const info = await Purchases.restorePurchases();
    return { ok: true, isPremium: isCustomerPremium(info) };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'restore_failed';
    return { ok: false, isPremium: false, error: msg };
  }
}
