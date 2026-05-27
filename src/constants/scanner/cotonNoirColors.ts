/**
 * Palette Scanner Coton Noir — thème brun profond / terracotta.
 * Utilisée exclusivement dans les composants du scanner capillaire.
 */
export const ScanColors = {
  background: {
    primary:   '#1C1210',
    secondary: '#2E1F1A',
    surface:   '#3D2A22',
    accent:    '#4A2E20',
  },
  accent: {
    primary:      '#C8733A',
    light:        '#E8924F',
    border:       'rgba(200, 115, 58, 0.2)',
    borderActive: 'rgba(200, 115, 58, 0.6)',
  },
  text: {
    primary:   '#F5EDE4',
    secondary: '#A88C7D',
    tertiary:  '#6B5348',
  },
  status: {
    success:   '#5C9E6E',
    successBg: '#1E3D2A',
    warning:   '#C8943A',
    warningBg: '#3D2E12',
    error:     '#B85050',
    errorBg:   '#3D1A1A',
  },
  overlay: 'rgba(28, 18, 16, 0.85)',
} as const;
