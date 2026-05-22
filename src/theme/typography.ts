import type { TextStyle } from 'react-native';

/**
 * Coton Noir — système typographique
 *
 * • Poppins : titres, cartes, CTA, headers
 * • DM Sans : corps, labels, chiffres, formulaires
 * • Playfair : hero éditorial + titre article (lecture longue) uniquement
 */

export const Fonts = {
  display: 'Poppins_700Bold',
  displaySemi: 'Poppins_600SemiBold',
  displayMedium: 'Poppins_500Medium',
  body: 'DMSans_400Regular',
  bodyMedium: 'DMSans_500Medium',
  bodySemi: 'DMSans_600SemiBold',
  bodyBold: 'DMSans_700Bold',
  editorial: 'PlayfairDisplay_700Bold',
} as const;

/** Titres UI (accueil, cartes, routine…) — Poppins Bold */
export const FontDisplay = Fonts.display;

/** Lecture éditoriale (page Articles + détail article) */
export const FontEditorial = Fonts.editorial;

/** Échelle fixe — privilégier ces tailles plutôt que des fontSize ad hoc */
export const Type = {
  hero: {
    fontSize: 28,
    lineHeight: 36,
    fontFamily: Fonts.display,
    letterSpacing: -0.3,
  },
  editorialHero: {
    fontSize: 28,
    lineHeight: 36,
    fontFamily: Fonts.editorial,
    letterSpacing: -0.2,
  },
  editorialArticle: {
    fontSize: 24,
    lineHeight: 31,
    fontFamily: Fonts.editorial,
  },
  screenTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: Fonts.display,
  },
  cardTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontFamily: Fonts.display,
  },
  greetingName: {
    fontSize: 20,
    lineHeight: 26,
    fontFamily: Fonts.display,
    letterSpacing: -0.3,
  },
  sectionTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontFamily: Fonts.displaySemi,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: Fonts.body,
  },
  bodySmall: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: Fonts.body,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: Fonts.bodyMedium,
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
    fontFamily: Fonts.bodyBold,
    letterSpacing: 0.4,
  },
  kicker: {
    fontSize: 10,
    lineHeight: 13,
    fontFamily: Fonts.bodyBold,
    letterSpacing: 1,
  },
} as const satisfies Record<string, TextStyle>;

export type TypeScaleKey = keyof typeof Type;

/** Fusionne un style de l’échelle avec des surcharges (couleur, alignement…). */
export function textStyle(key: TypeScaleKey, overrides?: TextStyle): TextStyle {
  return { ...Type[key], ...overrides };
}
