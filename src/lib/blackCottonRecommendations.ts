import type { IonName } from '../components/AppIconBox';
import type { BlackCottonMood } from '../components/blackCotton/types';
import { displayObjective, normalizeObjectiveId } from '../constants/hairObjectives';
import { Colors } from '../theme/colors';
import type { HairProfile } from '../context/AppContext';
import {
  buildOnboardingRecommendations,
  diagnosticSnapshotFromProfile,
  type OnboardingRecommendations,
} from './onboardingRecommendations';

export type BCPriority = {
  id: string;
  title: string;
  detail: string;
  ion: IonName;
  ionBg: string;
  ionColor: string;
};

export type BlackCottonHomeReco = {
  intro: string;
  mood: BlackCottonMood;
  priorities: BCPriority[];
  routineParagraph: string;
  washdayParagraph: string;
  spotlight?: {
    kind: 'product' | 'recipe' | 'article';
    title: string;
    detail: string;
    cta: string;
    route: '/shop' | '/recipes' | '/articles';
  };
};

function priority(
  id: string,
  title: string,
  detail: string,
  ion: IonName,
  ionBg: string,
  ionColor: string,
): BCPriority {
  return { id, title, detail, ion, ionBg, ionColor };
}

function buildPriorities(profile: HairProfile, reco: OnboardingRecommendations): BCPriority[] {
  const items: BCPriority[] = [];
  const objective = normalizeObjectiveId(profile.objective);

  if (profile.porosity === 'Élevée') {
    items.push(
      priority(
        'porosity-high',
        'Scelle après chaque hydratation',
        'Ta porosité élevée laisse l’humidité s’échapper vite. Applique une crème ou une huile légère sur cheveux humides, en insistant sur les pointes.',
        'sparkles-outline',
        Colors.amberLight,
        Colors.amberDark,
      ),
    );
  } else if (profile.porosity === 'Faible') {
    items.push(
      priority(
        'porosity-low',
        'Hydrate sans surcharger',
        'Tes cheveux retiennent bien l’humidité : privilégie des sprays légers et évite les couches trop épaisses qui alourdissent.',
        'water-outline',
        Colors.sageLight,
        Colors.sageDark,
      ),
    );
  } else {
    items.push(
      priority(
        'porosity-mid',
        'Routine équilibrée LCO',
        'Alterne spray hydratant, leave-in crémeux puis petite touche d’huile sur les longueurs pour garder souplesse et définition.',
        'leaf-outline',
        Colors.sageLight,
        Colors.sageDark,
      ),
    );
  }

  if (objective === 'Hydratation') {
    items.push(
      priority(
        'obj-hydration',
        'Objectif hydratation',
        'Vise une couche d’humidité matin et soir : le soir, insiste sur les pointes avant le bonnet pour limiter le dessèchement nocturne.',
        'water-outline',
        Colors.sageLight,
        Colors.sageDark,
      ),
    );
  } else if (objective === 'Pousse') {
    items.push(
      priority(
        'obj-growth',
        'Objectif pousse',
        'Protège tes longueurs (tresses, bonnet satin) et planifie un wash day régulier sans négliger le cuir chevelu.',
        'fitness-outline',
        Colors.growthLight,
        Colors.growth,
      ),
    );
  } else if (objective === 'Définition') {
    items.push(
      priority(
        'obj-definition',
        'Objectif définition',
        'Coiffe sur cheveux très humides et évite de toucher tes boucles avant qu’elles soient sèches — c’est là que la définition se fixe.',
        'color-wand-outline',
        Colors.amberPowder,
        Colors.amberInk,
      ),
    );
  } else if (
    objective === 'Casse_et_chute' ||
    objective === 'Fibre' ||
    objective === 'Casse' ||
    objective === 'Dommages' ||
    objective === 'Pointes'
  ) {
    items.push(
      priority(
        'obj-strength',
        'Renforcement & réparation',
        'Masque hebdo + huile sur pointes seulement. Démêle toujours avec douceur, jamais sur cheveux secs.',
        'shield-checkmark-outline',
        Colors.growthLight,
        Colors.growth,
      ),
    );
  } else if (objective === 'Transition') {
    items.push(
      priority(
        'obj-transition',
        'Transition capillaire',
        'Hydrate les longueurs naturelles et protège les jonctions : masque doux, démêlage patient, pas de chaleur sur les zones fragiles.',
        'git-merge-outline',
        Colors.amberPowder,
        Colors.amberInk,
      ),
    );
  } else if (objective === 'Brillance' || objective === 'Densite') {
    items.push(
      priority(
        'obj-shine-density',
        objective === 'Brillance' ? 'Objectif brillance' : 'Objectif densité',
        objective === 'Brillance'
          ? 'Huile légère sur pointes et rinçage frais pour garder de l’éclat sans alourdir.'
          : 'Routine équilibrée + soins légers sur racines pour du volume sans casser la fibre.',
        'sunny-outline',
        Colors.amberPowder,
        Colors.amberInk,
      ),
    );
  }

  if (profile.hairType === 'Locks') {
    items.push(
      priority(
        'hair-locks',
        'Spécifique locks',
        'Hydrate les racines visibles sans surcharger, renforce les pointes et dors toujours en protection (bonnet ou foulard).',
        'ribbon-outline',
        Colors.blush,
        Colors.rose,
      ),
    );
  } else if (profile.hairType.startsWith('4')) {
    items.push(
      priority(
        'hair-4',
        'Cheveux type 4',
        'Le pré-poo avant lavage et le masque profond hebdo t’aideront à démêler sans casse et à garder la matière souple.',
        'flask-outline',
        Colors.sageLight,
        Colors.sageDark,
      ),
    );
  } else if (profile.hairType.startsWith('3')) {
    items.push(
      priority(
        'hair-3',
        'Cheveux type 3',
        'Évite les sulfates agressifs et termine par un leave-in léger : tes boucles garderont du ressort sans frisottis.',
        'sparkles-outline',
        Colors.amberLight,
        Colors.amberDark,
      ),
    );
  }

  // ── Tips problématiques (priorité sur climat et type générique) ────────────
  type ProbTip = { title: string; detail: string; ion: IonName; ionBg: string; ionColor: string };
  const PROBLEMATIC_TIPS: Record<string, ProbTip> = {
    "Alopécie de traction": {
      title: "Protège ta ligne d’implantation",
      detail: "Évite les coiffures qui tirent sur les racines (tresses serrées, chignons hauts). Masse ton cuir chevelu 2-3x/semaine avec une huile légère (ricin, jojoba) pour stimuler la circulation.",
      ion: "shield-outline", ionBg: Colors.alertLight, ionColor: Colors.alertDark,
    },
    "Chute de cheveux": {
      title: "Stimule ton cuir chevelu",
      detail: "Un massage quotidien de 3 à 5 min sur le cuir chevelu active la microcirculation. Ajoute une huile de ricin ou un complément alimentaire riche en biotine si la chute est importante.",
      ion: "trending-up-outline", ionBg: Colors.growthLight, ionColor: Colors.growth,
    },
    "Cheveux secs et cassants": {
      title: "Hydratation en profondeur",
      detail: "Masque nourrissant hebdomadaire (30 min minimum) + méthode LCO : spray hydratant, leave-in crémeux, huile sur les longueurs. Seche à l’air libre ou diffuseur froid.",
      ion: "water-outline", ionBg: Colors.sageLight, ionColor: Colors.sageDark,
    },
    "Casse": {
      title: "Renforce la fibre",
      detail: "Intègre un masque protéiné tous les 15 jours (kératine, protéines de blé). Démêle toujours sur cheveux humides, section par section, des pointes vers les racines.",
      ion: "shield-checkmark-outline", ionBg: Colors.growthLight, ionColor: Colors.growth,
    },
    "Frisottis": {
      title: "Dompte les frisottis",
      detail: "Coiffe sur cheveux très humides avec un leave-in + gel définissant. Ne touche plus tes cheveux jusqu’au séchage complet — c’est là que les frisottis apparaissent.",
      ion: "flash-outline", ionBg: Colors.amberLight, ionColor: Colors.amberDark,
    },
    "Pellicules": {
      title: "Assainis ton cuir chevelu",
      detail: "Utilise un shampoing antipelliculaire 1x/semaine (pyrithione de zinc ou kétoconazole). Entre les lavages, un spray à l’eau de rose ou à l’aloe vera soulage les démangeaisons.",
      ion: "snow-outline", ionBg: Colors.sageLight, ionColor: Colors.sageDark,
    },
    "Manque de brillance": {
      title: "Retrouve l’éclat",
      detail: "Termine chaque lavage par un rinçage à l’eau froide pour refermer les écailles. Applique une huile légère (argan, jojoba) sur pointes humides — juste une noisette suffit.",
      ion: "sunny-outline", ionBg: Colors.amberPowder, ionColor: Colors.amberInk,
    },
    "Noeuds fréquents": {
      title: "Démêlage sans casse",
      detail: "Démêle toujours sur cheveux saturés de produit (après-shampoing ou masque), jamais à sec. Travaille en petites sections avec un peigne à dents larges, des pointes vers les racines.",
      ion: "git-network-outline", ionBg: Colors.blush, ionColor: Colors.rose,
    },
    "Fourches et pointes abîmées": {
      title: "Soigne tes pointes",
      detail: "Applique une huile ou un sérum sur les pointes à chaque manipulation. Planifie une coupe des pointes tous les 2-3 mois — même 1 cm éliminent les fourches et relancent la pousse.",
      ion: "cut-outline", ionBg: Colors.amberLight, ionColor: Colors.amberDark,
    },
    "Problèmes de cuir chevelu": {
      title: "Prends soin de ton cuir chevelu",
      detail: "Le cuir chevelu est la base de tout : nettoie-le correctement à chaque lavage sans gratter. Masse avec une huile adaptée (tea tree si inflammation, ricin si pousse lente) 2x/semaine.",
      ion: "body-outline", ionBg: Colors.sageLight, ionColor: Colors.sageDark,
    },
    "Dommages chaleur": {
      title: "Répare les dommages thermiques",
      detail: "Masque protéiné 1x/semaine + hydratant 1x/semaine en alternance. Stoppe les outils chauffants le temps de la réparation — au moins 4 semaines pour sentir une vraie différence.",
      ion: "flame-outline", ionBg: Colors.alertLight, ionColor: Colors.alertDark,
    },
    "Dommages chimiques": {
      title: "Reconstruis ta fibre",
      detail: "Alterne masque protéiné et masque hydratant chaque semaine. Évite tout processus chimique supplémentaire jusqu’à ce que la fibre retrouve son élasticité.",
      ion: "beaker-outline", ionBg: Colors.alertLight, ionColor: Colors.alertDark,
    },
    "Perte de définition des boucles": {
      title: "Retrouve tes boucles",
      detail: "Coiffe sur cheveux très humides avec la méthode praying hands (produit glissé entre les paumes sur chaque mèche). Un gel définissant léger scelle la définition jusqu’au séchage.",
      ion: "refresh-outline", ionBg: Colors.amberLight, ionColor: Colors.amberDark,
    },
  };

  const topProblematics = (profile.problematics ?? []).slice(0, 2);
  for (const prob of topProblematics) {
    const tip = PROBLEMATIC_TIPS[prob];
    if (tip && items.length < 3) {
      items.push(priority(`prob-${prob}`, tip.title, tip.detail, tip.ion, tip.ionBg, tip.ionColor));
    }
  }

  // Score santé bas → tip urgence (si aucune problématique n’a déjà rempli le slot)
  if (items.length < 3 && profile.healthScore != null && profile.healthScore < 40) {
    const scoreDetail = `Ton score sante (${profile.healthScore}/100) indique que ta fibre a besoin d’attention. Concentre-toi sur un masque nourrissant et reduis les manipulations.`;
    items.push(priority("score-low", "Intensifie tes soins cette semaine", scoreDetail, "analytics-outline", Colors.alertLight, Colors.alertDark));
  }

  if (items.length < 3 && profile.region) {
    const climateDetail = profile.climate
      ? `Chez toi (${profile.climate}) : adapte l’hydratation selon l’humidite — plus de spray quand l’air est sec, plus leger quand il est humide.`
      : "Adapte la quantite de produit a la saison : plus de protection en hiver, plus de legerete en ete.";
    items.push(priority("climate", `Climat ${profile.region}`, climateDetail, "partly-sunny-outline", Colors.growthLight, Colors.growth));
  }

  return items.slice(0, 3);
}

