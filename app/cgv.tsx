import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import { AppHeader } from '../src/components/AppHeader';
import { LegalDocumentView } from '../src/components/legal/LegalDocumentView';
import { CGV } from '../src/content/legalDocuments';
import { Colors } from '../src/theme/colors';

/** CGV Premium — accessible sans connexion (appcotonnoir.com/cgv). */
export default function CgvScreen() {
  return (
    <SafeAreaView style={S.safe} edges={['top']}>
      <AppHeader title={CGV.title} rightAction="none" />
      <LegalDocumentView document={CGV} />
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
});
