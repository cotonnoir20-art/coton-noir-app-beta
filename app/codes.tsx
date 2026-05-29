import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/theme/colors';
import { useApp } from '../src/context/AppContext';
import { supabase } from '../src/lib/supabase';
import { AppHeader } from '../src/components/AppHeader';
import { EmptyAnimation } from '../src/components/animations/EmptyAnimation';
import * as Clipboard from 'expo-clipboard';
import { hapticLight, hapticSuccess } from '../src/lib/haptics';
import { formatApproxEurCc } from '../src/lib/cotonCoins';
import { normalizeHttpUrl, openSafeUrl } from '../src/lib/safeLinking';
import { REWARDS } from '../src/data/rewards';
import { getCurrentLevel } from '../src/data/levels';
import { DEMO_BRAND_OFFERS } from '../src/data/demoBrandOffers';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

type BrandOffer = {
  id:                    string;
  brand:                 string;
  title:                 string;
  description:           string | null;
  discount:              string;
  icon_name:             string | null;
  color_theme:           string;
  code_type:             'generic' | 'pool';
  partner_url:           string | null;
  eligibility_min_level: number;
  eligibility_min_coins: number;
  stock_remaining:       number | null;
  expires_at:            string | null;
};

type ClaimedOffer = {
  offer_id:      string;
  code_assigned: string | null;
};

type PromoCode = {
  id:          string;
  brand:       string;
  description: string | null;
  code:        string;
  discount:    string;                 // ex: '-15%', '-10€'
  icon_name:   string | null;          // Ionicons (ex: 'bag-handle-outline')
  color_theme: 'amber' | 'rose' | 'sage' | string;
  expires_at:  string | null;          // ISO date
  status:      'active' | 'used' | 'archived' | string;
  saved:       string | null;
  partner_url: string | null;
  created_at:  string;
};

async function openOffer(url: string | null | undefined) {
  const u = normalizeHttpUrl(url ?? '');
  if (!u) {
    Alert.alert('Offre', 'Aucun lien partenaire renseigné pour ce code.');
    return;
  }
  await openSafeUrl(u, 'partner', { alertTitle: 'Offre' });
}

const THEMES: Record<string, { iconBg: string; iconColor: string }> = {
  amber: { iconBg: Colors.amberLight, iconColor: Colors.amber },
  rose:  { iconBg: Colors.blush,      iconColor: Colors.rose  },
  sage:  { iconBg: Colors.sageLight,  iconColor: Colors.sage  },
};

function formatExp(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('fr-FR');
}

function pctFromDiscount(d: string): number {
  const m = d.match(/(\d+)\s*%/);
  return m ? parseInt(m[1], 10) : 0;
}