function buildIntro(profile: HairProfile, reco: OnboardingRecommendations): { intro: string; mood: BlackCottonMood } {
  const objective = displayObjective(normalizeObjectiveId(profile.objective));
  const topProb = profile.problematics?.[0];

  const parts = [
    "J’ai affine tes recommandations pour des cheveux " + (profile.hairType || "textures"),
    profile.porosity ? ("a porosite " + profile.porosity.toLowerCase()) : null,
    objective ? ("objectif : " + objective) : null,
    topProb ? ("problematique : " + topProb) : null,
  ]
    .filter(Boolean)
    .join(", ");

  const morning = reco.morning[0]?.title;
  const evening = reco.evening[0]?.title;
  const tail = (morning && evening)
    ? (" Commence par " + morning + " le matin et " + evening + " le soir — le detail est dans ton plan.")
    : "";

  const scoreAlert = (profile.healthScore != null && profile.healthScore < 40)
    ? (" Ton score sante est de " + profile.healthScore + "/100 — j’ai priorise les soins les plus urgents.")
    : "";

  return {
    intro: parts + "." + scoreAlert + tail,
    mood: (profile.healthScore != null && profile.healthScore < 40) ? "coaching"
        : profile.porosity === "Elevee" ? "coaching"
        : "encouraging",
  };
}

