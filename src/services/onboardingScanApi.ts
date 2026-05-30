import { supabase } from '../lib/supabase';
import type { ScanPhoto } from '../components/hairScan/HairZoneScanner';

/**
 * Extrait le code de type depuis le format brut retourné par le scan IA.
 * "4B · Crépu dense" → "4B"   |   "3C · Bouclé" → "3C"
 */
export function parseScanHairType(raw: string): string {
  if (!raw || raw === '—') return '';
  const m = raw.match(/^(\d[A-C])/i);
  if (m) return m[1].toUpperCase();
  return raw.split('·')[0].trim() || raw;
}

export type OnboardingQuickScan = {
  hairType: string;
  porosity: string;
  score: number;
  synthesis: string;
  highlights: string[];
};

export type OnboardingProfile = {
  hairType?: string;
  porosity?: string;
  density?: string;
  objective?: string;
  problematics?: string[];
};

/** Mots-clés → problématique canonique détectée depuis les highlights/synthesis du scan. */
const SCAN_KEYWORD_TO_PROBLEMATIC: Array<{ keywords: string[]; label: string }> = [
  { keywords: ['alopécie', 'implantation', 'calvitie', 'traction'], label: 'Alopécie de traction' },
  { keywords: ['chute', 'perte de cheveux', 'perte capillaire'], label: 'Chute de cheveux' },
  { keywords: ['sèche', 'déshydrat', 'manque d\'hydratation', 'terne et fibreux', 'sécheresse'], label: 'Cheveux secs et cassants' },
  { keywords: ['casse', 'cassant', 'fragilisé', 'fragilité'], label: 'Casse' },
  { keywords: ['frisottis', 'frizz', 'gonflé'], label: 'Frisottis' },
  { keywords: ['pellicule', 'démangeai'], label: 'Pellicules' },
  { keywords: ['terne', 'sans brillance', 'manque de brillance', 'sans éclat'], label: 'Manque de brillance' },
  { keywords: ['nœud', 'noeud', 'emmêlé', 'difficile à démêler'], label: 'Noeuds fréquents' },
  { keywords: ['fourche', 'pointes abîmées', 'pointes sèches'], label: 'Fourches et pointes abîmées' },
  { keywords: ['scalp', 'cuir chevelu irrité', 'cuir chevelu sensible'], label: 'Problèmes de cuir chevelu' },
  { keywords: ['perte de définition', 'boucles aplaties', 'boucles relâchées'], label: 'Perte de définition des boucles' },
];

/**
 * Extrait automatiquement les problématiques capillaires détectées
 * dans les highlights et la synthesis du scan IA.
 * Retourne au plus 3 labels canoniques.
 */
export function extractProblematicsFromScan(scan: OnboardingQuickScan): string[] {
  const text = [scan.synthesis, ...scan.highlights].join(' ').toLowerCase();
  const detected: string[] = [];
  for (const { keywords, label } of SCAN_KEYWORD_TO_PROBLEMATIC) {
    if (keywords.some(kw => text.includes(kw)) && !detected.includes(label)) {
      detected.push(label);
    }
    if (detected.length >= 3) break;
  }
  return detected;
}

const ONBOARDING_SCAN_FUNCTION = 'onboarding-scan';

export async function analyzeOnboardingPhoto(
  photo: ScanPhoto,
  profile: OnboardingProfile,
): Promise<OnboardingQuickScan> {
  const token = process.env.EXPO_PUBLIC_ONBOARDING_SCAN_TOKEN ?? '';

  const { data, error } = await supabase.functions.invoke(ONBOARDING_SCAN_FUNCTION, {
    body: {
      photo: { base64: photo.base64, mimeType: photo.mimeType },
      profile,
    },
    headers: token ? { 'x-onboarding-token': token } : {},
  });

  if (error) {
    throw new Error(error.message ?? 'Analyse indisponible');
  }
  if (data && typeof data === 'object' && 'error' in data) {
    const code = (data as { error: string }).error;
    if (code === 'rate_limit') throw new Error('Trop de scans. Réessaie dans 5 minutes.');
    throw new Error('Analyse indisponible');
  }

  const d = data as Partial<OnboardingQuickScan>;
  return {
    hairType:   typeof d.hairType   === 'string' ? d.hairType   : '—',
    porosity:   typeof d.porosity   === 'string' ? d.porosity   : '—',
    score:      typeof d.score      === 'number' ? d.score      : 50,
    synthesis:  typeof d.synthesis  === 'string' ? d.synthesis  : '',
    highlights: Array.isArray(d.highlights) ? d.highlights : [],
  };
}
