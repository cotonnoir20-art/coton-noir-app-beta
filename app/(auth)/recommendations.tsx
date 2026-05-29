import { useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSupabaseProducts } from '../../src/lib/useSupabaseProducts';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../../src/context/AppContext';
import { Colors } from '../../src/theme/colors';
import { Fonts } from '../../src/theme/typography';
import { OnboardingFinalPlanStep } from '../../src/components/onboarding/OnboardingFinalPlanStep';
import {
  buildOnboardingRecommendations,
  diagnosticSnapshotFromProfile,
} from '../../src/lib/onboardingRecommendations';
import { buildBlackCottonHomeRecommendations } from '../../src/lib/blackCottonRecommendations';
import { INITIAL_SCAN_RESULT_KEY } from '../../src/lib/onboardingStorage';
import type { OnboardingQuickScan } from '../../src/services/onboardingScanApi';

export default function RecommendationsScreen() {
  const router = useRouter();
  const { state, isAppReady } = useApp();
  const profile = state.profile;
  const { products } = useSupabaseProducts();

  const [initialScan, setInitialScan] = useState<OnboardingQuickScan | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(INITIAL_SCAN_RESULT_KEY).then(raw => {
      if (!raw) return;
      try { setInitialScan(JSON.parse(raw) as OnboardingQuickScan); } catch {}
    });
  }, []);

  const reco = useMemo(
    () => buildOnboardingRecommendations(diagnosticSnapshotFromProfile(profile), products),
    [profile, products],
  );

  const coachReco = useMemo(
    () => buildBlackCottonHomeRecommendations(profile),
    [profile],
  );

  if (!isAppReady) {
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
        <OnboardingFinalPlanStep
          reco={reco}
          name={profile.name}
          objective={profile.objective}
          resultsWeeks={8}
          hairTypeUnsure={!profile.hairType}
          hairType={profile.hairType || ''}
          porosity={profile.porosity || ''}
          density={profile.density || ''}
          problematics={profile.problematics ?? []}
          unlocked
          coachReco={coachReco}
          scanResult={initialScan ?? undefined}
          onRestart={() => router.push('/hair-profile' as any)}
        />

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
  enterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    backgroundColor: Colors.ink,
    borderRadius: 16,
    paddingVertical: 16,
  },
  enterBtnText: {
    fontSize: 15,
    fontFamily: Fonts.displayBold,
    color: Colors.amber,
  },
});
