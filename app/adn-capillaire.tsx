import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../src/theme/colors';
import { useApp } from '../src/context/AppContext';
import { HAIR_OBJECTIVES, normalizeObjectiveId } from '../src/constants/hairObjectives';
import { findHairProblematic } from '../src/constants/hairProblematics';
import { POROSITY_OPTIONS, resolvePorosity } from '../src/constants/hairProfileOptions';
import { getProfileCompletion } from '../src/lib/profileCompleteness';
import { INITIAL_SCAN_RESULT_KEY } from '../src/lib/onboardingStorage';
import type { OnboardingQuickScan } from '../src/services/onboardingScanApi';

// ─── Helpers ─────────────────────────────────────────────────────────────────

type LOCInfo = {
  method: string;
  full: string;
  description: string;
  steps: string[];
};

function getLOCMethod(porosity: string): LOCInfo {
  if (porosity === 'Faible') return {
    method: 'LCO',
    full: 'Liquid · Cream · Oil',
    description: "Ta cuticule est fermée : hydrate d'abord, applique la crème pour faire pénétrer, puis une huile légère pour sceller sans bloquer l'entrée de l'eau.",
    steps: ['💧 Liquide (eau, lait hydratant)', '🧴 Crème hydratante', '🌿 Huile légère'],
  };
  if (porosity === 'Élevée') return {
    method: 'LOC',
    full: 'Liquid · Oil · Cream',
    description: "Ta cuticule est très ouverte : scelle immédiatement l'humidité avec une huile lourde avant d'appliquer la crème, sinon l'eau repart aussi vite qu'elle est entrée.",
    steps: ['💧 Liquide (eau, lait)', '🥥 Huile lourde (coco, ricin)', '🧴 Crème scellante riche'],
  };
  return {
    method: 'LOC',
    full: 'Liquid · Oil · Cream',
    description: "Ta porosité équilibrée accepte bien la plupart des soins. La méthode LOC maintient une bonne hydratation durable.",
    steps: ['💧 Liquide (eau, lait)', '🌿 Huile légère à moyenne', '🧴 Crème hydratante'],
  };
}

type IngredientRecs = {
  recommended: { name: string; why: string }[];
  avoid: string[];
};

function getIngredientRecs(porosity: string, objective: string): IngredientRecs {
  const base: Record<string, IngredientRecs> = {
    Faible: {
      recommended: [
        { name: 'Aloe vera', why: 'hydratant léger, pénètre facilement' },
        { name: 'Glycérine diluée', why: 'attire l\'eau sans alourdir' },
        { name: 'Eau de riz', why: 'renforce et lisse la cuticule' },
        { name: 'Huile de jojoba', why: 'la plus proche du sébum naturel' },
        { name: 'Huile de pépins de raisin', why: 'légère, non grasse' },
      ],
      avoid: ['Beurre de karité pur', 'Huile de coco en excès', 'Silicones non solubles', 'Produits trop épais'],
    },
    Moyenne: {
      recommended: [
        { name: 'Aloe vera', why: 'hydratation équilibrée' },
        { name: 'Beurre de karité léger', why: 'nourrit sans alourdir' },
        { name: 'Huile d\'argan', why: 'brillance et souplesse' },
        { name: 'Miel', why: 'humectant naturel' },
        { name: 'Protéines légères', why: 'force et élasticité' },
      ],
      avoid: ['Excès de protéines', 'Silicones non solubles', 'Huiles très lourdes en excès'],
    },
    Élevée: {
      recommended: [
        { name: 'Beurre de karité', why: 'scelle et protège durablement' },
        { name: 'Huile de ricin', why: 'épaisse, excellente pour sceller' },
        { name: 'Huile de coco', why: 'pénètre la fibre, renforce' },
        { name: 'Protéines hydrolysées', why: 'comblent les lacunes de la cuticule' },
        { name: 'Miel', why: 'humectant qui retient l\'eau' },
      ],
      avoid: ['Glycérine en forte concentration', 'Produits trop légers sans scellement', 'Formules aqueuses seules'],
    },
  };

  const recs = base[porosity] ?? base.Moyenne;

  // Ajout selon objectif
  const objectiveExtras: Record<string, string> = {
    Casse_et_chute: 'Protéines de kératine',
    Fibre:          'Protéines de soie',
    Cuir_chevelu:   'Huile de tea tree',
    Pousse:         'Huile de ricin (cuir chevelu)',
    Dommages:       'Kératine végétale',
  };
  const extra = objectiveExtras[objective];
  if (extra && !recs.recommended.some(r => r.name === extra)) {
    recs.recommended = [{ name: extra, why: 'ciblé pour ton objectif' }, ...recs.recommended];
  }

  return recs;
}

