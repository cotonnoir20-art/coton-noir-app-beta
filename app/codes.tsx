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

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

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

  const [active, setActive]       = useState<PromoCode[]>([]);
  const [used, setUsed]           = useState<PromoCode[]>([]);
  const [loading, setLoading]     = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

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
  }, []);

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

        {/* ── Codes disponibles ── */}
        <Text style={S.secTitle}>Codes disponibles</Text>

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
  headerTitle: { fontSize: 20, fontFamily: 'Poppins_700Bold', color: Colors.ink },
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
  soldeAmount: { fontSize: 28, fontFamily: 'Poppins_700Bold', color: Colors.amber },
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
  statValue: { fontSize: 26, fontFamily: 'Poppins_700Bold' },
  statLabel: { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, textAlign: 'center' },

  secTitle: {
    fontSize: 17, fontFamily: 'Poppins_600SemiBold',
    color: Colors.ink, marginBottom: 12,
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
  heroOff:  { fontSize: 32, fontFamily: 'Poppins_700Bold' },
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
