export type RoutineStep = {
  id: number;
  title: string;
  duration: string;
  desc: string;
  products: string[];
  done: boolean;
};

export type RoutineType = 'washday' | 'daily' | 'night';

export const ROUTINE_TYPES: Record<RoutineType, { label: string; emoji: string; steps: Omit<RoutineStep, 'done'>[] }> = {
  washday: {
    label: 'Wash Day',
    emoji: '🚿',
    steps: [
      { id: 1, title: 'Pré-poo',            duration: '30 min', desc: "Bain d'huile coco/avocat sur cheveux secs avant lavage.",   products: ["Huile de coco", "Huile d'avocat"] },
      { id: 2, title: 'Co-wash',             duration: '15 min', desc: 'Nettoyage doux sans sulfates, focus cuir chevelu.',         products: ['Co-wash Aloe'] },
      { id: 3, title: 'Masque hydratant',    duration: '20 min', desc: 'Démêlage doux à plat sur cheveux essorés sous charlotte.',  products: ['Masque Karité Profond'] },
      { id: 4, title: 'Leave-in + huile',    duration: '10 min', desc: 'Méthode LCO sur cheveux trempés section par section.',      products: ['Leave-in Hydrate', 'Huile Ricin Noir'] },
      { id: 5, title: 'Protection nocturne', duration: '5 min',  desc: 'Bonnet satin + ananas style pour préserver les boucles.',  products: ['Bonnet satin'] },
    ],
  },
  daily: {
    label: 'Quotidienne',
    emoji: '🌤️',
    steps: [
      { id: 1, title: 'Humidification', duration: '3 min',  desc: "Vaporise de l'eau ou un spray sur les longueurs.",          products: ['Spray eau florale'] },
      { id: 2, title: 'Leave-in',       duration: '5 min',  desc: 'Applique le leave-in en sections pour bien répartir.',      products: ['Leave-in léger'] },
      { id: 3, title: 'Scellage',       duration: '3 min',  desc: "Scelle l'humidité avec une huile légère sur les pointes.", products: ['Huile de sésame'] },
      { id: 4, title: 'Coiffage',       duration: '10 min', desc: 'Définis tes boucles ou arrange ta coiffure du jour.',      products: ['Gel', 'Mousse fixante'] },
    ],
  },
  night: {
    label: 'Nuit',
    emoji: '🌙',
    steps: [
      { id: 1, title: 'Démêlage doux',         duration: '5 min',  desc: 'Démêle délicatement des pointes aux racines.',           products: ['Brosse douce', 'Spray démêlant'] },
      { id: 2, title: 'Hydratation nocturne',  duration: '5 min',  desc: 'Applique un léger leave-in sur les pointes abîmées.',   products: ['Leave-in léger'] },
      { id: 3, title: 'Tresses de protection', duration: '10 min', desc: 'Fais 2 à 4 tresses lâches pour protéger la nuit.',      products: [] },
      { id: 4, title: 'Bonnet satin',          duration: '2 min',  desc: 'Enfile ton bonnet ou utilise une taie en satin.',       products: ['Bonnet satin'] },
    ],
  },
};
