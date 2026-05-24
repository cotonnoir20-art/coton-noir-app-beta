import type { IonName } from '../components/AppIconBox';
import type { HairProfile } from '../context/AppContext';
import { normalizeObjectiveId } from '../constants/hairObjectives';
import { resolvePorosity } from '../constants/hairProfileOptions';
import {
  buildOnboardingRecommendations,
  diagnosticSnapshotFromProfile,
  type RecoProduct,
} from './onboardingRecommendations';

export type HomeProblemItem = {
  id: string;
  label: string;
  ion: IonName;
  ionBg: string;
  ionColor: string;
};

export type HomeProductRecommendations = {
  mainProblem: HomeProblemItem;
  relatedProblems: [HomeProblemItem, HomeProblemItem];
  products: RecoProduct[];
  showSection: boolean;
};

type ProblemBundle = {
  main: HomeProblemItem;
  related: [HomeProblemItem, HomeProblemItem];
};

function problem(
  id: string,
  label: string,
  ion: IonName,
  ionBg: string,
  ionColor: string,
): HomeProblemItem {
  return { id, label, ion, ionBg, ionColor };
}

const BY_OBJECTIVE: Record<string, ProblemBundle> = {
  Hydratation: {
    main: problem('main-hydration', 'Sécheresse & manque d’hydratation', 'water-outline', '#D9EBE5', '#3D6B5C'),
    related: [
      problem('rel-frizz', 'Frisottis & rébellion', 'cloud-outline', '#FDE9D0', '#8A4E0A'),
      problem('rel-dull', 'Cheveux ternes', 'moon-outline', '#DCE4E8', '#2F4B59'),
    ],
  },
  Pousse: {
    main: problem('main-growth', 'Longueur qui stagne', 'fitness-outline', '#DCE4E8', '#2F4B59'),
    related: [
      problem('rel-scalp', 'Cuir chevelu à stimuler', 'leaf-outline', '#D9EBE5', '#3D6B5C'),
      problem('rel-ends', 'Pointes abîmées', 'cut-outline', '#F5D8DA', '#C45A62'),
    ],
  },
  Casse_et_chute: {
    main: problem('main-break-shed', 'Casse et chute', 'heart-dislike-outline', '#F5D8DA', '#C45A62'),
    related: [
      problem('rel-scalp', 'Cuir chevelu sensible', 'leaf-outline', '#D9EBE5', '#3D6B5C'),
      problem('rel-weak', 'Fibres fragilisées', 'shield-outline', '#DCE4E8', '#2F4B59'),
    ],
  },
  Fibre: {
    main: problem('main-fiber', 'Fibres fragiles', 'shield-outline', '#F5D8DA', '#C45A62'),
    related: [
      problem('rel-protein', 'Manque de force', 'barbell-outline', '#DCE4E8', '#2F4B59'),
      problem('rel-ends', 'Pointes abîmées', 'cut-outline', '#FDE9D0', '#8A4E0A'),
    ],
  },
  Chute: {
    main: problem('main-shedding', 'Chute ou amincissement', 'heart-dislike-outline', '#F5D8DA', '#C45A62'),
    related: [
      problem('rel-scalp', 'Cuir chevelu sensible', 'leaf-outline', '#D9EBE5', '#3D6B5C'),
      problem('rel-stress', 'Fibres fragilisées', 'shield-outline', '#DCE4E8', '#2F4B59'),
    ],
  },
  Définition: {
    main: problem('main-definition', 'Boucles peu définies', 'color-wand-outline', '#FDE9D0', '#8A4E0A'),
    related: [
      problem('rel-frizz', 'Frisottis', 'cloud-outline', '#F5D8DA', '#C45A62'),
      problem('rel-hold', 'Tenue qui ne tient pas', 'hourglass-outline', '#DCE4E8', '#2F4B59'),
    ],
  },
  Casse: {
    main: problem('main-breakage', 'Casse & fibres fragiles', 'shield-outline', '#F5D8DA', '#C45A62'),
    related: [
      problem('rel-ends', 'Pointes fourchues', 'cut-outline', '#FDE9D0', '#8A4E0A'),
      problem('rel-protein', 'Manque de force', 'barbell-outline', '#DCE4E8', '#2F4B59'),
    ],
  },
  Pointes: {
    main: problem('main-ends', 'Pointes sèches & abîmées', 'cut-outline', '#FDE9D0', '#8A4E0A'),
    related: [
      problem('rel-breakage', 'Casse sur les longueurs', 'shield-outline', '#F5D8DA', '#C45A62'),
      problem('rel-seal', 'Hydratation qui s’échappe', 'water-outline', '#D9EBE5', '#3D6B5C'),
    ],
  },
  Couleur: {
    main: problem('main-color', 'Couleur qui ternit vite', 'color-palette-outline', '#F5D8DA', '#C45A62'),
    related: [
      problem('rel-dry', 'Sécheresse post-coloration', 'water-outline', '#D9EBE5', '#3D6B5C'),
      problem('rel-dull', 'Manque d’éclat', 'sunny-outline', '#FDE9D0', '#8A4E0A'),
    ],
  },
  Densite: {
    main: problem('main-density', 'Densité ou épaisseur insuffisante', 'resize-outline', '#FDE9D0', '#8A4E0A'),
    related: [
      problem('rel-volume', 'Manque de volume', 'cloud-outline', '#DCE4E8', '#2F4B59'),
      problem('rel-weak', 'Fibres fragiles', 'shield-outline', '#F5D8DA', '#C45A62'),
    ],
  },
  Epaisseur: {
    main: problem('main-thickness', 'Cheveux fins ou peu denses', 'resize-outline', '#FDE9D0', '#8A4E0A'),
    related: [
      problem('rel-volume', 'Manque de volume', 'cloud-outline', '#DCE4E8', '#2F4B59'),
      problem('rel-weak', 'Fibres fragiles', 'shield-outline', '#F5D8DA', '#C45A62'),
    ],
  },
  Dommages: {
    main: problem('main-damage', 'Cheveux abîmés', 'bandage-outline', '#F5D8DA', '#C45A62'),
    related: [
      problem('rel-ends', 'Pointes fourchues', 'cut-outline', '#FDE9D0', '#8A4E0A'),
      problem('rel-dry', 'Sécheresse liée aux agressions', 'water-outline', '#D9EBE5', '#3D6B5C'),
    ],
  },
  Transition: {
    main: problem('main-transition', 'Deux textures à harmoniser', 'git-merge-outline', '#FDE9D0', '#8A4E0A'),
    related: [
      problem('rel-breakage', 'Casse aux jonctions', 'shield-outline', '#F5D8DA', '#C45A62'),
      problem('rel-hydration', 'Hydratation inégale', 'water-outline', '#D9EBE5', '#3D6B5C'),
    ],
  },
  Cuir_chevelu: {
    main: problem('main-scalp', 'Cuir chevelu inconfortable', 'leaf-outline', '#D9EBE5', '#3D6B5C'),
    related: [
      problem('rel-itch', 'Démangeaisons', 'medical-outline', '#F5D8DA', '#C45A62'),
      problem('rel-flakes', 'Pellicules ou sécheresse', 'snow-outline', '#DCE4E8', '#2F4B59'),
    ],
  },
  Brillance: {
    main: problem('main-shine', 'Manque de brillance', 'sunny-outline', '#FDE9D0', '#8A4E0A'),
    related: [
      problem('rel-buildup', 'Résidus & alourdissement', 'flask-outline', '#DCE4E8', '#2F4B59'),
      problem('rel-dry', 'Longueurs ternes', 'water-outline', '#D9EBE5', '#3D6B5C'),
    ],
  },
  Tout: {
    main: problem('main-global', 'Cheveux qui manquent d’équilibre', 'sparkles-outline', '#FDE9D0', '#8A4E0A'),
    related: [
      problem('rel-hydration', 'Hydratation insuffisante', 'water-outline', '#D9EBE5', '#3D6B5C'),
      problem('rel-strength', 'Manque de force', 'shield-outline', '#F5D8DA', '#C45A62'),
    ],
  },
};

