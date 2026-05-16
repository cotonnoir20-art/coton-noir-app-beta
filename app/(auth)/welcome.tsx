import { Image } from 'expo-image';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../../src/theme/colors';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={S.safe}>

      <View style={S.logoZone}>
        <View style={S.avatarShell}>
          <View style={S.avatarRing}>
            <Image
              source={require('../../assets/welcome-avatar.png')}
              style={S.avatar}
              contentFit="cover"
            />
          </View>
        </View>
      </View>

      {/* Tagline */}
      <View style={S.taglineZone}>
        <Text style={S.tagline}>La routine capillaire{'\n'}faite pour toi.</Text>
        <Text style={S.sub}>
          Personnalisée, gamifiée et pensée{'\n'}pour les cheveux afro & bouclés.
        </Text>
      </View>

      {/* Stats sociales */}
      <View style={S.statsRow}>
        {[
          { val: '+2 000', label: 'utilisatrices' },
          { val: '4.9 ★', label: 'note moyenne'  },
          { val: '100%', label: 'naturel'         },
        ].map((s, i) => (
          <View key={i} style={S.statBox}>
            <Text style={S.statVal}>{s.val}</Text>
            <Text style={S.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* CTAs */}
      <View style={S.ctaZone}>
        <TouchableOpacity
          style={S.primaryBtn}
          onPress={() => router.push('/(auth)/onboarding')}
        >
          <Text style={S.primaryBtnText}>
            Commencer mon diagnostic{' '}
            <Text style={S.primaryBtnAccent}>→</Text>
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={S.secondaryBtn}
          onPress={() => router.push('/(auth)/login')}
        >
          <Text style={S.secondaryBtnText}>J'ai déjà un compte</Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: {
    flex: 1, backgroundColor: Colors.bg,
    justifyContent: 'space-between', paddingHorizontal: 28,
  },

  logoZone: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
  },
  avatarShell: {
    width: 214,
    height: 214,
    borderRadius: 107,
    backgroundColor: Colors.border,
    padding: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRing: {
    width: 200,
    height: 200,
    borderRadius: 100,
    overflow: 'hidden',
    backgroundColor: Colors.bg,
  },
  avatar: {
    width: 200,
    height: 200,
    transform: [{ scale: 1.12 }],
  },

  taglineZone: { alignItems: 'center', marginBottom: 28 },
  tagline: {
    fontSize: 30, fontFamily: 'Poppins_700Bold',
    color: Colors.ink, textAlign: 'center', lineHeight: 38, marginBottom: 12,
  },
  sub: {
    fontSize: 14, fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray, textAlign: 'center', lineHeight: 22,
  },

  statsRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: 18, paddingVertical: 16, paddingHorizontal: 20,
    marginBottom: 28,
  },
  statBox:  { alignItems: 'center', flex: 1 },
  statVal:  { fontSize: 18, fontFamily: 'DMSans_700Bold', color: Colors.ink, marginBottom: 2 },
  statLabel:{ fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray },

  ctaZone: { paddingBottom: 20, gap: 12 },
  primaryBtn: {
    backgroundColor: Colors.ink,
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontSize: 16,
    fontFamily: 'DMSans_700Bold',
    color: Colors.white,
  },
  primaryBtnAccent: {
    color: Colors.amber,
    fontFamily: 'DMSans_700Bold',
  },

  secondaryBtn: {
    borderRadius: 18, paddingVertical: 14,
    alignItems: 'center', borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryBtnText: {
    fontSize: 14, fontFamily: 'DMSans_500Medium',
    color: Colors.warmGray,
  },
});
