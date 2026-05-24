import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { Fonts } from '../../theme/typography';

type ScanEntryCardProps = {
  onStartScan: () => void;
};

/** Carte d’entrée « Scanner mes cheveux » — style Iruncoil, charte Coton Noir. */
export function ScanEntryCard({ onStartScan }: ScanEntryCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onStartScan} activeOpacity={0.92}>
      <View style={styles.iconCircle}>
        <Ionicons name="camera" size={26} color={Colors.ink} />
      </View>
      <Text style={styles.title}>Scanner mes cheveux</Text>
      <Text style={styles.sub}>
        Photos guidées racines, longueurs et pointes — pour une lecture précise de ta texture,
        porosité et état du cheveu.
      </Text>
      <View style={styles.ctaRow}>
        <Text style={styles.ctaText}>Lancer le scan</Text>
        <Ionicons name="arrow-forward" size={18} color={Colors.amber} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.ink,
    borderRadius: 22,
    paddingHorizontal: 22,
    paddingVertical: 32,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 16,
    minHeight: 220,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.amber,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 20,
    fontFamily: Fonts.display,
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  sub: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(255,255,255,0.72)',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ctaText: {
    fontSize: 15,
    fontFamily: Fonts.display,
    color: '#fff',
  },
});
