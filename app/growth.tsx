import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BackButton } from '../src/components/BackButton';
import { Colors } from '../src/theme/colors';
import { useApp, GrowthEntry } from '../src/context/AppContext';
import { usePremium } from '../src/context/PremiumContext';
import { FREE_GROWTH_HISTORY_MONTHS } from '../src/lib/premiumAccess';
import { markPremiumFirstValue } from '../src/lib/premiumTrial';
import { MiniCalendar, formatFull } from '../src/components/MiniCalendar';
import { BCEmojiAvatar } from '../src/components/blackCotton/BCEmojiAvatar';
import { CoinIcon } from '../src/components/CoinIcon';
import {
  averageLatestCmByZone,
  buildHomeMeasureSessions,
  computeHairHealthScore,
  parseCmFromText,
  toLocalISODate,
} from '../src/lib/homeGrowth';
import { GROWTH_ZONE_NAMES } from '../src/constants/growthZones';
import { GrowthHealthActionBanner } from '../src/components/growth/GrowthHealthActionBanner';
import { trackMeasurementSaved } from '../src/lib/growthAnalytics';
import { trackProductEvent } from '../src/lib/productAnalytics';
import {
  avgLatestGrowthCm,
  buildPostMeasurementContext,
  type GrowthMeasureRow,
} from '../src/lib/coachMoments';
import { resolveBlackCottonBilanSynthesis } from '../src/lib/monthlyBilanSynthesis';
import { exportBilanPdf } from '../src/lib/bilanPdfExport';

const TODAY_DATE = new Date();
const TODAY      = toLocalISODate(TODAY_DATE);

type Zone = (typeof GROWTH_ZONE_NAMES)[number];

type Entry = GrowthEntry & { zone: Zone };

const DOT_COLORS = [Colors.sage, Colors.amber, Colors.rose] as const;

type MeasureSession = {
  date: string;
  dateLabel: string;
  avgCm: number;
  zoneCount: number;
  isLatest: boolean;
  dotColor: string;
};

function withSessionDotColors(
  history: Entry[],
): MeasureSession[] {
  return buildHomeMeasureSessions(history, history.length || 1).map((session, i) => ({
    ...session,
    dotColor: DOT_COLORS[i % DOT_COLORS.length],
  }));
}

/* ── Conseils cards ── */
const CONSEILS = [
  { emoji: '📏', title: 'Mesure constante',   body: 'Mesure toujours avant ton wash day, au même endroit, pour des résultats fiables et comparables.' },
  { emoji: '📷', title: 'Photos régulières',  body: 'Une photo toutes les 4 semaines suffit pour voir une vraie progression sur la durée.' },
  { emoji: '💆', title: 'Massage du cuir',    body: '5 min de massage quotidien stimule la circulation et favorise activement la pousse.' },
  { emoji: '💧', title: 'Hydratation',        body: 'La rétention, c\'est la clé. Hydrate et scelle chaque semaine pour garder chaque centimètre.' },
];

/* ── Line chart component ── */
function LineSegment({ x1, y1, x2, y2, color }: { x1: number; y1: number; x2: number; y2: number; color: string }) {
  const dx  = x2 - x1;
  const dy  = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const ang = Math.atan2(dy, dx) * (180 / Math.PI);
  const cos = Math.cos(ang * Math.PI / 180);
  const sin = Math.sin(ang * Math.PI / 180);
  return (
    <View style={{
      position: 'absolute',
      left: x1 + (cos - 1) * len / 2,
      top:  y1 - 1.25 + sin * len / 2,
      width: len, height: 2.5,
      backgroundColor: color, borderRadius: 2,
      transform: [{ rotate: `${ang}deg` }],
    }} />
  );
}

function MiniLineChart({ chartWidth, months, growth, scores }: {
  chartWidth: number; months: string[]; growth: number[]; scores?: number[];
}) {
  const PAD_L = 28; const PAD_B = 22; const H = 110;
  const innerW = chartWidth - PAD_L - 8;
  const innerH = H - PAD_B;

  const n = growth.length;
  const gMin = n > 0 ? Math.min(...growth) : 0;
  const gMax = n > 0 ? Math.max(...growth) : 1;
  const gRange = Math.max(gMax - gMin, 0.1);
  const gPts = growth.map((v, i) => ({
    x: PAD_L + (n > 1 ? i / (n - 1) : 0.5) * innerW,
    y: innerH - ((v - gMin) / gRange) * innerH * 0.85,
  }));

  const sc = scores ?? [];
  const sMin = sc.length > 0 ? Math.min(...sc) : 0;
  const sMax = sc.length > 0 ? Math.max(...sc) : 1;
  const sRange = Math.max(sMax - sMin, 0.1);
  const sPts = sc.map((v, i) => ({
    x: PAD_L + (sc.length > 1 ? i / (sc.length - 1) : 0.5) * innerW,
    y: innerH - ((v - sMin) / sRange) * innerH * 0.85,
  }));

  return (
    <View style={{ width: chartWidth, height: H + 8, position: 'relative' }}>
      {[0, 0.33, 0.66, 1].map((t, i) => (
        <View key={i} style={{
          position: 'absolute', left: PAD_L, top: innerH - t * innerH * 0.85,
          width: innerW, height: 1, backgroundColor: Colors.border,
        }} />
      ))}
      {gPts.slice(0, -1).map((p, i) => (
        <LineSegment key={`g${i}`} x1={p.x} y1={p.y} x2={gPts[i+1].x} y2={gPts[i+1].y} color={Colors.sage} />
      ))}
      {gPts.map((p, i) => (
        <View key={`gd${i}`} style={{ position: 'absolute', left: p.x - 4, top: p.y - 4, width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.sage, borderWidth: 2, borderColor: '#fff' }} />
      ))}
      {sPts.slice(0, -1).map((p, i) => (
        <LineSegment key={`s${i}`} x1={p.x} y1={p.y} x2={sPts[i+1].x} y2={sPts[i+1].y} color={Colors.amber} />
      ))}
      {sPts.map((p, i) => (
        <View key={`sd${i}`}>
          <View style={{ position: 'absolute', left: p.x - 4, top: p.y - 4, width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.amber, borderWidth: 2, borderColor: '#fff' }} />
          <Text style={{ position: 'absolute', left: p.x - 12, top: p.y + 6, fontSize: 8, fontFamily: 'DMSans_400Regular', color: Colors.amber, textAlign: 'center', width: 24 }}>{sc[i]}</Text>
        </View>
      ))}
      {months.map((m, i) => (
        <Text key={`m${i}`} style={{
          position: 'absolute',
          left: PAD_L + (months.length > 1 ? i / (months.length - 1) : 0.5) * innerW - 12,
          top: H - 14, fontSize: 9, fontFamily: 'DMSans_400Regular', color: Colors.warmGray,
          textAlign: 'center', width: 24,
        }}>{m}</Text>
      ))}
    </View>
  );
}


