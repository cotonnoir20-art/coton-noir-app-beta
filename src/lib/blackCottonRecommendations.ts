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
  } else if (objective === 'Casse' || objective === 'Pointes') {
    items.push(
      priority(
        'obj-strength',
        'Renforcement & pointes',
        'Masque hebdo + huile sur pointes seulement. Démêle toujours avec douceur, jamais sur cheveux secs.',
        'shield-checkmark-outline',
        Colors.growthLight,
        Colors.growth,
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

  if (profile.region) {
    items.push(
      priority(
        'climate',
        `Climat ${profile.region}`,
        profile.climate
          ? `Chez toi (${profile.climate}) : adapte l’hydratation selon l’humidité — plus de spray quand l’air est sec, plus léger quand il est humide.`
          : 'Adapte la quantité de produit à la saison : plus de protection en hiver, plus de légèreté en été.',
        'partly-sunny-outline',
        Colors.growthLight,
        Colors.growth,
      ),
    );
  }

  return items.slice(0, 3);
}

function buildIntro(profile: HairProfile, reco: OnboardingRecommendations): { intro: string; mood: BlackCottonMood } {
  const objective = displayObjective(normalizeObjectiveId(profile.objective));
  const parts = [
    `J’ai affiné tes recommandations pour des cheveux ${profile.hairType || 'texturés'}`,
    profile.porosity ? `à porosité ${profile.porosity.toLowerCase()}` : null,
    objective ? `avec l’objectif « ${objective} »` : null,
  ]
    .filter(Boolean)
    .join(' ');

  const morning = reco.morning[0]?.title;
  const evening = reco.evening[0]?.title;
  const tail =
    morning && evening
      ? ` Commence par « ${morning} » le matin et « ${evening} » le soir — le détail est dans ton plan juste au-dessus.`
      : '';

  return {
    intro: `${parts}.${tail}`,
    mood: profile.porosity === 'Élevée' ? 'coaching' : 'encouraging',
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
