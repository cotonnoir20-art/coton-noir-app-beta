import type { TextStyle } from 'react-native';

/**
 * Coton Noir — système typographique
 *
 * • Satoshi : titres, cartes, headers (Medium — moins gras qu’avant)
 * • DM Sans : corps, labels, chiffres, formulaires
 * • Playfair : hero éditorial + titre article (lecture longue) uniquement
 */

export const Fonts = {
  display: 'Satoshi_500Medium',
  displayBold: 'Satoshi_700Bold',
  displaySemi: 'Satoshi_500Medium',
  displayMedium: 'Satoshi_400Regular',
  body: 'DMSans_400Regular',
  bodyMedium: 'DMSans_500Medium',
  bodySemi: 'DMSans_600SemiBold',
  bodyBold: 'DMSans_700Bold',
  editorial: 'PlayfairDisplay_700Bold',
} as const;

/** Titres UI (accueil, cartes, routine…) — Satoshi Medium */
export const FontDisplay = Fonts.display;

/** Lecture éditoriale (page Articles + détail article) */
export const FontEditorial = Fonts.editorial;

/** Échelle fixe — privilégier ces tailles plutôt que des fontSize ad hoc */
export const Type = {
  hero: {
    fontSize: 26,
    lineHeight: 34,
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
    fontSize: 17,
    lineHeight: 23,
    fontFamily: Fonts.display,
  },
  cardTitle: {
    fontSize: 17,
    lineHeight: 23,
    fontFamily: Fonts.displayBold,
  },
  greetingName: {
    fontSize: 19,
    lineHeight: 25,
    fontFamily: Fonts.displayBold,
    letterSpacing: -0.3,
  },
  sectionTitle: {
    fontSize: 15,
    lineHeight: 21,
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
