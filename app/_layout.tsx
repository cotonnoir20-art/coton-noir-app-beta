import 'react-native-url-polyfill/auto';
import { useFonts } from 'expo-font';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
  Poppins_900Black,
} from '@expo-google-fonts/poppins';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';
import { AppProvider } from '../src/context/AppContext';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { BlackCottonProvider } from '../src/context/BlackCottonContext';
import { NotificationsProvider } from '../src/context/NotificationsContext';
import { AppTabBar } from '../src/components/AppTabBar';
import { BlackCottonFloatingAssistant } from '../src/components/blackCotton/BlackCottonFloatingAssistant';
import { LevelUpCelebration } from '../src/components/animations/LevelUpCelebration';
import { AchievementToast } from '../src/components/animations/AchievementToast';
import { AchievementsProvider } from '../src/context/AchievementsContext';
import { setupNotificationsHandler } from '../src/lib/dailyCoach';
import { WebProductionBlocker } from '../src/components/WebProductionBlocker';
import { WebBetaBanner } from '../src/components/WebBetaBanner';
import { DeviceIntegrityGuard } from '../src/components/DeviceIntegrityGuard';

setupNotificationsHandler();

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router   = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!session && !inAuthGroup) {
      router.replace('/(auth)/welcome');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [session, loading, segments]);

  const inAuthGroup = segments[0] === '(auth)';
  const showTabBar  = !!session && !loading && !inAuthGroup;

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="recipes"       options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="rewards"       options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="shop"          options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="tutorials"     options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="washday"       options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="community"     options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="box"           options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="discover"      options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="highlights"    options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="coiffures"     options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="hair-profile"  options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="codes"         options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="invite"        options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="partners"      options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="favorites"     options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="premium"       options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="legal"         options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="notifications" options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="avis"          options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="add-entry"     options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="add-washday"   options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="journal"       options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="hair-length"    options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="plan-soin"     options={{ presentation: 'transparentModal', animation: 'fade' }} />
        <Stack.Screen name="product"       options={{ presentation: 'card', animation: 'slide_from_right' }} />
        <Stack.Screen name="achievements"  options={{ presentation: 'card', animation: 'slide_from_right' }} />
      </Stack>

      {showTabBar && <AppTabBar />}

      {/* Black Cotton overlay — rendered last so it appears above everything */}
      {showTabBar && <BlackCottonFloatingAssistant />}

      {/* Célébration plein écran quand l'utilisatrice passe au niveau supérieur */}
      {!!session && <LevelUpCelebration />}

      {/* Toast de déblocage badge (file d'attente FIFO) */}
      {!!session && <AchievementToast />}
    </View>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
    Poppins_900Black,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    PlayfairDisplay_700Bold,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <WebProductionBlocker>
    <SafeAreaProvider style={{ flex: 1 }}>
      <WebBetaBanner />
      <View style={{ flex: 1 }}>
        <StatusBar style="dark" />
        <AuthProvider>
          <DeviceIntegrityGuard>
            <AppProvider>
              <AchievementsProvider>
                <NotificationsProvider>
                  <BlackCottonProvider>
                    <RootLayoutNav />
                  </BlackCottonProvider>
                </NotificationsProvider>
              </AchievementsProvider>
            </AppProvider>
          </DeviceIntegrityGuard>
        </AuthProvider>
      </View>
    </SafeAreaProvider>
    </WebProductionBlocker>
  );
}
