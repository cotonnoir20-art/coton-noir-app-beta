export type PremiumMomentId =
  | 'routine_insight'
  | 'analysis_limit'
  | 'growth_history'
  | 'growth_export'
  | 'coins_multiplier'
  | 'box_masterclass';

export type PremiumMomentConfig = {
  id: PremiumMomentId;
  title: string;
  subtitle: string;
  bullets: string[];
  cta: string;
  trialHint: string;
};

export const PREMIUM_MOMENTS: Record<PremiumMomentId, PremiumMomentConfig> = {
  routine_insight: {
    id: 'routine_insight',
    title: 'Black Cotton analyse ta routine',
    subtitle: 'Tu as validé 3 routines — passe au niveau supérieur.',
    bullets: [
      'Diagnostic de ta routine matin / soir / wash day',
      'Conseils personnalisés chaque semaine',
      'Repères pour garder ton streak',
    ],
    cta: 'Essayer Premium 7 jours',
    trialHint: 'Puis analyse illimitée + PDF',
  },
  analysis_limit: {
    id: 'analysis_limit',
    title: 'Analyses illimitées + PDF',
    subtitle: 'Tu as utilisé tes 2 analyses gratuites ce mois-ci.',
    bullets: [
      'Analyses photo Black Cotton sans limite',
      'Export PDF de ton bilan capillaire',
      'Suivi de score mois après mois',
    ],
    cta: 'Débloquer avec Premium',
    trialHint: '7 jours gratuits · annule quand tu veux',
  },
  growth_history: {
    id: 'growth_history',
    title: 'Graphiques 12 mois + export',
    subtitle: 'Ton historique dépasse 3 mois — visualise toute ta progression.',
    bullets: [
      'Courbes sur 12 mois (toutes zones)',
      'Comparaison avant / après par période',
      'Export PDF & image de ton bilan pousse',
    ],
    cta: 'Voir Premium',
    trialHint: 'Essai 7 jours · 1ère valeur : export ou analyse',
  },
  growth_export: {
    id: 'growth_export',
    title: 'Export bilan Premium',
    subtitle: 'Télécharge ton bilan complet (stats, score, notes).',
    bullets: [
      'PDF structuré pour partager ou archiver',
      'Export image pour tes stories',
      'Inclus dans l’essai 7 jours',
    ],
    cta: 'Essayer 7 jours gratuits',
    trialHint: 'Analyse ou box en 1ère valeur',
  },
  coins_multiplier: {
    id: 'coins_multiplier',
    title: 'CotonCoins × 2',
    subtitle: 'Gagne deux fois plus sur chaque action validée.',
    bullets: [
      'Multiplicateur sur routines, wash day, défis',
      'Montée de niveau plus rapide',
      'Plus d’échanges au catalogue récompenses',
    ],
    cta: 'Activer le multiplicateur',
    trialHint: '7 jours pour tester sans engagement',
  },
  box_masterclass: {
    id: 'box_masterclass',
    title: 'Box & masterclass expert',
    subtitle: 'Contenu réservé aux membres Premium.',
    bullets: [
      'Box digitale mensuelle complète',
      'Masterclass avec des expertes',
      'Guides PDF et tutos exclusifs',
    ],
    cta: 'Accéder au contenu expert',
    trialHint: 'Essai 7 jours · box en 1ère valeur possible',
  },
};
