import { INGREDIENT_DB, type IngredientInfo, type IngredientRating } from '../data/ingredientAnalysis';
import { CURLSBOT_INGREDIENTS } from '../data/curlsbotIngredients';

// Notre DB détaillée en premier (priorité sur CurlsBot pour les ingrédients communs)
const ALL_INGREDIENTS: IngredientInfo[] = [...INGREDIENT_DB, ...CURLSBOT_INGREDIENTS];

export type AnalyzedIngredient = {
  raw: string;
  info: IngredientInfo | null;
  rating: IngredientRating | 'neutre';
};

export type IngredientSummary = {
  rouge: AnalyzedIngredient[];
  orange: AnalyzedIngredient[];
  vert: AnalyzedIngredient[];
  neutre: AnalyzedIngredient[];
  total: number;
  score: number; // 0-100 (100 = parfait)
};

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchEntry(norm: string, entry: IngredientInfo): boolean {
  const nameNorm = normalize(entry.name);
  const aliasNorms = entry.aliases.map(normalize);

  // Exact match
  if (norm === nameNorm || aliasNorms.includes(norm)) return true;

  // Paraben family: any word ending with "paraben"
  if (entry.id === 'paraben' && norm.endsWith('paraben')) return true;

  // PEG/PPG family: any word starting with "peg-" or "ppg-"
  if (entry.id === 'peg' && (norm.startsWith('peg') || norm.startsWith('ppg'))) return true;

  // Protein family: any "hydrolyzed X" compound
  if (entry.id === 'protein' && norm.startsWith('hydrolyzed')) return true;

  // Cyclosiloxane family: D4/D5/D6 or cyclo*siloxane
  if (entry.id === 'cyclosiloxane' && (norm.includes('siloxane') || /^d[456]$/.test(norm))) return true;

  // Alcohol (dry): bare "alcohol" or "sd alcohol XX" but NOT fatty alcohol
  if (entry.id === 'alcohol_denat') {
    if (norm === 'alcohol') return true;
    if (norm.startsWith('sd alcohol')) return true;
    if (norm.startsWith('alcohol denat')) return true;
  }

  // Fatty alcohol — extra guard so we don't flag cetyl/stearyl as dry alcohol
  if (entry.id === 'fatty_alcohol') {
    const fattyNames = ['cetyl', 'cetearyl', 'stearyl', 'behenyl'];
    if (fattyNames.some(f => norm.startsWith(f))) return true;
  }

  // Contains match (either direction) — only for longer strings to avoid false positives
  if (nameNorm.length > 5 && norm.includes(nameNorm)) return true;
  if (norm.length > 5 && nameNorm.includes(norm)) return true;

  // Alias contains match
  for (const alias of aliasNorms) {
    if (alias.length > 5 && (norm.includes(alias) || alias.includes(norm))) return true;
  }

  return false;
}

export function analyzeIngredients(ingredientText: string): AnalyzedIngredient[] {
  if (!ingredientText.trim()) return [];

  // Split by commas, newlines, semicolons or slashes, clean each token
  const tokens = ingredientText
    .split(/[,\n;\/•*]+/)
    .map(s => s.trim().replace(/^\d+\.\s*/, '')) // remove leading numbers like "1. "
    .filter(s => s.length > 1);

  return tokens.map(raw => {
    const norm = normalize(raw);
    let found: IngredientInfo | null = null;

    for (const entry of ALL_INGREDIENTS) {
      if (matchEntry(norm, entry)) {
        found = entry;
        break;
      }
    }

    return {
      raw,
      info: found,
      rating: found ? found.rating : 'neutre',
    };
  });
}

export function buildSummary(analyzed: AnalyzedIngredient[]): IngredientSummary {
  const rouge  = analyzed.filter(a => a.rating === 'rouge');
  const orange = analyzed.filter(a => a.rating === 'orange');
  const vert   = analyzed.filter(a => a.rating === 'vert');
  const neutre = analyzed.filter(a => a.rating === 'neutre');
  const total  = analyzed.length;

  // Score: rouge = -15pts, orange = -5pts, vert = +8pts, base 50
  const raw = 50 - rouge.length * 15 - orange.length * 5 + vert.length * 8;
  const score = Math.max(0, Math.min(100, raw));

  return { rouge, orange, vert, neutre, total, score };
}

export const RATING_CONFIG = {
  rouge:  { color: '#D32F2F', bg: '#FFEBEE', label: 'À éviter',     icon: 'close-circle'     },
  orange: { color: '#E65100', bg: '#FFF3E0', label: 'Attention',    icon: 'warning'           },
  vert:   { color: '#2E7D32', bg: '#E8F5E9', label: 'Bénéfique',    icon: 'checkmark-circle'  },
  neutre: { color: '#757575', bg: '#F5F5F5', label: 'Non classifié', icon: 'remove-circle-outline' },
} as const;