export default function GrowthScreen() {
  const router = useRouter();
  const { state, dispatch, queueBcTrigger } = useApp();
  const { hasAccess, requireAccess, maybeShowMoment, openPremium } = usePremium();
  const { width } = useWindowDimensions();

  const history = state.growthHistory as Entry[];
  const [showModal, setShowModal]         = useState(false);
  const [form, setForm]                   = useState({ devant: '', derriere: '', coteGauche: '', coteDroit: '', notes: '' });
  const [formError, setFormError]         = useState('');
  const [flashSaved, setFlashSaved]       = useState(false);
  const [showObjectif, setShowObjectif]   = useState(false);
  const [objForm, setObjForm]             = useState({ longueur: '' });
  const [objDate, setObjDate]             = useState<Date | null>(null);
  const [showObjCal, setShowObjCal]       = useState(false);
  const [showAnalyse, setShowAnalyse]     = useState(false);
  const [bcSynthesis, setBcSynthesis]   = useState('');
  const [bcScore, setBcScore]           = useState<number | null>(null);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise(res => setTimeout(res, 600));
    setRefreshing(false);
  }, []);

  /* ── Calculs ── */

  const primaryH       = history.filter(h => h.zone === 'Devant').sort((a,b) => a.date.localeCompare(b.date));
  const latestM        = primaryH[primaryH.length - 1];
  const ref3mAgo       = new Date(TODAY_DATE); ref3mAgo.setMonth(ref3mAgo.getMonth() - 3);
  const refPoint3m     = [...primaryH].reverse().find(h => h.date <= toLocalISODate(ref3mAgo));
  const growth3m       = latestM && refPoint3m ? +(latestM.cm - refPoint3m.cm).toFixed(1) : null;
  const growthPerMonth = growth3m !== null ? +(growth3m / 3).toFixed(1) : 0;

  const avgCurrentCm = averageLatestCmByZone(history);

  const totalPousse = growth3m ?? 0;
  const scoreHealth = computeHairHealthScore(state);
  const suivi = (() => {
    if (history.length === 0) return 0;
    const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
    const firstDate = new Date(sorted[0].date);
    const months = (TODAY_DATE.getFullYear() - firstDate.getFullYear()) * 12
      + (TODAY_DATE.getMonth() - firstDate.getMonth());
    return Math.max(1, months);
  })();

  useEffect(() => {
    if (suivi > FREE_GROWTH_HISTORY_MONTHS) void maybeShowMoment('growth_history');
  }, [suivi, maybeShowMoment]);

  useEffect(() => {
    let cancelled = false;
    void resolveBlackCottonBilanSynthesis(state).then(res => {
      if (!cancelled) {
        setBcSynthesis(res.text);
        setBcScore(res.score ?? null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [state.growthHistory, state.coinHistory, state.profile, state.validated]);

  // Chart data from real measurements
  const SHORT_M = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
  const monthMap: Record<string, number> = {};
  primaryH.forEach(h => { monthMap[h.date.slice(0, 7)] = h.cm; });
  const mKeys = Object.keys(monthMap).sort().slice(-7);
  const realChartMonths: string[] = [];
  const realChartGrowth: number[] = [];
  for (let i = 1; i < mKeys.length; i++) {
    realChartMonths.push(SHORT_M[parseInt(mKeys[i].split('-')[1]) - 1]);
    realChartGrowth.push(Math.max(0, +(monthMap[mKeys[i]] - monthMap[mKeys[i - 1]]).toFixed(1)));
  }
  /** Au moins 2 mois de mesures Devant → courbe mensuelle (fixtures démo incluses). */
  const hasChartData = mKeys.length >= 2;
  const measureSessions = withSessionDotColors(history);
  const hasGrowthEntries = history.length > 0;

  // Palier / objectif
  const targetCm  = parseFloat(state.profile.targetLength ?? '') || 40;
  const currentCm = avgCurrentCm || (latestM?.cm ?? parseCmFromText(state.profile.length) ?? 0);
  const palierPct = currentCm > 0 ? Math.min(100, Math.round((currentCm / targetCm) * 100)) : 0;
  const remaining = Math.max(0, +(targetCm - currentCm).toFixed(1));
  const monthsToTarget = growthPerMonth > 0 && remaining > 0
    ? +(remaining / growthPerMonth).toFixed(1) : null;

  // Bilan ce mois
  const thisMonthKey = TODAY.slice(0, 7);
  const soinsThisMonth = state.coinHistory.filter(e => e.date.startsWith(thisMonthKey) && e.amount > 0).length;
  const prevMonthDate = new Date(TODAY_DATE);
  prevMonthDate.setMonth(prevMonthDate.getMonth() - 1);
  const prevMonthKey = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;
  const growthThisMonth = monthMap[thisMonthKey] && monthMap[prevMonthKey]
    ? +(monthMap[thisMonthKey] - monthMap[prevMonthKey]).toFixed(1) : null;

  // Badges from real data
  const BADGES = [
    { emoji: '🔥', label: 'Streak 7j',   unlocked: state.streak >= 7,   hint: state.streak >= 7 ? '✓ Débloqué' : `Encore ${7 - state.streak}j` },
    { emoji: '🧴', label: 'Hydra Pro',   unlocked: soinsThisMonth >= 4,  hint: soinsThisMonth >= 4 ? '✓ Débloqué' : `Encore ${4 - soinsThisMonth} soins` },
    { emoji: '📏', label: '+5 cm',       unlocked: totalPousse >= 5,     hint: totalPousse >= 5 ? '✓ Débloqué' : `Encore ${(5 - totalPousse).toFixed(1)} cm` },
    { emoji: '🍌', label: 'Bonnet 30j',  unlocked: state.streak >= 30,   hint: state.streak >= 30 ? '✓ Débloqué' : `Encore ${30 - state.streak}j` },
    { emoji: '✂️', label: 'Trim Master', unlocked: false,                hint: 'Encore 1 trim pour débloquer' },
    { emoji: '👑', label: 'Crown',       unlocked: soinsThisMonth >= 12, hint: soinsThisMonth >= 12 ? '✓ Débloqué' : `Encore ${12 - soinsThisMonth} soins` },
  ];

  /* ── Actions ── */
  function openModal() {
    setForm({ devant: '', derriere: '', coteGauche: '', coteDroit: '', notes: '' });
    setFormError('');
    setShowModal(true);
  }

  function submitMeasure() {
    const entries: { zone: Zone; cm: number }[] = [
      { zone: 'Devant' as Zone,      cm: parseFloat(form.devant)     },
      { zone: 'Derrière' as Zone,    cm: parseFloat(form.derriere)   },
      { zone: 'Côté Gauche' as Zone, cm: parseFloat(form.coteGauche) },
      { zone: 'Côté Droit' as Zone,  cm: parseFloat(form.coteDroit)  },
    ].filter(e => !isNaN(e.cm) && e.cm >= 1 && e.cm <= 200);

    if (entries.length === 0) { setFormError('Entre au moins une mesure valide (1–200 cm).'); return; }
    const wasFirst = history.length === 0;
    const beforeAvg = avgLatestGrowthCm(history);
    entries.forEach(e => dispatch({ type: 'addGrowthEntry', entry: { date: TODAY, zone: e.zone, cm: e.cm } }));
    const afterHistory: GrowthMeasureRow[] = [
      ...history,
      ...entries.map(e => ({ date: TODAY, zone: e.zone, cm: e.cm })),
    ];
    const afterAvg = avgLatestGrowthCm(afterHistory);
    const deltaCm =
      beforeAvg != null && afterAvg != null ? +(afterAvg - beforeAvg).toFixed(1) : null;
    queueBcTrigger('post_measurement', buildPostMeasurementContext({
      streak: state.streak,
      deltaCm: wasFirst ? null : deltaCm,
      currentCm: afterAvg,
    }));
    void trackMeasurementSaved({
      source: 'growth_modal',
      zonesCount: entries.length,
      wasFirst,
    });
    setShowModal(false);
    setFlashSaved(true);
    setTimeout(() => setFlashSaved(false), 2500);
  }

  const chartWidth = width - 40 - 32;

  return (
    <SafeAreaView style={S.safe} edges={['top']}>

      {/* ── Header ── */}
      <View style={S.header}>
        <BackButton onPress={() => router.back()} style={S.backBtn} />
        <Text style={S.headerTitle}>Progression</Text>
        <TouchableOpacity style={S.coinsBadge} onPress={() => router.push('/rewards')}>
          <CoinIcon size={16} />
          <Text style={S.coinsText}>{state.coins}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={S.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.amber}
            colors={[Colors.amber]}
          />
        }
      >

        {scoreHealth != null && scoreHealth < 30 ? (
          <GrowthHealthActionBanner score={scoreHealth} />
        ) : null}

        {/* ── Stats 2×2 ── */}
        <View style={S.statsGrid}>
          <View style={[S.statCard, S.statCardDark]}>
            <Text style={S.statValDark}>{totalPousse > 0 ? `+${totalPousse} cm` : '— cm'}</Text>
            <Text style={S.statLabelDark}>Pousse totale</Text>
          </View>
          <View style={S.statCard}>
            <Text style={S.statVal}>{suivi > 0 ? `${suivi} mois` : '< 1 mois'}</Text>
            <Text style={S.statLabel}>Suivi en cours</Text>
          </View>
          <View style={S.statCard}>
            <Text style={S.statVal}>
              {scoreHealth != null ? scoreHealth : '—'}
              <Text style={S.statValMuted}>/100</Text>
            </Text>
            <Text style={S.statLabel}>Score santé</Text>
          </View>
          <View style={S.statCard}>
            <Text style={S.statVal}>{state.streak} <Text style={{ fontSize: 18 }}>🔥</Text></Text>
            <Text style={S.statLabel}>Streak actuel</Text>
          </View>
        </View>

        {/* ── Badges & succès (liés au soin : streak, hydra…) ── */}
        <Text style={[S.secTitle, { marginBottom: 10 }]}>Badges & succès</Text>
        <View style={S.badgesGrid}>
          {BADGES.map((b, i) => (
            <View key={i} style={[S.badgeCard, b.unlocked && S.badgeCardUnlocked]}>
              {b.unlocked ? (
                <Text style={{ fontSize: 30 }}>{b.emoji}</Text>
              ) : (
                <Text style={{ fontSize: 26 }}>🔒</Text>
              )}
              <Text style={S.badgeLabel}>{b.label}</Text>
              <Text style={[S.badgeHint, b.unlocked && { color: Colors.sage }]}>{b.hint}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity
          style={S.achievementsLink}
          onPress={() => router.push('/achievements' as any)}
          activeOpacity={0.75}
        >
          <Text style={S.achievementsLinkText}>Voir tous les succès</Text>
          <Ionicons name="chevron-forward" size={16} color={Colors.amberDark} />
        </TouchableOpacity>

        {/* ── Bilan automatique (soins du mois + pousse) ── */}
        <View style={S.bilanCard}>
          <Text style={S.bilanLabel}>BILAN AUTOMATIQUE</Text>
          <Text style={S.bilanTitle}>
            {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase())}
          </Text>
          <View style={S.bilanStats}>
            {[
              { val: soinsThisMonth > 0 ? String(soinsThisMonth) : '—', sub: 'Soins effectués' },
              { val: growthThisMonth !== null ? `+${growthThisMonth} cm` : '—',  sub: 'Gagnés ce mois' },
              { val: hasGrowthEntries ? '+6 pts défi' : '—', sub: 'Score Black Cotton' },
            ].map((item, i) => (
              <View key={i} style={S.bilanStat}>
                <Text style={S.bilanStatVal}>{item.val}</Text>
                <Text style={S.bilanStatSub}>{item.sub}</Text>
              </View>
            ))}
          </View>
          <View style={S.bilanMsg}>
            <Text style={S.bilanMsgLabel}>Black Cotton</Text>
            {bcScore != null ? (
              <Text style={S.bilanMsgScore}>Score diagnostic · {bcScore}/100</Text>
            ) : null}
            <Text style={S.bilanMsgText}>
              {bcSynthesis || 'Fais une analyse photo pour une synthèse personnalisée ce mois-ci.'}
            </Text>
          </View>
        </View>

        {/* ── Hair length shortcut ── */}
        <TouchableOpacity style={S.hairLengthBtn} onPress={() => router.push('/hair-length' as any)}>
          <Text style={{ fontSize: 22 }}>📏</Text>
          <View style={{ flex: 1 }}>
            <Text style={S.hairLengthBtnTitle}>Définir ma longueur</Text>
            <Text style={S.hairLengthBtnSub}>Mesure tes 4 zones pour un suivi précis</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.warmGray} />
        </TouchableOpacity>

        {/* ── Historique des entrées ── */}
        <View style={S.sectionRow}>
          <Text style={S.secTitle}>Historique des entrées</Text>
          <Text style={S.secCount}>
            {measureSessions.length} entrée{measureSessions.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {measureSessions.length === 0 ? (
          <View style={S.emptyBlock}>
            <Text style={S.emptyEmoji}>📏</Text>
            <Text style={S.emptyTitle}>Aucune entrée pour le moment</Text>
            <Text style={S.emptySub}>
              Enregistre tes mesures pour suivre ta progression au fil du temps.
            </Text>
            <TouchableOpacity style={S.emptyBtn} onPress={openModal}>
              <Text style={S.emptyBtnText}>Ajouter une mesure</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={S.timeline}>
            {measureSessions.map((entry, i) => (
              <View key={entry.date} style={S.timelineRow}>
                <View style={S.timelineDotCol}>
                  <View style={[S.timelineDot, { backgroundColor: entry.dotColor }]} />
                  {i < measureSessions.length - 1 && <View style={S.timelineLine} />}
                  {i === measureSessions.length - 1 && <View style={S.timelineLineGhost} />}
                </View>

                <View style={[S.photoCard, entry.isLatest && S.photoCardCurrent]}>
                  <View style={S.photoCardTop}>
                    <View style={S.photoThumb}>
                      <Text style={{ fontSize: 22 }}>📏</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={S.photoMeta}>
                        <Text style={S.photoDate}>{entry.dateLabel}</Text>
                        {entry.isLatest && (
                          <View style={S.currentBadge}>
                            <Text style={S.currentBadgeText}>DERNIÈRE</Text>
                          </View>
                        )}
                      </View>
                      <View style={S.photoPills}>
                        <View style={S.photoPill}>
                          <Text style={S.photoPillText}>{entry.avgCm} cm (moy.)</Text>
                        </View>
                        <View style={S.photoPill}>
                          <Text style={S.photoPillText}>
                            {entry.zoneCount} zone{entry.zoneCount > 1 ? 's' : ''}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            ))}

            <View style={S.timelineRow}>
              <View style={S.timelineDotCol}>
                <View style={[S.timelineDot, { backgroundColor: Colors.border }]} />
              </View>
              <TouchableOpacity style={S.addPhotoBtn} onPress={openModal}>
                <Ionicons name="add-circle-outline" size={18} color={Colors.warmGray} />
                <Text style={S.addPhotoBtnText}>Ajouter une mesure</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Évolution mensuelle ── */}
        <Text style={[S.secTitle, { marginBottom: 14 }]}>Évolution mensuelle</Text>
        <View style={S.chartCard}>
          {hasChartData ? (
            <>
              <View style={S.chartLegend}>
                <View style={S.legendItem}>
                  <View style={[S.legendDot, { backgroundColor: Colors.sage }]} />
                  <Text style={S.legendText}>Pousse (cm/mois)</Text>
                </View>
              </View>
              <MiniLineChart
                chartWidth={chartWidth}
                months={realChartMonths}
                growth={realChartGrowth}
              />
            </>
          ) : (
            <View style={S.emptyChart}>
              <Text style={S.emptyEmoji}>📈</Text>
              <Text style={S.emptyTitle}>Pas encore de courbe</Text>
              <Text style={S.emptySub}>
                Enregistre au moins deux mesures sur des mois différents pour voir ton évolution mensuelle.
              </Text>
            </View>
          )}
        </View>

        {/* ── Prochain palier ── */}
        <View style={S.palierCard}>
          <View style={S.palierHeader}>
            <View style={S.palierIcon}><Text style={{ fontSize: 18 }}>🎯</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={S.palierTitle}>Prochain palier</Text>
              <Text style={S.palierSub}>Tu es à <Text style={{ fontFamily: 'DMSans_700Bold', color: Colors.amber }}>{remaining} cm</Text> de ton objectif {targetCm} cm</Text>
            </View>
          </View>
          <View style={S.palierBarBg}>
            <View style={[S.palierBarFill, { width: `${palierPct}%` }]} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
            <Text style={S.palierEdge}>{currentCm > 0 ? `${currentCm} cm` : '—'}</Text>
            <Text style={[S.palierEdge, { color: Colors.amber, fontFamily: 'DMSans_700Bold' }]}>Objectif : {targetCm} cm</Text>
          </View>
          <Text style={S.palierNote}>
            {growthPerMonth > 0
              ? `À ton rythme actuel (+${growthPerMonth} cm/mois), tu y seras dans `
              : 'Continue le suivi pour estimer ton délai '}
            {monthsToTarget !== null
              ? <Text style={{ fontFamily: 'DMSans_700Bold', color: Colors.ink }}>~{monthsToTarget} mois 🌱</Text>
              : '📏'}
          </Text>
        </View>

        {/* ── Objectif ── */}
        <View style={S.objectifCard}>
          <Text style={S.objectifLabel}>OBJECTIF</Text>
          <Text style={S.objectifTitle}>Atteindre {targetCm} cm</Text>
          <Text style={S.objectifDate}>
            {state.profile.objectiveTargetDate?.trim()
              ? `Échéance : ${formatFull(new Date(state.profile.objectiveTargetDate.trim() + 'T12:00:00'))}`
              : state.profile.targetLength
                ? 'Objectif de longueur personnalisé'
                : 'Objectif par défaut'}
          </Text>
          <View style={S.objectifBarBg}>
            <View style={[S.objectifBarFill, { width: `${palierPct}%` }]} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            <Text style={S.objectifEdge}>{currentCm > 0 ? `${currentCm} cm actuels` : '— cm actuels'}</Text>
            <Text style={S.objectifEdge}>{palierPct}% accompli</Text>
          </View>
          <TouchableOpacity
            style={S.objectifBtn}
            onPress={() => {
              const tl = (state.profile.targetLength ?? '').trim();
              setObjForm({ longueur: tl || (targetCm > 0 ? String(targetCm) : '') });
              const raw = state.profile.objectiveTargetDate?.trim();
              setObjDate(raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? new Date(`${raw}T12:00:00`) : null);
              setShowObjCal(false);
              setShowObjectif(true);
            }}
          >
            <Ionicons name="pencil-outline" size={13} color={Colors.warmGray} />
            <Text style={S.objectifBtnText}>Voir détails</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={S.quarterlyCta}
          onPress={() => router.push('/quarterly-bilan' as any)}
          activeOpacity={0.88}
        >
          <Text style={S.quarterlyEmoji}>📋</Text>
          <View style={{ flex: 1 }}>
            <Text style={S.quarterlyTitle}>Bilan trimestriel (90 jours)</Text>
            <Text style={S.quarterlySub}>
              Mesures · routines validées · synthèse BC — pour ton RDV coiffeuse ou trichologue
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.warmGray} />
        </TouchableOpacity>

        {/* ── Export bilan ── */}
        <View style={S.exportCard}>
          <View style={S.exportLeft}>
            <View style={S.exportIcon}><Text style={{ fontSize: 22 }}>📊</Text></View>
            <View>
              <Text style={S.exportTitle}>Télécharger mon bilan</Text>
              <Text style={S.exportSub}>Stats · photos · score Black Cotton · notes</Text>
            </View>
          </View>
          <View style={S.exportBtns}>
            <TouchableOpacity
              style={[S.exportBtn, { backgroundColor: Colors.ink }]}
              onPress={async () => {
                const ok = await requireAccess('growth_export');
                if (!ok) return;
                if (hasAccess) {
                  void markPremiumFirstValue('export');
                  void trackProductEvent('premium_trial_first_value', { kind: 'export' });
                }
                const exported = await exportBilanPdf(state, {
                  title: 'Bilan capillaire mensuel',
                  periodDays: 30,
                });
                if (exported && hasAccess) {
                  void trackProductEvent('premium_trial_first_value', { kind: 'export' });
                }
              }}
            >
              <Text style={S.exportBtnText}>📊 Exporter en PDF</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[S.exportBtn, { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border }]}
              onPress={async () => {
                const ok = await requireAccess('growth_export');
                if (!ok) return;
                await exportBilanPdf(state, {
                  title: 'Bilan capillaire mensuel',
                  periodDays: 30,
                });
              }}
            >
              <Text style={[S.exportBtnText, { color: Colors.ink }]}>🖼️ Image</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Conseils ── */}
        <View style={S.tipsBlock}>
          <View style={S.tipsHeader}>
            <BCEmojiAvatar size={40} mood="coaching" />
            <View style={{ flex: 1 }}>
              <Text style={S.tipsHeaderTitle}>Conseils Black Cotton</Text>
              <Text style={S.tipsHeaderSub}>Optimise ta pousse capillaire</Text>
            </View>
          </View>
          {CONSEILS.map((c, i) => (
            <View key={i} style={[S.tipRow, i < CONSEILS.length - 1 && S.tipRowBorder]}>
              <Text style={S.tipEmoji}>{c.emoji}</Text>
              <View style={S.tipBody}>
                <Text style={S.tipTitle}>{c.title}</Text>
                <Text style={S.tipText}>{c.body}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── Outils d'Analyse ── */}
        <Text style={[S.secTitle, { marginBottom: 14 }]}>Outils d'Analyse</Text>
        <View style={S.toolsRow}>
          <TouchableOpacity style={S.toolCard} onPress={() => setShowAnalyse(true)}>
            <View style={[S.toolIcon, { backgroundColor: '#FFE8EE' }]}>
              <Ionicons name="trending-up-outline" size={20} color={Colors.rose} />
            </View>
            <Text style={S.toolTitle}>Analyser la Croissance</Text>
            <Text style={S.toolSub}>Compare tes photos et mesure tes progrès</Text>
          </TouchableOpacity>
          <TouchableOpacity style={S.toolCard}>
            <View style={[S.toolIcon, { backgroundColor: Colors.amberLight }]}>
              <Ionicons name="bar-chart-outline" size={20} color={Colors.amber} />
            </View>
            <Text style={S.toolTitle}>Graphiques</Text>
            <Text style={S.toolSub}>Visualisez l'évolution sur le temps</Text>
          </TouchableOpacity>
        </View>

        {/* Nouvelle mesure CTA */}
        <TouchableOpacity style={S.newMeasureBtn} onPress={openModal}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={S.newMeasureBtnText}>Nouvelle mesure</Text>
          <View style={S.newMeasurePts}><Text style={S.newMeasurePtsText}>+5 pts défi</Text></View>
        </TouchableOpacity>

        {flashSaved && (
          <View style={S.flash}>
            <Text style={S.flashText}>✓ Mesure enregistrée !</Text>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ── Modal Nouvelle mesure ── */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <TouchableOpacity style={S.modalOverlay} activeOpacity={1} onPress={() => setShowModal(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ width: '100%' }}>
            <TouchableOpacity activeOpacity={1} onPress={() => {}}>
              <View style={S.sheet}>
                <View style={S.sheetHandle} />
                <Text style={S.sheetTitle}>Ajouter une mesure</Text>
                <Text style={S.sheetSub}>Mesure tes cheveux en centimètres à différents endroits</Text>
                <View style={S.fieldsGrid}>
                  {([
                    { key: 'devant',     label: 'Devant (cm)'      },
                    { key: 'derriere',   label: 'Derrière (cm)'    },
                    { key: 'coteGauche', label: 'Côté gauche (cm)' },
                    { key: 'coteDroit',  label: 'Côté droit (cm)'  },
                  ] as const).map(({ key, label }) => (
                    <View key={key} style={S.fieldWrap}>
                      <Text style={S.fieldLabel}>{label}</Text>
                      <TextInput
                        style={S.fieldInput}
                        value={form[key]}
                        onChangeText={v => { setForm(f => ({ ...f, [key]: v })); setFormError(''); }}
                        placeholder="0.0"
                        placeholderTextColor={Colors.border}
                        keyboardType="decimal-pad"
                      />
                    </View>
                  ))}
                </View>
                {formError ? <Text style={S.formError}>{formError}</Text> : null}
                <Text style={S.fieldLabel}>Notes (optionnel)</Text>
                <TextInput
                  style={S.notesInput}
                  value={form.notes}
                  onChangeText={v => setForm(f => ({ ...f, notes: v }))}
                  placeholder="Observations, produits utilisés..."
                  placeholderTextColor={Colors.warmGray}
                  multiline
                />
                <TouchableOpacity style={S.saveBtn} onPress={submitMeasure}>
                  <Text style={S.saveBtnText}>Enregistrer la mesure</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>

      {/* ── Modal Objectif ── */}
      <Modal visible={showObjectif} transparent animationType="fade" onRequestClose={() => setShowObjectif(false)}>
        <TouchableOpacity style={S.objOverlay} activeOpacity={1} onPress={() => setShowObjectif(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ width: '100%', paddingHorizontal: 24 }}>
            <TouchableOpacity activeOpacity={1} onPress={() => {}}>
              <View style={S.objSheet}>
                <View style={S.objHeader}>
                  <Text style={S.objTitle}>Définir un objectif</Text>
                  <TouchableOpacity onPress={() => setShowObjectif(false)} style={S.objClose}>
                    <Ionicons name="close" size={18} color={Colors.ink} />
                  </TouchableOpacity>
                </View>
                <Text style={S.objLabel}>Longueur cible (cm)</Text>
                <TextInput
                  style={S.objInput}
                  value={objForm.longueur}
                  onChangeText={v => setObjForm(f => ({ ...f, longueur: v }))}
                  placeholder="ex. 40"
                  placeholderTextColor={Colors.border}
                  keyboardType="decimal-pad"
                />
                <Text style={[S.objLabel, { marginTop: 14 }]}>Date cible</Text>
                <TouchableOpacity style={[S.objInput, S.objDateRow]} onPress={() => setShowObjCal(v => !v)}>
                  <Text style={objDate ? S.objDateText : S.objDatePlaceholder}>
                    {objDate ? formatFull(objDate) : 'Choisir une date'}
                  </Text>
                  <Ionicons name="calendar-outline" size={18} color={showObjCal ? Colors.rose : Colors.warmGray} />
                </TouchableOpacity>
                {showObjCal && (
                  <MiniCalendar selectedDate={objDate} onSelect={d => { setObjDate(d); setShowObjCal(false); }} horizontalOffset={96} />
                )}
                <TouchableOpacity
                  style={[S.objBtn, (!objForm.longueur?.trim() || !objDate) && { backgroundColor: Colors.border }]}
                  onPress={() => {
                    if (!objForm.longueur?.trim() || !objDate) return;
                    dispatch({
                      type: 'updateProfile',
                      payload: {
                        targetLength: objForm.longueur.trim(),
                        objectiveTargetDate: toLocalISODate(objDate),
                      },
                    });
                    void trackProductEvent('growth_goal_set', {
                      target_cm: objForm.longueur.trim(),
                      target_date: toLocalISODate(objDate),
                    });
                    setShowObjectif(false);
                    setShowObjCal(false);
                  }}
                >
                  <Text style={S.objBtnText}>Créer l'objectif</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </TouchableOpacity>
      </Modal>

      {/* ── Modal Analyser ── */}
      <Modal visible={showAnalyse} transparent animationType="fade" onRequestClose={() => setShowAnalyse(false)}>
        <TouchableOpacity style={S.objOverlay} activeOpacity={1} onPress={() => setShowAnalyse(false)}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}} style={{ width: '100%', paddingHorizontal: 24 }}>
            <View style={S.analyseSheet}>
              <View style={S.analyseHeader}>
                <View style={S.analyseIconWrap}>
                  <Ionicons name="trending-up-outline" size={18} color={Colors.ink} />
                </View>
                <Text style={S.analyseTitle}>Analyser</Text>
                <TouchableOpacity onPress={() => setShowAnalyse(false)} style={S.objClose}>
                  <Ionicons name="close" size={18} color={Colors.ink} />
                </TouchableOpacity>
              </View>
              <Text style={S.analyseSub}>Capture le résultat de ton wash day pour des conseils d'amélioration</Text>
              <TouchableOpacity style={S.analyseBtn}>
                <Ionicons name="camera-outline" size={20} color={Colors.ink} />
                <Text style={S.analyseBtnText}>Prendre une photo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[S.analyseBtn, { marginTop: 12 }]}>
                <Ionicons name="images-outline" size={20} color={Colors.ink} />
                <Text style={S.analyseBtnText}>Choisir depuis la galerie</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.bg },
  content: { paddingHorizontal: 20, paddingBottom: 16 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  backBtn: {
    flexShrink: 0,
    marginRight: 8,
  },
  headerTitle: { fontSize: 24, fontFamily: 'Satoshi_500Medium', color: Colors.ink },
  coinsBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.ink,
    borderRadius: 999, paddingHorizontal: 14, paddingVertical: 7,
  },
  coinsEmoji: { fontSize: 15 },
  coinsText:  { fontSize: 15, fontFamily: 'DMSans_700Bold', color: Colors.amber },

  // Stats 2×2
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statCard: {
    width: '47.5%', backgroundColor: Colors.surface,
    borderRadius: 18, borderWidth: 1, borderColor: Colors.border,
    padding: 16, gap: 4,
  },
  statCardDark: { backgroundColor: Colors.ink, borderColor: Colors.ink },
  statVal:     { fontSize: 22, fontFamily: 'DMSans_700Bold', color: Colors.ink },
  statValDark: { fontSize: 22, fontFamily: 'DMSans_700Bold', color: '#fff' },
  statValMuted:{ fontSize: 14, fontFamily: 'DMSans_400Regular', color: Colors.warmGray },
  statLabel:    { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray },
  statLabelDark:{ fontSize: 11, fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.55)' },

  // Bilan automatique
  bilanCard: {
    backgroundColor: '#1E3A10', borderRadius: 20, padding: 18, marginBottom: 20,
  },
  bilanLabel: { fontSize: 10, fontFamily: 'DMSans_700Bold', color: '#7CBF5A', letterSpacing: 1.2, marginBottom: 6 },
  bilanTitle: { fontSize: 20, fontFamily: 'Satoshi_500Medium', color: '#fff', marginBottom: 14 },
  bilanStats: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  bilanStat: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12, padding: 10, alignItems: 'center', gap: 4,
  },
  bilanStatVal: { fontSize: 15, fontFamily: 'DMSans_700Bold', color: '#fff' },
  bilanStatSub: { fontSize: 9, fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.55)', textAlign: 'center' },
  bilanMsg: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, padding: 10 },
  bilanMsgLabel: { fontSize: 10, fontFamily: 'DMSans_700Bold', color: Colors.amber, letterSpacing: 0.8, marginBottom: 4 },
  bilanMsgScore: { fontSize: 11, fontFamily: 'DMSans_600SemiBold', color: 'rgba(255,255,255,0.65)', marginBottom: 6 },
  bilanMsgText: { fontSize: 12, fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.8)', lineHeight: 18 },

  // Section rows
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  secTitle: { fontSize: 18, fontFamily: 'Satoshi_500Medium', color: Colors.ink },
  secCount: { fontSize: 12, fontFamily: 'DMSans_400Regular', color: Colors.warmGray },

  // Timeline
  timeline: { marginBottom: 20 },
  timelineRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  timelineDotCol: { alignItems: 'center', width: 16 },
  timelineDot: { width: 14, height: 14, borderRadius: 7, marginTop: 14 },
  timelineLine: { width: 2, flex: 1, backgroundColor: Colors.border, minHeight: 20, marginTop: 4 },
  timelineLineGhost: { width: 2, height: 20, backgroundColor: 'transparent' },

  photoCard: {
    flex: 1, backgroundColor: Colors.surface,
    borderRadius: 16, borderWidth: 1, borderColor: Colors.border,
    padding: 12, marginBottom: 12,
  },
  photoCardCurrent: { borderColor: Colors.sage, borderWidth: 1.5 },
  photoCardTop: { flexDirection: 'row', gap: 10 },
  photoThumb: {
    width: 60, height: 60, borderRadius: 10,
    backgroundColor: Colors.cream, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center', gap: 2,
  },
  photoThumbLabel: { fontSize: 9, fontFamily: 'DMSans_400Regular', color: Colors.warmGray },
  photoMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  photoDate: { fontSize: 13, fontFamily: 'DMSans_700Bold', color: Colors.ink },
  currentBadge: { backgroundColor: Colors.sage, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  currentBadgeText: { fontSize: 9, fontFamily: 'DMSans_700Bold', color: '#fff' },
  photoPills: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  photoPill: { backgroundColor: Colors.cream, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  photoPillText: { fontSize: 10, fontFamily: 'DMSans_500Medium', color: Colors.ink },
  photoNote: { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.rose, lineHeight: 16, fontStyle: 'italic' },

  addPhotoBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: Colors.border, borderStyle: 'dashed',
    borderRadius: 14, paddingVertical: 14, marginBottom: 12,
    backgroundColor: Colors.cream,
  },
  addPhotoBtnText: { fontSize: 13, fontFamily: 'DMSans_500Medium', color: Colors.warmGray },

  // Chart
  chartCard: {
    backgroundColor: Colors.surface, borderRadius: 18,
    borderWidth: 1, borderColor: Colors.border,
    padding: 16, marginBottom: 20,
  },
  chartLegend: { flexDirection: 'row', gap: 16, marginBottom: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray },

  emptyBlock: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyChart: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 12,
  },
  emptyEmoji: { fontSize: 32, marginBottom: 10 },
  emptyTitle: {
    fontSize: 15,
    fontFamily: 'DMSans_700Bold',
    color: Colors.ink,
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 14,
  },
  emptyBtn: {
    backgroundColor: Colors.ink,
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  emptyBtnText: { fontSize: 13, fontFamily: 'DMSans_700Bold', color: '#fff' },

  // Palier
  palierCard: {
    borderRadius: 18, borderWidth: 1.5, borderColor: Colors.amber,
    backgroundColor: Colors.amberLight, padding: 16, marginBottom: 16,
  },
  palierHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  palierIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.amber + '33', alignItems: 'center', justifyContent: 'center',
  },
  palierTitle: { fontSize: 14, fontFamily: 'DMSans_700Bold', color: Colors.ink, marginBottom: 2 },
  palierSub:   { fontSize: 13, fontFamily: 'DMSans_400Regular', color: Colors.ink },
  palierBarBg: { height: 8, backgroundColor: 'rgba(0,0,0,0.08)', borderRadius: 999, overflow: 'hidden' },
  palierBarFill: {
    height: 8, borderRadius: 999,
    backgroundColor: Colors.sage,
  },
  palierEdge: { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, marginBottom: 8 },
  palierNote: { fontSize: 12, fontFamily: 'DMSans_400Regular', color: Colors.ink, lineHeight: 18 },

  // Objectif
  objectifCard: { backgroundColor: Colors.ink, borderRadius: 20, padding: 18, marginBottom: 16 },
  objectifLabel: { fontSize: 10, fontFamily: 'DMSans_700Bold', color: 'rgba(255,255,255,0.45)', letterSpacing: 1.2, marginBottom: 4 },
  objectifTitle: { fontSize: 22, fontFamily: 'Satoshi_500Medium', color: '#fff', marginBottom: 2 },
  objectifDate:  { fontSize: 12, fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.5)', marginBottom: 14 },
  objectifBarBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 999, overflow: 'hidden' },
  objectifBarFill: { height: 6, backgroundColor: Colors.sage, borderRadius: 999 },
  objectifEdge: { fontSize: 12, fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.65)' },
  objectifBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.1)',
    alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8, marginTop: 14,
  },
  objectifBtnText: { fontSize: 12, fontFamily: 'DMSans_600SemiBold', color: Colors.warmGray },

  // Export
  premiumUpsell: {
    marginHorizontal: 20,
    marginBottom: 14,
    backgroundColor: Colors.amberLight,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.amber,
    padding: 14,
  },
  premiumUpsellTitle: { fontSize: 14, fontFamily: 'DMSans_700Bold', color: Colors.ink, marginBottom: 4 },
  premiumUpsellSub: { fontSize: 12, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, lineHeight: 17 },
  premiumUpsellCta: { marginTop: 8, fontSize: 12, fontFamily: 'DMSans_700Bold', color: Colors.amberDark },

  quarterlyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 14,
  },
  quarterlyEmoji: { fontSize: 28 },
  quarterlyTitle: { fontSize: 14, fontFamily: 'DMSans_700Bold', color: Colors.ink, marginBottom: 2 },
  quarterlySub: { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, lineHeight: 16 },
  exportCard: {
    backgroundColor: Colors.surface, borderRadius: 18,
    borderWidth: 1, borderColor: Colors.border, padding: 16, marginBottom: 20,
  },
  exportLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  exportIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: Colors.cream, alignItems: 'center', justifyContent: 'center',
  },
  exportTitle: { fontSize: 14, fontFamily: 'DMSans_700Bold', color: Colors.ink, marginBottom: 2 },
  exportSub:   { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray },
  exportBtns:  { flexDirection: 'row', gap: 10 },
  exportBtn:   { flex: 1, borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  exportBtnText: { fontSize: 13, fontFamily: 'DMSans_700Bold', color: '#fff' },

  // Badges
  badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 },
  achievementsLink: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    marginBottom: 20, paddingVertical: 6,
  },
  achievementsLinkText: { fontSize: 13, fontFamily: 'DMSans_700Bold', color: Colors.amberDark },
  badgeCard: {
    width: '30.5%', backgroundColor: Colors.surface,
    borderRadius: 16, borderWidth: 1, borderColor: Colors.border,
    padding: 12, alignItems: 'center', gap: 4,
  },
  badgeCardUnlocked: { backgroundColor: Colors.amberLight, borderColor: Colors.amber },
  badgeLabel: { fontSize: 11, fontFamily: 'DMSans_700Bold', color: Colors.ink, textAlign: 'center' },
  badgeHint:  { fontSize: 9, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, textAlign: 'center', lineHeight: 13 },

  // Conseils
  tipsBlock: {
    backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: 20, overflow: 'hidden', marginBottom: 20,
  },
  tipsHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 16, backgroundColor: Colors.cream,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  tipsHeaderTitle: { fontSize: 15, fontFamily: 'Satoshi_500Medium', color: Colors.ink },
  tipsHeaderSub:   { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, marginTop: 2 },
  tipRow:       { flexDirection: 'row', gap: 12, padding: 14 },
  tipRowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  tipEmoji: { fontSize: 18, marginTop: 1 },
  tipBody:  { flex: 1 },
  tipTitle: { fontSize: 13, fontFamily: 'DMSans_700Bold', color: Colors.ink, marginBottom: 4 },
  tipText:  { fontSize: 12, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, lineHeight: 18 },

  // Outils
  toolsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  toolCard: {
    flex: 1, backgroundColor: Colors.surface,
    borderRadius: 16, borderWidth: 1, borderColor: Colors.border, padding: 14,
  },
  toolIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  toolTitle: { fontSize: 12, fontFamily: 'DMSans_700Bold', color: Colors.ink, marginBottom: 4 },
  toolSub:   { fontSize: 10, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, lineHeight: 14 },

  // Nouvelle mesure
  newMeasureBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.ink, borderRadius: 16, paddingVertical: 16, marginBottom: 12,
  },
  newMeasureBtnText: { fontSize: 15, fontFamily: 'DMSans_700Bold', color: '#fff' },
  newMeasurePts: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  newMeasurePtsText: { fontSize: 11, fontFamily: 'DMSans_700Bold', color: '#fff' },

  flash: { backgroundColor: Colors.sage, borderRadius: 14, padding: 14, alignItems: 'center', marginBottom: 12 },
  flashText: { fontSize: 13, fontFamily: 'DMSans_700Bold', color: '#fff' },

  // Modals
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#fff', borderRadius: 24, padding: 24, paddingBottom: 40,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 40, elevation: 16,
  },
  sheetHandle: { width: 40, height: 4, borderRadius: 99, backgroundColor: Colors.border, alignSelf: 'center', marginBottom: 20 },
  sheetTitle:  { fontSize: 18, fontFamily: 'DMSans_700Bold', color: Colors.ink, marginBottom: 6 },
  sheetSub:    { fontSize: 12, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, lineHeight: 18, marginBottom: 20 },
  fieldsGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 6 },
  fieldWrap:   { width: '47%' },
  fieldLabel:  { fontSize: 12, fontFamily: 'DMSans_600SemiBold', color: Colors.warmGray, marginBottom: 6 },
  fieldInput:  {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 16, fontFamily: 'DMSans_500Medium', color: Colors.ink,
    backgroundColor: Colors.cream, marginBottom: 6,
  },
  notesInput: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 13, fontFamily: 'DMSans_400Regular', color: Colors.ink,
    minHeight: 80, textAlignVertical: 'top', marginBottom: 16,
    backgroundColor: Colors.cream,
  },
  formError: { fontSize: 11, color: Colors.alert, marginBottom: 10 },
  saveBtn:     { padding: 16, borderRadius: 14, backgroundColor: Colors.ink, alignItems: 'center' },
  saveBtnText: { fontSize: 15, fontFamily: 'DMSans_700Bold', color: '#fff' },

  objOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  objSheet:   { backgroundColor: '#fff', borderRadius: 20, padding: 24, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 30, elevation: 16 },
  objHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  objTitle:   { fontSize: 17, fontFamily: 'DMSans_700Bold', color: Colors.ink },
  objClose:   { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.cream, alignItems: 'center', justifyContent: 'center' },
  objLabel:   { fontSize: 12, fontFamily: 'DMSans_600SemiBold', color: Colors.warmGray, marginBottom: 8 },
  objInput:   { borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, fontFamily: 'DMSans_400Regular', color: Colors.ink, marginBottom: 4 },
  objDateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  objDateText:        { fontSize: 15, fontFamily: 'DMSans_500Medium', color: Colors.ink },
  objDatePlaceholder: { fontSize: 15, fontFamily: 'DMSans_400Regular', color: Colors.border },
  objBtn:    { backgroundColor: Colors.ink, borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  objBtnText:{ fontSize: 15, fontFamily: 'DMSans_700Bold', color: '#fff' },

  analyseSheet: { backgroundColor: '#fff', borderRadius: 20, padding: 24, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 30, elevation: 16 },
  analyseHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  analyseIconWrap: { width: 32, height: 32, borderRadius: 10, backgroundColor: Colors.cream, alignItems: 'center', justifyContent: 'center' },
  analyseTitle: { flex: 1, fontSize: 17, fontFamily: 'DMSans_700Bold', color: Colors.ink },
  analyseSub:   { fontSize: 13, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, lineHeight: 20, marginBottom: 20 },
  analyseBtn:   { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 16 },
  analyseBtnText: { fontSize: 15, fontFamily: 'DMSans_500Medium', color: Colors.ink },

  // Hair length shortcut
  hairLengthBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.surface, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 16, paddingVertical: 14, marginBottom: 16,
  },
  hairLengthBtnTitle: { fontSize: 14, fontFamily: 'DMSans_700Bold', color: Colors.ink, marginBottom: 2 },
  hairLengthBtnSub:   { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray },
});
