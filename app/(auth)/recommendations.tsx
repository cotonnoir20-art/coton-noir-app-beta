import { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../src/theme/colors';
import { BlurredPaywall } from '../../src/components/onboarding/BlurredPaywall';
import {
  buildHomeAwaitingTeaser,
  buildOnboardingRecommendations,
  type DiagnosticSnapshot,
  type OnboardingRecommendations,
  type RecoRoutineStep,
} from '../../src/lib/onboardingRecommendations';
import type { CareStyleId } from '../../src/constants/careStyles';
import { CC_ONBOARDING_GIFT } from '../../src/lib/cotonCoins';

const ONBOARDING_STORAGE_KEY = '@coton_noir_onboarding';

function StepList({
  steps,
  startIndex = 0,
  keyPrefix,
}: {
  steps: RecoRoutineStep[];
  startIndex?: number;
  keyPrefix: string;
}) {
  return (
    <>
      {steps.map((step, i) => {
        const n = startIndex + i + 1;
        return (
          <View key={`${keyPrefix}-${n}`} style={s.stepRow}>
            <View style={s.stepNum}>
              <Text style={s.stepNumText}>{n}</Text>
            </View>
            <View style={s.stepBody}>
              <Text style={s.stepTitle}>{step.title}</Text>
              <Text style={s.stepMeta}>{step.duration}</Text>
              <Text style={s.stepDesc}>{step.desc}</Text>
            </View>
          </View>
        );
      })}
    </>
  );
}

/** Aperçu court : pas de longues listes qui suggèrent un scroll infini. */
function LockedTailContent({ reco }: { reco: OnboardingRecommendations }) {
  const eveningTail = reco.evening.slice(1);
  const weeklyPreview = reco.weekly.slice(0, 2);

  return (
    <View style={s.progressiveInner}>
      {eveningTail.length > 0 ? (
        <StepList steps={eveningTail} startIndex={1} keyPrefix="evening-tail" />
      ) : null}

      <Text style={[s.sectionLabel, s.sectionLabelInBlur]}>Routine hebdomadaire</Text>
      <Text style={s.blockTitle}>🚿 Wash day</Text>
      <StepList steps={weeklyPreview} keyPrefix="weekly" />
    </View>
  );
}

export default function RecommendationsScreen() {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState<DiagnosticSnapshot | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_STORAGE_KEY).then(raw => {
      if (!raw) {
        router.replace('/(auth)/onboarding');
        return;
      }
      try {
        const p = JSON.parse(raw) as Partial<DiagnosticSnapshot & { careStyle: CareStyleId }>;
        if (!p.hairType || !p.careStyle) {
          router.replace('/(auth)/onboarding');
          return;
        }
        setSnapshot({
          hairType: p.hairType,
          porosity: p.porosity ?? 'Moyenne',
          density: p.density ?? 'Moyenne',
          objective: p.objective ?? '',
          region: p.region ?? '',
          budget: p.budget ?? '',
          careStyle: p.careStyle,
        });
      } catch {
        router.replace('/(auth)/onboarding');
      }
    });
  }, [router]);

  const reco = useMemo(
    () => (snapshot ? buildOnboardingRecommendations(snapshot) : null),
    [snapshot],
  );

  if (!reco) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.loading}>
          <Text style={s.loadingText}>Préparation de tes recommandations…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const eveningPreview = reco.evening.slice(0, 1);
  const homeTeaser = buildHomeAwaitingTeaser(reco);

  return (
    <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
      <View style={s.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={s.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Retour"
        >
          <Ionicons name="chevron-back" size={22} color={Colors.ink} />
        </TouchableOpacity>
        <Text style={s.headerKicker}>Diagnostic terminé</Text>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.title}>Mes recommandations pour toi</Text>
        <Text style={s.subtitle}>{reco.profileSummary}</Text>

        <View style={s.coinsTeaser}>
          <Text style={s.coinsTeaserEmoji}>🎁</Text>
          <View style={s.coinsTeaserBody}>
            <Text style={s.coinsTeaserTitle}>+{CC_ONBOARDING_GIFT} CotonCoins à l'inscription</Text>
            <Text style={s.coinsTeaserSub}>Débloque tout en créant ton compte gratuit</Text>
          </View>
        </View>

        <Text style={s.sectionLabel}>Routine journalière</Text>

        <View style={s.block}>
          <Text style={s.blockTitle}>🌤️ Matin</Text>
          <StepList steps={reco.morning} keyPrefix="morning" />
        </View>

        <View style={[s.block, s.blockSoir]}>
          <Text style={s.blockTitle}>🌙 Soir</Text>
          <StepList steps={eveningPreview} keyPrefix="evening" />
          <BlurredPaywall
            locked
            progressive
            progressiveMaxHeight={300}
            fadeBottomColor={Colors.surface}
            homeTeaser={homeTeaser}
            style={s.progressivePaywall}
          >
            <LockedTailContent reco={reco} />
          </BlurredPaywall>
        </View>
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity
          style={s.primaryBtn}
          onPress={() =>
            router.replace({ pathname: '/(auth)/onboarding', params: { signup: '1' } })
          }
        >
          <Text style={s.primaryBtnText}>
            Créer mon compte <Text style={s.primaryBtnAccent}>→</Text>
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={s.loginLink}>
          <Text style={s.loginLinkText}>J'ai déjà un compte</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: 14, fontFamily: 'DMSans_400Regular', color: Colors.warmGray },
  header: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 8 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  headerKicker: {
    fontSize: 12,
    fontFamily: 'DMSans_700Bold',
    color: Colors.warmGray,
    letterSpacing: 0.5,
  },
  scroll: { paddingHorizontal: 20, paddingBottom: 24 },
  title: {
    fontSize: 26,
    fontFamily: 'Poppins_700Bold',
    color: Colors.ink,
    marginBottom: 8,
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    marginBottom: 14,
    lineHeight: 19,
  },
  coinsTeaser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.amberLight,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.amber,
    padding: 12,
    marginBottom: 18,
  },
  coinsTeaserEmoji: { fontSize: 26 },
  coinsTeaserBody: { flex: 1 },
  coinsTeaserTitle: { fontSize: 13, fontFamily: 'DMSans_700Bold', color: Colors.ink },
  coinsTeaserSub: { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, marginTop: 2 },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'DMSans_700Bold',
    color: Colors.amberDark,
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 6,
  },
  sectionLabelInBlur: {
    marginTop: 18,
    marginBottom: 8,
  },
  block: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 12,
  },
  blockSoir: {
    paddingBottom: 0,
    overflow: 'hidden',
  },
  progressivePaywall: {
    marginHorizontal: -14,
    marginTop: 8,
  },
  progressiveInner: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 8,
  },
  blockTitle: {
    fontSize: 15,
    fontFamily: 'DMSans_700Bold',
    color: Colors.ink,
    marginBottom: 12,
  },
  stepRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  stepNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.amber,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: { fontSize: 12, fontFamily: 'DMSans_700Bold', color: Colors.white },
  stepBody: { flex: 1 },
  stepTitle: { fontSize: 14, fontFamily: 'DMSans_700Bold', color: Colors.ink },
  stepMeta: { fontSize: 11, fontFamily: 'DMSans_600SemiBold', color: Colors.amberDark, marginTop: 2 },
  stepDesc: { fontSize: 12, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, marginTop: 4, lineHeight: 17 },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  primaryBtn: {
    backgroundColor: Colors.ink,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtnText: { fontSize: 16, fontFamily: 'DMSans_700Bold', color: Colors.white },
  primaryBtnAccent: { color: Colors.amber },
  loginLink: { alignItems: 'center', marginTop: 14 },
  loginLinkText: { fontSize: 13, fontFamily: 'DMSans_500Medium', color: Colors.warmGray },
});
