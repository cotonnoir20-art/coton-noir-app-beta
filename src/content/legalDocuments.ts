/**
 * Textes légaux Coton Noir — source unique (app + export web appcotonnoir.com).
 * Compléter [SIRET] et [Raison sociale] avant publication stores.
 */

export const LEGAL_CONTACT = {
  site: 'https://appcotonnoir.com',
  emailLegal: 'contact@appcotonnoir.com',
  emailSupport: 'support@appcotonnoir.com',
  lastUpdated: '19 mai 2026',
} as const;

export type LegalBlock = { heading?: string; text: string };

export type LegalDocument = {
  id: string;
  title: string;
  subtitle: string;
  lastUpdated: string;
  blocks: LegalBlock[];
};

export const PRIVACY_POLICY: LegalDocument = {
  id: 'privacy',
  title: 'Politique de confidentialité',
  subtitle: 'Comment Coton Noir collecte, utilise et protège vos données personnelles.',
  lastUpdated: LEGAL_CONTACT.lastUpdated,
  blocks: [
    {
      heading: '1. Responsable du traitement',
      text:
        'L\'application Coton Noir (iOS, Android et version web PWA) est éditée par Coton Noir.\n\n' +
        '• Site : appcotonnoir.com\n' +
        '• Contact données personnelles : contact@appcotonnoir.com\n' +
        '• Support utilisateur : support@appcotonnoir.com\n\n' +
        'Pour toute question relative à vos données ou à l\'exercice de vos droits, écrivez à contact@appcotonnoir.com (objet : « Données personnelles »).',
    },
    {
      heading: '2. Données que nous collectons',
      text:
        'Selon les fonctionnalités que vous utilisez, nous pouvons traiter :\n\n' +
        '**Compte et identité**\n' +
        '• Prénom, adresse e-mail, identifiant de compte (Supabase Auth)\n' +
        '• Mot de passe (stocké sous forme hachée — jamais en clair)\n\n' +
        '**Profil capillaire**\n' +
        '• Type de cheveux, porosité, densité, longueur (repères corporels et/ou cm), objectifs, problématiques, budget, région, style de coiffure protectrice\n\n' +
        '**Suivi d\'usage**\n' +
        '• Routines validées (matin, soir, wash day), mesures de pousse par zone, historique CotonCoins, niveaux, streak, favoris (articles, produits, recettes en local)\n' +
        '• Plans de routine personnalisés, notes sur l\'état des cheveux\n\n' +
        '**Analyse capillaire (Black Cotton)**\n' +
        '• Photos que vous choisissez d\'importer (racines, longueurs, pointes)\n' +
        '• Réponses au questionnaire d\'analyse\n' +
        '• Résultats : score, synthèse, recommandations — un résumé est conservé pour l\'historique\n\n' +
        '**Communauté** (si vous publiez)\n' +
        '• Texte du post, photos (dont avant/après), type de publication, likes\n' +
        '• Prénom affiché sur le post\n\n' +
        '**Abonnement Premium**\n' +
        '• Statut d\'abonnement, dates d\'essai ou de renouvellement (via App Store, Google Play ou prestataire de paiement web)\n' +
        '• Nous ne stockons pas vos numéros de carte bancaire\n\n' +
        '**Technique et sécurité**\n' +
        '• Identifiants de session, logs techniques limités, événements produit anonymisés (ex. « première routine validée »)\n' +
        '• Sur mobile : tokens d\'authentification dans le stockage sécurisé de l\'appareil\n' +
        '• Sur web (PWA) : session en sessionStorage lorsque le mode staging est activé — pas de JWT en localStorage en production',
    },
    {
      heading: '3. Finalités et bases légales',
      text:
        '• Création de compte, connexion → exécution du contrat (CGU)\n' +
        '• Personnalisation des routines et recommandations → contrat + consentement\n' +
        '• Analyse photo IA → consentement (import volontaire de photos)\n' +
        '• Communauté et défis → exécution du contrat\n' +
        '• CotonCoins, niveaux, récompenses partenaires → exécution du contrat\n' +
        '• Abonnement Premium → exécution du contrat (CGV)\n' +
        '• Notifications (rappels routine, wash day) → consentement (paramétrable)\n' +
        '• Amélioration du service, statistiques produit → intérêt légitime\n' +
        '• Sécurité, prévention des abus → intérêt légitime',
    },
    {
      heading: '4. Photos et intelligence artificielle',
      text:
        'L\'analyse capillaire envoie vos photos et réponses de questionnaire à notre serveur sécurisé (Supabase Edge Function), qui les transmet au prestataire IA **Anthropic** uniquement pour générer le diagnostic affiché dans l\'app.\n\n' +
        '• Les photos ne sont **pas** conservées comme fichiers sur nos serveurs après traitement\n' +
        '• Seuls un score, une synthèse textuelle et des métadonnées d\'analyse peuvent être enregistrés pour votre historique\n' +
        '• Votre adresse e-mail n\'est pas transmise au prestataire IA\n' +
        '• Vous pouvez refuser l\'analyse photo en n\'utilisant pas cette fonctionnalité\n\n' +
        'Le coach Black Cotton (conseils contextuels) utilise le même type de traitement serveur, sans revente de vos données.',
    },
    {
      heading: '5. Communauté et contenus publiés',
      text:
        'Les publications (texte, photos, avant/après) sont visibles par les autres utilisatrices de l\'application. Ne publiez pas d\'informations que vous ne souhaitez pas partager.\n\n' +
        'Les images sont stockées sur l\'infrastructure Supabase Storage, avec accès contrôlé par des règles de sécurité (RLS). Vous pouvez demander la suppression d\'un post en contactant support@appcotonnoir.com.',
    },
    {
      heading: '6. CotonCoins et partenaires',
      text:
        'Les **CotonCoins (CC)** sont une monnaie virtuelle interne : elles n\'ont pas de valeur monétaire en dehors de l\'application et ne sont pas convertibles en espèces.\n\n' +
        'L\'échange de CC contre un code promo partenaire peut impliquer la communication de votre identifiant d\'échange ou du code à la marque partenaire, **uniquement** lorsque vous déclenchez volontairement l\'échange dans le catalogue récompenses.',
    },
    {
      heading: '7. Sous-traitants et hébergement',
      text:
        'Vos données peuvent être traitées par :\n\n' +
        '• **Supabase** (authentification, base de données, stockage, fonctions serveur) — Singapour / AWS\n' +
        '• **Vercel** (hébergement de la version web PWA)\n' +
        '• **Apple** et **Google** (achats in-app, selon votre plateforme)\n' +
        '• **Anthropic** (analyse IA, via notre serveur)\n' +
        '• Prestataire de paiement web (ex. Stripe), le cas échéant, pour Premium sur navigateur\n\n' +
        'Ces prestataires agissent en qualité de sous-traitants ou de responsables conjoints selon leur rôle, dans le cadre de clauses contractuelles et, le cas échéant, de clauses contractuelles types (CCT) pour les transferts hors UE.',
    },
    {
      heading: '8. Transferts hors Union européenne',
      text:
        'Certains sous-traitants (notamment Supabase/AWS, Anthropic) peuvent traiter des données depuis des pays tiers, dont les États-Unis. Ces transferts sont encadrés par des garanties appropriées (CCT, mesures complémentaires) conformément au RGPD.',
    },
    {
      heading: '9. Durée de conservation',
      text:
        '• **Compte actif** : données conservées tant que le compte existe\n' +
        '• **Historique d\'analyses** : résumés conservés jusqu\'à 24 mois, puis suppression ou anonymisation\n' +
        '• **Posts communauté** : jusqu\'à suppression par vous ou modération\n' +
        '• **Suppression de compte** : effacement ou anonymisation sous 30 jours, sauf obligation légale de conservation (ex. facturation)\n' +
        '• **Logs techniques** : durée limitée, proportionnée aux besoins de sécurité',
    },
    {
      heading: '10. Sécurité',
      text:
        'Nous appliquons des mesures techniques et organisationnelles : chiffrement HTTPS/TLS, mots de passe hachés, règles d\'accès en base (Row Level Security), séparation des clés API côté serveur, pas de clé « service role » dans l\'application mobile.\n\n' +
        'Aucune mesure n\'offre une sécurité absolue ; en cas d\'incident susceptible d\'affecter vos droits, nous vous informerons dans les délais prévus par la réglementation.',
    },
    {
      heading: '11. Vos droits (RGPD)',
      text:
        'Vous disposez des droits d\'**accès**, de **rectification**, d\'**effacement**, de **limitation**, d\'**opposition** et de **portabilité** ( lorsque applicable ).\n\n' +
        '• Exercer vos droits : contact@appcotonnoir.com\n' +
        '• Supprimer votre compte : depuis Profil → Paramètres, ou par e-mail\n' +
        '• Export de données : sur demande, format structuré (JSON) sous 30 jours\n\n' +
        'Réclamation auprès de la **CNIL** : www.cnil.fr — 3 Place de Fontenoy, 75007 Paris.',
    },
    {
      heading: '12. Mineurs',
      text:
        'Coton Noir s\'adresse aux personnes **âgées de 15 ans et plus**. Si vous avez moins de 15 ans, vous ne devez pas utiliser l\'application sans l\'accord d\'un représentant légal. Si nous apprenons qu\'un compte a été créé en violation de cette règle, nous pourrons le supprimer.',
    },
    {
      heading: '13. Version web (PWA) et traceurs',
      text:
        'La version navigateur n\'utilise pas de cookies publicitaires tiers. Des identifiants techniques (session) peuvent être nécessaires au fonctionnement. En production web restreinte, l\'accès complet à l\'app peut être limité au profit des applications mobiles — voir paramètres de déploiement.',
    },
    {
      heading: '14. Modifications',
      text:
        `Dernière mise à jour : ${LEGAL_CONTACT.lastUpdated}.\n\n` +
        'Toute modification substantielle de cette politique vous sera notifiée par e-mail ou via l\'application. La date de mise à jour figure en tête de document.',
    },
  ],
};

