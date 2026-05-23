/**
 * Catalogue Premium — une feature = `true` uniquement quand elle est livrée en prod.
 * Tant qu'une entrée est `false`, les paiements restent désactivés (RevenueCat inactif côté achat).
 *
 * Pour activer les stores : passer toutes les clés à `true` + configurer RevenueCat.
 */

export type PremiumFeatureKey =
  | 'advanced_analysis'
  | 'expert_content'
  | 'coins_multiplier'
  | 'digital_box'
  | 'partner_codes'
  | 'growth_history_12m'
  | 'pdf_export'
  | 'multi_profiles'
  | 'vip_support';

export const PREMIUM_FEATURE_LABELS: Record<PremiumFeatureKey, string> = {
  advanced_analysis: 'Analyse capillaire IA avancée (illimitée)',
  expert_content: 'Contenu expert (+200 tutos, masterclass, guides PDF)',
  coins_multiplier: 'CotonCoins × 2',
  digital_box: 'Box digitale mensuelle complète',
  partner_codes: 'Codes promo partenaires exclusifs',
  growth_history_12m: 'Historique pousse 12 mois',
  pdf_export: 'Export PDF bilan capillaire',
  multi_profiles: 'Multi-profils capillaires (3)',
  vip_support: 'Support VIP',
};

/** Mettre à `true` au fur et à mesure des livraisons. */
export const PREMIUM_FEATURE_READINESS: Record<PremiumFeatureKey, boolean> = {
  advanced_analysis: false,
  expert_content: false,
  coins_multiplier: false,
  digital_box: false,
  partner_codes: false,
  growth_history_12m: false,
  pdf_export: false,
  multi_profiles: false,
  vip_support: false,
};

export function areAllPremiumFeaturesReady(): boolean {
  return (Object.keys(PREMIUM_FEATURE_READINESS) as PremiumFeatureKey[]).every(
    k => PREMIUM_FEATURE_READINESS[k],
  );
}

export function getPendingPremiumFeatures(): PremiumFeatureKey[] {
  return (Object.keys(PREMIUM_FEATURE_READINESS) as PremiumFeatureKey[]).filter(
    k => !PREMIUM_FEATURE_READINESS[k],
  );
}
