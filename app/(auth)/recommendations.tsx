import { useMemo } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../src/context/AppContext';
import { Colors } from '../../src/theme/colors';
import { Type } from '../../src/theme/typography';
import { PlanReadyHeader } from '../../src/components/onboarding/PlanReadyHeader';
import { RoutineRecoCard } from '../../src/components/recommendations/RoutineRecoCard';
import { HomeRecommendedProductsCard } from '../../src/components/home/HomeRecommendedProductsCard';
import { HomeRecoExtras } from '../../src/components/home/HomeRecoExtras';
import { HomeBlackCottonRecommendations } from '../../src/components/home/HomeBlackCottonRecommendations';
import {
  buildOnboardingRecommendations,
  diagnosticSnapshotFromProfile,
} from '../../src/lib/onboardingRecommendations';

export default function RecommendationsScreen() {
  const router = useRouter();
  const { state, isAppReady, needsOnboarding } = useApp();
  const profile = state.profile;
  const hasPlanData = !!profile.careStyle && !!profile.objective;

  const reco = useMemo(
    () => buildOnboardingRecommendations(diagnosticSnapshotFromProfile(profile)),
    [profile],
  );

  if (!hasPlanData && (!isAppReady || needsOnboarding)) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.loading}>
          <ActivityIndicator color={Colors.amber} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        <PlanReadyHeader
          objective={profile.objective}
          resultsWeeks={8}
          hairTypeUnsure={!profile.hairType}
        />

        <View style={s.heroCard}>
          <Text style={s.heroKicker}>PLAN COMPLET</Text>
          <Text style={s.heroTitle}>Voici ta routine complète avant d’entrer dans ton espace.</Text>
          <Text style={s.heroSub}>
            Matin, soir, wash day, produits, recettes et conseils Black Cotton:
            tout est déjà calibré pour toi.
          </Text>
          <Text style={s.profileLine}>{reco.profileSummary}</Text>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Ta routine capillaire</Text>
          <RoutineRecoCard
            kicker="WASH DAY"
            title="Nettoyage & soin profond"
            icon="water-outline"
            accent="sage"
            steps={reco.weekly}
            tip="Démêle toujours avec du conditioner, des pointes vers les racines."
          />
          <RoutineRecoCard
            kicker="MATIN"
            title="Hydratation & coiffage"
            icon="sunny-outline"
            accent="amber"
            steps={reco.morning}
            tip="Coiffe sur cheveux humides pour une meilleure définition."
          />
          <RoutineRecoCard
            kicker="SOIR"
            title="Soins de nuit"
            icon="moon-outline"
            accent="slate"
            steps={reco.evening}
            tip="Bonnet en satin la nuit pour limiter la casse."
          />
        </View>

        <View style={s.flush14}>
          <HomeRecommendedProductsCard profile={profile} />
        </View>
        <View style={s.flush14}>
          <HomeRecoExtras profile={profile} />
        </View>
        <View style={s.flush20}>
          <HomeBlackCottonRecommendations profile={profile} />
        </View>

        <TouchableOpacity
          style={s.enterBtn}
          onPress={() => router.replace('/(tabs)')}
          activeOpacity={0.9}
          accessibilityRole="button"
          accessibilityLabel="Accéder à mon espace"
        >
          <Text style={s.enterBtnText}>Accéder à mon espace</Text>
          <Ionicons name="arrow-forward" size={18} color={Colors.amber} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 8,
  },
  heroCard: {
    backgroundColor: Colors.white,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
    marginBottom: 20,
  },
  heroKicker: {
    ...Type.kicker,
    color: Colors.amberDark,
    marginBottom: 6,
  },
  heroTitle: {
    fontSize: 22,
    fontFamily: 'Satoshi_700Bold',
    color: Colors.ink,
    lineHeight: 28,
    marginBottom: 8,
  },
  heroSub: {
    ...Type.body,
    color: Colors.warmGray,
    marginBottom: 10,
  },
  profileLine: {
    ...Type.caption,
    color: Colors.inkSoft,
  },
  section: {
    marginBottom: 8,
  },
  flush14: {
    marginHorizontal: -14,
  },
  flush20: {
    marginHorizontal: -20,
  },
  sectionTitle: {
    ...Type.cardTitle,
    color: Colors.ink,
    marginBottom: 10,
  },
  enterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
    backgroundColor: Colors.ink,
    borderRadius: 16,
    paddingVertical: 16,
  },
  enterBtnText: {
    fontSize: 15,
    fontFamily: 'DMSans_700Bold',
    color: Colors.amber,
  },
});
