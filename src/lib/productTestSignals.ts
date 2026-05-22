import type { HairProfile } from '../context/AppContext';
import { supabase } from './supabase';

export async function saveProductTestSignal(args: {
  profile: Pick<HairProfile, 'hairType' | 'porosity' | 'objective'>;
  productBrand: string;
  productName: string;
  productId?: string;
}): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('product_test_signals').insert({
      user_id: user.id,
      hair_type: args.profile.hairType?.trim().slice(0, 40) ?? null,
      porosity: args.profile.porosity?.trim().slice(0, 40) ?? null,
      objective: args.profile.objective?.trim().slice(0, 80) ?? null,
      product_brand: args.productBrand.trim().slice(0, 80),
      product_name: args.productName.trim().slice(0, 120),
      product_id: args.productId?.trim().slice(0, 64) ?? null,
    });
  } catch {
    /* best-effort — table optionnelle */
  }
}
