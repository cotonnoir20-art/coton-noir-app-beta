import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { Fonts } from '../../theme/typography';
import { displayObjective, normalizeObjectiveId } from '../../constants/hairObjectives';
import { BlurredPaywall } from './BlurredPaywall';
import { PlanReadyHeader } from './PlanReadyHeader';
import { BCEmojiAvatar } from '../blackCotton/BCEmojiAvatar';
import {
  buildHomeAwaitingTeaser,
  type OnboardingRecommendations,
} from '../../lib/onboardingRecommendations';
import type { BlackCottonHomeReco } from '../../lib/blackCottonRecommendations';

const TABS = ['Plan', 'Produits', 'Recettes', 'Articles'] as const;
type Tab = (typeof TABS)[number];

const DIAG_BG = '#4B1E08';

const RECIPE_FREQUENCY: Record<string, string> = {
  Masque: "1 fois par semaine",
  Huile: "1 fois par semaine",
  Spray: "Quotidien",
  "Cuir chevelu": "1 à 2 fois par semaine",
};


const CAT_LABELS: Record<string, string> = {
  sham: 'Shampoing',
  cond: 'Après-shampoing',
  leave: 'Leave-in',
  mask: 'Masque',
  oil: 'Huile',
  style: 'Coiffage',
  compl: 'Complément',
};

type Props = {
  reco: OnboardingRecommendations;
  objective: string;
  resultsWeeks: number;
  hairTypeUnsure: boolean;
  hairType: string;
  porosity: string;
  density: string;
  problematics: string[];
  name?: string;
  unlocked?: boolean;
  coachReco?: BlackCottonHomeReco | null;
  onRestart?: () => void;
};

// ── Carte diagnostic ─────────────────────────────────────────────────────────

