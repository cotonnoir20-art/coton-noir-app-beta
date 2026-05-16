import React from 'react';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import { Colors } from '../theme/colors';

interface CoinIconProps {
  /** Taille en pixels (largeur = hauteur). */
  size?: number;
  /**
   * Variante de rendu :
   * - `gold` (défaut) : pièce orange/amber, idéale sur fond clair OU sombre
   * - `flat` : version plate sans relief (utile dans les chips très petites)
   */
  variant?: 'gold' | 'flat';
}

/**
 * Icône CotonCoin (SVG vectoriel).
 *
 * Remplace l'emoji 🪙 qui rendait différemment selon les OS / fonts.
 * Conserve la palette amber + ink de l'app.
 */
export function CoinIcon({ size = 16, variant = 'gold' }: CoinIconProps) {
  const isFlat = variant === 'flat';

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {!isFlat && (
        <Defs>
          {/* Léger dégradé radial pour donner l'impression d'une pièce métallique. */}
          <RadialGradient id="coinFace" cx="35%" cy="32%" r="75%">
            <Stop offset="0%"   stopColor="#FFE6B8" />
            <Stop offset="55%"  stopColor={Colors.amber} />
            <Stop offset="100%" stopColor={Colors.amberDark} />
          </RadialGradient>
        </Defs>
      )}

      {/* Rebord (rim) — anneau sombre */}
      <Circle cx="12" cy="12" r="11" fill={Colors.amberDark} />

      {/* Face de la pièce */}
      <Circle
        cx="12"
        cy="12"
        r="9.5"
        fill={isFlat ? Colors.amber : 'url(#coinFace)'}
      />

      {/* Cercle gravé interne (relief subtil) */}
      <Circle
        cx="12"
        cy="12"
        r="7.6"
        fill="none"
        stroke={Colors.amberDark}
        strokeWidth="0.6"
        opacity={0.45}
      />

      {/* Monogramme "C" — arc ouvert sur la droite, façon CotonCoin */}
      <Path
        d="M 15.2 8.6 A 4 4 0 1 0 15.2 15.4"
        stroke={Colors.ink}
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />

      {/* Reflet (highlight) en haut à gauche pour donner du volume */}
      {!isFlat && (
        <Ellipse
          cx="8.2"
          cy="7.2"
          rx="2.6"
          ry="1.4"
          fill="#FFFFFF"
          opacity={0.45}
          transform="rotate(-25 8.2 7.2)"
        />
      )}
    </Svg>
  );
}
