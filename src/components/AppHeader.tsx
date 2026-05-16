import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useApp } from '../context/AppContext';
import { Colors } from '../theme/colors';
import { CoinIcon } from './CoinIcon';

type AppHeaderProps = {
  title: string;
  /** Sous-titre optionnel sous le titre (petit, gris). */
  subtitle?: string;
  /** Cacher le bouton retour (par défaut visible). */
  hideBack?: boolean;
  /** Surcharger l'action retour (par défaut router.back()). */
  onBack?: () => void;
  /**
   * Action à droite :
   * - "coins" (par défaut) : badge CotonCoins
   * - "none" : rien
   * - "custom" : on passe `rightSlot` à la place
   */
  rightAction?: 'coins' | 'none' | 'custom';
  /** Slot custom à droite (utilisé si rightAction = 'custom'). */
  rightSlot?: React.ReactNode;
  /** Style additionnel sur le conteneur. */
  style?: ViewStyle;
};

/**
 * Header standard de l'app — utilisé sur toutes les pages internes.
 * Garantit un alignement cohérent (back · titre centré · action droite),
 * et un badge CotonCoins partagé via `CoinsBadge` (inclus ci-dessous).
 */
export function AppHeader({
  title,
  subtitle,
  hideBack = false,
  onBack,
  rightAction = 'coins',
  rightSlot,
  style,
}: AppHeaderProps) {
  const router = useRouter();

  function handleBack() {
    if (onBack) return onBack();
    if (router.canGoBack()) router.back();
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.side}>
        {!hideBack && (
          <TouchableOpacity
            onPress={handleBack}
            hitSlop={10}
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Retour"
          >
            <Ionicons name="chevron-back" size={22} color={Colors.ink} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.center}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={3}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View style={[styles.side, styles.sideRight]}>
        {rightAction === 'coins' && <CoinsBadge />}
        {rightAction === 'custom' && rightSlot}
      </View>
    </View>
  );
}

/**
 * Badge CotonCoins partagé.
 * - Affiche l'icône SVG dorée + le solde
 * - Navigue vers /rewards au tap
 */
export function CoinsBadge() {
  const router = useRouter();
  const { state } = useApp();

  return (
    <TouchableOpacity
      onPress={() => router.push('/rewards' as any)}
      style={styles.coinsBadge}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={`Solde CotonCoins : ${state.coins}`}
    >
      <CoinIcon size={16} />
      <Text style={styles.coinsText}>{state.coins}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 56,
  },
  side: {
    minWidth: 40,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sideRight: {
    justifyContent: 'flex-end',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',
    color: Colors.ink,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    marginTop: 2,
    textAlign: 'center',
  },
  coinsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.ink,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  coinsText: {
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
    color: Colors.amber,
  },
});
