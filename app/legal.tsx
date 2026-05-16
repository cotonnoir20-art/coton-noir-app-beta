import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/theme/colors';
import { AppHeader } from '../src/components/AppHeader';

type Section = {
  id: string;
  title: string;
  emoji: string;
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
        text: 'Coton Noir\nEmail : contact@cotonnoir.app\nSite web : www.cotonnoir.app',
      },
      {
        heading: 'Directrice de la publication',
        text: 'La directrice de la publication est la représentante légale de Coton Noir.',
      },
      {
        heading: 'Hébergement',
        text: 'L\'application est hébergée par :\nSupabase Inc.\n970 Toa Payoh North, Singapour\nwww.supabase.com\n\nLes services d\'infrastructure sont fournis par Amazon Web Services (AWS) et Vercel.',
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
        text: 'Les présentes CGU régissent l\'utilisation de l\'application mobile Coton Noir, disponible sur iOS et Android. En téléchargeant et utilisant l\'application, vous acceptez sans réserve les présentes conditions.',
      },
      {
        heading: 'Accès et inscription',
        text: 'L\'utilisation de l\'application nécessite la création d\'un compte personnel. Vous vous engagez à fournir des informations exactes et à maintenir votre mot de passe confidentiel. Vous êtes seul responsable des activités effectuées depuis votre compte.',
      },
      {
        heading: 'Utilisation du service',
        text: 'Coton Noir est une application de suivi capillaire personnalisé. Les recommandations fournies (routines, produits, soins) sont données à titre informatif et ne remplacent pas l\'avis d\'un professionnel. L\'utilisatrice s\'engage à utiliser l\'application de manière conforme à sa destination.',
      },
      {
        heading: 'CotonCoins',
        text: 'Les CotonCoins sont une monnaie virtuelle interne à l\'application. Ils sont gagnés en réalisant des actions dans l\'app et peuvent être échangés contre des avantages partenaires. Les CotonCoins n\'ont aucune valeur monétaire réelle et ne peuvent pas être convertis en espèces.',
      },
      {
        heading: 'Abonnement Premium',
        text: 'Un abonnement payant donne accès à des fonctionnalités avancées. Le paiement est prélevé via l\'App Store (Apple) ou le Play Store (Google). L\'abonnement se renouvelle automatiquement sauf résiliation au moins 24h avant la date d\'échéance. Aucun remboursement n\'est possible pour la période en cours.',
      },
      {
        heading: 'Responsabilité',
        text: 'Coton Noir s\'efforce d\'assurer la disponibilité et la fiabilité de l\'application mais ne peut garantir un accès ininterrompu. Coton Noir ne saurait être tenu responsable des dommages indirects résultant de l\'utilisation ou de l\'impossibilité d\'utiliser l\'application.',
      },
      {
        heading: 'Modification des CGU',
        text: 'Coton Noir se réserve le droit de modifier les présentes CGU à tout moment. Les utilisatrices seront informées par notification ou par email. La poursuite de l\'utilisation de l\'application après modification vaut acceptation des nouvelles conditions.',
      },
      {
        heading: 'Droit applicable',
        text: 'Les présentes CGU sont soumises au droit français. Tout litige sera soumis à la compétence des tribunaux français.',
      },
    ],
  },
  {
    id: 'privacy',
    title: 'Politique de confidentialité',
    emoji: '🔒',
    content: [
      {
        heading: 'Données collectées',
        text: 'Coton Noir collecte les données suivantes :\n• Données d\'identification : prénom, adresse email\n• Données capillaires : type de cheveux, porosité, densité, longueur, objectifs, questionnaires d\'analyse\n• Photos d\'analyse capillaire : traitées temporairement pour le diagnostic IA (non conservées sur nos serveurs ; métadonnées légères uniquement)\n• Données d\'usage : routines complétées, CotonCoins, mesures de pousse\n• Données techniques : identifiant de session, sans logs de contenu capillaire en production',
      },
      {
        heading: 'Finalités du traitement',
        text: 'Vos données sont utilisées pour :\n• Gérer votre compte et authentification\n• Personnaliser vos recommandations capillaires\n• Suivre votre progression et vos routines\n• Améliorer nos services\n• Vous envoyer des notifications si vous y avez consenti',
      },
      {
        heading: 'Base légale',
        text: 'Le traitement de vos données repose sur :\n• Votre consentement (données capillaires, notifications)\n• L\'exécution du contrat (compte, abonnement)\n• Notre intérêt légitime (amélioration du service, sécurité)',
      },
      {
        heading: 'Partage des données',
        text: 'Vos données ne sont jamais vendues à des tiers. Elles peuvent être partagées avec :\n• Supabase (hébergement et base de données)\n• Nos partenaires uniquement avec votre accord explicite (codes promo, offres)\n\nTous nos prestataires sont soumis à des obligations contractuelles strictes de confidentialité.',
      },
      {
        heading: 'Conservation des données',
        text: 'Vos données de compte sont conservées pendant toute la durée de votre compte. Les historiques d\'analyses capillaires (questionnaire + résumé) sont conservés au maximum 24 mois, puis supprimés. En cas de suppression de compte, vos données personnelles sont effacées dans un délai de 30 jours, sauf obligation légale contraire.',
      },
      {
        heading: 'Sécurité',
        text: 'Vos données sont chiffrées en transit (HTTPS/TLS) et au repos chez notre hébergeur (Supabase / AWS). Les mots de passe sont hachés et jamais stockés en clair. L\'accès aux données est restreint par authentification et règles de sécurité au niveau de la base (RLS). Les photos d\'analyse ne sont pas stockées en base : elles transitent uniquement vers notre service IA sécurisé pour générer le diagnostic.',
      },
      {
        heading: 'Analyse capillaire IA',
        text: 'L\'analyse photo utilise un prestataire IA (Anthropic) via un serveur sécurisé Coton Noir. Seuls les champs capillaires utiles au diagnostic sont transmis (pas votre email). Le résultat détaillé s\'affiche dans l\'app ; seul un résumé est enregistré pour l\'historique. Une analyse d\'impact (DPIA) interne encadre ce traitement.',
      },
      {
        heading: 'Vos droits',
        text: 'Conformément au RGPD, vous disposez des droits suivants :\n• Accès à vos données\n• Rectification de vos données\n• Suppression de votre compte et de vos données\n• Portabilité de vos données\n• Opposition au traitement\n\nPour exercer ces droits : contact@cotonnoir.app',
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
        text: 'Coton Noir s\'engage à respecter le Règlement Général sur la Protection des Données (UE) 2016/679. En tant que responsable du traitement, nous mettons en œuvre toutes les mesures techniques et organisationnelles appropriées pour protéger vos données.',
      },
      {
        heading: 'Responsable du traitement',
        text: 'Le responsable du traitement des données est Coton Noir.\nPour toute question relative à vos données : contact@cotonnoir.app',
      },
      {
        heading: 'Transferts hors UE',
        text: 'Certaines données peuvent être transférées vers des serveurs situés hors de l\'Union Européenne (notamment aux États-Unis via AWS/Supabase). Ces transferts sont encadrés par des clauses contractuelles types approuvées par la Commission Européenne.',
      },
      {
        heading: 'Cookies et traceurs',
        text: 'L\'application mobile Coton Noir n\'utilise pas de cookies au sens strict. Des identifiants techniques anonymes peuvent être utilisés pour le bon fonctionnement de l\'app (session, préférences). Aucun traceur publicitaire tiers n\'est utilisé.',
      },
      {
        heading: 'Analyse d\'audience',
        text: 'Nous utilisons des outils d\'analyse d\'audience anonymisés pour comprendre l\'utilisation de l\'app et l\'améliorer. Ces données ne permettent pas de vous identifier personnellement.',
      },
      {
        heading: 'Droit à la portabilité',
        text: 'Vous pouvez demander l\'export de vos données dans un format lisible (JSON) en écrivant à contact@cotonnoir.app. Nous répondons dans un délai de 30 jours.',
      },
      {
        heading: 'Réclamation',
        text: 'Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une réclamation auprès de la CNIL :\nCommission Nationale de l\'Informatique et des Libertés\n3 Place de Fontenoy, 75007 Paris\nwww.cnil.fr',
      },
      {
        heading: 'Mise à jour',
        text: 'Cette politique de confidentialité a été mise à jour le 7 mai 2026. Toute modification substantielle vous sera notifiée par email ou via l\'application.',
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
                onPress={() => toggle(section.id)}
                activeOpacity={0.7}
              >
                <View style={S.accordionLeft}>
                  <View style={S.emojiBox}>
                    <Text style={S.emoji}>{section.emoji}</Text>
                  </View>
                  <Text style={S.accordionTitle}>{section.title}</Text>
                </View>
                <Ionicons
                  name={isOpen ? 'chevron-up' : 'chevron-down'}
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
            <Text style={S.contactEmail}>contact@cotonnoir.app</Text>
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
  headerTitle: { fontSize: 18, fontFamily: 'Poppins_600SemiBold', color: Colors.ink },

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
