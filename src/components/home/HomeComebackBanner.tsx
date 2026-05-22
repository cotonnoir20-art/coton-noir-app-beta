import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { BCEmojiAvatar } from '../blackCotton/BCEmojiAvatar';
import { Colors } from '../../theme/colors';

type Props = {
  daysAway: number;
  onDismiss: () => void;
};

export function HomeComebackBanner({ daysAway, onDismiss }: Props) {
  const router = useRouter();

  return (
    <View style={S.card}>
      <TouchableOpacity style={S.dismiss} onPress={onDismiss} hitSlop={12}>
        <Text style={S.dismissText}>✕</Text>
      </TouchableOpacity>
      <BCEmojiAvatar size={44} mood="encouraging" />
      <View style={S.body}>
        <Text style={S.title}>Content de te revoir</Text>
        <Text style={S.sub}>
          {daysAway >= 14
            ? `Ça fait ${daysAway} jours — aucune pression. Ton streak repart à 1 dès ta prochaine routine validée.`
            : 'Reprends en douceur : une routine courte suffit pour relancer la régularité.'}
        </Text>
        <View style={S.actions}>
          <TouchableOpacity
            style={S.primaryBtn}
            onPress={() => router.push('/(tabs)/routine?routine=daily' as any)}
          >
            <Text style={S.primaryText}>Routine courte (10 min)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={S.secondaryBtn}
            onPress={() => router.push('/washday' as any)}
          >
            <Text style={S.secondaryText}>Wash day simple</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const S = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: Colors.blush,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.rose,
    padding: 14,
    marginBottom: 14,
  },
  dismiss: { position: 'absolute', top: 8, right: 10, zIndex: 1 },
  dismissText: { fontSize: 14, color: Colors.warmGray },
  body: { flex: 1, paddingRight: 16 },
  title: { fontSize: 15, fontFamily: 'DMSans_700Bold', color: Colors.ink, marginBottom: 4 },
  sub: { fontSize: 12, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, lineHeight: 17, marginBottom: 10 },
  actions: { gap: 8 },
  primaryBtn: {
    backgroundColor: Colors.ink,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  primaryText: { fontSize: 12, fontFamily: 'DMSans_700Bold', color: Colors.amber },
  secondaryBtn: {
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.rose,
  },
  secondaryText: { fontSize: 12, fontFamily: 'DMSans_600SemiBold', color: Colors.rose },
});
