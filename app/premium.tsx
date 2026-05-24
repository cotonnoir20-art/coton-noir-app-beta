import { useCallback, useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/theme/colors';
import { AppHeader } from '../src/components/AppHeader';
import { DemoPopin } from '../src/components/DemoPopin';
import { useAuth } from '../src/context/AuthContext';
import { getDemoPopinContent, isDemoEmail } from '../src/data/demoUsers';
import { startPremiumCheckout, restorePremiumPurchases } from '../src/lib/premiumPurchase';
import type { PremiumPlanId } from '../src/lib/premiumPlans';
import { usePremium } from '../src/context/PremiumContext';
import { PREMIUM_MOMENTS, type PremiumMomentId } from '../src/data/premiumMoments';
import { getPremiumFirstValues, markPremiumFirstValue, TRIAL_DAYS } from '../src/lib/premiumTrial';

type Feature = {
  title: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  headerBg: string;
  iconColor: string;
  items: string[];
};

const FEATURES: Feature[] = [
  {
    title: 'Black Cotton Avancé', icon: 'scan-outline',
    headerBg: '#2D1B4E', iconColor: '#C4B5FD',
    items: [
      'Analyse photo détaillée de tes cheveux par Black Cotton',
      'Recommandations personnalisées hebdomadaires',
      "Suivi de l'évolution de la santé capillaire",
      'Détection des carences et problèmes',
    ],
  },
  {
    title: 'Contenu Expert Premium', icon: 'library-outline',
    headerBg: '#1E3A5F', iconColor: '#93C5FD',
    items: [
      '+200 tutoriels vidéo exclusifs',
      'Masterclass mensuelles avec des expertes',
      'Guides PDF téléchargeables',
      'Nouveaux contenus chaque semaine',
    ],
  },
  {
    title: 'Récompenses & Avantages', icon: 'trophy-outline',
    headerBg: '#7A4E0A', iconColor: Colors.amber,
    items: [
      '2× CotonCoins sur chaque action',
      'Accès aux codes promo exclusifs partenaires',
      'Box digitale mensuelle complète',
      'Réductions doublées chez les partenaires',
    ],
  },
  {
    title: 'Analytics Avancées', icon: 'bar-chart-outline',
    headerBg: '#1A3A2A', iconColor: '#6EE7B7',
    items: [
      'Historique complet sur 12 mois',
      'Graphiques de progression détaillés',
      'Export PDF de ton bilan capillaire',
      'Comparaison avant/après par zone',
    ],
  },
  {
    title: 'Personnalisation Avancée', icon: 'color-palette-outline',
    headerBg: '#3A1A2A', iconColor: '#FDA4AF',
    items: [
      'Thèmes et couleurs personnalisés',
      'Jusqu\'à 3 profils capillaires',
      'Rappels et routines sur mesure',
      'Widgets et raccourcis personnalisés',
    ],
  },
  {
    title: 'Support VIP', icon: 'headset-outline',
    headerBg: '#2A2A2A', iconColor: '#D1D5DB',
    items: [
      'Support prioritaire 24h/7j',
      'Chat en direct avec une experte',
      'Réponse garantie en moins de 2h',
      'Accès bêta aux nouvelles fonctionnalités',
    ],
  },
];

const COMPARISON = [
  { feature: 'Analyse capillaire IA',          free: false, premium: true  },
  { feature: 'Tutoriels de base',               free: true,  premium: true  },
  { feature: 'Tutoriels Premium',               free: false, premium: true  },
  { feature: 'CotonCoins × 2',                  free: false, premium: true  },
  { feature: 'Box digitale complète',           free: false, premium: true  },
  { feature: 'Codes promo exclusifs',           free: false, premium: true  },
  { feature: 'Historique 12 mois',              free: false, premium: true  },
  { feature: 'Export PDF bilan',                free: false, premium: true  },
  { feature: 'Multi-profils (3)',                free: false, premium: true  },
  { feature: 'Suivi de pousse',                 free: true,  premium: true  },
  { feature: 'Routines personnalisées',         free: true,  premium: true  },
  { feature: 'Support VIP',                     free: false, premium: true  },
];

const TESTIMONIALS = [
  { name: 'Aïcha M.', text: "Depuis que j'utilise Premium, mes cheveux ont vraiment transformé. Les analyses IA sont bluffantes !", stars: 5 },
  { name: 'Fatou D.', text: "Les masterclass exclusives valent vraiment le prix. J'ai appris plus en 1 mois qu'en 3 ans.", stars: 5 },
  { name: 'Roxane K.', text: 'Le suivi de pousse avec les graphiques Premium est incroyable. Je vois vraiment mes progrès.', stars: 5 },
];

type PlanId = PremiumPlanId;

const PLANS = {
  annual: {
    id: 'annual' as const,
    title: 'Abonnement annuel',
    detail: '12 mois · 39,99 €',
    priceLabel: '3,33 €/mois',
    savePercent: 67,
  },
  monthly: {
    id: 'monthly' as const,
    title: 'Mensuel',
    detail: '',
    priceLabel: '9,99 €/mois',
    savePercent: 0,
  },
};

const FAQ = [
  { q: 'Puis-je annuler à tout moment ?',               a: "Oui, sans engagement. Tu peux annuler depuis les paramètres de ton compte. Aucun frais supplémentaire." },
  { q: 'Que se passe-t-il après les 7 jours ?',         a: "Après l'essai, tu seras facturée 9,99€/mois. On t'envoie un rappel 24 h avant par e-mail." },
  { q: 'Mes données sont-elles sécurisées ?',           a: 'Absolument. Toutes les données sont chiffrées et ne sont jamais vendues à des tiers.' },
  { q: 'Puis-je avoir plusieurs profils ?',              a: "Oui, Premium te permet de gérer jusqu'à 3 profils capillaires différents." },
];

export default function PremiumScreen() {
  const { session } = useAuth();
  const { hasAccess, trialDaysLeft, startTrial, refreshPremium, purchasesEnabled, purchasesBlockReason } = usePremium();
  const params = useLocalSearchParams<{ moment?: string; trial?: string }>();
  const momentParam = typeof params.moment === 'string' ? params.moment : undefined;
  const momentConfig =
    momentParam && momentParam in PREMIUM_MOMENTS
      ? PREMIUM_MOMENTS[momentParam as PremiumMomentId]
      : null;

  const userEmail = session?.user?.email ?? null;
  const isDemo = isDemoEmail(userEmail);
  const demoPopin = userEmail ? getDemoPopinContent(userEmail, 'premium') : null;

  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('annual');
  const [freeTrial, setFreeTrial] = useState(true);
  const [demoPopinOpen, setDemoPopinOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [firstValues, setFirstValues] = useState<string[]>([]);

  useEffect(() => {
    void getPremiumFirstValues().then(v => setFirstValues(v));
    void refreshPremium();
  }, [refreshPremium]);

  const onSubscribe = useCallback(async () => {
    if (isDemo && demoPopin) {
      setDemoPopinOpen(true);
      return;
    }
    if (!purchasesEnabled) {
      Alert.alert('Premium bientôt disponible', purchasesBlockReason ?? undefined);
      return;
    }
    setCheckoutLoading(true);
    try {
      const result = await startPremiumCheckout(selectedPlan);
      if (result.ok) {
        await refreshPremium();
      }
    } finally {
      setCheckoutLoading(false);
    }
  }, [isDemo, demoPopin, selectedPlan, purchasesEnabled, purchasesBlockReason, refreshPremium]);

  return (
    <SafeAreaView style={S.safe} edges={['top']}>

      {/* ── Header ── */}
      <AppHeader title="Premium" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.content}>

        {momentConfig ? (
          <View style={S.contextCard}>
            <Text style={S.contextLabel}>POUR TOI MAINTENANT</Text>
            <Text style={S.contextTitle}>{momentConfig.title}</Text>
            <Text style={S.contextSub}>{momentConfig.subtitle}</Text>
          </View>
        ) : null}

        {!purchasesEnabled ? (
          <View style={S.comingSoonCard}>
            <Ionicons name="time-outline" size={22} color={Colors.amberDark} />
            <View style={S.comingSoonTextWrap}>
              <Text style={S.comingSoonTitle}>Abonnements bientôt disponibles</Text>
              <Text style={S.comingSoonSub}>
                {purchasesBlockReason ??
                  'Les paiements s’ouvriront quand toutes les fonctionnalités Premium seront livrées.'}
              </Text>
              <Text style={S.comingSoonHint}>
                En attendant, profite de l’essai gratuit de {TRIAL_DAYS} jours pour découvrir Premium.
              </Text>
            </View>
          </View>
        ) : null}

        {hasAccess && trialDaysLeft > 0 ? (
          <View style={S.trialActiveCard}>
            <Text style={S.trialActiveTitle}>Essai Premium actif</Text>
            <Text style={S.trialActiveSub}>
              {trialDaysLeft} jour{trialDaysLeft > 1 ? 's' : ''} restant{trialDaysLeft > 1 ? 's' : ''} — profite d’une 1ère valeur (analyse, box ou export) puis renouvelle si tu adores.
            </Text>
            <View style={S.workflowRow}>
              {['Essai 7j', '1ère valeur', 'Renouvellement'].map((step, i) => (
                <View key={step} style={S.workflowStep}>
                  <View style={[S.workflowDot, i <= firstValues.length && S.workflowDotOn]}>
                    <Text style={S.workflowDotText}>{i + 1}</Text>
                  </View>
                  <Text style={S.workflowLabel}>{step}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* ── Hero card ── */}
        <LinearGradient
          colors={['#2D1800', '#0D0804']}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={S.hero}
        >
          <View style={S.trialPill}>
            <Text style={S.trialPillText}>7 JOURS GRATUITS</Text>
          </View>
          <Text style={S.heroTitle}>Débloque tout le potentiel{'\n'}de tes cheveux</Text>
          <Text style={S.heroSub}>
            Black Cotton avancé, contenus exclusifs,{'\n'}récompenses doublées et bien plus.
          </Text>

          <View style={S.priceRow}>
            <Text style={S.priceAmount}>9,99€</Text>
            <Text style={S.pricePer}> / mois</Text>
          </View>
          <Text style={S.priceSub}>Puis 9,99€/mois · Annulable à tout moment</Text>

          <TouchableOpacity
            style={[S.heroBtn, (checkoutLoading || (!hasAccess && !purchasesEnabled && !freeTrial)) && S.btnDisabled]}
            onPress={() => {
              if (!hasAccess && freeTrial) {
                void startTrial();
              } else if (purchasesEnabled || hasAccess) {
                void onSubscribe();
              } else {
                Alert.alert('Premium bientôt disponible', purchasesBlockReason ?? undefined);
              }
            }}
            activeOpacity={0.85}
            disabled={checkoutLoading}
          >
            {checkoutLoading ? (
              <ActivityIndicator color={Colors.ink} />
            ) : (
              <Text style={S.heroBtnText}>
                {hasAccess
                  ? purchasesEnabled
                    ? '✨ Gérer mon abonnement'
                    : '✨ Essai Premium actif'
                  : `✨ Commencer l'essai ${TRIAL_DAYS} jours`}
              </Text>
            )}
          </TouchableOpacity>
          <Text style={S.heroLegal}>Sans engagement · Rappel 24h avant facturation</Text>
        </LinearGradient>

        {/* ── Choix abonnement (ancienne homepage) ── */}
        <Text style={S.planSecTitle}>Choisis ton abonnement</Text>

        <View style={S.trialToggleCard}>
          <Text style={S.trialToggleText}>Tu as des doutes ? Active l'essai gratuit.</Text>
          <Switch
            value={freeTrial}
            onValueChange={setFreeTrial}
            trackColor={{ false: Colors.border, true: Colors.amber }}
            thumbColor={Colors.white}
          />
        </View>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setSelectedPlan('annual')}
          style={[S.planCard, S.planCardAnnual, selectedPlan === 'annual' && S.planCardSelected]}
        >
          <View style={S.saveBanner}>
            <Text style={S.saveBannerText}>ÉCONOMISEZ {PLANS.annual.savePercent} %</Text>
          </View>
          <View style={S.planCardBody}>
            <View style={S.planCardLeft}>
              <Text style={S.planTitle}>{PLANS.annual.title}</Text>
              <Text style={S.planDetail}>{PLANS.annual.detail}</Text>
            </View>
            <Text style={S.planPrice}>{PLANS.annual.priceLabel}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setSelectedPlan('monthly')}
          style={[S.planCard, S.planCardMonthly, selectedPlan === 'monthly' && S.planCardSelected]}
        >
          <View style={[S.planCardBody, S.planCardBodyMonthly]}>
            <Text style={S.planTitle}>{PLANS.monthly.title}</Text>
            <Text style={S.planPrice}>{PLANS.monthly.priceLabel}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[S.subscribeBtn, (checkoutLoading || !purchasesEnabled) && S.btnDisabled]}
          onPress={onSubscribe}
          activeOpacity={0.85}
          disabled={checkoutLoading || !purchasesEnabled}
        >
          {checkoutLoading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={S.subscribeBtnText}>
              {purchasesEnabled ? "S'abonner" : 'Bientôt disponible'}
            </Text>
          )}
        </TouchableOpacity>
        {purchasesEnabled && freeTrial && (
          <Text style={S.subscribeHint}>7 jours gratuits · puis {PLANS[selectedPlan].priceLabel}</Text>
        )}
        {purchasesEnabled ? (
          <TouchableOpacity
            style={S.restoreBtn}
            onPress={() => {
              void restorePremiumPurchases().then(r => {
                if (r.ok) void refreshPremium();
              });
            }}
            activeOpacity={0.7}
          >
            <Text style={S.restoreBtnText}>Restaurer mes achats</Text>
          </TouchableOpacity>
        ) : null}

        {/* ── Ce qui t'attend ── */}
        <Text style={S.secTitle}>Ce qui t'attend</Text>
        {FEATURES.map((f, i) => (
          <View key={i} style={S.featureCard}>
            <View style={[S.featureHeader, { backgroundColor: f.headerBg }]}>
              <View style={S.featureIconBox}>
                <Ionicons name={f.icon} size={20} color={f.iconColor} />
              </View>
              <Text style={S.featureTitle}>{f.title}</Text>
            </View>
            <View style={S.featureBody}>
              {f.items.map((item, j) => (
                <View key={j} style={S.featureItem}>
                  <Ionicons name="checkmark" size={14} color={Colors.amber} />
                  <Text style={S.featureItemText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* ── Comparaison ── */}
        <Text style={S.secTitle}>Gratuit vs Premium</Text>
        <View style={S.table}>
          {/* Table header */}
          <View style={[S.tableRow, S.tableHeader]}>
            <Text style={[S.tableCell, { flex: 2 }]}> </Text>
            <Text style={[S.tableColHead, { flex: 1 }]}>Gratuit</Text>
            <Text style={[S.tableColHead, S.tableColHeadPremium, { flex: 1 }]}>Premium</Text>
          </View>
          {COMPARISON.map((row, i) => (
            <View key={i} style={[S.tableRow, i % 2 === 0 && S.tableRowAlt]}>
              <Text style={[S.tableCell, { flex: 2 }]}>{row.feature}</Text>
              <View style={[S.tableCellCenter, { flex: 1 }]}>
                <Text style={row.free ? S.checkYes : S.checkNo}>
                  {row.free ? '✓' : '✗'}
                </Text>
              </View>
              <View style={[S.tableCellCenter, { flex: 1 }]}>
                <Text style={S.checkYesPremium}>✓</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── Témoignages ── */}
        <Text style={S.secTitle}>Elles adorent Premium</Text>
        {TESTIMONIALS.map((t, i) => (
          <View key={i} style={S.testimonialCard}>
            <View style={S.testimonialTop}>
              <View style={S.avatarCircle}>
                <Text style={S.avatarText}>{t.name[0]}</Text>
              </View>
              <View>
                <Text style={S.testimonialName}>{t.name}</Text>
                <Text style={S.testimonialStars}>{'★'.repeat(t.stars)}</Text>
              </View>
            </View>
            <Text style={S.testimonialText}>"{t.text}"</Text>
          </View>
        ))}

        {/* ── FAQ ── */}
        <Text style={S.secTitle}>Questions fréquentes</Text>
        {FAQ.map((item, i) => (
          <TouchableOpacity
            key={i}
            style={S.faqCard}
            onPress={() => setOpenFaq(openFaq === i ? null : i)}
            activeOpacity={0.8}
          >
            <View style={S.faqRow}>
              <Text style={S.faqQ}>{item.q}</Text>
              <Ionicons
                name={openFaq === i ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={Colors.warmGray}
              />
            </View>
            {openFaq === i && (
              <Text style={S.faqA}>{item.a}</Text>
            )}
          </TouchableOpacity>
        ))}

        {/* ── Bottom CTA ── */}
        <LinearGradient
          colors={[Colors.amber, '#C47B00']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={S.bottomCta}
        >
          <Text style={S.bottomCtaTitle}>Prête à transformer ta routine ?</Text>
          <Text style={S.bottomCtaSub}>Rejoins +2 000 femmes qui ont franchi le cap.</Text>
          <TouchableOpacity
            style={[S.bottomCtaBtn, (checkoutLoading || !purchasesEnabled) && S.btnDisabled]}
            onPress={() => {
              if (!purchasesEnabled) {
                if (!hasAccess) void startTrial();
                else Alert.alert('Premium bientôt disponible', purchasesBlockReason ?? undefined);
                return;
              }
              void onSubscribe();
            }}
            activeOpacity={0.85}
            disabled={checkoutLoading}
          >
            {checkoutLoading ? (
              <ActivityIndicator color={Colors.amber} />
            ) : (
              <Text style={S.bottomCtaBtnText}>
                {purchasesEnabled
                  ? "✨ Commencer l'essai gratuit"
                  : `✨ Essai ${TRIAL_DAYS} jours — paiement bientôt`}
              </Text>
            )}
          </TouchableOpacity>
          <Text style={S.bottomCtaLegal}>
            {purchasesEnabled
              ? '7 jours gratuits · Sans engagement'
              : 'Abonnements activés quand Premium sera complet'}
          </Text>
        </LinearGradient>

        <View style={{ height: 20 }} />
      </ScrollView>

      {demoPopin && (
        <DemoPopin
          visible={demoPopinOpen}
          onClose={() => setDemoPopinOpen(false)}
          label={demoPopin.label}
          title={demoPopin.title}
          body={demoPopin.body}
          ctaText={demoPopin.ctaText}
          hint={demoPopin.hint}
          mood="celebrating"
        />
      )}
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: 20, paddingBottom: 16 },

  contextCard: {
    backgroundColor: Colors.amberLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.amber,
    padding: 14,
    marginBottom: 14,
  },
  contextLabel: {
    fontSize: 10,
    fontFamily: 'DMSans_700Bold',
    color: Colors.amberDark,
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  contextTitle: { fontSize: 16, fontFamily: 'Satoshi_500Medium', color: Colors.ink, marginBottom: 4 },
  contextSub: { fontSize: 13, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, lineHeight: 18 },

  comingSoonCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: Colors.amberLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.amber,
    padding: 14,
    marginBottom: 14,
    alignItems: 'flex-start',
  },
  comingSoonTextWrap: { flex: 1 },
  comingSoonTitle: {
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
    color: Colors.ink,
    marginBottom: 4,
  },
  comingSoonSub: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    lineHeight: 17,
    marginBottom: 6,
  },
  comingSoonHint: {
    fontSize: 11,
    fontFamily: 'DMSans_500Medium',
    color: Colors.amberDark,
    lineHeight: 16,
  },

  trialActiveCard: {
    backgroundColor: Colors.sageLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.sage,
    padding: 14,
    marginBottom: 14,
  },
  trialActiveTitle: { fontSize: 14, fontFamily: 'DMSans_700Bold', color: Colors.ink, marginBottom: 4 },
  trialActiveSub: { fontSize: 12, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, lineHeight: 17, marginBottom: 12 },
  workflowRow: { flexDirection: 'row', justifyContent: 'space-between' },
  workflowStep: { alignItems: 'center', flex: 1 },
  workflowDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  workflowDotOn: { backgroundColor: Colors.sage, borderColor: Colors.sage },
  workflowDotText: { fontSize: 12, fontFamily: 'DMSans_700Bold', color: Colors.ink },
  workflowLabel: { fontSize: 9, fontFamily: 'DMSans_500Medium', color: Colors.warmGray, textAlign: 'center' },

  // ── Header ──
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, gap: 8,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { flex: 1, fontSize: 20, fontFamily: 'Satoshi_500Medium', color: Colors.ink },
  coinsBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.ink,
    borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7,
  },
  coinsEmoji: { fontSize: 15 },
  coinsText:  { fontSize: 15, fontFamily: 'DMSans_700Bold', color: Colors.amber },

  // ── Hero ──
  hero: {
    borderRadius: 22, padding: 22, marginBottom: 24, alignItems: 'center',
  },
  trialPill: {
    backgroundColor: Colors.amber,
    borderRadius: 999, paddingHorizontal: 14, paddingVertical: 5, marginBottom: 16,
  },
  trialPillText: { fontSize: 11, fontFamily: 'DMSans_700Bold', color: '#fff', letterSpacing: 0.8 },
  heroTitle: {
    fontSize: 26, fontFamily: 'Satoshi_500Medium', color: '#fff',
    textAlign: 'center', lineHeight: 34, marginBottom: 10,
  },
  heroSub: {
    fontSize: 13, fontFamily: 'DMSans_400Regular',
    color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 20, marginBottom: 20,
  },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 4 },
  priceAmount: { fontSize: 36, fontFamily: 'Satoshi_500Medium', color: '#fff' },
  pricePer:    { fontSize: 16, fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.7)' },
  priceSub:    { fontSize: 11, fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.45)', marginBottom: 20 },
  heroBtn: {
    backgroundColor: Colors.amber, borderRadius: 16,
    paddingVertical: 16, paddingHorizontal: 32,
    width: '100%', alignItems: 'center', marginBottom: 10,
  },
  heroBtnText: { fontSize: 15, fontFamily: 'DMSans_700Bold', color: '#fff' },
  heroLegal:   { fontSize: 11, fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.35)' },

  // ── Plans ──
  planSecTitle: {
    fontSize: 22,
    fontFamily: 'Satoshi_500Medium',
    color: Colors.ink,
    marginBottom: 14,
  },
  trialToggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    backgroundColor: Colors.cream,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },
  trialToggleText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
    color: Colors.ink,
    lineHeight: 18,
  },
  planCard: {
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: 12,
  },
  planCardAnnual: {
    borderColor: Colors.ink,
    backgroundColor: Colors.amberPowder,
  },
  planCardMonthly: {
    backgroundColor: Colors.surface,
  },
  planCardSelected: {
    borderColor: Colors.ink,
    borderWidth: 2.5,
  },
  saveBanner: {
    backgroundColor: Colors.amber,
    paddingVertical: 8,
    alignItems: 'center',
  },
  saveBannerText: {
    fontSize: 12,
    fontFamily: 'DMSans_700Bold',
    color: Colors.ink,
    letterSpacing: 0.6,
  },
  planCardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  planCardBodyMonthly: {
    paddingVertical: 16,
  },
  planCardLeft: { flex: 1, minWidth: 0 },
  planTitle: {
    fontSize: 16,
    fontFamily: 'DMSans_700Bold',
    color: Colors.ink,
  },
  planDetail: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    marginTop: 3,
  },
  planPrice: {
    fontSize: 15,
    fontFamily: 'DMSans_700Bold',
    color: Colors.ink,
    flexShrink: 0,
  },
  subscribeBtn: {
    backgroundColor: Colors.ink,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  subscribeBtnText: {
    fontSize: 16,
    fontFamily: 'DMSans_700Bold',
    color: '#fff',
  },
  subscribeHint: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    textAlign: 'center',
    marginBottom: 8,
  },
  restoreBtn: { alignItems: 'center', paddingVertical: 10, marginBottom: 16 },
  restoreBtnText: {
    fontSize: 12,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.warmGray,
    textDecorationLine: 'underline',
  },

  // ── Section title ──
  secTitle: {
    fontSize: 20, fontFamily: 'Satoshi_500Medium',
    color: Colors.ink, marginBottom: 14,
  },

  // ── Feature cards ──
  featureCard: {
    borderRadius: 16, borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden', marginBottom: 12,
  },
  featureHeader: {
    flexDirection: 'row', alignItems: 'center',
    gap: 12, padding: 14,
  },
  featureIconBox: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  featureTitle: { fontSize: 15, fontFamily: 'DMSans_700Bold', color: '#fff' },
  featureBody:  { backgroundColor: Colors.surface, padding: 14, gap: 8 },
  featureItem:  { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  featureItemText: {
    flex: 1, fontSize: 12, fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray, lineHeight: 18,
  },

  // ── Comparison table ──
  table: {
    borderRadius: 16, borderWidth: 1, borderColor: Colors.border,
    overflow: 'hidden', marginBottom: 24,
  },
  tableHeader: { backgroundColor: Colors.cream },
  tableRow:    { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12 },
  tableRowAlt: { backgroundColor: Colors.surface },
  tableColHead: {
    fontSize: 12, fontFamily: 'DMSans_700Bold',
    color: Colors.warmGray, textAlign: 'center',
  },
  tableColHeadPremium: { color: Colors.amber },
  tableCell: { fontSize: 12, fontFamily: 'DMSans_400Regular', color: Colors.ink },
  tableCellCenter: { alignItems: 'center' },
  checkYes:        { fontSize: 14, color: Colors.sage,     fontFamily: 'DMSans_700Bold' },
  checkNo:         { fontSize: 14, color: Colors.warmGray, fontFamily: 'DMSans_700Bold' },
  checkYesPremium: { fontSize: 14, color: Colors.amber,    fontFamily: 'DMSans_700Bold' },

  // ── Testimonials ──
  testimonialCard: {
    backgroundColor: Colors.surface, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border,
    padding: 16, marginBottom: 10,
  },
  testimonialTop: { flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 10 },
  avatarCircle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.amber, alignItems: 'center', justifyContent: 'center',
  },
  avatarText:       { fontSize: 16, fontFamily: 'DMSans_700Bold', color: '#fff' },
  testimonialName:  { fontSize: 13, fontFamily: 'DMSans_700Bold', color: Colors.ink },
  testimonialStars: { fontSize: 12, color: Colors.amber },
  testimonialText:  {
    fontSize: 13, fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray, lineHeight: 20, fontStyle: 'italic',
  },

  // ── FAQ ──
  faqCard: {
    backgroundColor: Colors.surface, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border,
    padding: 14, marginBottom: 8,
  },
  faqRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  faqQ:    { flex: 1, fontSize: 13, fontFamily: 'DMSans_600SemiBold', color: Colors.ink },
  faqA:    { fontSize: 12, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, lineHeight: 18, marginTop: 10 },

  // ── Bottom CTA ──
  bottomCta: {
    borderRadius: 20, padding: 22,
    alignItems: 'center', marginTop: 10,
  },
  bottomCtaTitle: {
    fontSize: 18, fontFamily: 'Satoshi_500Medium',
    color: '#fff', textAlign: 'center', marginBottom: 6,
  },
  bottomCtaSub: {
    fontSize: 13, fontFamily: 'DMSans_400Regular',
    color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginBottom: 18,
  },
  bottomCtaBtn: {
    backgroundColor: '#fff', borderRadius: 14,
    paddingVertical: 14, paddingHorizontal: 28,
    width: '100%', alignItems: 'center', marginBottom: 10,
  },
  bottomCtaBtnText: { fontSize: 14, fontFamily: 'DMSans_700Bold', color: Colors.amber },
  bottomCtaLegal:   { fontSize: 11, fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.6)' },
  btnDisabled:      { opacity: 0.65 },
});