function DiagnosticCard({
  hairType,
  hairTypeUnsure,
  porosity,
  density,
  problematics,
  objective,
}: {
  hairType: string;
  hairTypeUnsure: boolean;
  porosity: string;
  density: string;
  problematics: string[];
  objective: string;
}) {
  const displayType = hairTypeUnsure ? "Type à préciser" : (hairType || "—");
  const probCount = problematics.length;
  const focus = displayObjective(normalizeObjectiveId(objective)) || "Prendre soin de tes cheveux";

  return (
    <View style={d.card}>
      <Text style={d.kicker}>✦ Ton diagnostic personnalisé</Text>

      <Text style={d.hairType}>Cheveux type {displayType}</Text>

      <View style={d.objectiveRow}>
        <Text style={d.objectiveKicker}>TON OBJECTIF</Text>
        <Text style={d.objectiveLabel}>{focus}</Text>
      </View>

      <View style={d.rows}>
        <View style={d.row}>
          <Ionicons name="water-outline" size={16} color="rgba(255,255,255,0.55)" />
          <View style={d.rowText}>
            <Text style={d.rowLabel}>Porosité</Text>
            <Text style={d.rowValue}>{porosity || "Moyenne"}</Text>
          </View>
        </View>

        <View style={d.row}>
          <Ionicons name="layers-outline" size={16} color="rgba(255,255,255,0.55)" />
          <View style={d.rowText}>
            <Text style={d.rowLabel}>Densité</Text>
            <Text style={d.rowValue}>{density || "Moyenne"}</Text>
          </View>
        </View>

        <View style={d.row}>
          <Ionicons name="alert-circle-outline" size={16} color="rgba(255,255,255,0.55)" />
          <View style={d.rowText}>
            <Text style={d.rowLabel}>Problématiques</Text>
            <Text style={d.rowValue}>
              {probCount > 0 ? `${probCount} identifiée${probCount > 1 ? "s" : ""}` : "Aucune"}
            </Text>
          </View>
        </View>
      </View>

      {problematics.length > 0 && (
        <View style={d.chips}>
          {problematics.slice(0, 3).map(p => (
            <View key={p} style={d.chip}>
              <Text style={d.chipText}>{p}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ── Onglets ───────────────────────────────────────────────────────────────────

function TabBar({ active, onPress }: { active: Tab; onPress: (t: Tab) => void }) {
  return (
    <View style={tb.bar}>
      {TABS.map(t => (
        <TouchableOpacity
          key={t}
          style={[tb.tab, active === t && tb.tabActive]}
          onPress={() => onPress(t)}
          activeOpacity={0.8}
        >
          <Text style={[tb.tabText, active === t && tb.tabTextActive]}>{t}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ── Coach card compacte ───────────────────────────────────────────────────────

function CoachCard({ reco }: { reco: BlackCottonHomeReco }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={co.card}>
      <TouchableOpacity
        style={co.header}
        onPress={() => setOpen(v => !v)}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={open ? "Réduire les recommandations Black Cotton" : "Voir les recommandations Black Cotton"}
      >
        <BCEmojiAvatar size={44} mood={reco.mood} />
        <View style={co.headerText}>
          <Text style={co.name}>Les recommandations de Black Cotton</Text>
          <Text style={co.role}>Ta copilote capillaire</Text>
        </View>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={Colors.warmGray}
        />
      </TouchableOpacity>

      {open && (
        <>
          <View style={co.divider} />
          <Text style={co.intro}>{reco.intro}</Text>
          {reco.priorities.length > 0 && (
            <>
              <Text style={co.kicker}>PRIORITÉS POUR TOI</Text>
              {reco.priorities.slice(0, 3).map(p => (
                <View key={p.id} style={co.priorityRow}>
                  <View style={[co.priorityIcon, { backgroundColor: p.ionBg }]}>
                    <Ionicons name={p.ion as 'water-outline'} size={14} color={p.ionColor} />
                  </View>
                  <View style={co.priorityBody}>
                    <Text style={co.priorityTitle}>{p.title}</Text>
                    <Text style={co.priorityDetail}>{p.detail}</Text>
                  </View>
                </View>
              ))}
            </>
          )}
        </>
      )}
    </View>
  );
}

// ── Contenu par onglet ────────────────────────────────────────────────────────

type RoutineGroup = {
  kicker: string;
  title: string;
  icon: string;
  iconBg: string;
  tip: string;
  steps: OnboardingRecommendations['weekly'];
};

function RoutineGroupCard({ group }: { group: RoutineGroup }) {
  if (group.steps.length === 0) return null;
  return (
    <View style={s.routineCard}>
      <View style={s.routineCardHeader}>
        <View style={[s.routineIconCircle, { backgroundColor: group.iconBg }]}>
          <Ionicons name={group.icon as 'water-outline'} size={18} color={Colors.amberDark} />
        </View>
        <View style={s.routineCardHeaderText}>
          <Text style={s.routineCardKicker}>{group.kicker}</Text>
          <Text style={s.routineCardTitle}>{group.title}</Text>
        </View>
      </View>

      <View style={s.routineStepsList}>
        {group.steps.map((step, i) => (
          <View key={`${step.title}-${i}`} style={s.routineStepBlock}>
            <View style={s.routineStepRow}>
              <View style={s.routineStepBadge}>
                <Text style={s.routineStepNum}>{i + 1}</Text>
              </View>
              <Text style={s.routineStepText}>{step.desc || step.title}</Text>
            </View>
            {step.products.length > 0 && (
              <View style={s.routineStepChips}>
                {step.products.map(p => (
                  <View key={p} style={s.routineStepChip}>
                    <Text style={s.routineStepChipText}>{p}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </View>

      <View style={s.routineTip}>
        <Ionicons name="bulb-outline" size={14} color={Colors.amberDark} />
        <Text style={s.routineTipText}>
          <Text style={s.routineTipLabel}>Astuce · </Text>
          {group.tip}
        </Text>
      </View>
    </View>
  );
}

function PlanTab({
  reco,
  homeTeaser,
  unlocked,
}: {
  reco: OnboardingRecommendations;
  homeTeaser: string;
  unlocked?: boolean;
}) {
  const groups: RoutineGroup[] = [
    {
      kicker: 'WASH DAY',
      title: "Nettoyage & soin profond",
      icon: 'water-outline',
      iconBg: '#E2EDD8',
      tip: "Démêle toujours avec du conditioner, des pointes vers les racines.",
      steps: reco.weekly,
    },
    {
      kicker: 'ROUTINE MATIN',
      title: "Hydratation & coiffage",
      icon: 'sunny-outline',
      iconBg: '#FDE8C8',
      tip: "Coiffe sur cheveux humides pour une meilleure définition des boucles.",
      steps: reco.morning,
    },
    {
      kicker: 'ROUTINE SOIR',
      title: "Soins de nuit",
      icon: 'moon-outline',
      iconBg: '#EDE8F5',
      tip: "Bonnet en satin chaque nuit pour limiter la casse et préserver l'hydratation.",
      steps: reco.evening,
    },
  ];

  const [firstGroup, ...lockedGroups] = groups;

  return (
    <View>
      <View style={s.planHeader}>
        <Ionicons name="calendar-outline" size={18} color={Colors.amberDark} />
        <View>
          <Text style={s.tabSectionTitle}>Ta routine capillaire</Text>
          <Text style={s.tabSectionSub}>Suis ces étapes pour des cheveux en pleine santé</Text>
        </View>
      </View>

      <RoutineGroupCard group={firstGroup} />

      {unlocked ? (
        <View>
          {lockedGroups.map(g => (
            <RoutineGroupCard key={g.kicker} group={g} />
          ))}
        </View>
      ) : (
        <BlurredPaywall
          locked
          progressive
          progressiveMaxHeight={420}
          fadeBottomColor={Colors.bg}
          homeTeaser={homeTeaser}
          style={s.paywall}
        >
          <View style={s.lockedBlock}>
            {lockedGroups.map(g => (
              <RoutineGroupCard key={g.kicker} group={g} />
            ))}
          </View>
        </BlurredPaywall>
      )}
    </View>
  );
}

function RichProductCard({ product, style }: { product: OnboardingRecommendations['products'][number]; style?: object }) {
  const catLabel = CAT_LABELS[product.cat] ?? product.cat;
  return (
    <View style={[s.richCard, style]}>
      <View style={[s.richCardTop, product.bg ? { backgroundColor: product.bg } : undefined]}>
        {product.image ? (
          <Image source={{ uri: product.image }} style={s.richProductImg} contentFit="contain" />
        ) : (
          <Text style={s.richEmoji}>{product.emoji ?? '🧴'}</Text>
        )}
        <View style={s.richCatBadge}>
          <Text style={s.richCatText}>{catLabel}</Text>
        </View>
      </View>
      <Text style={s.richName}>{product.name}</Text>
      <Text style={s.richBrand}>{product.brand} · {product.price}</Text>
      {product.desc ? <Text style={s.richDesc}>{product.desc}</Text> : null}
      {product.ingredients && product.ingredients.length > 0 && (
        <View style={s.richSection}>
          <Text style={s.richSectionKicker}>INGREDIENTS CLES</Text>
          <View style={s.richChips}>
            {product.ingredients.map(ing => (
              <View key={ing} style={s.richChip}>
                <Text style={s.richChipText}>{ing}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
      {product.matchReason ? (
        <View style={s.richWhy}>
          <Text style={s.richWhyKicker}>POURQUOI POUR TOI</Text>
          <Text style={s.richWhyText}>{product.matchReason}</Text>
        </View>
      ) : null}
    </View>
  );
}

function ProduitsTab({ reco, homeTeaser, unlocked }: { reco: OnboardingRecommendations; homeTeaser: string; unlocked?: boolean }) {
  if (!reco.showProducts || reco.products.length === 0) {
    return <Text style={s.emptyMsg}>Produits personnalisés disponibles après inscription.</Text>;
  }
  const [first, ...rest] = reco.products;
  return (
    <View>
      <View style={s.planHeader}>
        <Ionicons name="sparkles-outline" size={18} color={Colors.amberDark} />
        <View>
          <Text style={s.tabSectionTitle}>Produits recommandés</Text>
          <Text style={s.tabSectionSub}>Sélectionnés spécialement pour tes besoins</Text>
        </View>
      </View>
      <RichProductCard product={first} />
      {rest.length > 0 && (
        unlocked ? (
          <View>
            {rest.map(p => (
              <RichProductCard key={p.name} product={p} style={s.richCardGap} />
            ))}
          </View>
        ) : (
          <BlurredPaywall locked progressive progressiveMaxHeight={320} fadeBottomColor={Colors.bg} homeTeaser={homeTeaser} style={s.paywall}>
            <View style={s.lockedBlock}>
              {rest.map(p => (
                <RichProductCard key={p.name} product={p} style={s.richCardGap} />
              ))}
            </View>
          </BlurredPaywall>
        )
      )}
    </View>
  );
}

function RichRecipeCard({ recipe, style }: { recipe: OnboardingRecommendations['recipes'][number]; style?: object }) {
  const frequency = RECIPE_FREQUENCY[recipe.category] ?? `${recipe.duration} min`;
  return (
    <View style={[s.recipeRichCard, style]}>
      <View style={[s.recipeIllustration, { backgroundColor: recipe.thumb_bg || Colors.amberPowder }]}>
        <Text style={s.recipeIllustrationEmoji}>{recipe.thumb_emoji}</Text>
      </View>
      <View style={s.recipeRichBody}>
        <View style={s.recipeRichHeader}>
          <Text style={s.recipeRichName}>{recipe.name}</Text>
          <View style={s.recipeFreq}>
            <Ionicons name="time-outline" size={13} color={Colors.amberDark} />
            <Text style={s.recipeFreqText}>{frequency}</Text>
          </View>
        </View>

        {recipe.ingredients && recipe.ingredients.length > 0 && (
          <View style={s.recipeSection}>
            <Text style={s.recipeSectionKicker}>INGRÉDIENTS</Text>
            {recipe.ingredients.map(ing => (
              <View key={ing} style={s.recipeIngredientRow}>
                <Ionicons name="checkmark" size={14} color={Colors.amberDark} />
                <Text style={s.recipeIngredientText}>{ing}</Text>
              </View>
            ))}
          </View>
        )}

        {recipe.steps && recipe.steps.length > 0 && (
          <View style={s.recipeSection}>
            <Text style={s.recipeSectionKicker}>INSTRUCTIONS</Text>
            {recipe.steps.map((step, i) => (
              <View key={i} style={s.recipeStepRow}>
                <View style={s.recipeStepNum}>
                  <Text style={s.recipeStepNumText}>{i + 1}</Text>
                </View>
                <Text style={s.recipeStepText}>{step}</Text>
              </View>
            ))}
          </View>
        )}

        {recipe.description ? (
          <View style={s.recipeBenefits}>
            <Text style={s.recipeBenefitsKicker}>BÉNÉFICES</Text>
            <Text style={s.recipeBenefitsText}>{recipe.description}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function RecettesTab({ reco, homeTeaser, unlocked }: { reco: OnboardingRecommendations; homeTeaser: string; unlocked?: boolean }) {
  if (!reco.showRecipes || reco.recipes.length === 0) {
    return <Text style={s.emptyMsg}>Recettes personnalisées disponibles après inscription.</Text>;
  }
  const [first, ...rest] = reco.recipes;
  return (
    <View>
      <View style={s.planHeader}>
        <Ionicons name="flask-outline" size={18} color={Colors.amberDark} />
        <View>
          <Text style={s.tabSectionTitle}>Recettes DIY</Text>
          <Text style={s.tabSectionSub}>Des soins maison avec des ingrédients naturels</Text>
        </View>
      </View>
      <RichRecipeCard recipe={first} />
      {rest.length > 0 && (
        unlocked ? (
          <View>
            {rest.map(r => (
              <RichRecipeCard key={r.id} recipe={r} style={s.recipeRichCardGap} />
            ))}
          </View>
        ) : (
          <BlurredPaywall locked progressive progressiveMaxHeight={320} fadeBottomColor={Colors.bg} homeTeaser={homeTeaser} style={s.paywall}>
            <View style={s.lockedBlock}>
              {rest.map(r => (
                <RichRecipeCard key={r.id} recipe={r} style={s.recipeRichCardGap} />
              ))}
            </View>
          </BlurredPaywall>
        )
      )}
    </View>
  );
}

function ArticleCard({ article, style }: { article: OnboardingRecommendations['articles'][number]; style?: object }) {
  return (
    <View style={[s.articleCard, style]}>
      <Text style={s.articleTitle}>{article.title}</Text>
      <Text style={s.articleSub}>{article.subtitle}</Text>
      {article.tags && article.tags.length > 0 && (
        <View style={s.articleTags}>
          {article.tags.map(tag => (
            <View key={tag} style={s.articleTag}>
              <Text style={s.articleTagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function ArticlesTab({ reco, homeTeaser, unlocked }: { reco: OnboardingRecommendations; homeTeaser: string; unlocked?: boolean }) {
  if (reco.articles.length === 0) {
    return <Text style={s.emptyMsg}>Articles disponibles après inscription.</Text>;
  }
  const [first, ...rest] = reco.articles;
  return (
    <View>
      <View style={s.planHeader}>
        <Ionicons name="book-outline" size={18} color={Colors.amberDark} />
        <View>
          <Text style={s.tabSectionTitle}>Articles recommandés</Text>
          <Text style={s.tabSectionSub}>Approfondis tes connaissances capillaires</Text>
        </View>
      </View>
      <ArticleCard article={first} />
      {rest.length > 0 && (
        unlocked ? (
          <View>
            {rest.map(a => (
              <ArticleCard key={a.id} article={a} style={s.articleCardGap} />
            ))}
          </View>
        ) : (
          <BlurredPaywall locked progressive progressiveMaxHeight={260} fadeBottomColor={Colors.bg} homeTeaser={homeTeaser} style={s.paywall}>
            <View style={s.lockedBlock}>
              {rest.map(a => (
                <ArticleCard key={a.id} article={a} style={s.articleCardGap} />
              ))}
            </View>
          </BlurredPaywall>
        )
      )}
      <View style={s.articleComingSoon}>
        <Ionicons name="flash-outline" size={28} color={Colors.amber} />
        <Text style={s.articleComingSoonText}>Plus d'articles à venir prochainement !</Text>
      </View>
    </View>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────

export function OnboardingFinalPlanStep({
  reco,
  objective,
  resultsWeeks,
  hairTypeUnsure,
  hairType,
  porosity,
  density,
  problematics,
  name,
  unlocked,
  coachReco,
  onRestart,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('Plan');
  const homeTeaser = buildHomeAwaitingTeaser(reco);

  return (
    <View style={s.wrap}>
      <PlanReadyHeader
        name={name}
        objective={objective}
        resultsWeeks={resultsWeeks}
        hairTypeUnsure={hairTypeUnsure}
        showObjectiveCard={false}
      />

      <DiagnosticCard
        hairType={hairType}
        hairTypeUnsure={hairTypeUnsure}
        porosity={porosity}
        density={density}
        problematics={problematics}
        objective={objective}
      />

      <TabBar active={activeTab} onPress={setActiveTab} />

      <View style={s.tabContent}>
        {activeTab === 'Plan' && <PlanTab reco={reco} homeTeaser={homeTeaser} unlocked={unlocked} />}
        {activeTab === 'Produits' && <ProduitsTab reco={reco} homeTeaser={homeTeaser} unlocked={unlocked} />}
        {activeTab === 'Recettes' && <RecettesTab reco={reco} homeTeaser={homeTeaser} unlocked={unlocked} />}
        {activeTab === 'Articles' && <ArticlesTab reco={reco} homeTeaser={homeTeaser} unlocked={unlocked} />}
      </View>

      {coachReco && unlocked && <CoachCard reco={coachReco} />}

      {unlocked && onRestart && (
        <View style={s.restartCard}>
          <Text style={s.restartTitle}>Refaire une analyse ?</Text>
          <Text style={s.restartSub}>
            Tes cheveux évoluent. Mets à jour ton diagnostic quand tu le souhaites.
          </Text>
          <TouchableOpacity style={s.restartBtn} onPress={onRestart} activeOpacity={0.85}>
            <Text style={s.restartBtnText}>Nouvelle analyse</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ── Styles diagnostic card ────────────────────────────────────────────────────

const d = StyleSheet.create({
  card: {
    backgroundColor: DIAG_BG,
    borderRadius: 22,
    padding: 20,
    marginBottom: 20,
  },
  kicker: {
    fontSize: 11,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.amber,
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  objectiveRow: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  objectiveKicker: {
    fontSize: 10,
    fontFamily: 'DMSans_700Bold',
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 1,
    marginBottom: 4,
  },
  objectiveLabel: {
    fontSize: 16,
    fontFamily: Fonts.display,
    color: Colors.amber,
    lineHeight: 22,
  },
  hairType: {
    fontSize: 28,
    fontFamily: Fonts.displayBold,
    color: Colors.amber,
    lineHeight: 34,
    marginBottom: 16,
  },
  rows: { gap: 8, marginBottom: 14 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 12,
  },
  rowText: { flex: 1 },
  rowLabel: {
    fontSize: 11,
    fontFamily: 'DMSans_500Medium',
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 2,
  },
  rowValue: {
    fontSize: 15,
    fontFamily: 'DMSans_600SemiBold',
    color: '#FFFFFF',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipText: {
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
    color: 'rgba(255,255,255,0.85)',
  },
});

// ── Styles tab bar ────────────────────────────────────────────────────────────

const tb = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 18,
    backgroundColor: Colors.bgShell,
    borderRadius: 999,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: Colors.amber },
  tabText: {
    fontSize: 13,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.warmGray,
  },
  tabTextActive: { color: Colors.ink },
});

// ── Styles CoachCard ──────────────────────────────────────────────────────────

const co = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerText: { flex: 1 },
  name: {
    fontSize: 15,
    fontFamily: 'DMSans_700Bold',
    color: Colors.ink,
  },
  role: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginTop: 14,
    marginBottom: 14,
  },
  intro: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: Colors.ink,
    lineHeight: 19,
    marginBottom: 14,
  },
  kicker: {
    fontSize: 10,
    fontFamily: 'DMSans_700Bold',
    color: Colors.amberDark,
    letterSpacing: 1.1,
    marginBottom: 10,
  },
  priorityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  priorityIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  priorityBody: { flex: 1 },
  priorityTitle: {
    fontSize: 13,
    fontFamily: 'DMSans_700Bold',
    color: Colors.ink,
    marginBottom: 2,
  },
  priorityDetail: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    lineHeight: 17,
  },
});

// ── Styles contenu ────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  wrap: { paddingBottom: 24 },
  tabContent: { minHeight: 200 },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 14,
  },
  tabSectionTitle: {
    fontSize: 18,
    fontFamily: Fonts.display,
    color: Colors.ink,
    marginBottom: 2,
  },
  tabSectionSub: {
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
    color: Colors.warmGray,
    lineHeight: 17,
  },
  paywall: { marginTop: 0, paddingBottom: 14 },
  lockedBlock: { paddingTop: 0 },
  // Routine group card
  routineCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 12,
  },
  routineCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  routineIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  routineCardHeaderText: { flex: 1 },
  routineCardKicker: {
    fontSize: 10,
    fontFamily: 'DMSans_700Bold',
    color: Colors.amberDark,
    letterSpacing: 1.1,
    marginBottom: 3,
  },
  routineCardTitle: {
    fontSize: 18,
    fontFamily: Fonts.display,
    color: Colors.ink,
    lineHeight: 23,
  },
  routineStepsList: { gap: 0 },
  routineStepBlock: { marginBottom: 10 },
  routineStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  routineStepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.amberLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  routineStepNum: {
    fontSize: 12,
    fontFamily: 'DMSans_700Bold',
    color: Colors.amberDark,
  },
  routineStepText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: Colors.ink,
    lineHeight: 20,
  },
  routineStepChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 7,
    marginLeft: 36,
  },
  routineStepChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.amberLight,
    backgroundColor: Colors.amberPowder,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  routineStepChipText: {
    fontSize: 11,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.amberDark,
  },
  routineTip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.amberPowder,
    borderRadius: 12,
    padding: 10,
    marginTop: 12,
  },
  routineTipText: {
    flex: 1,
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.ink,
    lineHeight: 17,
  },
  routineTipLabel: {
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.amberDark,
  },
  emptyMsg: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    textAlign: 'center',
    paddingVertical: 32,
  },
  // Produits — rich card
  richCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  richCardGap: { marginTop: 12 },
  richCardTop: {
    backgroundColor: Colors.amberPowder,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  richEmoji: { fontSize: 64 },
  richProductImg: { width: '100%', height: '100%' },
  richCatBadge: {
    position: 'absolute',
    top: 10,
    left: 12,
    backgroundColor: Colors.amber,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  richCatText: {
    fontSize: 11,
    fontFamily: 'DMSans_700Bold',
    color: Colors.ink,
    letterSpacing: 0.5,
  },
  richName: {
    fontSize: 17,
    fontFamily: Fonts.display,
    color: Colors.ink,
    paddingHorizontal: 16,
    paddingTop: 14,
    marginBottom: 2,
  },
  richBrand: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: Colors.amberDark,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  richDesc: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    lineHeight: 19,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  richSection: { paddingHorizontal: 16, marginBottom: 12 },
  richSectionKicker: {
    fontSize: 10,
    fontFamily: 'DMSans_700Bold',
    color: Colors.warmGray,
    letterSpacing: 1.1,
    marginBottom: 8,
  },
  richChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  richChip: {
    backgroundColor: Colors.bg,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  richChipText: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.ink,
  },
  richWhy: {
    backgroundColor: Colors.amberLight,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 12,
  },
  richWhyKicker: {
    fontSize: 10,
    fontFamily: 'DMSans_700Bold',
    color: Colors.amberDark,
    letterSpacing: 1.1,
    marginBottom: 4,
  },
  richWhyText: {
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
    color: Colors.ink,
    lineHeight: 18,
  },
  // Recettes — rich card
  recipeRichCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  recipeRichCardGap: { marginTop: 12 },
  recipeIllustration: {
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipeIllustrationEmoji: { fontSize: 72 },
  recipeRichBody: { padding: 16 },
  recipeRichHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 14,
  },
  recipeRichName: {
    flex: 1,
    fontSize: 17,
    fontFamily: Fonts.display,
    color: Colors.ink,
    lineHeight: 23,
  },
  recipeFreq: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  recipeFreqText: {
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
    color: Colors.amberDark,
  },
  recipeSection: { marginBottom: 14 },
  recipeSectionKicker: {
    fontSize: 10,
    fontFamily: 'DMSans_700Bold',
    color: Colors.warmGray,
    letterSpacing: 1.1,
    marginBottom: 8,
  },
  recipeIngredientRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 5,
  },
  recipeIngredientText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: Colors.ink,
    lineHeight: 19,
  },
  recipeStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  recipeStepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.amberLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  recipeStepNumText: {
    fontSize: 11,
    fontFamily: 'DMSans_700Bold',
    color: Colors.amberDark,
  },
  recipeStepText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: Colors.ink,
    lineHeight: 19,
  },
  recipeBenefits: {
    backgroundColor: Colors.amberLight,
    borderRadius: 12,
    padding: 12,
  },
  recipeBenefitsKicker: {
    fontSize: 10,
    fontFamily: 'DMSans_700Bold',
    color: Colors.amberDark,
    letterSpacing: 1.1,
    marginBottom: 4,
  },
  recipeBenefitsText: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: Colors.ink,
    lineHeight: 18,
  },
  // Restart CTA
  restartCard: {
    backgroundColor: DIAG_BG,
    borderRadius: 22,
    padding: 24,
    marginTop: 24,
    alignItems: 'center',
    gap: 8,
  },
  restartTitle: {
    fontSize: 18,
    fontFamily: Fonts.display,
    color: Colors.white,
    textAlign: 'center',
  },
  restartSub: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 4,
  },
  restartBtn: {
    backgroundColor: Colors.amber,
    borderRadius: 999,
    paddingHorizontal: 28,
    paddingVertical: 13,
    marginTop: 4,
  },
  restartBtnText: {
    fontSize: 15,
    fontFamily: 'DMSans_700Bold',
    color: Colors.ink,
  },
  // Articles
  articleCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
  },
  articleCardGap: { marginTop: 10 },
  articleTitle: {
    fontSize: 15,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.ink,
    marginBottom: 4,
    lineHeight: 21,
  },
  articleSub: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: Colors.warmGray,
    lineHeight: 19,
    marginBottom: 6,
  },
  articleTime: {
    fontSize: 11,
    fontFamily: 'DMSans_500Medium',
    color: Colors.amberDark,
  },
  articleTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  articleTag: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: Colors.bg,
  },
  articleTagText: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.ink,
  },
  articleComingSoon: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 24,
    marginTop: 12,
  },
  articleComingSoonText: {
    fontSize: 14,
    fontFamily: 'DMSans_500Medium',
    color: Colors.amberDark,
    textAlign: 'center',
  },
});
