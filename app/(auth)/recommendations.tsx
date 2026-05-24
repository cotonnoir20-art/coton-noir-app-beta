import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../src/theme/colors';

/** Redirection : le plan + la sauvegarde sont sur la dernière étape de l'onboarding. */
export default function RecommendationsScreen() {
  const router = useRouter();

  useEffect(() => {
    router.replace({ pathname: '/(auth)/onboarding', params: { signup: '1' } });
  }, [router]);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.loading}>
        <ActivityIndicator color={Colors.amber} />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