const BY_POROSITY: Record<string, ProblemBundle> = {
  Élevée: {
    main: problem('main-poro-high', 'Hydratation qui ne tient pas', 'water-outline', '#D9EBE5', '#3D6B5C'),
    related: [
      problem('rel-frizz', 'Frisottis', 'cloud-outline', '#FDE9D0', '#8A4E0A'),
      problem('rel-dry', 'Sécheresse rapide', 'leaf-outline', '#DCE4E8', '#2F4B59'),
    ],
  },
  Faible: {
    main: problem('main-poro-low', 'Cheveux alourdis ou gras', 'beaker-outline', '#DCE4E8', '#2F4B59'),
    related: [
      problem('rel-buildup', 'Produits qui s’accumulent', 'flask-outline', '#FDE9D0', '#8A4E0A'),
      problem('rel-flat', 'Manque de volume', 'expand-outline', '#D9EBE5', '#3D6B5C'),
    ],
  },
  Moyenne: {
    main: problem('main-poro-mid', 'Routine difficile à équilibrer', 'options-outline', '#FDE9D0', '#8A4E0A'),
    related: [
      problem('rel-frizz', 'Frisottis ponctuels', 'cloud-outline', '#F5D8DA', '#C45A62'),
      problem('rel-dry', 'Zones plus sèches', 'water-outline', '#D9EBE5', '#3D6B5C'),
    ],
  },
};

function resolveProblems(profile: HairProfile): ProblemBundle {
  const objective = normalizeObjectiveId(profile.objective);
  if (objective && BY_OBJECTIVE[objective]) {
    return BY_OBJECTIVE[objective];
  }
  const porosity = resolvePorosity(profile.porosity);
  return BY_POROSITY[porosity] ?? BY_POROSITY.Moyenne;
}

export function buildHomeProductRecommendations(profile: HairProfile): HomeProductRecommendations {
  const reco = buildOnboardingRecommendations(diagnosticSnapshotFromProfile(profile));
  const problems = resolveProblems(profile);

  return {
    mainProblem: problems.main,
    relatedProblems: problems.related,
    products: reco.products,
    showSection: Boolean(profile.careStyle && reco.showProducts && reco.products.length > 0),
  };
}
