import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../theme/colors';
import type { LegalDocument } from '../../content/legalDocuments';
import { LEGAL_CONTACT } from '../../content/legalDocuments';

function plainLegalText(text: string): string {
  return text.replace(/\*\*/g, '');
}

type Props = {
  document: LegalDocument;
  footer?: React.ReactNode;
};

/** Affiche un document légal (titres + paragraphes). */
export function LegalDocumentView({ document, footer }: Props) {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.content}>
      <Text style={S.updated}>Mis à jour le {document.lastUpdated}</Text>
      <Text style={S.subtitle}>{document.subtitle}</Text>

      {document.blocks.map((block, i) => (
        <View key={i} style={S.block}>
          {block.heading ? <Text style={S.heading}>{block.heading}</Text> : null}
          <Text style={S.body}>{plainLegalText(block.text)}</Text>
        </View>
      ))}

      <View style={S.contactCard}>
        <Text style={S.contactTitle}>Contact</Text>
        <Text style={S.contactBody}>
          {document.id === 'cgv' ? 'Ventes & abonnements : ' : 'Données personnelles : '}
          <Text style={S.contactLink}>{LEGAL_CONTACT.emailLegal}</Text>
          {'\n'}Support : <Text style={S.contactLink}>{LEGAL_CONTACT.emailSupport}</Text>
        </Text>
      </View>

      {footer}
      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const S = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 },
  updated: {
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
    color: Colors.warmGray,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    lineHeight: 22,
    marginBottom: 20,
  },
  block: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  heading: {
    fontSize: 15,
    fontFamily: 'Satoshi_500Medium',
    color: Colors.ink,
    marginBottom: 10,
    lineHeight: 22,
  },
  body: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: Colors.ink,
    lineHeight: 23,
  },
  contactCard: {
    backgroundColor: Colors.amberLight,
    borderWidth: 1,
    borderColor: Colors.amber,
    borderRadius: 16,
    padding: 16,
    marginTop: 4,
  },
  contactTitle: {
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
    color: Colors.ink,
    marginBottom: 6,
  },
  contactBody: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    lineHeight: 21,
  },
  contactLink: {
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.amberDark,
  },
});
