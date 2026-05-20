import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../../src/components/AppHeader';
import { ShortcutsExplorer } from '../../src/components/shortcuts/ShortcutsExplorer';
import { Colors } from '../../src/theme/colors';

export default function ShortcutsTabScreen() {
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <AppHeader title="Raccourcis" subtitle="Tous tes outils et contenus au même endroit" rightAction="none" />
      <ShortcutsExplorer contentPaddingBottom={32} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
});
