import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import type { ProfileCompletion } from '../../lib/profileCompleteness';

type Props = {
  completion: ProfileCompletion;
  onPress: () => void;
  compact?: boolean;
};

export function ProfileCompletionCard({ completion, onPress, compact }: Props) {
  if (completion.isComplete) return null;

  const nextHint = completion.missing.slice(0, 2).join(' · ');

  return (
    <TouchableOpacity
      style={[S.card, compact && S.cardCompact]}
      onPress={onPress}
      activeOpacity={0.88}
    >
      <View style={S.top}>
        <Text style={S.title}>Affiner ton profil capillaire</Text>
        <Text style={S.pct}>{completion.percent}%</Text>
      </View>
      <View style={S.barBg}>
        <View style={[S.barFill, { width: `${completion.percent}%` }]} />
      </View>
      <Text style={S.sub}>
        Meilleures recos Black Cotton & routines — encore : {nextHint}
        {completion.missing.length > 2 ? '…' : ''}
      </Text>
      <View style={S.ctaRow}>
        <Text style={S.cta}>Compléter →</Text>
        <Ionicons name="chevron-forward" size={16} color={Colors.amber} />
      </View>
    </TouchableOpacity>
  );
}

const S = StyleSheet.create({
  card: {
    backgroundColor: Colors.amberLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.amber,
    padding: 14,
    marginBottom: 14,
  },
  cardCompact: { marginHorizontal: 20 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { flex: 1, fontSize: 14, fontFamily: 'DMSans_700Bold', color: Colors.ink, marginRight: 8 },
  pct: { fontSize: 16, fontFamily: 'Satoshi_500Medium', color: Colors.amberDark },
  barBg: {
    height: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.7)',
    overflow: 'hidden',
    marginBottom: 8,
  },
  barFill: { height: '100%', backgroundColor: Colors.amber, borderRadius: 999 },
  sub: { fontSize: 12, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, lineHeight: 17 },
  ctaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 4 },
  cta: { fontSize: 12, fontFamily: 'DMSans_700Bold', color: Colors.amberDark },
});
