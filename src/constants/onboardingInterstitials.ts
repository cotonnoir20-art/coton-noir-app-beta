/** Contenu des écrans intercalaires (inspiration parcours type IrunCoil). */

export type OnboardingInterstitialId = 'regularity' | 'testimonials' | 'consistency';

export type StatBarRow = {
  label: string;
  percent: number;
  tone: 'muted' | 'mid' | 'brand';
};

export type OnboardingInterstitialConfig = {
  id: OnboardingInterstitialId;
  cardEyebrow: string;
  title: string;
  body: string;
  statBars?: StatBarRow[];
  chartWeeks?: string[];
  chartWithValues?: number[];
  chartWithoutValues?: number[];
};

export const ONBOARDING_INTERSTITIALS: OnboardingInterstitialConfig[] = [
  {
    id: 'regularity',
    cardEyebrow: 'RÉGULARITÉ DE LA ROUTINE',
    title:
      'Les femmes qui suivent leur routine avec Coton Noir gardent plus longtemps des habitudes protectrices.',
    body: 'Le suivi de ta routine facilite la régularité et limite les casses inutiles.',
    statBars: [
      { label: 'Sans suivi', percent: 28, tone: 'muted' },
      { label: 'Suivi de base', percent: 54, tone: 'mid' },
      { label: 'Avec Coton Noir', percent: 89, tone: 'brand' },
    ],
  },
  {
    id: 'testimonials',
    cardEyebrow: 'COMMUNAUTÉ',
    title: 'Tu n’es pas seule.',
    body: 'Des femmes comme toi ont commencé au même point — voici ce qui a changé avec Coton Noir.',
  },
  {
    id: 'consistency',
    cardEyebrow: 'COHÉRENCE AU FIL DU TEMPS',
    title: 'Avec Coton Noir, il devient plus facile de tenir une routine.',
    body: 'Celles qui suivent leur routine et leurs wash days restent plus régulières semaine après semaine.',
    chartWeeks: ['Semaine 1', 'Semaine 4', 'Semaine 8'],
    chartWithValues: [32, 58, 86],
    chartWithoutValues: [30, 34, 36],
  },
];

/** Indices d’étape onboarding où insérer un intercalaire (après N questions). */
export const ONBOARDING_INTERSTITIAL_STEP_INDICES: Partial<Record<OnboardingInterstitialId, number>> = {
  testimonials: 7,
};

export const ONBOARDING_INTERSTITIAL_STEPS = new Set<number>(
  Object.values(ONBOARDING_INTERSTITIAL_STEP_INDICES),
);