function buildRoutineParagraph(reco: OnboardingRecommendations): string {
  const m = reco.morning.map(s => s.title).join(', ');
  const e = reco.evening.map(s => s.title).join(', ');
  return `Routine quotidienne : matin (${m}) puis soir (${e}). Valide chaque étape dans l’onglet Routine pour que je puisse suivre ta régularité.`;
}

function buildWashdayParagraph(reco: OnboardingRecommendations): string {
  const steps = reco.weekly.map(s => s.title).join(' → ');
  return `Wash day recommandé : ${steps}. Un lavage complet toutes les 7 à 10 jours suffit en général — planifie-le pour ne pas sauter le pré-poo ni le masque.`;
}

function buildSpotlight(
  profile: HairProfile,
  reco: OnboardingRecommendations,
): BlackCottonHomeReco['spotlight'] {
  if (reco.showProducts && reco.products[0]) {
    const p = reco.products[0];
    return {
      kind: 'product',
      title: `Mon coup de cœur : ${p.name}`,
      detail: `${p.brand} · ${p.price} — adapté à ton profil et à ton style de soin ${profile.careStyle === 'diy' ? 'mixte' : profile.careStyle}.`,
      cta: 'Voir en boutique',
      route: '/shop',
    };
  }
  if (reco.showRecipes && reco.recipes[0]) {
    const r = reco.recipes[0];
    return {
      kind: 'recipe',
      title: `Recette à tester : ${r.name}`,
      detail: `${r.category} · ${r.duration} min — ingrédients simples pour nourrir tes longueurs entre deux lavages.`,
      cta: 'Voir la recette',
      route: '/recipes',
    };
  }
  if (reco.articles[0]) {
    const a = reco.articles[0];
    return {
      kind: 'article',
      title: a.title,
      detail: a.subtitle || `${a.read_time} min de lecture pour aller plus loin sur ton profil.`,
      cta: 'Lire l’article',
      route: '/articles',
    };
  }
  return undefined;
}

export function buildBlackCottonHomeRecommendations(profile: HairProfile): BlackCottonHomeReco | null {
  if (!profile.careStyle) return null;

  const reco = buildOnboardingRecommendations(diagnosticSnapshotFromProfile(profile));
  const { intro, mood } = buildIntro(profile, reco);

  return {
    intro,
    mood,
    priorities: buildPriorities(profile, reco),
    routineParagraph: buildRoutineParagraph(reco),
    washdayParagraph: buildWashdayParagraph(reco),
    spotlight: buildSpotlight(profile, reco),
  };
}
