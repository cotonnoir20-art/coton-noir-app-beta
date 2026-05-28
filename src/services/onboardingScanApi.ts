import { supabase } from '../lib/supabase';
import type { ScanPhoto } from '../components/hairScan/HairZoneScanner';

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