export const CGV: LegalDocument = {
  id: 'cgv',
  title: 'Conditions générales de vente',
  subtitle: 'Abonnements Premium et achats numériques dans l\'application Coton Noir.',
  lastUpdated: LEGAL_CONTACT.lastUpdated,
  blocks: [
    {
      heading: '1. Objet',
      text:
        'Les présentes Conditions Générales de Vente (CGV) régissent la souscription et l\'utilisation de l\'**offre Premium** et, le cas échéant, de tout contenu ou service numérique payant proposé dans l\'application **Coton Noir** (ci-après « l\'Application »), éditée par Coton Noir (ci-après « le Vendeur »).\n\n' +
        'Les CGV complètent les Conditions générales d\'utilisation (CGU), accessibles depuis Profil → Légal. En cas de contradiction, les CGV prévalent pour les aspects tarifaires et contractuels de l\'abonnement Premium.',
    },
    {
      heading: '2. Informations sur le Vendeur',
      text:
        '**Coton Noir**\n' +
        'Site : appcotonnoir.com\n' +
        'E-mail : contact@appcotonnoir.com\n' +
        'Support : support@appcotonnoir.com\n\n' +
        '[Raison sociale, adresse du siège social et numéro SIRET à compléter avant mise en ligne des paiements.]',
    },
    {
      heading: '3. Description de l\'offre Premium',
      text:
        'L\'abonnement **Premium** débloque des fonctionnalités avancées, notamment :\n\n' +
        '• Analyse capillaire photo approfondie (Black Cotton)\n' +
        '• Contenus experts exclusifs (masterclass, guides, tutoriels Premium)\n' +
        '• Multiplicateur CotonCoins ×2 sur les actions éligibles\n' +
        '• Box digitale mensuelle, codes promo partenaires exclusifs\n' +
        '• Historique étendu, export PDF bilan, multi-profils (jusqu\'à 3)\n' +
        '• Support prioritaire\n\n' +
        'Le détail des fonctionnalités est présenté dans l\'Application avant achat et peut évoluer ; les fonctionnalités essentielles de l\'Application restent accessibles en version gratuite.',
    },
    {
      heading: '4. Tarifs (TTC)',
      text:
        'Prix indicatifs en vigueur au ' +
        LEGAL_CONTACT.lastUpdated +
        ' :\n\n' +
        '• **Abonnement mensuel** : 9,99 € TTC / mois\n' +
        '• **Abonnement annuel** : 39,99 € TTC / an (équivalent ~3,33 € / mois)\n\n' +
        'Les prix affichés dans l\'App Store ou le Google Play Store (ou la page de paiement web) font foi en cas de différence liée à la devise ou aux taxes locales. Le Vendeur se réserve le droit de modifier ses tarifs pour l\'avenir ; tout changement s\'applique aux nouveaux abonnements ou au renouvellement, avec information préalable.',
    },
    {
      heading: '5. Essai gratuit',
      text:
        'Un **essai gratuit de 7 jours** peut être proposé aux nouvelles abonnées Premium (une fois par compte, selon éligibilité affichée dans l\'app).\n\n' +
        '• Si vous ne résiliez pas avant la fin de l\'essai, l\'abonnement devient payant au tarif en vigueur (mensuel par défaut si non précisé autrement)\n' +
        '• Un rappel peut vous être envoyé par e-mail environ 24 h avant la fin de l\'essai\n' +
        '• Les conditions exactes de l\'essai sont celles affichées au moment de la souscription sur votre plateforme (Apple/Google)',
    },
    {
      heading: '6. Commande et paiement',
      text:
        '**Sur iOS** : paiement via votre compte Apple (App Store). Apple agit comme intermédiaire de paiement.\n\n' +
        '**Sur Android** : paiement via Google Play.\n\n' +
        '**Sur web** (le cas échéant) : paiement via le prestataire sécurisé indiqué sur la page de checkout (ex. Stripe).\n\n' +
        'Le contrat de vente est conclu lors de la confirmation de paiement par la plateforme ou le prestataire. Vous recevez une confirmation par e-mail de la plateforme concernée.',
    },
    {
      heading: '7. Durée, renouvellement et résiliation',
      text:
        'L\'abonnement est conclu pour la durée choisie (1 mois ou 1 an) avec **renouvellement automatique** tacite pour la même période, sauf résiliation.\n\n' +
        '**Résiliation :**\n' +
        '• iOS : Réglages → [Votre nom] → Abonnements → Coton Noir → Annuler\n' +
        '• Android : Google Play → Paiements et abonnements → Abonnements → Coton Noir → Annuler\n' +
        '• Web : selon les instructions du prestataire de paiement ou support@appcotonnoir.com\n\n' +
        'La résiliation prend effet à la **fin de la période en cours**. Aucun remboursement au prorata de la période entamée, sauf disposition légale impérative ou geste commercial du Vendeur.',
    },
    {
      heading: '8. Droit de rétractation',
      text:
        'Conformément aux articles L221-28 et suivants du Code de la consommation, le droit de rétractation de 14 jours **ne s\'applique pas** aux contenus numériques fournis immédiatement après achat, **lorsque** vous avez expressément accepté la mise à disposition immédiate et renoncé à votre droit de rétractation (case à cocher ou équivalent sur la plateforme de paiement).\n\n' +
        'Pour toute demande exceptionnelle, contactez support@appcotonnoir.com ; les remboursements Apple/Google sont soumis à leurs propres politiques.',
    },
    {
      heading: '9. CotonCoins et récompenses partenaires',
      text:
        'Les CotonCoins gagnés ou dépensés dans l\'Application ne constituent pas une monnaie légale. Les échanges contre codes partenaires sont soumis aux conditions de la marque partenaire. Le Vendeur n\'est pas responsable de la disponibilité des stocks ou offres chez les partenaires tiers.',
    },
    {
      heading: '10. Disponibilité et modifications du service',
      text:
        'Le Vendeur s\'efforce d\'assurer l\'accès à Premium 24h/24 et 7j/7, sous réserve de maintenance et de force majeure. Les fonctionnalités Premium peuvent évoluer ; en cas de suppression substantielle, les abonnées en cours seront informées dans un délai raisonnable.',
    },
    {
      heading: '11. Responsabilité',
      text:
        'Coton Noir est un outil d\'accompagnement capillaire. Les conseils, analyses IA et contenus **ne remplacent pas** un avis médical ou professionnel (dermatologue, trichologue, coiffeur). Le Vendeur ne saurait être tenu responsable des dommages indirects liés à l\'utilisation des recommandations.\n\n' +
        'La responsabilité du Vendeur, toutes causes confondues, est limitée au montant des sommes effectivement payées par l\'utilisatrice pour Premium sur les **12 derniers mois**, sauf faute lourde ou dol.',
    },
    {
      heading: '12. Réclamations et médiation',
      text:
        'Pour toute réclamation : support@appcotonnoir.com (réponse visée sous 5 jours ouvrés).\n\n' +
        'Conformément à l\'article L612-1 du Code de la consommation, vous pouvez recourir gratuitement à un médiateur de la consommation en cas de litige non résolu. [Coordonnées du médiateur à compléter avant publication.]\n\n' +
        'Plateforme européenne de règlement en ligne des litiges : https://ec.europa.eu/consumers/odr',
    },
    {
      heading: '13. Droit applicable',
      text:
        'Les présentes CGV sont soumises au **droit français**. En l\'absence de résolution amiable, compétence est attribuée aux tribunaux français conformément aux règles de droit commun, sous réserve des dispositions protectrices du consommateur.',
    },
    {
      heading: '14. Acceptation',
      text:
        `En souscrivant à Premium, vous reconnaissez avoir lu et accepté les présentes CGV (version du ${LEGAL_CONTACT.lastUpdated}).`,
    },
  ],
};
