import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/theme/colors';
import { AppHeader } from '../src/components/AppHeader';
import { LEGAL_CONTACT } from '../src/content/legalDocuments';

type Section = {
  id: string;
  title: string;
  emoji: string;
  route?: '/privacy' | '/cgv';
  content: { heading?: string; text: string }[];
};

const SECTIONS: Section[] = [
  {
    id: 'mentions',
    title: 'Mentions légales',
    emoji: '🏢',
    content: [
      {
        heading: 'Éditeur de l\'application',
        text: `Coton Noir\nSite : ${LEGAL_CONTACT.site}\nE-mail : ${LEGAL_CONTACT.emailLegal}\nSupport : ${LEGAL_CONTACT.emailSupport}`,
      },
      {
        heading: 'Directrice de la publication',
        text: 'La directrice de la publication est la représentante légale de Coton Noir.',
      },
      {
        heading: 'Hébergement',
        text: 'L\'application est hébergée par :\nSupabase Inc.\n970 Toa Payoh North, Singapour\nwww.supabase.com\n\nVersion web PWA : Vercel Inc.\nInfrastructure : Amazon Web Services (AWS).',
      },
      {
        heading: 'Propriété intellectuelle',
        text: 'L\'ensemble des contenus présents sur l\'application Coton Noir (textes, images, logo, icônes, sons, logiciels) est la propriété exclusive de Coton Noir ou de ses partenaires. Toute reproduction, représentation, modification ou exploitation, même partielle, est strictement interdite sans autorisation préalable écrite.',
      },
    ],
  },
  {
    id: 'cgu',
    title: 'Conditions générales d\'utilisation',
    emoji: '📋',
    content: [
      {
        heading: 'Objet',
        text: 'Les présentes CGU régissent l\'utilisation de l\'application mobile et web Coton Noir (iOS, Android, PWA). En créant un compte ou en utilisant l\'application, vous acceptez sans réserve les présentes conditions.',
      },
      {
        heading: 'Accès et inscription',
        text: 'L\'utilisation de l\'application nécessite la création d\'un compte personnel (15 ans minimum). Vous vous engagez à fournir des informations exactes et à maintenir votre mot de passe confidentiel. Vous êtes seule responsable des activités effectuées depuis votre compte.',
      },
      {
        heading: 'Utilisation du service',
        text: 'Coton Noir est une application de suivi capillaire personnalisé. Les recommandations (routines, produits, soins, analyses IA) sont données à titre informatif et ne remplacent pas l\'avis d\'un professionnel de santé ou d\'un coiffeur.',
      },
      {
        heading: 'CotonCoins',
        text: 'Les CotonCoins sont une monnaie virtuelle interne. Ils sont gagnés en réalisant des actions dans l\'app et peuvent être échangés contre des avantages partenaires. Les CotonCoins n\'ont aucune valeur monétaire réelle et ne peuvent pas être convertis en espèces.',
      },
      {
        heading: 'Communauté',
        text: 'Les contenus que vous publiez (texte, photos) doivent respecter la loi et la bienveillance. Coton Noir se réserve le droit de modérer ou supprimer tout contenu inapproprié.',
      },
      {
        heading: 'Abonnement Premium',
        text: 'Les conditions tarifaires, l\'essai gratuit et la résiliation de l\'abonnement Premium sont détaillés dans les Conditions générales de vente (CGV).',
      },
      {
        heading: 'Modification des CGU',
        text: 'Coton Noir se réserve le droit de modifier les présentes CGU. Les utilisatrices seront informées par notification ou par e-mail. La poursuite de l\'utilisation vaut acceptation.',
      },
      {
        heading: 'Droit applicable',
        text: 'Les présentes CGU sont soumises au droit français. Tout litige sera soumis à la compétence des tribunaux français, sous réserve des dispositions protectrices du consommateur.',
      },
    ],
  },
  {
    id: 'cgv-link',
    title: 'Conditions générales de vente (Premium)',
    emoji: '💳',
    route: '/cgv',
    content: [
      {
        text: 'Tarifs, essai 7 jours, renouvellement, résiliation App Store / Google Play, droit de rétractation et réclamations — document complet.',
      },
    ],
  },
  {
    id: 'privacy-link',
    title: 'Politique de confidentialité',
    emoji: '🔒',
    route: '/privacy',
    content: [
      {
        text: 'Données collectées, finalités RGPD, analyse IA, communauté, sous-traitants, durées de conservation et vos droits — document complet.',
      },
    ],
  },
  {
    id: 'rgpd',
    title: 'RGPD & Cookies',
    emoji: '🇪🇺',
    content: [
      {
        heading: 'Conformité RGPD',
        text: 'Coton Noir respecte le Règlement (UE) 2016/679. Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos données.',
      },
      {
        heading: 'Responsable du traitement',
        text: `Coton Noir — ${LEGAL_CONTACT.emailLegal}`,
      },
      {
        heading: 'Transferts hors UE',
        text: 'Certains sous-traitants (Supabase/AWS, Anthropic) peuvent traiter des données hors UE, encadrées par des clauses contractuelles types.',
      },
      {
        heading: 'Cookies et traceurs',
        text: 'L\'application mobile n\'utilise pas de cookies publicitaires. La PWA web utilise des identifiants de session techniques. Aucun traceur publicitaire tiers.',
      },
      {
        heading: 'Réclamation CNIL',
        text: 'Commission Nationale de l\'Informatique et des Libertés\n3 Place de Fontenoy, 75007 Paris\nwww.cnil.fr',
      },
      {
        heading: 'Mise à jour',
        text: `Politique complète : ${LEGAL_CONTACT.site}/privacy — mise à jour le ${LEGAL_CONTACT.lastUpdated}.`,
      },
    ],
  },
];

