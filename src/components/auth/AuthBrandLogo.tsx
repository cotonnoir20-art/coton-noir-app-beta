import { Image } from 'expo-image';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { Colors } from '../../theme/colors';

/** Logo blanc sur fond noir — lisible sur les écrans auth (fond crème). */
const LOGO_LIGHT_ON_DARK = require('../../../assets/brand/splash-logo.png');

type Props = {
  /** Largeur de la tuile logo (px). */
  width?: number;
  /** Carré arrondi (welcome) ou cercle avec contour (connexion). */
  variant?: 'rounded' | 'circle';
  style?: ViewStyle;
};

/**
 * Logo Coton Noir pour welcome / connexion.
 * Tuile noire + logo blanc (le PNG auth orange/gris est illisible sur fond clair).
 */
export function AuthBrandLogo({ width = 176, variant = 'rounded', style }: Props) {
  const isCircle = variant === 'circle';
  const radius = isCircle ? width / 2 : Math.round(width * 0.13);

  return (
    <View
      style={[
        styles.tile,
        isCircle && styles.tileCircle,
        { width, height: width, borderRadius: radius },
        style,
      ]}
      accessibilityRole="image"
      accessibilityLabel="Coton Noir"
    >
      <Image
        source={LOGO_LIGHT_ON_DARK}
        style={styles.logo}
        contentFit="contain"
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: '#000000',
    overflow: 'hidden',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileCircle: {
    borderWidth: 2.5,
    borderColor: Colors.ink,
  },
  logo: {
    width: '88%',
    height: '88%',
  },
});
