import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { Fonts } from '../../theme/typography';
import {
  MARKETING_LANDING_COPYRIGHT,
  MARKETING_LANDING_CTA_PRIMARY,
  MARKETING_LANDING_CTA_SECONDARY,
  MARKETING_LANDING_FEATURES,
  MARKETING_LANDING_FEATURES_TITLE,
  MARKETING_LANDING_FOOTER_LINE,
} from '../../constants/marketingCopy';
import { resetOnboardingForNewDiagnostic } from '../../lib/startOnboardingDiagnostic';

type FeatureIcon = (typeof MARKETING_LANDING_FEATURES)[number]['icon'];

function FeatureCard({
  icon,
  iconBg,
  iconColor,
  title,
  subtitle,
  style,
}: {
  icon: FeatureIcon;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
  style?: ViewStyle;
}) {
  return (
    <View style={[s.featureCard, style]}>
      <View style={[s.featureIconCircle, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <View style={s.featureTextCol}>
        <Text style={s.featureTitle}>{title}</Text>
        <Text style={s.featureSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

/** Landing web appcotonnoir.com — 6 blocs + CTAs (sans accroche « copilote »). */
export function LandingPage() {
  const router = useRouter();

  async function onStartDiagnostic() {
    await resetOnboardingForNewDiagnostic();
    router.push('/(auth)/onboarding');
  }

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={s.header}>
          <Image
            source={require('../../../assets/brand/auth-logo.png')}
            style={s.logo}
            contentFit="contain"
            accessibilityLabel="Coton Noir"
          />
          <Text style={s.brandName}>Coton Noir</Text>
        </View>

        <View style={s.ctaBlock}>
          <TouchableOpacity
            style={s.primaryBtn}
            onPress={() => void onStartDiagnostic()}
            activeOpacity={0.9}
            accessibilityRole="button"
            accessibilityLabel={MARKETING_LANDING_CTA_PRIMARY}
          >
            <Text style={s.primaryBtnText}>
              {MARKETING_LANDING_CTA_PRIMARY}{' '}
              <Text style={s.primaryBtnArrow}>→</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.secondaryBtn}
            onPress={() => router.push('/(auth)/login')}
            activeOpacity={0.88}
            accessibilityRole="button"
            accessibilityLabel={MARKETING_LANDING_CTA_SECONDARY}
          >
            <Text style={s.secondaryBtnText}>{MARKETING_LANDING_CTA_SECONDARY}</Text>
          </TouchableOpacity>
        </View>

        <Text style={s.featuresSectionTitle}>{MARKETING_LANDING_FEATURES_TITLE}</Text>

        <View style={s.featuresList}>
          {MARKETING_LANDING_FEATURES.map((f, i) => (
            <FeatureCard
              key={f.title}
              icon={f.icon}
              iconBg={f.iconBg}
              iconColor={f.iconColor}
              title={f.title}
              subtitle={f.subtitle}
              style={i < MARKETING_LANDING_FEATURES.length - 1 ? s.featureCardGap : undefined}
            />
          ))}
        </View>

        <Text style={s.footerLine}>{MARKETING_LANDING_FOOTER_LINE}</Text>
        <Text style={s.footerCopy}>{MARKETING_LANDING_COPYRIGHT}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 24,
  },
  logo: { width: 52, height: 52, marginBottom: 10 },
  brandName: {
    fontSize: 22,
    fontFamily: Fonts.display,
    color: Colors.ink,
    letterSpacing: 0.2,
  },
  ctaBlock: { marginBottom: 36 },
  primaryBtn: {
    backgroundColor: Colors.amber,
    borderRadius: 999,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryBtnText: {
    fontSize: 15,
    fontFamily: 'DMSans_700Bold',
    color: Colors.ink,
  },
  primaryBtnArrow: { color: Colors.ink },
  secondaryBtn: {
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.ink,
    backgroundColor: Colors.surface,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.ink,
  },
  featuresSectionTitle: {
    fontSize: 22,
    fontFamily: Fonts.display,
    color: Colors.ink,
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 30,
  },
  featuresList: { marginBottom: 28 },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
  },
  featureCardGap: { marginBottom: 10 },
  featureIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTextCol: { flex: 1, minWidth: 0 },
  featureTitle: {
    fontSize: 16,
    fontFamily: Fonts.display,
    color: Colors.ink,
    marginBottom: 6,
    lineHeight: 22,
  },
  featureSubtitle: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    lineHeight: 19,
  },
  footerLine: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    textAlign: 'center',
    marginBottom: 6,
  },
  footerCopy: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    textAlign: 'center',
    opacity: 0.85,
  },
});
