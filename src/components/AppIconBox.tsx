import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';

export type IonName = ComponentProps<typeof Ionicons>['name'];

type Props = {
  name: IonName;
  backgroundColor: string;
  color: string;
  /** Taille du carré (défaut 42, comme les lignes de notification) */
  size?: number;
  /** Taille de l’icône Ionicons (défaut 20) */
  iconSize?: number;
  /** Rayon des coins (défaut 13) */
  borderRadius?: number;
};

/**
 * Pastille + Ionicons, même langage visuel que les notifications
 * (`notifications.tsx` → `iconBox` + `Ionicons`).
 */
export function AppIconBox({
  name,
  backgroundColor,
  color,
  size = 42,
  iconSize = 20,
  borderRadius = 13,
}: Props) {
  return (
    <View
      style={[
        styles.box,
        {
          width: size,
          height: size,
          borderRadius,
          backgroundColor,
        },
      ]}
    >
      <Ionicons name={name} size={iconSize} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
