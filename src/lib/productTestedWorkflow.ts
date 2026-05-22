import AsyncStorage from '@react-native-async-storage/async-storage';

const PENDING_KEY = '@coton_noir_product_tested_pending';

export type ProductTestedPending = {
  productId: string;
  brand: string;
  name: string;
  routineSavedAt: string;
  washdayPrompted?: boolean;
};

export async function loadProductTestedPending(): Promise<ProductTestedPending | null> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as ProductTestedPending;
    if (!p?.productId || !p.routineSavedAt) return null;
    const age = Date.now() - new Date(p.routineSavedAt).getTime();
    if (age > 30 * 86400000) {
      await AsyncStorage.removeItem(PENDING_KEY);
      return null;
    }
    return p;
  } catch {
    return null;
  }
}

export async function startProductTestedWorkflow(args: {
  productId: string;
  brand: string;
  name: string;
}): Promise<void> {
  const pending: ProductTestedPending = {
    productId: args.productId,
    brand: args.brand,
    name: args.name,
    routineSavedAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(PENDING_KEY, JSON.stringify(pending));
}

export async function markProductTestedWashdayPrompted(): Promise<void> {
  const p = await loadProductTestedPending();
  if (!p) return;
  await AsyncStorage.setItem(
    PENDING_KEY,
    JSON.stringify({ ...p, washdayPrompted: true }),
  );
}

export async function clearProductTestedPending(): Promise<void> {
  await AsyncStorage.removeItem(PENDING_KEY);
}

const COMPLETED_KEY = '@coton_noir_product_test_completed';

export type CompletedProductTest = {
  productId: string;
  brand: string;
  name: string;
  completedAt: string;
};

/** Dernier test produit terminé (commentaire évolution enregistré). */
export async function recordCompletedProductTest(
  args: CompletedProductTest,
): Promise<void> {
  await AsyncStorage.setItem(COMPLETED_KEY, JSON.stringify(args));
}

export async function loadCompletedProductTest(): Promise<CompletedProductTest | null> {
  try {
    const raw = await AsyncStorage.getItem(COMPLETED_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as CompletedProductTest;
    if (!p?.productId || !p.completedAt) return null;
    const age = Date.now() - new Date(p.completedAt).getTime();
    if (age > 14 * 86400000) {
      await AsyncStorage.removeItem(COMPLETED_KEY);
      return null;
    }
    return p;
  } catch {
    return null;
  }
}

export async function dismissCompletedProductTest(): Promise<void> {
  await AsyncStorage.removeItem(COMPLETED_KEY);
}
