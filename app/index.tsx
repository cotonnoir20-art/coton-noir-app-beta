import { Redirect, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Platform, View } from 'react-native';
import { LandingPage } from '../src/components/landing/LandingPage';
import { useAuth } from '../src/context/AuthContext';

/** Web : landing publique. Native : redirection vers welcome « Ta copilote… ». */
export default function IndexScreen() {
  const { session, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS !== 'web' || loading) return;
    if (session) {
      router.replace('/(tabs)');
    }
  }, [loading, session, router]);

  if (Platform.OS !== 'web') {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (loading || session) {
    return <View style={{ flex: 1, backgroundColor: '#FAF7F4' }} />;
  }

  return <LandingPage />;
}
