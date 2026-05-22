import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { AppIconBox } from '../AppIconBox';
import { Colors } from '../../theme/colors';
import type { HomeIntent } from '../../lib/homeIntent';

type Props = {
  intent: HomeIntent;
};

export function HomeIntentCard({ intent }: Props) {
  const router = useRouter();

  return (
    <View style={s.wrap}>
      <Text style={s.eyebrow}>{intent.objective}</Text>
      <TouchableOpacity
        style={s.card}
        onPress={() =>
          intent.routeParams
            ? router.push({ pathname: intent.route, params: intent.routeParams } as any)
            : router.push(intent.route as any)
        }
        activeOpacity={0.88}
      >
        <AppIconBox
          name={intent.ion}
          backgroundColor={intent.ionBg}
          color={intent.ionColor}
          size={44}
          iconSize={22}
          borderRadius={14}
        />
        <View style={s.body}>
          <Text style={s.title}>{intent.title}</Text>
          <Text style={s.sub} numberOfLines={2}>{intent.sub}</Text>
        </View>
        <View style={s.cta}>
          <Text style={s.ctaText}>{intent.cta}</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { marginBottom: 18, paddingHorizontal: 14 },
  eyebrow: {
    fontSize: 10,
    fontFamily: 'DMSans_700Bold',
    color: Colors.warmGray,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
  },
  body: { flex: 1 },
  title: { fontSize: 14, fontFamily: 'DMSans_700Bold', color: Colors.ink, marginBottom: 4 },
  sub: { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, lineHeight: 15 },
  cta: {
    backgroundColor: Colors.ink,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  ctaText: { fontSize: 11, fontFamily: 'DMSans_700Bold', color: Colors.amber },
});
