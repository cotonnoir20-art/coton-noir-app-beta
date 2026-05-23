import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import { AppHeader } from '../src/components/AppHeader';
import { LegalDocumentView } from '../src/components/legal/LegalDocumentView';
import { PRIVACY_POLICY } from '../src/content/legalDocuments';
import { Colors } from '../src/theme/colors';

/** Politique de confidentialité — accessible sans connexion (stores + appcotonnoir.com/privacy). */
export default function PrivacyScreen() {
  return (
    <SafeAreaView style={S.safe} edges={['top']}>
      <AppHeader title={PRIVACY_POLICY.title} rightAction="none" />
      <LegalDocumentView document={PRIVACY_POLICY} />
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
});