function getSummaryText(hairType: string, porosity: string, objective: string): string {
  const type = hairType || 'naturels';
  const poroLabel =
    porosity === 'Faible' ? 'à faible porosité (cuticule fermée)'
    : porosity === 'Élevée' ? 'à porosité élevée (très assoiffés)'
    : 'à porosité moyenne (équilibrés)';

  const objLabel = (() => {
    const o = HAIR_OBJECTIVES.find(x => x.id === objective);
    return o ? o.label.toLowerCase() : 'un résultat optimal';
  })();

  const poro_tip =
    porosity === 'Faible'
      ? ' Pense au bonnet chauffant pour ouvrir la cuticule et faire pénétrer les soins.'
      : porosity === 'Élevée'
      ? ' Scelle toujours l\'humidité avec un produit riche pour limiter la fuite de l\'eau.'
      : ' La plupart des soins naturels seront bien acceptés par tes cheveux.';

  return `Tes cheveux ${type} ${poroLabel} ont besoin de soins orientés vers ${objLabel}.${poro_tip}`;
}

// Gradient hero selon type
function getHeroGradient(hairType: string): [string, string] {
  if (hairType.startsWith('4')) return ['#1D1D1B', '#5C3A1E'];
  if (hairType === '3C')        return ['#1A3340', '#2F5A6A'];
  if (hairType === '3B')        return ['#1F3A52', '#3A6B7A'];
  if (hairType === '3A')        return ['#1A3D20', '#3A6B2A'];
  if (hairType === 'Locks')     return ['#2A1A3D', '#4A2F5C'];
  return ['#1D1D1B', '#3A2A1A'];
}

// ─── Composants internes ──────────────────────────────────────────────────────

