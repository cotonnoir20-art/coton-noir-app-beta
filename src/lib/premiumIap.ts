import { Platform } from 'react-native';
import {
  endConnection,
  fetchProducts,
  finishTransaction,
  initConnection,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  type Purchase,
} from 'expo-iap';

import type { PremiumPlanId } from './premiumPlans';

export type { PremiumPlanId };

export type IapPurchaseResult =
  | { ok: true; purchase: Purchase }
  | { ok: false; error: string; cancelled?: boolean };

function readSku(plan: PremiumPlanId): string | null {
  const key =
    plan === 'annual'
      ? 'EXPO_PUBLIC_IAP_PREMIUM_ANNUAL'
      : 'EXPO_PUBLIC_IAP_PREMIUM_MONTHLY';
  const v =
    typeof process !== 'undefined'
      ? process.env?.[key as keyof NodeJS.ProcessEnv]
      : undefined;
  return typeof v === 'string' && v.trim() ? v.trim() : null;
}

export function isPremiumIapConfigured(): boolean {
  return !!(readSku('monthly') && readSku('annual'));
}

export function getPremiumSku(plan: PremiumPlanId): string | null {
  return readSku(plan);
}

function isNativeStore(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

/**
 * Achat in-app (StoreKit / Play Billing) — development build requis, pas Expo Go.
 */
export async function purchasePremiumWithIap(
  plan: PremiumPlanId,
): Promise<IapPurchaseResult> {
  if (!isNativeStore()) {
    return { ok: false, error: 'platform_not_supported' };
  }

  const sku = getPremiumSku(plan);
  if (!sku) {
    return { ok: false, error: 'iap_not_configured' };
  }

  let connected = false;

  return new Promise<IapPurchaseResult>(resolve => {
    const cleanup = () => {
      successSub.remove();
      errorSub.remove();
      if (connected) {
        endConnection().catch(() => {});
      }
    };

    const successSub = purchaseUpdatedListener(async purchase => {
      const pid = purchase.productId ?? '';
      if (pid !== sku) return;

      cleanup();
      try {
        await finishTransaction({ purchase, isConsumable: false });
        resolve({ ok: true, purchase });
      } catch {
        resolve({ ok: false, error: 'finish_transaction_failed' });
      }
    });

    const errorSub = purchaseErrorListener(err => {
      cleanup();
      const code = String(err.code ?? '');
      const cancelled =
        code === 'user-cancelled' ||
        /cancel/i.test(code) ||
        /cancel/i.test(err.message ?? '');
      resolve({
        ok: false,
        error: err.message || 'purchase_failed',
        cancelled,
      });
    });

    (async () => {
      try {
        await initConnection();
        connected = true;

        const products = await fetchProducts({ skus: [sku], type: 'subs' });
        if (!products?.length) {
          cleanup();
          resolve({ ok: false, error: 'product_not_found' });
          return;
        }

        const sub = products[0] as {
          id?: string;
          productId?: string;
          subscriptionOfferDetailsAndroid?: Array<{
            offerToken?: string;
          }>;
        };

        const offerToken =
          sub.subscriptionOfferDetailsAndroid?.[0]?.offerToken;

        await requestPurchase({
          type: 'subs',
          request: {
            apple: { sku },
            google: offerToken
              ? {
                  skus: [sku],
                  subscriptionOffers: [{ sku, offerToken }],
                }
              : { skus: [sku] },
          },
        });
      } catch (e: unknown) {
        cleanup();
        const msg = e instanceof Error ? e.message : String(e);
        const notAvailable =
          /native module|expo go|not available|RNSS|billing/i.test(msg);
        resolve({
          ok: false,
          error: notAvailable ? 'iap_native_unavailable' : msg || 'purchase_failed',
        });
      }
    })();
  });
}
