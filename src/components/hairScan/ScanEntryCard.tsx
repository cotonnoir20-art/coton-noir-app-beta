import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScanColors as C } from '../../constants/scanner/cotonNoirColors';
import { Fonts } from '../../theme/typography';

type ScanEntryCardProps = {
  onStartScan: () => void;
};

const FEATURES = ['Texture', 'Porosité', 'Condition', 'Type'];

/** Carte d'entrée scanner — palette brun profond / terracotta Coton Noir. */
export function ScanEntryCard({ onStartScan }: ScanEntryCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onStartScan} activeOpacity={0.93}>
      {/* Coins décoratifs */}
      <View style={[styles.corner, styles.cornerTL]} />
      <View style={[styles.corner, styles.cornerTR]} />
      <View style={[styles.corner, styles.cornerBL]} />
      <View style={[styles.corner, styles.cornerBR]} />

      {/* Badge IA */}
      <View style={styles.aiBadge}>
        <Ionicons name="sparkles" size={11} color={C.accent.primary} />
        <Text style={styles.aiBadgeText}>Propulsé par IA</Text>
      </View>

      {/* Icône centrale */}
      <View style={styles.iconRing}>
        <View style={styles.iconCircle}>
          <Ionicons name="camera" size={28} color={C.text.primary} />
        </View>
      </View>

      {/* Titre */}
      <Text style={styles.title}>Prête pour{'\n'}ton scan ?</Text>

      {/* Sous-titre */}
      <Text style={styles.sub}>1 angle · 30 sec · croisé avec ton profil</Text>

      {/* Chips fonctionnalités */}
      <View style={styles.featuresRow}>
        {FEATURES.map(f => (
          <View key={f} style={styles.featureChip}>
            <Text style={styles.featureChipText}>{f}</Text>
          </View>
        ))}
      </View>

      {/* CTA */}
      <View style={styles.ctaBtn}>
        <Ionicons name="camera-outline" size={18} color={C.text.primary} />
        <Text style={styles.ctaBtnText}>Commencer le scan</Text>
        <Ionicons name="arrow-forward" size={16} color={C.accent.primary} />
      </View>
    </TouchableOpacity>
  );
}

const CORNER_SIZE = 22;
const CORNER_STROKE = 2.5;

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.background.primary,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: C.accent.borderActive,
    paddingHorizontal: 24,
    paddingVertical: 36,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 16,
    minHeight: 280,
    overflow: 'hidden',
    position: 'relative',
  },

  /* Coins terracotta */
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: C.accent.primary,
  },
  cornerTL: {
    top: 12,
    left: 12,
    borderTopWidth: CORNER_STROKE,
    borderLeftWidth: CORNER_STROKE,
    borderTopLeftRadius: 4,
  },
  cornerTR: {
    top: 12,
    right: 12,
    borderTopWidth: CORNER_STROKE,
    borderRightWidth: CORNER_STROKE,
    borderTopRightRadius: 4,
  },
  cornerBL: {
    bottom: 12,
    left: 12,
    borderBottomWidth: CORNER_STROKE,
    borderLeftWidth: CORNER_STROKE,
    borderBottomLeftRadius: 4,
  },
  cornerBR: {
    bottom: 12,
    right: 12,
    borderBottomWidth: CORNER_STROKE,
    borderRightWidth: CORNER_STROKE,
    borderBottomRightRadius: 4,
  },

  /* Badge IA */
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: C.background.surface,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.accent.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 20,
  },
  aiBadgeText: {
    fontSize: 10,
    fontFamily: Fonts.bodyBold,
    color: C.accent.primary,
    letterSpacing: 0.4,
  },

  /* Icône */
  iconRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: C.accent.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: C.background.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Titre éditorial */
  title: {
    fontSize: 26,
    fontFamily: Fonts.editorial,
    color: C.text.primary,
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 8,
  },

  sub: {
    fontSize: 13,
    fontFamily: Fonts.body,
    color: C.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },

  /* Chips */
  featuresRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
    marginBottom: 24,
  },
  featureChip: {
    backgroundColor: C.background.accent,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.accent.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  featureChipText: {
    fontSize: 11,
    fontFamily: Fonts.bodyMedium,
    color: C.accent.light,
  },

  /* CTA */
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: C.accent.primary,
    borderRadius: 16,
    paddingHorizontal: 22,
    paddingVertical: 14,
    width: '100%',
    justifyContent: 'center',
  },
  ctaBtnText: {
    flex: 1,
    fontSize: 15,
    fontFamily: Fonts.display,
    color: C.text.primary,
    textAlign: 'center',
  },
});