export default function LegalScreen() {
  const router = useRouter();
  const [open, setOpen] = useState<string | null>(null);

  function toggle(id: string) {
    setOpen(prev => (prev === id ? null : id));
  }

  return (
    <SafeAreaView style={S.safe} edges={['top']}>
      {/* Header */}
      <AppHeader title="Informations légales" rightAction="none" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.content}>

        <Text style={S.intro}>
          Toutes les informations légales relatives à l'utilisation de l'application Coton Noir.
        </Text>

        {SECTIONS.map(section => {
          const isOpen = open === section.id;
          return (
            <View key={section.id} style={S.accordion}>
              <TouchableOpacity
                style={S.accordionHeader}
                onPress={() => {
                  if (section.route) {
                    router.push(section.route);
                    return;
                  }
                  toggle(section.id);
                }}
                activeOpacity={0.7}
              >
                <View style={S.accordionLeft}>
                  <View style={S.emojiBox}>
                    <Text style={S.emoji}>{section.emoji}</Text>
                  </View>
                  <Text style={S.accordionTitle}>{section.title}</Text>
                </View>
                <Ionicons
                  name={section.route ? 'open-outline' : isOpen ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={Colors.warmGray}
                />
              </TouchableOpacity>

              {isOpen && (
                <View style={S.accordionBody}>
                  {section.content.map((block, i) => (
                    <View key={i} style={[S.block, i > 0 && S.blockBorder]}>
                      {block.heading && (
                        <Text style={S.blockHeading}>{block.heading}</Text>
                      )}
                      <Text style={S.blockText}>{block.text}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}

        {/* Contact */}
        <View style={S.contactCard}>
          <Text style={S.contactTitle}>Une question ?</Text>
          <Text style={S.contactText}>
            Pour toute question relative à vos données ou à nos conditions, contactez-nous à{' '}
            <Text style={S.contactEmail}>{LEGAL_CONTACT.emailLegal}</Text>
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: 20, paddingBottom: 20 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 18, fontFamily: 'Satoshi_500Medium', color: Colors.ink },

  intro: {
    fontSize: 13, fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray, lineHeight: 20,
    marginTop: 20, marginBottom: 20,
  },

  accordion: {
    backgroundColor: Colors.surface,
    borderRadius: 16, borderWidth: 1, borderColor: Colors.border,
    marginBottom: 12, overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  accordionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  emojiBox: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: Colors.cream, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  emoji:          { fontSize: 18 },
  accordionTitle: { fontSize: 15, fontFamily: 'DMSans_600SemiBold', color: Colors.ink, flex: 1 },

  accordionBody: {
    borderTopWidth: 1, borderTopColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  block:        { padding: 16 },
  blockBorder:  { borderTopWidth: 1, borderTopColor: Colors.border },
  blockHeading: {
    fontSize: 12, fontFamily: 'DMSans_700Bold',
    color: Colors.ink, marginBottom: 6,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  blockText: {
    fontSize: 13, fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray, lineHeight: 21,
  },

  contactCard: {
    backgroundColor: Colors.amberLight,
    borderWidth: 1, borderColor: Colors.amber,
    borderRadius: 16, padding: 16, marginTop: 8,
  },
  contactTitle: { fontSize: 14, fontFamily: 'DMSans_700Bold', color: Colors.ink, marginBottom: 6 },
  contactText:  { fontSize: 13, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, lineHeight: 20 },
  contactEmail: { fontFamily: 'DMSans_600SemiBold', color: Colors.amber },
});
