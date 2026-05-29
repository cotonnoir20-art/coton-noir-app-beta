import { useEffect, useState } from 'react';
import { PRODUCTS, type Product } from '../data/products';
import { fetchPublishedProducts } from './supabaseProducts';

let _cache: Product[] | null = null;
let _cacheAt = 0;
const TTL_MS = 5 * 60 * 1000;

export function useSupabaseProducts(): { products: Product[]; loading: boolean } {
  const isFresh = _cache !== null && Date.now() - _cacheAt < TTL_MS;
  const [products, setProducts] = useState<Product[]>(isFresh ? _cache! : PRODUCTS);
  const [loading, setLoading] = useState(!isFresh);

  useEffect(() => {
    if (isFresh) return;
    let cancelled = false;
    fetchPublishedProducts()
      .then(fetched => {
        if (__DEV__) console.log('[useSupabaseProducts] fetched', fetched.length, 'products, cancelled:', cancelled);
        if (cancelled) return;
        if (fetched.length > 0) {
          _cache = fetched;
          _cacheAt = Date.now();
          setProducts(fetched);
        }
      })
      .catch(e => { if (__DEV__) console.error('[useSupabaseProducts] unexpected error', e); })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { products, loading };
}
