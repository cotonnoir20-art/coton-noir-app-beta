import { StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

type BackButtonProps = {
  onPress: () => void;
  /** Libellé affiché à droite de la flèche (défaut : Retour). */
  label?: string;
  accessibilityLabel?: string;
  style?: ViewStyle;
  /** Variante plus petite (wizard, barres secondaires). */
  compact?: boolean;
};

/**
 * Retour minimaliste : flèche + libellé (style Iruncoil).
 */
export function BackButton({
  onPress,
  label = 'Retour',
  accessibilityLabel,
  style,
  compact = false,
}: BackButtonProps) {
  const iconSize = compact ? 18 : 20;
  const fontSize = compact ? 14 : 16;

  return (
    <TouchableOpacity
      onPress={onPress}
      hitSlop={{ top: 8, bottom: 8, left: 4, right: 12 }}
      style={[styles.root, style]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      activeOpacity={0.7}
    >
      <Ionicons name="arrow-back" size={iconSize} color={Colors.warmGray} />
      <Text style={[styles.label, { fontSize, lineHeight: fontSize + 4 }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  label: {
    fontFamily: 'Satoshi_500Medium',
    color: Colors.warmGray,
  },
});
