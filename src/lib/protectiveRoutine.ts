export type ProtectiveStyleId =
  | 'braids'
  | 'extensions'
  | 'locks'
  | 'weave'
  | 'twists'
  | 'autre'
  | '';

export type ProtectiveNightGuide = {
  title: string;
  focus: string;
  steps: string[];
  scalpTip: string;
};

const GUIDES: Record<ProtectiveStyleId, ProtectiveNightGuide> = {
  braids: {
    title: 'Tresses / box braids',
    focus: 'Cuir chevelu + racines, sans défaire la coiffure',
    steps: [
      'Brumiser légèrement le cuir chevelu (eau + leave-in dilué)',
      'Masser les racines 2 min avec une huile légère',
      'Enrouler avec un foulard satin ou bonnet',
    ],
    scalpTip: 'Évite les produits lourds sur les longueurs tressées — privilégie le cuir chevelu.',
  },
  extensions: {
    title: 'Extensions / vanilles',
    focus: 'Hydratation racines + protection des points',
    steps: [
      'Vaporiser un spray hydratant sur les racines uniquement',
      'Sérum léger sur les pointes visibles',
      'Bonnet satin pour limiter le frottement',
    ],
    scalpTip: 'Pas de rinçage abondant : un excès d’eau peut glisser sous les attaches.',
  },
  locks: {
    title: 'Locks / dreadlocks',
    focus: 'Hydratation ciblée sans alourdir les locs',
    steps: [
      'Brumiser les locs (pas de trempage)',
      'Huile légère sur longueurs si sensation de sécheresse',
      'Bonnet ou taie satin',
    ],
    scalpTip: '1×/semaine : nettoyage doux du cuir chevelu si démangeaisons.',
  },
  weave: {
    title: 'Tissage / weave',
    focus: 'Cuir chevelu accessible + couture protégée',
    steps: [
      'Spray hydratant entre les rangs accessibles',
      'Massage cuir chevelu 2 min',
      'Foulard satin serré sans tirer les coutures',
    ],
    scalpTip: 'Surveille démangeaisons ou rougeurs — signe de sécheresse sous le tissage.',
  },
  twists: {
    title: 'Twists',
    focus: 'Rétention hydratation + définition sans re-twist',
    steps: [
      'Brumiser twists + leave-in léger',
      'Huile sur pointes en petite quantité',
      'Bonnet satin',
    ],
    scalpTip: 'Ne défais pas chaque soir : retwist seulement si nécessaire (frisottis).',
  },
  autre: {
    title: 'Coiffure protectrice',
    focus: 'Routine minimale, cuir chevelu prioritaire',
    steps: [
      'Hydrater le cuir chevelu si accessible',
      'Protéger les pointes visibles',
      'Dormir avec satin',
    ],
    scalpTip: 'Adapte les produits à ce que ta coiffure laisse accessible.',
  },
  '': {
    title: 'Mode protecteur',
    focus: 'Routine du soir allégée',
    steps: [
      'Hydratation légère cuir chevelu',
      'Protection satin pour la nuit',
      'Valider la routine pour garder ton streak',
    ],
    scalpTip: 'Choisis ton type de coiffure dans le profil pour des conseils plus précis.',
  },
};

export function getProtectiveNightGuide(styleId: string | undefined): ProtectiveNightGuide {
  const id = (styleId ?? '') as ProtectiveStyleId;
  return GUIDES[id] ?? GUIDES[''];
}

export function getProtectiveReminderBody(styleId: string | undefined): string {
  const g = getProtectiveNightGuide(styleId);
  return `${g.focus} — ouvre ta routine du soir adaptée.`;
}
