import { Redirect } from 'expo-router';

/** Ancienne route « Découvrir » → onglet Raccourcis. */
export default function DiscoverScreen() {
  return <Redirect href="/(tabs)/shortcuts" />;
}