function DNAAttribute({ icon, label, value, sub }: {
  icon: string; label: string; value: string; sub?: string;
}) {
  const isEmpty = !value || value === '—';
  return (
    <View style={S.attrCard}>
      <Text style={S.attrIcon}>{icon}</Text>
      <Text style={S.attrLabel}>{label}</Text>
      <Text style={[S.attrValue, isEmpty && S.attrValueEmpty]}>
        {value || '—'}
      </Text>
      {sub && !isEmpty ? <Text style={S.attrSub}>{sub}</Text> : null}
    </View>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <Text style={S.sectionTitle}>{children}</Text>;
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function AdnCapillaireScreen() {
  const router = useRouter();
  const { state } = useApp();
  const { profile } = state;

  const hairType   = profile.hairType?.trim() || '';
  const porosity   = resolvePorosity(profile.porosity);
  const density    = profile.density?.trim() || '';
  const routineType = profile.routineType?.trim() || '';
  const objective  = normalizeObjectiveId(profile.objective ?? '');
  const problematics = profile.problematics ?? [];
  const { percent: completion } = getProfileCompletion(profile);

  const locInfo      = getLOCMethod(porosity);
  const ingredients  = getIngredientRecs(porosity, objective);
  const summaryText  = getSummaryText(hairType, porosity, objective);
  const heroGradient = getHeroGradient(hairType);

  const porosityOption = POROSITY_OPTIONS.find(p => p.id === porosity);
  const objectiveObj   = HAIR_OBJECTIVES.find(o => o.id === objective);

  const isLocks        = hairType === 'Locks';
  const profileMissing = !hairType;

  const [scan, setScan] = useState<OnboardingQuickScan | null>(null);
  useEffect(() => {
    AsyncStorage.getItem(INITIAL_SCAN_RESULT_KEY).then(raw => {
      if (raw) setScan(JSON.parse(raw) as OnboardingQuickScan);
    });
  }, []);

  return (
    <SafeAreaView style={S.safe} edges={['top']}>

      {/* ── Header ── */}
      <View style={S.header}>
        <TouchableOpacity style={S.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color={Colors.ink} />
        </TouchableOpacity>
        <Text style={S.headerTitle}>Mon ADN Capillaire</Text>
        <TouchableOpacity style={S.editHeaderBtn} onPress={() => router.push('/hair-profile')}>
          <Ionicons name="create-outline" size={18} color={Colors.warmGray} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.scroll}>

        {/* ════════════════════════════
            Hero — Type + identité
        ════════════════════════════ */}
        <LinearGradient colors={heroGradient} style={S.hero} start={{ x: 0.1, y: 0 }} end={{ x: 1, y: 1 }}>
          {/* Completion ring */}
          <View style={S.heroBadgeRow}>
            <View style={S.completionPill}>
              <View style={[S.completionDot, { backgroundColor: completion >= 80 ? Colors.sage : Colors.amber }]} />
              <Text style={S.completionText}>Profil {Math.round(completion)}% complété</Text>
            </View>
          </View>

          {/* Type principal */}
          <View style={S.heroCenter}>
            {hairType ? (
              <>
                <View style={S.heroTypeBadge}>
                  <Text style={S.heroTypeText}>{hairType}</Text>
                </View>
                <Text style={S.heroSub}>
                  {density ? `${density} · ` : ''}
                  {porosityOption ? `Porosité ${porosity.toLowerCase()}` : ''}
                </Text>
              </>
            ) : (
              <View style={S.heroEmpty}>
                <Text style={S.heroEmptyText}>Type non renseigné</Text>
              </View>
            )}
          </View>

          {/* Label ADN */}
          <View style={S.heroDnaRow}>
            <Text style={S.heroDnaLabel}>🧬 ADN Capillaire</Text>
            {profile.name ? (
              <Text style={S.heroDnaName}>{profile.name}</Text>
            ) : null}
          </View>
        </LinearGradient>

        {/* Profil incomplet → CTA */}
        {profileMissing ? (
          <TouchableOpacity style={S.incompleteBanner} onPress={() => router.push('/hair-profile')} activeOpacity={0.85}>
            <Ionicons name="alert-circle-outline" size={20} color={Colors.amberDark} />
            <View style={{ flex: 1 }}>
              <Text style={S.incompleteBannerTitle}>Complète ton profil</Text>
              <Text style={S.incompleteBannerSub}>
                Renseigne ton type de cheveux pour voir ton ADN complet et tes recommandations personnalisées.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.amberDark} />
          </TouchableOpacity>
        ) : null}

        {/* ════════════════════════════
            Grille ADN
        ════════════════════════════ */}
        <SectionTitle>Caractéristiques</SectionTitle>
        <View style={S.attrGrid}>
          <DNAAttribute
            icon="🧬"
            label="Type"
            value={hairType || '—'}
          />
          <DNAAttribute
            icon="💧"
            label="Porosité"
            value={porosity}
            sub={porosityOption?.label}
          />
          <DNAAttribute
            icon="🌿"
            label="Densité"
            value={density || '—'}
          />
          <DNAAttribute
            icon="⚙️"
            label="Routine"
            value={routineType || '—'}
          />
        </View>

        {/* ════════════════════════════
            Objectif + Problématiques
        ════════════════════════════ */}
        <SectionTitle>Objectif & problématiques</SectionTitle>
        <View style={S.objRow}>
          {/* Objectif */}
          <View style={S.objCard}>
            <Text style={S.objIcon}>{objectiveObj?.emoji ?? '🎯'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={S.objLabel}>Objectif principal</Text>
              <Text style={S.objValue} numberOfLines={2}>
                {objectiveObj?.label ?? (objective || 'Non renseigné')}
              </Text>
            </View>
          </View>
        </View>

        {problematics.length > 0 ? (
          <View style={S.problRow}>
            {problematics.map((p, i) => {
              const probObj = findHairProblematic(p);
              return (
                <View key={i} style={S.problChip}>
                  {probObj?.emoji ? (
                    <Text style={S.problEmoji}>{probObj.emoji}</Text>
                  ) : null}
                  <Text style={S.problText}>{p}</Text>
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={S.emptyHint}>Aucune problématique renseignée · modifier dans le profil</Text>
        )}

        {/* ════════════════════════════
            Méthode LOC / LCO
        ════════════════════════════ */}
        <SectionTitle>Méthode recommandée</SectionTitle>
        <View style={S.locCard}>
          <View style={S.locHeader}>
            <View style={S.locBadge}>
              <Text style={S.locBadgeText}>{locInfo.method}</Text>
            </View>
            <Text style={S.locFull}>{locInfo.full}</Text>
          </View>
          <Text style={S.locDesc}>{locInfo.description}</Text>
          <View style={S.locSteps}>
            {locInfo.steps.map((step, i) => (
              <View key={i} style={S.locStep}>
                <View style={S.locStepNum}>
                  <Text style={S.locStepNumText}>{i + 1}</Text>
                </View>
                <Text style={S.locStepText}>{step}</Text>
              </View>
            ))}
          </View>
          {isLocks ? (
            <View style={S.locksNote}>
              <Ionicons name="information-circle-outline" size={14} color={Colors.warmGray} />
              <Text style={S.locksNoteText}>
                Pour les locks : la méthode s'applique au cuir chevelu et aux racines uniquement.
              </Text>
            </View>
          ) : null}
        </View>

        {/* ════════════════════════════
            Ingrédients
        ════════════════════════════ */}
        <SectionTitle>Ingrédients pour toi</SectionTitle>

        {/* Recommandés */}
        <View style={S.ingrSection}>
          <View style={S.ingrSectionHeader}>
            <View style={[S.ingrDot, { backgroundColor: Colors.sage }]} />
            <Text style={S.ingrSectionLabel}>Idéaux pour ta porosité</Text>
          </View>
          <View style={S.ingrChips}>
            {ingredients.recommended.slice(0, 5).map((r, i) => (
              <TouchableOpacity
                key={i}
                style={S.ingrChipGreen}
                activeOpacity={0.75}
              >
                <Text style={S.ingrChipGreenText}>{r.name}</Text>
                <Text style={S.ingrChipWhy}>{r.why}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* À éviter */}
        <View style={[S.ingrSection, { marginTop: 8 }]}>
          <View style={S.ingrSectionHeader}>
            <View style={[S.ingrDot, { backgroundColor: Colors.rose }]} />
            <Text style={S.ingrSectionLabel}>À limiter ou éviter</Text>
          </View>
          <View style={S.ingrChips}>
            {ingredients.avoid.map((name, i) => (
              <View key={i} style={S.ingrChipRed}>
                <Text style={S.ingrChipRedText}>{name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ════════════════════════════
            Lecture simple
        ════════════════════════════ */}
        <SectionTitle>Lecture de ton profil</SectionTitle>
        <View style={S.summaryCard}>
          <View style={S.summaryBar} />
          <Text style={S.summaryText}>{summaryText}</Text>
        </View>

        {/* ════════════════════════════
            Bilan scan IA
        ════════════════════════════ */}
        {scan ? (
          <>
            <SectionTitle>Bilan du scan IA</SectionTitle>
            <View style={S.scanCard}>
              <View style={S.scanScoreRow}>
                <View style={S.scanScoreBadge}>
                  <Text style={S.scanScoreNum}>{scan.score}</Text>
                  <Text style={S.scanScoreMax}>/100</Text>
                </View>
                <Text style={S.scanScoreLabel}>Score santé capillaire{'\n'}détecté à l'inscription</Text>
              </View>
              {scan.synthesis ? (
                <Text style={S.scanSynthesis}>{scan.synthesis}</Text>
              ) : null}
              {scan.highlights?.map((h, i) => (
                <View key={i} style={S.scanHighlight}>
                  <View style={S.scanDot} />
                  <Text style={S.scanHighlightText}>{h}</Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        {/* ════════════════════════════
            CTA modifier le profil
        ════════════════════════════ */}
        <TouchableOpacity
          style={S.editCta}
          onPress={() => router.push('/hair-profile')}
          activeOpacity={0.85}
        >
          <Ionicons name="create-outline" size={16} color={Colors.ink} />
          <Text style={S.editCtaText}>Modifier mon profil capillaire</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: Colors.bg },
  scroll: { paddingBottom: 16 },

  // ── Header ──
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, gap: 10,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { flex: 1, fontSize: 18, fontFamily: 'Satoshi_500Medium', color: Colors.ink },
  editHeaderBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },

  // ── Hero ──
  hero: {
    marginHorizontal: 16, marginBottom: 16, borderRadius: 24,
    padding: 20, overflow: 'hidden', minHeight: 180,
    justifyContent: 'space-between',
  },
  heroBadgeRow:   { flexDirection: 'row', justifyContent: 'flex-end' },
  completionPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5,
  },
  completionDot:  { width: 7, height: 7, borderRadius: 3.5 },
  completionText: { fontSize: 11, fontFamily: 'DMSans_500Medium', color: '#fff' },

  heroCenter:      { alignItems: 'center', paddingVertical: 12 },
  heroTypeBadge:   {
    backgroundColor: Colors.amber, borderRadius: 20,
    paddingHorizontal: 24, paddingVertical: 8, marginBottom: 8,
  },
  heroTypeText:    { fontSize: 32, fontFamily: 'DMSans_700Bold', color: Colors.ink, letterSpacing: 1 },
  heroSub:         { fontSize: 13, fontFamily: 'DMSans_500Medium', color: 'rgba(255,255,255,0.7)' },
  heroEmpty:       { paddingVertical: 8 },
  heroEmptyText:   { fontSize: 16, fontFamily: 'DMSans_500Medium', color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' },

  heroDnaRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroDnaLabel: { fontSize: 12, fontFamily: 'DMSans_600SemiBold', color: 'rgba(255,255,255,0.55)', letterSpacing: 0.5 },
  heroDnaName:  { fontSize: 13, fontFamily: 'DMSans_600SemiBold', color: 'rgba(255,255,255,0.8)' },

  // ── Incomplete banner ──
  incompleteBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    marginHorizontal: 16, marginBottom: 16,
    backgroundColor: Colors.amberPowder, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.amberLight,
    padding: 14,
  },
  incompleteBannerTitle: { fontSize: 14, fontFamily: 'DMSans_700Bold', color: Colors.amberInk, marginBottom: 3 },
  incompleteBannerSub:   { fontSize: 12, fontFamily: 'DMSans_400Regular', color: Colors.amberInk, lineHeight: 17 },

  // ── Section title ──
  sectionTitle: {
    fontSize: 12, fontFamily: 'DMSans_700Bold', color: Colors.warmGray,
    letterSpacing: 0.8, textTransform: 'uppercase',
    marginBottom: 10, marginTop: 20, paddingHorizontal: 16,
  },

  // ── ADN grid ──
  attrGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 16, gap: 10,
  },
  attrCard: {
    width: '47%', backgroundColor: Colors.surface,
    borderRadius: 18, borderWidth: 1, borderColor: Colors.border,
    padding: 16, gap: 4,
  },
  attrIcon:       { fontSize: 22, marginBottom: 4 },
  attrLabel:      { fontSize: 11, fontFamily: 'DMSans_500Medium', color: Colors.warmGray, textTransform: 'uppercase', letterSpacing: 0.5 },
  attrValue:      { fontSize: 18, fontFamily: 'DMSans_700Bold', color: Colors.ink },
  attrValueEmpty: { color: Colors.border, fontStyle: 'italic', fontSize: 16 },
  attrSub:        { fontSize: 11, fontFamily: 'DMSans_400Regular', color: Colors.warmGray },

  // ── Objectif ──
  objRow:  { paddingHorizontal: 16 },
  objCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.surface, borderRadius: 18,
    borderWidth: 1, borderColor: Colors.border,
    padding: 16, marginBottom: 10,
  },
  objIcon:  { fontSize: 28 },
  objLabel: { fontSize: 11, fontFamily: 'DMSans_500Medium', color: Colors.warmGray, marginBottom: 3 },
  objValue: { fontSize: 15, fontFamily: 'DMSans_700Bold', color: Colors.ink, lineHeight: 20 },

  // ── Problématiques ──
  problRow: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 16, gap: 8, marginBottom: 4,
  },
  problChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.blush, borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  problEmoji: { fontSize: 13 },
  problText:  { fontSize: 12, fontFamily: 'DMSans_600SemiBold', color: Colors.rose },
  emptyHint:  { fontSize: 12, fontFamily: 'DMSans_400Regular', color: Colors.warmGray, fontStyle: 'italic', paddingHorizontal: 16 },

  // ── LOC / LCO ──
  locCard: {
    marginHorizontal: 16,
    backgroundColor: Colors.ink, borderRadius: 20, padding: 18, gap: 14,
  },
  locHeader:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  locBadge:       {
    backgroundColor: Colors.amber, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  locBadgeText:   { fontSize: 18, fontFamily: 'DMSans_700Bold', color: Colors.ink, letterSpacing: 1 },
  locFull:        { fontSize: 14, fontFamily: 'DMSans_500Medium', color: 'rgba(255,255,255,0.75)', flex: 1 },
  locDesc:        { fontSize: 13, fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.85)', lineHeight: 19 },
  locSteps:       { gap: 8 },
  locStep:        { flexDirection: 'row', alignItems: 'center', gap: 10 },
  locStepNum:     {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  locStepNumText: { fontSize: 11, fontFamily: 'DMSans_700Bold', color: Colors.amber },
  locStepText:    { fontSize: 13, fontFamily: 'DMSans_500Medium', color: '#fff', flex: 1 },
  locksNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 10, padding: 10,
  },
  locksNoteText: { fontSize: 11, fontFamily: 'DMSans_400Regular', color: 'rgba(255,255,255,0.6)', flex: 1 },

  // ── Ingrédients ──
  ingrSection: {
    paddingHorizontal: 16,
  },
  ingrSectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10,
  },
  ingrDot:          { width: 8, height: 8, borderRadius: 4 },
  ingrSectionLabel: { fontSize: 13, fontFamily: 'DMSans_600SemiBold', color: Colors.ink },
  ingrChips:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },

  ingrChipGreen: {
    backgroundColor: Colors.sageLight, borderRadius: 12,
    borderWidth: 1, borderColor: '#C5DED7',
    paddingHorizontal: 12, paddingVertical: 8,
    maxWidth: '47%',
  },
  ingrChipGreenText: { fontSize: 12, fontFamily: 'DMSans_700Bold', color: Colors.sageDark },
  ingrChipWhy:       { fontSize: 10, fontFamily: 'DMSans_400Regular', color: Colors.sageDark, opacity: 0.75, marginTop: 2 },

  ingrChipRed: {
    backgroundColor: Colors.blush, borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  ingrChipRedText: { fontSize: 12, fontFamily: 'DMSans_600SemiBold', color: Colors.rose },

  // ── Lecture simple ──
  summaryCard: {
    marginHorizontal: 16,
    backgroundColor: Colors.cream, borderRadius: 18,
    borderWidth: 1, borderColor: Colors.border,
    padding: 18, flexDirection: 'row', gap: 14,
  },
  summaryBar: {
    width: 4, borderRadius: 2, backgroundColor: Colors.amber, flexShrink: 0,
  },
  summaryText: {
    flex: 1, fontSize: 14, fontFamily: 'DMSans_400Regular',
    color: Colors.ink, lineHeight: 21,
  },

  // ── Scan IA ──
  scanCard: {
    marginHorizontal: 16,
    backgroundColor: Colors.surface, borderRadius: 20,
    borderWidth: 1, borderColor: Colors.border,
    padding: 18, gap: 14,
  },
  scanScoreRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  scanScoreBadge: {
    flexDirection: 'row', alignItems: 'baseline', gap: 2,
    backgroundColor: Colors.amberLight, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  scanScoreNum:   { fontSize: 28, fontFamily: 'DMSans_700Bold', color: Colors.amberDark },
  scanScoreMax:   { fontSize: 13, fontFamily: 'DMSans_500Medium', color: Colors.amberDark },
  scanScoreLabel: { flex: 1, fontSize: 13, fontFamily: 'DMSans_500Medium', color: Colors.warmGray, lineHeight: 18 },
  scanSynthesis: {
    fontSize: 13, fontFamily: 'DMSans_400Regular',
    color: Colors.ink, lineHeight: 20,
  },
  scanHighlight: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  scanDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: Colors.amber, marginTop: 6, flexShrink: 0,
  },
  scanHighlightText: {
    flex: 1, fontSize: 13, fontFamily: 'DMSans_400Regular',
    color: Colors.ink, lineHeight: 19,
  },

  // ── Edit CTA ──
  editCta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: 16, marginTop: 20,
    backgroundColor: Colors.surface, borderRadius: 14,
    borderWidth: 1.5, borderColor: Colors.border,
    paddingVertical: 13,
  },
  editCtaText: { fontSize: 14, fontFamily: 'DMSans_600SemiBold', color: Colors.ink },
});