export default function CodesScreen() {
  const router = useRouter();
  const { state } = useApp();
  const [copied, setCopied] = useState<string | null>(null);

  const currentLevel = getCurrentLevel(state.totalEarned);
  const affordable   = REWARDS.filter(r => !r.locked && state.coins >= r.cost);
  const upcoming     = REWARDS.filter(r => !r.locked && state.coins < r.cost).slice(0, 2);

  const [active, setActive]       = useState<PromoCode[]>([]);
  const [used, setUsed]           = useState<PromoCode[]>([]);
  const [loading, setLoading]     = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [brandOffers, setBrandOffers]   = useState<BrandOffer[]>([]);
  const [claimedOffers, setClaimedOffers] = useState<ClaimedOffer[]>([]);
  const [claiming, setClaiming]         = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('promo_codes')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          setLoadError(error.message);
          setActive([]);
          setUsed([]);
        } else {
          const all = (data ?? []) as PromoCode[];
          setLoadError(null);
          setActive(all.filter(c => c.status === 'active'));
          setUsed(all.filter(c => c.status === 'used'));
        }
        setLoading(false);
      });

    supabase
      .from('brand_offers')
      .select('id,brand,title,description,discount,icon_name,color_theme,code_type,partner_url,eligibility_min_level,eligibility_min_coins,stock_remaining,expires_at')
      .eq('active', true)
      .order('sort_order')
      .then(({ data }) => {
        setBrandOffers((data && data.length > 0) ? data as BrandOffer[] : DEMO_BRAND_OFFERS as BrandOffer[]);
      });

    supabase
      .from('user_claimed_offers')
      .select('offer_id,code_assigned')
      .then(({ data }) => {
        if (data) setClaimedOffers(data as ClaimedOffer[]);
      });
  }, []);

  const now = new Date();
  const eligibleOffers = brandOffers.filter(o =>
    currentLevel.id >= o.eligibility_min_level &&
    state.coins >= o.eligibility_min_coins &&
    (o.stock_remaining === null || o.stock_remaining > 0) &&
    (!o.expires_at || new Date(o.expires_at) > now)
  );
  const lockedOffers = brandOffers.filter(o =>
    currentLevel.id < o.eligibility_min_level ||
    state.coins < o.eligibility_min_coins
  ).slice(0, 3);

  function getClaimedCode(offerId: string): string | null | undefined {
    const c = claimedOffers.find(c => c.offer_id === offerId);
    return c ? c.code_assigned : undefined; // undefined = not claimed
  }

  async function handleClaim(offer: BrandOffer) {
    // Offres démo : réclamer localement sans appeler Supabase
    if (offer.id.startsWith('demo-')) {
      const demo = DEMO_BRAND_OFFERS.find(d => d.id === offer.id);
      const code = demo?.code_value ?? null;
      setClaimedOffers(prev => [...prev, { offer_id: offer.id, code_assigned: code }]);
      if (code) {
        try { await Clipboard.setStringAsync(code); } catch {}
        hapticSuccess();
        Alert.alert('Code réclamé ! 🎉', `Ton code « ${code} » a été copié dans le presse-papiers.`);
      } else {
        hapticSuccess();
        Alert.alert('Offre réclamée ! 🎉', 'Utilise le lien partenaire pour en profiter.');
      }
      return;
    }

    setClaiming(offer.id);
    try {
      const { data, error } = await supabase.rpc('claim_brand_offer', { p_offer_id: offer.id });
      if (error || !data?.ok) {
        const msg =
          data?.error === 'out_of_stock' ? 'Plus de codes disponibles pour cette offre.' :
          data?.error === 'expired'       ? 'Cette offre a expiré.' :
          'Impossible de réclamer cette offre. Réessaie.';
        Alert.alert('Offre indisponible', msg);
        return;
      }
      setClaimedOffers(prev => [...prev, { offer_id: offer.id, code_assigned: data.code ?? null }]);
      if (data.code) {
        try { await Clipboard.setStringAsync(data.code); } catch {}
        hapticSuccess();
        Alert.alert('Code réclamé ! 🎉', `Ton code « ${data.code} » a été copié dans le presse-papiers.`);
      } else {
        hapticSuccess();
        Alert.alert('Offre réclamée ! 🎉', 'Utilise le lien partenaire pour en profiter.');
      }
    } finally {
      setClaiming(null);
    }
  }

  const totalPct = active.reduce((acc, c) => acc + pctFromDiscount(c.discount), 0);

  async function handleCopy(code: string) {
    try {
      await Clipboard.setStringAsync(code);
      hapticSuccess();
    } catch {
      hapticLight();
    }
    setCopied(code);
    setTimeout(() => setCopied(null), 1400);
  }

  return (
    <SafeAreaView style={S.safe} edges={['top']}>

      {/* Header */}
      <AppHeader title="Mes codes" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.content}>

        {/* ── Solde card ── */}
        <View style={S.soldeCard}>
          <View style={{ flex: 1 }}>
            <Text style={S.soldeLabel}>SOLDE</Text>
            <Text style={S.soldeAmount}>{state.coins.toLocaleString('fr-FR')}</Text>
            <Text style={S.soldeEuro}>≈ {formatApproxEurCc(state.coins)} €</Text>
          </View>
          <TouchableOpacity style={S.getCodeBtn}>
            <Text style={S.getCodeBtnText}>Obtenir un code</Text>
          </TouchableOpacity>
        </View>

        <Text style={S.ccLegalNote}>
          {`Les CotonCoins n'ont pas de valeur monétaire. L'équivalent en euros affiché est uniquement indicatif (comme des points fidélité), pour t'aider à te repérer.`}
        </Text>

        {/* ── Stats ── */}
        <View style={S.statsRow}>
          <View style={[S.statCard, { borderColor: Colors.amber }]}>
            <View style={[S.statIcon, { backgroundColor: Colors.amberLight }]}>
              <Ionicons name="ticket-outline" size={22} color={Colors.amber} />
            </View>
            <Text style={[S.statValue, { color: Colors.ink }]}>{active.length}</Text>
            <Text style={S.statLabel}>Codes disponibles</Text>
          </View>
          <View style={[S.statCard, { borderColor: '#86EFAC' }]}>
            <View style={[S.statIcon, { backgroundColor: '#DCFCE7' }]}>
              <Ionicons name="stats-chart-outline" size={22} color="#16A34A" />
            </View>
            <Text style={[S.statValue, { color: Colors.ink }]}>{totalPct}%</Text>
            <Text style={S.statLabel}>Réductions totales</Text>
          </View>
        </View>

        {/* ── Offres partenaires ── */}
        {brandOffers.length > 0 && (
          <>
            <Text style={S.secTitle}>Offres partenaires</Text>

            {/* Offres éligibles */}
            {eligibleOffers.map(offer => {
              const theme     = THEMES[offer.color_theme] ?? THEMES.amber;
              const iconKey   = (offer.icon_name ?? 'pricetag-outline') as IoniconName;
              const claimed   = getClaimedCode(offer.id);
              const isClaiming = claiming === offer.id;
              const alreadyClaimed = claimed !== undefined;

              return (
                <View
                  key={offer.id}
                  style={[S.offerCard, alreadyClaimed && S.offerCardClaimed]}
                >
                  {/* Top row */}
                  <View style={S.offerTop}>
                    <View style={[S.offerIconWrap, { backgroundColor: theme.iconBg }]}>
                      <Ionicons name={iconKey} size={16} color={theme.iconColor} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={S.offerBrand}>{offer.brand}</Text>
                      {offer.description && (
                        <Text style={S.offerDesc}>{offer.description}</Text>
                      )}
                    </View>
                    <View style={[S.discountBadge, { backgroundColor: theme.iconBg }]}>
                      <Text style={[S.discountText, { color: theme.iconColor }]}>{offer.discount}</Text>
                    </View>
                  </View>

                  <Text style={S.offerTitle}>{offer.title}</Text>

                  {/* Code réclamé */}
                  {alreadyClaimed && claimed ? (
                    <View style={S.codeField}>
                      <Text style={S.codeText}>{claimed}</Text>
                      <TouchableOpacity
                        style={S.copyBtn}
                        onPress={async () => {
                          try { await Clipboard.setStringAsync(claimed); } catch {}
                          hapticSuccess();
                          setCopied(claimed);
                          setTimeout(() => setCopied(null), 1400);
                        }}
                      >
                        <Ionicons
                          name={copied === claimed ? 'checkmark-outline' : 'copy-outline'}
                          size={15} color={theme.iconColor}
                        />
                        <Text style={[S.copyText, { color: theme.iconColor }]}>
                          {copied === claimed ? 'Copié !' : 'Copier'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : alreadyClaimed ? (
                    /* Offre sans code (lien direct) */
                    <View style={[S.claimedPill]}>
                      <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
                      <Text style={S.claimedPillText}>Offre réclamée</Text>
                    </View>
                  ) : (
                    /* Bouton réclamer */
                    <TouchableOpacity
                      style={[S.claimBtn, { backgroundColor: theme.iconColor }, isClaiming && { opacity: 0.65 }]}
                      onPress={() => void handleClaim(offer)}
                      disabled={isClaiming}
                      activeOpacity={0.85}
                    >
                      {isClaiming
                        ? <ActivityIndicator size="small" color="#fff" />
                        : <Text style={S.claimBtnText}>Réclamer l'offre</Text>
                      }
                    </TouchableOpacity>
                  )}

                  {/* Footer : lien partenaire + stock + expiry */}
                  <View style={S.offerFooter}>
                    {offer.partner_url && (
                      <TouchableOpacity
                        style={S.partnerLink}
                        onPress={() => openOffer(offer.partner_url)}
                      >
                        <Ionicons name="open-outline" size={12} color={Colors.warmGray} />
                        <Text style={S.partnerLinkText}>Voir le site</Text>
                      </TouchableOpacity>
                    )}
                    {offer.stock_remaining !== null && (
                      <Text style={S.stockText}>{offer.stock_remaining} restants</Text>
                    )}
                    {offer.expires_at && (
                      <Text style={S.expText}>Expire le {formatExp(offer.expires_at)}</Text>
                    )}
                  </View>
                </View>
              );
            })}

            {/* Offres verrouillées (aperçu) */}
            {lockedOffers.length > 0 && (
              <>
                <Text style={S.lockedLabel}>BIENTÔT DISPONIBLES POUR TOI</Text>
                {lockedOffers.map(offer => {
                  const theme   = THEMES[offer.color_theme] ?? THEMES.amber;
                  const iconKey = (offer.icon_name ?? 'pricetag-outline') as IoniconName;
                  const needLevel = currentLevel.id < offer.eligibility_min_level;
                  const needCoins = state.coins < offer.eligibility_min_coins;
                  return (
                    <View key={offer.id} style={S.offerCardLocked}>
                      <View style={[S.offerIconWrap, { backgroundColor: Colors.cream }]}>
                        <Ionicons name={iconKey} size={16} color={Colors.warmGray} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={S.offerBrandLocked}>{offer.brand} · {offer.discount}</Text>
                        <Text style={S.offerTitleLocked}>{offer.title}</Text>
                        <View style={S.lockCondRow}>
                          {needLevel && (
                            <View style={S.lockChip}>
                              <Ionicons name="lock-closed-outline" size={10} color={Colors.warmGray} />
                              <Text style={S.lockChipText}>Niveau {offer.eligibility_min_level} requis</Text>
                            </View>
                          )}
                          {needCoins && (
                            <View style={S.lockChip}>
                              <Ionicons name="lock-closed-outline" size={10} color={Colors.warmGray} />
                              <Text style={S.lockChipText}>{offer.eligibility_min_coins.toLocaleString('fr-FR')} CC requis</Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  );
                })}
              </>
            )}

            {eligibleOffers.length === 0 && lockedOffers.length === 0 && (
              <View style={S.emptyBox}>
                <EmptyAnimation emoji="🤝" size={88} />
                <Text style={S.emptyText}>Les offres partenaires arrivent bientôt !</Text>
              </View>
            )}
          </>
        )}

        {/* ── Récompenses disponibles ── */}
        <View style={S.recoHeaderRow}>
          <Text style={S.secTitle}>Récompenses disponibles</Text>
          <TouchableOpacity onPress={() => router.push('/redeem' as any)} hitSlop={8}>
            <Text style={S.seeAll}>Tout voir →</Text>
          </TouchableOpacity>
        </View>

        {/* Avantage niveau */}
        <TouchableOpacity
          style={S.levelCard}
          onPress={() => router.push('/redeem' as any)}
          activeOpacity={0.88}
        >
          <View style={S.levelIconWrap}>
            <Text style={S.levelEmoji}>{currentLevel.emoji}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={S.levelKicker}>NIVEAU {currentLevel.id} · {currentLevel.name.toUpperCase()}</Text>
            <Text style={S.levelBenefit}>{currentLevel.benefit}</Text>
          </View>
          <Ionicons name="gift-outline" size={18} color={Colors.amber} />
        </TouchableOpacity>

        {/* Récompenses achetables maintenant */}
        {affordable.length > 0 && (
          <View style={S.recoGroup}>
            <Text style={S.recoGroupLabel}>TU PEUX DÉBLOQUER MAINTENANT</Text>
            {affordable.map(r => (
              <TouchableOpacity
                key={r.id}
                style={S.recoCard}
                onPress={() => router.push('/redeem' as any)}
                activeOpacity={0.88}
              >
                <Text style={S.recoEmoji}>{r.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={S.recoName}>{r.name}</Text>
                  <Text style={S.recoCost}>{r.cost.toLocaleString('fr-FR')} CC</Text>
                </View>
                <View style={S.availBadge}>
                  <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
                  <Text style={S.availText}>Prêt</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Prochaines récompenses */}
        {upcoming.length > 0 && (
          <View style={S.recoGroup}>
            <Text style={S.recoGroupLabel}>PROCHAINEMENT</Text>
            {upcoming.map(r => {
              const pct = Math.min(100, Math.round((state.coins / r.cost) * 100));
              const missing = r.cost - state.coins;
              return (
                <TouchableOpacity
                  key={r.id}
                  style={S.upcomingCard}
                  onPress={() => router.push('/redeem' as any)}
                  activeOpacity={0.88}
                >
                  <Text style={[S.recoEmoji, { opacity: 0.55 }]}>{r.emoji}</Text>
                  <View style={{ flex: 1, gap: 6 }}>
                    <View style={S.upcomingTop}>
                      <Text style={S.recoName}>{r.name}</Text>
                      <Text style={S.recoCost}>{r.cost.toLocaleString('fr-FR')} CC</Text>
                    </View>
                    <View style={S.progressBg}>
                      <View style={[S.progressFill, { width: `${pct}%` as any }]} />
                    </View>
                    <Text style={S.missingText}>encore {missing.toLocaleString('fr-FR')} CC</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {affordable.length === 0 && upcoming.length === 0 && (
          <View style={S.recoEmpty}>
            <Ionicons name="gift-outline" size={28} color={Colors.warmGray} />
            <Text style={S.recoEmptyText}>Continue à gagner des CC pour débloquer des récompenses !</Text>
          </View>
        )}

        {/* ── Codes disponibles ── */}
        <Text style={[S.secTitle, { marginTop: 8 }]}>Codes disponibles</Text>

        {loading ? (
          <View style={{ paddingVertical: 24, alignItems: 'center' }}>
            <ActivityIndicator color={Colors.amber} />
          </View>
        ) : loadError ? (
          <View style={S.emptyBox}>
            <EmptyAnimation emoji="⚠️" size={88} />
            <Text style={S.emptyText}>Connexion codes : {loadError}</Text>
            <Text style={S.emptyHint}>
              Vérifie dans Supabase : table « promo_codes » + policy SELECT pour anon.
            </Text>
          </View>
        ) : active.length === 0 ? (
          <View style={S.emptyBox}>
            <EmptyAnimation emoji="🎟️" size={88} />
            <Text style={S.emptyText}>Aucun code disponible pour le moment.</Text>
          </View>
        ) : (
          active.map(c => {
            const theme   = THEMES[c.color_theme] ?? THEMES.amber;
            const iconKey = (c.icon_name ?? 'pricetag-outline') as IoniconName;
            return (
              <View key={c.id} style={S.card}>
                <View style={S.cardTop}>
                  <View style={[S.brandIcon, { backgroundColor: theme.iconBg }]}>
                    <Ionicons name={iconKey} size={16} color={theme.iconColor} />
                  </View>
                  <Text style={S.brandName}>{c.brand}</Text>
                  <View style={[S.offBadge, { backgroundColor: '#DCFCE7' }]}>
                    <Text style={[S.offText, { color: '#16A34A' }]}>{c.discount}</Text>
                  </View>
                </View>

                <View style={S.heroRow}>
                  <Text style={[S.heroOff, { color: theme.iconColor }]}>{c.discount}</Text>
                  <Text style={S.heroDesc}>{c.description ?? ''}</Text>
                </View>

                <View style={S.codeField}>
                  <Text style={S.codeText}>{c.code}</Text>
                  <TouchableOpacity style={S.copyBtn} onPress={() => handleCopy(c.code)}>
                    <Ionicons
                      name={copied === c.code ? 'checkmark-outline' : 'copy-outline'}
                      size={15}
                      color={Colors.amber}
                    />
                    <Text style={S.copyText}>
                      {copied === c.code ? 'Copié !' : 'Copier'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {c.partner_url && (
                  <TouchableOpacity
                    style={S.shopBtn}
                    onPress={() => openOffer(c.partner_url)}
                    activeOpacity={0.88}
                  >
                    <Ionicons name="open-outline" size={15} color="#fff" />
                    <Text style={S.shopBtnText}>Voir l'offre</Text>
                  </TouchableOpacity>
                )}

                {c.expires_at && (
                  <View style={S.expRow}>
                    <Ionicons name="calendar-outline" size={13} color={Colors.warmGray} />
                    <Text style={S.expText}>Valide jusqu'au {formatExp(c.expires_at)}</Text>
                  </View>
                )}
              </View>
            );
          })
        )}

        {/* ── Historique ── */}
        {used.length > 0 && (
          <>
            <Text style={[S.secTitle, { marginTop: 8 }]}>Historique</Text>
            {used.map(c => (
              <View key={c.id} style={S.usedCard}>
                <View style={{ flex: 1 }}>
                  <Text style={S.usedBrand}>{c.brand}</Text>
                  <Text style={S.usedCode}>{c.code} · {c.discount}</Text>
                </View>
                <View style={S.usedPill}>
                  <Text style={S.usedPillText}>Utilisé</Text>
                </View>
                {c.saved && (
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={S.savingLabel}>économie</Text>
                    <Text style={S.savingAmount}>{c.saved}</Text>
                  </View>
                )}
              </View>
            ))}
          </>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: 20, paddingBottom: 16 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontFamily: 'Satoshi_500Medium', color: Colors.ink },
  coinsBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.ink,
    borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7,
  },
  coinsEmoji: { fontSize: 15 },
  coinsText:  { fontSize: 15, fontFamily: 'DMSans_700Bold', color: Colors.amber },

  /* Solde card */
  soldeCard: {
    backgroundColor: Colors.ink, borderRadius: 18,
    padding: 20, flexDirection: 'row',
    alignItems: 'center', gap: 16, marginBottom: 12,
  },
  soldeLabel:  { fontSize: 11, fontFamily: 'DMSans_500Medium', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 },
  soldeAmount: { fontSize: 28, fontFamily: 'Satoshi_500Medium', color: Colors.amber },
  soldeEuro:   { fontSize: 12, fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  getCodeBtn:     { backgroundColor: Colors.ink, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  getCodeBtnText: { fontSize: 12, fontFamily: 'DMSans_700Bold', color: '#fff' },
  ccLegalNote: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    lineHeight: 16,
    marginBottom: 20,
  },

  /* Stats */
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: {
    flex: 1, backgroundColor: Colors.surface,
    borderWidth: 1.5, borderRadius: 16,
    padding: 16, alignItems: 'center', gap: 6,
  },
  statIcon:  { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  statValue: { fontSize: 26, fontFamily: 'Satoshi_500Medium' },
  statLabel: { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, textAlign: 'center' },

  secTitle: {
    fontSize: 17, fontFamily: 'Satoshi_500Medium',
    color: Colors.ink, marginBottom: 12,
  },

  /* Offres partenaires */
  offerCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16, borderWidth: 1, borderColor: Colors.border,
    padding: 16, marginBottom: 12,
  },
  offerCardClaimed: {
    borderColor: '#86EFAC', backgroundColor: '#F0FDF4',
  },
  offerCardLocked: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.cream,
    borderRadius: 14, borderWidth: 1, borderColor: Colors.border,
    padding: 14, marginBottom: 8, opacity: 0.75,
  },
  offerTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  offerIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  offerBrand:  { fontSize: 13, fontFamily: 'DMSans_700Bold', color: Colors.ink },
  offerDesc:   { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, marginTop: 1 },
  offerTitle:  { fontSize: 15, fontFamily: 'Satoshi_500Medium', color: Colors.ink, marginBottom: 12 },
  discountBadge: { borderRadius: 8, paddingHorizontal: 9, paddingVertical: 4, flexShrink: 0 },
  discountText:  { fontSize: 12, fontFamily: 'DMSans_700Bold' },
  claimBtn: {
    borderRadius: 12, paddingVertical: 12,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  claimBtnText: { fontSize: 14, fontFamily: 'DMSans_700Bold', color: '#fff' },
  claimedPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#DCFCE7', borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 6,
    alignSelf: 'flex-start', marginBottom: 10,
  },
  claimedPillText: { fontSize: 12, fontFamily: 'DMSans_700Bold', color: '#16A34A' },
  offerFooter: { flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap' },
  partnerLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  partnerLinkText: { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray },
  stockText: { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray },
  lockedLabel: {
    fontSize: 10, fontFamily: 'DMSans_700Bold', color: Colors.warmGray,
    letterSpacing: 0.8, marginBottom: 8, marginTop: 4,
  },
  offerBrandLocked: { fontSize: 12, fontFamily: 'DMSans_700Bold', color: Colors.warmGray },
  offerTitleLocked: { fontSize: 13, fontFamily: 'DMSans_500Medium', color: Colors.warmGray, marginTop: 2 },
  lockCondRow: { flexDirection: 'row', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  lockChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.border, borderRadius: 999,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  lockChipText: { fontSize: 10, fontFamily: 'DMSans_500Medium', color: Colors.warmGray },

  /* Récompenses disponibles */
  recoHeaderRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 12,
  },
  seeAll: {
    fontSize: 13, fontFamily: 'DMSans_600SemiBold', color: Colors.amber,
  },
  levelCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.amberPowder,
    borderRadius: 14, borderWidth: 1, borderColor: Colors.amberLight,
    padding: 14, marginBottom: 10,
  },
  levelIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.amberLight,
    alignItems: 'center', justifyContent: 'center',
  },
  levelEmoji:   { fontSize: 20 },
  levelKicker:  { fontSize: 10, fontFamily: 'DMSans_700Bold', color: Colors.amberDark, letterSpacing: 0.8, marginBottom: 3 },
  levelBenefit: { fontSize: 13, fontFamily: 'DMSans_600SemiBold', color: Colors.ink },

  recoGroup:      { marginBottom: 10 },
  recoGroupLabel: {
    fontSize: 10, fontFamily: 'DMSans_700Bold', color: Colors.warmGray,
    letterSpacing: 0.8, marginBottom: 8,
  },
  recoCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 14, borderWidth: 1, borderColor: '#86EFAC',
    padding: 14, marginBottom: 8,
  },
  recoEmoji: { fontSize: 22 },
  recoName:  { fontSize: 13, fontFamily: 'DMSans_600SemiBold', color: Colors.ink },
  recoCost:  { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, marginTop: 2 },
  availBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#DCFCE7', borderRadius: 999,
    paddingHorizontal: 9, paddingVertical: 4,
  },
  availText: { fontSize: 11, fontFamily: 'DMSans_700Bold', color: '#16A34A' },

  upcomingCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 14, borderWidth: 1, borderColor: Colors.border,
    padding: 14, marginBottom: 8, opacity: 0.8,
  },
  upcomingTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressBg: {
    height: 4, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden',
  },
  progressFill: {
    height: 4, backgroundColor: Colors.amber, borderRadius: 2,
  },
  missingText: { fontSize: 10, fontFamily: 'DMSans_400Regular', color: Colors.warmGray },

  recoEmpty: {
    alignItems: 'center', gap: 8,
    backgroundColor: Colors.cream, borderRadius: 14,
    paddingVertical: 20, paddingHorizontal: 16, marginBottom: 16,
  },
  recoEmptyText: {
    fontSize: 13, fontFamily: 'DMSans_500Medium', color: Colors.warmGray,
    textAlign: 'center', lineHeight: 19,
  },

  /* Active code card */
  card: {
    backgroundColor: Colors.surface, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border,
    padding: 16, marginBottom: 12,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 14 },
  brandIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  brandName: { fontSize: 14, fontFamily: 'DMSans_700Bold', color: Colors.ink },
  brandDesc: { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, marginTop: 2 },
  offBadge:  { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, flexShrink: 0 },
  offText:   { fontSize: 12, fontFamily: 'DMSans_700Bold' },

  heroRow:  { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginBottom: 12 },
  heroOff:  { fontSize: 32, fontFamily: 'Satoshi_500Medium' },
  heroDesc: { fontSize: 12, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, flex: 1, flexWrap: 'wrap' },

  codeField: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1.5, borderColor: Colors.amber, borderStyle: 'dashed',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11,
    marginBottom: 10,
  },
  codeText:  { fontSize: 15, fontFamily: 'DMSans_700Bold', color: Colors.amber, letterSpacing: 1.5 },
  copyBtn:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  copyText:  { fontSize: 13, fontFamily: 'DMSans_600SemiBold', color: Colors.amber },

  shopBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.ink, borderRadius: 10,
    paddingVertical: 10, paddingHorizontal: 14,
    marginBottom: 10,
  },
  shopBtnText: { fontSize: 13, fontFamily: 'DMSans_700Bold', color: '#fff' },

  expRow:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  expText: { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray },

  /* Used codes */
  usedCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.surface, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border,
    padding: 14, marginBottom: 10, opacity: 0.65,
  },
  usedBrand:  { fontSize: 13, fontFamily: 'DMSans_700Bold', color: Colors.ink },
  usedCode:   { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, marginTop: 2 },
  usedPill: {
    backgroundColor: Colors.cream, borderRadius: 999,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  usedPillText: { fontSize: 10, fontFamily: 'DMSans_500Medium', color: Colors.warmGray },
  savingLabel:  { fontSize: 10, fontFamily: 'DMSans_400Regular', color: Colors.warmGray },
  savingAmount: { fontSize: 13, fontFamily: 'DMSans_700Bold', color: Colors.sage },

  /* Empty / Error state */
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 16,
    backgroundColor: Colors.cream,
    borderRadius: 14,
    marginBottom: 16,
  },
  emptyEmoji: { fontSize: 36, marginBottom: 8 },
  emptyText:  {
    fontSize: 14,
    fontFamily: 'DMSans_500Medium',
    color: Colors.ink,
    textAlign: 'center',
  },
  emptyHint:  {
    marginTop: 8,
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    textAlign: 'center',
    lineHeight: 17,
  },
});
