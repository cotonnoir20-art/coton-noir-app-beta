import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BCEmojiAvatar } from '../blackCotton/BCEmojiAvatar';
import { Colors } from '../../theme/colors';
import { Type } from '../../theme/typography';

type Props = {
  onDismiss: () => void;
};

export function HomeDayZeroRoutineBanner({ onDismiss }: Props) {
  const router = useRouter();

  const openRoutinePlan = () => {
    onDismiss();
    router.push({ pathname: '/routine-plan', params: { kind: 'daily' } } as any);
  };

  return (
    <View style={s.wrap}>
      <View style={s.card}>
        <View style={s.head}>
          <BCEmojiAvatar size={44} mood="coaching" />
          <View style={s.headText}>
            <Text style={s.kicker}>PREMIER PAS</Text>
            <Text style={s.title}>Définir ma routine du matin</Text>
          </View>
          <TouchableOpacity
            onPress={onDismiss}
            style={s.closeBtn}
            accessibilityRole="button"
            accessibilityLabel="Fermer"
          >
            <Ionicons name="close" size={18} color={Colors.warmGray} />
          </TouchableOpacity>
        </View>
        <Text style={s.body}>
          On part de tes recommandations — ajoute tes produits et tes étapes pour que chaque matin soit simple.
        </Text>
        <TouchableOpacity style={s.cta} onPress={openRoutinePlan} activeOpacity={0.88}>
          <Text style={s.ctaText}>Définir ma routine matin</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={onDismiss} style={s.later} activeOpacity={0.7}>
          <Text style={s.laterText}>Plus tard</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { marginBottom: 12, paddingHorizontal: 0 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.amber,
    padding: 16,
    shadowColor: Colors.ink,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  headText: { flex: 1 },
  kicker: {
    fontSize: 10,
    fontFamily: 'DMSans_700Bold',
    color: Colors.amber,
    letterSpacing: 1,
  },
  title: {
    ...Type.sectionTitle,
    color: Colors.ink,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    lineHeight: 19,
    marginBottom: 14,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.ink,
    borderRadius: 14,
    paddingVertical: 13,
  },
  ctaText: { fontSize: 14, fontFamily: 'DMSans_700Bold', color: '#fff' },
  later: { marginTop: 10, alignItems: 'center', paddingVertical: 4 },
  laterText: { fontSize: 12, fontFamily: 'DMSans_600SemiBold', color: Colors.warmGray },
});
