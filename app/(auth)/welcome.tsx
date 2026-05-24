import { Image } from 'expo-image';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/theme/colors';
import { Fonts } from '../../src/theme/typography';
import {
  MARKETING_HERO_SUBTITLE,
  MARKETING_HERO_TITLE,
  MARKETING_WELCOME_CTA_PRIMARY,
  MARKETING_WELCOME_CTA_SECONDARY,
  MARKETING_WELCOME_FEATURES,
} from '../../src/constants/marketingCopy';
import { resetOnboardingForNewDiagnostic } from '../../src/lib/startOnboardingDiagnostic';

export default function WelcomeScreen() {
  const router = useRouter();

  async function onStartDiagnostic() {
    await resetOnboardingForNewDiagnostic();
    router.push('/(auth)/onboarding');
  }

  return (
    <SafeAreaView style={S.safe}>
      <ScrollView
        contentContainerStyle={S.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={S.logoZone}>
          <View style={S.avatarShell}>
            <View style={S.avatarRing}>
              <Image
                source={require('../../assets/welcome-avatar.png')}
                style={S.avatar}
                contentFit="cover"
                accessibilityLabel="Black Cotton, mascotte Coton Noir"
              />
            </View>
          </View>
        </View>

        <View style={S.taglineZone}>
          <Text style={S.tagline}>{MARKETING_HERO_TITLE}</Text>
          <Text style={S.sub}>{MARKETING_HERO_SUBTITLE}</Text>
        </View>

        <Text style={S.featuresHeading}>Tout ce qu'il te faut</Text>
        <View style={S.featuresCard}>
          {MARKETING_WELCOME_FEATURES.map((f, i) => (
            <View
              key={f.title}
              style={[S.featureRow, i < MARKETING_WELCOME_FEATURES.length - 1 && S.featureRowBorder]}
            >
              <View style={S.featureIconWrap}>
                <Ionicons name={f.icon} size={18} color={Colors.amberDark} />
              </View>
              <View style={S.featureTextWrap}>
                <Text style={S.featureTitle}>{f.title}</Text>
                <Text style={S.featureSub}>{f.subtitle}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={S.ctaZone}>
          <TouchableOpacity
            style={S.primaryBtn}
            onPress={() => void onStartDiagnostic()}
            activeOpacity={0.88}
          >
            <Text style={S.primaryBtnText}>
              {MARKETING_WELCOME_CTA_PRIMARY}{' '}
              <Text style={S.primaryBtnAccent}>→</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={S.secondaryBtn}
            onPress={() => router.push('/(auth)/login')}
            activeOpacity={0.88}
          >
            <Text style={S.secondaryBtnText}>{MARKETING_WELCOME_CTA_SECONDARY}</Text>
          </TouchableOpacity>

          <Text style={S.footerNote}>Fait avec amour pour les cheveux texturés.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },

  logoZone: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    paddingBottom: 8,
  },
  avatarShell: {
    width: 168,
    height: 168,
    borderRadius: 84,
    backgroundColor: Colors.border,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRing: {
    width: 156,
    height: 156,
    borderRadius: 78,
    overflow: 'hidden',
    backgroundColor: Colors.bg,
  },
  avatar: {
    width: 156,
    height: 156,
    transform: [{ scale: 1.12 }],
  },

  taglineZone: { alignItems: 'center', marginBottom: 20 },
  tagline: {
    fontSize: 24,
    fontFamily: Fonts.display,
    color: Colors.ink,
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 10,
  },
  sub: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    textAlign: 'center',
    lineHeight: 21,
    maxWidth: 320,
  },

  featuresHeading: {
    fontSize: 12,
    fontFamily: 'DMSans_700Bold',
    color: Colors.warmGray,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 10,
    textAlign: 'center',
  },
  featuresCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    marginBottom: 22,
    overflow: 'hidden',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  featureRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  featureIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.amberLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  featureTextWrap: { flex: 1, minWidth: 0 },
  featureTitle: {
    fontSize: 14,
    fontFamily: Fonts.display,
    color: Colors.ink,
    marginBottom: 3,
  },
  featureSub: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    lineHeight: 17,
  },

  ctaZone: { gap: 12, paddingTop: 4 },
  primaryBtn: {
    backgroundColor: Colors.ink,
    borderRadius: 18,
    paddingVertical: 17,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontSize: 16,
    fontFamily: Fonts.display,
    color: Colors.white,
  },
  primaryBtnAccent: {
    color: Colors.amber,
    fontFamily: Fonts.display,
  },
  secondaryBtn: {
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.ink,
  },
  footerNote: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    textAlign: 'center',
    marginTop: 4,
  },
});
