import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { HEALTH_SCORE_LOW_THRESHOLD } from '../../lib/homeGrowth';

type Props = {
  score: number;
  compact?: boolean;
};

/**
 * Pont diagnostic → action quand le score santé capillaire est bas.
 */
export function GrowthHealthActionBanner({ score, compact }: Props) {
  const router = useRouter();
  if (score >= HEALTH_SCORE_LOW_THRESHOLD) return null;

  return (
    <View style={[s.wrap, compact && s.wrapCompact]}>
      <View style={s.topRow}>
        <View style={s.iconWrap}>
          <Ionicons name="heart-outline" size={20} color={Colors.alertDark} />
        </View>
        <View style={s.textCol}>
          <Text style={s.title}>Score santé à renforcer ({score}/100)</Text>
          <Text style={s.sub}>
            Affine ta routine ou lance une analyse pour des conseils ciblés.
          </Text>
        </View>
      </View>
      <View style={s.actions}>
        <TouchableOpacity
          style={s.btn}
          onPress={() => router.push({ pathname: '/(tabs)/routine', params: { routine: 'daily' } } as any)}
          activeOpacity={0.88}
        >
          <Text style={s.btnText}>Routine</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.btn, s.btnPrimary]}
          onPress={() => router.push('/(tabs)/analyze' as any)}
          activeOpacity={0.88}
        >
          <Text style={[s.btnText, s.btnTextPrimary]}>Analyser</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    marginTop: 12,
    marginBottom: 4,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.alert,
    backgroundColor: Colors.alertLight,
    gap: 10,
  },
  wrapCompact: {
    marginHorizontal: 20,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: { flex: 1, gap: 4 },
  title: {
    fontSize: 13,
    fontFamily: 'DMSans_700Bold',
    color: Colors.ink,
  },
  sub: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    lineHeight: 17,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  btn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  btnPrimary: {
    backgroundColor: Colors.ink,
    borderColor: Colors.ink,
  },
  btnText: {
    fontSize: 12,
    fontFamily: 'DMSans_700Bold',
    color: Colors.ink,
  },
  btnTextPrimary: {
    color: '#fff',
  },
});
