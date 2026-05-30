import 'react-native-url-polyfill/auto';
import { useFonts } from 'expo-font';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { Stack, usePathname, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';
import { AppProvider } from '../src/context/AppContext';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { BlackCottonProvider } from '../src/context/BlackCottonContext';
import { NotificationsProvider } from '../src/context/NotificationsContext';
import { AppTabBar } from '../src/components/AppTabBar';
import { OnboardingAuthGate } from '../src/components/OnboardingAuthGate';
import { ProductMilestonesBridge } from '../src/components/ProductMilestonesBridge';
import { NotificationDeepLinkHandler } from '../src/components/NotificationDeepLinkHandler';
import { isNativeNotificationsSupported } from '../src/lib/notificationsPlatform';
import { LevelUpCelebration } from '../src/components/animations/LevelUpCelebration';
import { AchievementToast } from '../src/components/animations/AchievementToast';
import { AchievementsProvider } from '../src/context/AchievementsContext';
import { PremiumProvider } from '../src/context/PremiumContext';
import { setupNotificationsHandler } from '../src/lib/dailyCoach';
import { WebProductionBlocker } from '../src/components/WebProductionBlocker';
import { WebBetaBanner } from '../src/components/WebBetaBanner';
import { DeviceIntegrityGuard } from '../src/components/DeviceIntegrityGuard';
import { BrandSplashScreen } from '../src/components/splash/BrandSplashScreen';

setupNotificationsHandler();

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const pathname = usePathname();
  const router   = useRouter();

  // isLanding = page marketing racine (app/index.tsx), pas l'accueil tabs
  const inTabs = segments[0] === '(tabs)';
  const isLanding =
    !inTabs &&
    (pathname === '/' || pathname === '');

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === '(auth)';
    const authScreen  = segments[1] as string | undefined;
    const isPublicLegal =
      segments[0] === 'privacy' || segments[0] === 'cgv' || segments[0] === 'legal';
    const publicAuthScreens = new Set(['login', 'welcome', 'onboarding']);
    // recommendations nécessite une session — rediriger si non connectée
    const isRestrictedAuthScreen = inAuthGroup && !!authScreen && !publicAuthScreens.has(authScreen);
    if (!session && (!inAuthGroup && !isPublicLegal && !isLanding || isRestrictedAuthScreen)) {
      router.replace(Platform.OS === 'web' ? '/' : '/(auth)/welcome');
    }
    // Redirection post-login avec profil incomplet : OnboardingAuthGate
  }, [session, loading, segments, pathname, isLanding]);

  const inAuthGroup = segments[0] === '(auth)';
  const isPublicLegal =
    segments[0] === 'privacy' || segments[0] === 'cgv' || segments[0] === 'legal';
  const showTabBar  = !!session && !loading && !inAuthGroup && !isPublicLegal && !isLanding;

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="recipes"       options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="rewards"       options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="shop"          options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="tutorials"     options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="washday"       options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="routine-plan"  options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="community"     options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="hydra-challenge" options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="box"           options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="discover"      options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="growth"        options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="quarterly-bilan" options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="growth-calculator" options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="highlights"    options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="coiffures"     options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="hair-profile"  options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="codes"         options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="invite"        options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="partners"      options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="favorites"     options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="premium"       options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="legal"         options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="privacy"       options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="cgv"           options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="notifications" options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="avis"          options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="add-entry"     options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="add-washday"   options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="journal"       options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="hair-length"    options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="plan-soin"     options={{ presentation: 'transparentModal', animation: 'fade' }} />
        <Stack.Screen name="product"       options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="achievements"  options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="redeem"        options={{ presentation: 'card', animation: 'slide_from_right' }} />
      </Stack>

      {showTabBar && <AppTabBar />}

      {/* Black Cotton overlay — masqué jusqu'au branchement chatbot */}
      {/* {showTabBar && <BlackCottonFloatingAssistant />} */}

      {/* Célébration plein écran quand l'utilisatrice passe au niveau supérieur */}
      {!!session && <LevelUpCelebration />}

      {/* Toast de déblocage badge (file d'attente FIFO) */}
      {!!session && <AchievementToast />}
    </View>
  );
}

export default function RootLayout() {
  const [brandSplashDone, setBrandSplashDone] = useState(false);
  const [loaded, error] = useFonts({
    Satoshi_400Regular: require('../assets/fonts/Satoshi/Satoshi-Regular.ttf'),
    Satoshi_500Medium: require('../assets/fonts/Satoshi/Satoshi-Medium.ttf'),
    Satoshi_700Bold: require('../assets/fonts/Satoshi/Satoshi-Bold.ttf'),
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    /** Lecture éditoriale (Articles hero + détail) — ne pas utiliser ailleurs */
    PlayfairDisplay_700Bold,
  });

  useEffect(() => {
    if (error && __DEV__) {
      console.warn("[fonts] Chargement partiel des polices — l’app continue.", error);
    }
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  const showBrandSplash = loaded && !brandSplashDone;

  if (!loaded) {
    return <View style={{ flex: 1, backgroundColor: '#FDF8F4' }} />;
  }

  return (
    <WebProductionBlocker>
    <SafeAreaProvider style={{ flex: 1 }}>
      <WebBetaBanner />
      <View style={{ flex: 1 }}>
        <StatusBar style={showBrandSplash ? 'light' : 'dark'} />
        <AuthProvider>
          <DeviceIntegrityGuard>
            <AppProvider>
              <PremiumProvider>
              <AchievementsProvider>
                <NotificationsProvider>
                  <BlackCottonProvider>
                    <ProductMilestonesBridge />
                    {isNativeNotificationsSupported() ? <NotificationDeepLinkHandler /> : null}
                    <OnboardingAuthGate>
                      <RootLayoutNav />
                    </OnboardingAuthGate>
                  </BlackCottonProvider>
                </NotificationsProvider>
              </AchievementsProvider>
              </PremiumProvider>
            </AppProvider>
          </DeviceIntegrityGuard>
        </AuthProvider>
      </View>
      <BrandSplashScreen
        visible={showBrandSplash}
        onFinish={() => setBrandSplashDone(true)}
      />
    </SafeAreaProvider>
    </WebProductionBlocker>
  );
}
