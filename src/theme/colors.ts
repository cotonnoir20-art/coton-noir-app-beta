/**
 * Couleurs Coton Noir — alignées charte graphique (PDF officiel).
 *
 * Charte (HEX) :
 *   noir #1d1d1b · orange #f49423 · sage #79b7a1
 *   ardoise #2f4b59 · bordeaux #631617 · rouge #b1282e
 *
 * Règle 60 / 30 / 10 dans l’app :
 *   60% noir + neutres  → structure, textes, CTAs
 *   30% orange          → CotonCoins, progression, identité
 *   10% sage + rouge    → succès / alerte (pas de promo en rouge)
 *
 * Typo charte : Montserrat (corps) · Yellowtail (titres) — voir typography.ts
 */

/** Valeurs brutes de la charte — ne pas utiliser directement dans les écrans. */
export const BrandCharter = {
  black: '#1D1D1B',
  orange: '#F49423',
  sage: '#79B7A1',
  slate: '#2F4B59',
  burgundy: '#631617',
  red: '#B1282E',
} as const;

export const Colors = {
  // ── PRIMARY — NOIR (charte #1d1d1b) ───────────────────────────────────
  ink: '#1D1D1B',
  inkSoft: BrandCharter.slate,

  // ── SIGNATURE — ORANGE (charte #f49423) ─────────────────────────────────
  amber: BrandCharter.orange,
  amberDark: '#D07A12',
  amberInk: '#8A4E0A',
  amberLight: '#FDE9D0',
  amberPowder: '#FDF3E6',

  // ── ACCENT ÉMOTION (hors charte — favoris / communauté) ─────────────────
  // Dérivé du rouge charte, plus doux pour ne pas confondre avec alert.
  rose: '#C45A62',
  blush: '#F5D8DA',

  // ── SUCCÈS — SAGE (charte #79b7a1) ──────────────────────────────────────
  sage: BrandCharter.sage,
  sageBright: '#92C9B5',
  sageDark: '#3D6B5C',
  sageLight: '#D9EBE5',

  // ── POUSSE — ARDOISE (charte #2f4b59) ───────────────────────────────────
  growth: BrandCharter.slate,
  growthDark: '#1F3540',
  growthLight: '#DCE4E8',

  // ── ALERTE — ROUGE CHARTE (#b1282e / #631617) ───────────────────────────
  alert: BrandCharter.red,
  alertDark: BrandCharter.burgundy,
  alertLight: '#F5D4D6',

  // ── NEUTRES (non définis dans la charte — fonds UI chauds) ─────────────
  bg: '#FDF8F4',
  bgShell: '#EDE8E2',
  surface: '#FFFFFF',
  cream: '#FAF3EC',
  border: '#E8DDD5',
  warmGray: '#5C5652',
  white: '#FFFFFF',
};

/**
 * Dégradés des cartes « Moments forts » (`HighlightCard`).
 * - live    → sage (challenges, communauté, parrainage)
 * - premium → orange → bordeaux (box, offres)
 * - neutral → ardoise → noir (tutos, analyse, actus)
 */
export const HighlightGradients: Record<
  'live' | 'premium' | 'neutral',
  readonly [string, string]
> = {
  live: [BrandCharter.sage, Colors.sageDark],
  premium: [BrandCharter.orange, BrandCharter.burgundy],
  neutral: [BrandCharter.slate, BrandCharter.black],
};
