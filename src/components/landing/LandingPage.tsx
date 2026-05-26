import { useRouter } from 'expo-router';
import {
  Linking,
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
  MARKETING_LANDING_HERO_SUBTITLE,
  MARKETING_LANDING_HERO_TITLE,
} from '../../constants/marketingCopy';
import { AuthBrandLogo } from '../auth/AuthBrandLogo';
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

/** Landing web appcotonnoir.com — proposition de valeur + CTAs + 7 blocs. */
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
          <AuthBrandLogo width={96} variant="rounded" />
        </View>

        <Text style={s.heroTitle}>{MARKETING_LANDING_HERO_TITLE}</Text>
        <Text style={s.heroSub}>{MARKETING_LANDING_HERO_SUBTITLE}</Text>

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

        <View style={s.ctaCard}>
          <Text style={s.ctaCardTitle}>Prête à révéler la beauté de tes cheveux ?</Text>
          <Text style={s.ctaCardSub}>
            Ton analyse personnalisée t'attend. C'est gratuit et ça prend moins de 3 minutes.
          </Text>
          <TouchableOpacity
            style={s.ctaCardBtn}
            onPress={() => void onStartDiagnostic()}
            activeOpacity={0.9}
            accessibilityRole="button"
            accessibilityLabel={MARKETING_LANDING_CTA_PRIMARY}
          >
            <Text style={s.ctaCardBtnText}>
              {MARKETING_LANDING_CTA_PRIMARY}{' '}
              <Text style={s.ctaCardBtnArrow}>→</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <View style={s.footer}>
          <View style={s.footerDivider} />

          <View style={s.footerBrand}>
            <AuthBrandLogo width={36} variant="rounded" />
            <View style={s.footerBrandText}>
              <Text style={s.footerBrandName}>Coton Noir</Text>
              <Text style={s.footerBrandTagline}>Ta copilote capillaire</Text>
            </View>
            <TouchableOpacity
              style={s.footerInsta}
              onPress={() => {}}
              activeOpacity={0.75}
              accessibilityRole="link"
              accessibilityLabel="Instagram Coton Noir"
            >
              <Ionicons name="logo-instagram" size={20} color={Colors.warmGray} />
            </TouchableOpacity>
          </View>

          <View style={s.footerLinks}>
            <TouchableOpacity onPress={() => router.push('/legal' as any)} activeOpacity={0.7}>
              <Text style={s.footerLink}>CGU</Text>
            </TouchableOpacity>
            <Text style={s.footerLinkSep}>·</Text>
            <TouchableOpacity onPress={() => router.push('/privacy' as any)} activeOpacity={0.7}>
              <Text style={s.footerLink}>Confidentialité</Text>
            </TouchableOpacity>
            <Text style={s.footerLinkSep}>·</Text>
            <TouchableOpacity
              onPress={() => void Linking.openURL('mailto:contact@appcotonnoir.com')}
              activeOpacity={0.7}
            >
              <Text style={s.footerLink}>Contact</Text>
            </TouchableOpacity>
          </View>

          <Text style={s.footerCopy}>{MARKETING_LANDING_COPYRIGHT}</Text>
          <Text style={s.footerConçu}>{MARKETING_LANDING_FOOTER_LINE}</Text>
        </View>
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
    paddingTop: 45,
    paddingBottom: 20,
  },
  heroTitle: {
    fontSize: 26,
    fontFamily: Fonts.displayBold,
    color: Colors.ink,
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  heroSub: {
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
    paddingHorizontal: 8,
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
  ctaCard: {
    backgroundColor: Colors.ink,
    borderRadius: 24,
    padding: 24,
    marginBottom: 28,
    alignItems: 'center',
  },
  ctaCardTitle: {
    fontSize: 20,
    fontFamily: Fonts.displayBold,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 10,
  },
  ctaCardSub: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 20,
  },
  ctaCardBtn: {
    backgroundColor: Colors.amber,
    borderRadius: 999,
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignItems: 'center',
  },
  ctaCardBtnText: {
    fontSize: 15,
    fontFamily: 'DMSans_700Bold',
    color: Colors.ink,
  },
  ctaCardBtnArrow: { color: Colors.ink },
  footer: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  footerDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginBottom: 20,
  },
  footerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  footerBrandText: { flex: 1 },
  footerBrandName: {
    fontSize: 15,
    fontFamily: Fonts.displayBold,
    color: Colors.ink,
    lineHeight: 20,
  },
  footerBrandTagline: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    lineHeight: 17,
  },
  footerInsta: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.bgShell,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  footerLink: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
  },
  footerLinkSep: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.border,
  },
  footerCopy: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    opacity: 0.75,
    marginBottom: 4,
  },
  footerConçu: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    opacity: 0.6,
  },
});
