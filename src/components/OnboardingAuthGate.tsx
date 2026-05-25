import { useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

/**
 * Redirige vers l’onboarding si le profil diagnostic est incomplet.
 * Laisse l’utilisatrice sur `/(auth)/onboarding` tant que nécessaire.
 */
export function OnboardingAuthGate({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  const { isAppReady, needsOnboarding } = useApp();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading || !session || !isAppReady) return;

    const inAuth = segments[0] === '(auth)';
    const authScreen = segments[1] as string | undefined;

    if (needsOnboarding) {
      const isAllowedOnboardingScreen =
        inAuth && (authScreen === 'onboarding' || authScreen === 'recommendations');
      if (!isAllowedOnboardingScreen) {
        router.replace('/(auth)/onboarding');
      }
      return;
    }

    if (
      inAuth &&
      authScreen !== 'login' &&
      authScreen !== 'recommendations' &&
      authScreen !== 'onboarding'
    ) {
      router.replace('/(tabs)');
    }
  }, [loading, session, isAppReady, needsOnboarding, segments, router]);

  return <>{children}</>;
}
