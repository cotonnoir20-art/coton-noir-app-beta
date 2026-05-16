import { isDemoEmail } from '../data/demoUsers';
import { isDemoModeAvailable } from '../lib/demoMode';
import { pickCoachProfileFields } from '../lib/coachProfile';
import { COACH_FALLBACK_ADVICE, getOfflineFloatingTips } from '../lib/coachFallbacks';
import { supabase } from '../lib/supabase';

export type ChatMessage = { role: 'user' | 'assistant'; content: string };

export type PhotoInput = {
  base64: string;
  mediaType: string;
  label: string;
};

export type HairQuestionnaire = {
  lastWash: 'today' | '1-3d' | '4-7d' | 'over-week' | 'unknown';
  texture: 'dry-rough' | 'dry-soft' | 'soft-supple' | 'oily' | 'brittle';
  porosityTest: 'sinks-fast' | 'sinks-slow' | 'floats' | 'not-done';
  mainConcern: 'breakage' | 'dryness' | 'definition' | 'growth' | 'scalp' | 'frizz' | 'volume';
  recentStress?: 'heat' | 'color' | 'relaxer' | 'protective-style' | 'none';
};

export type HairAnalysis = {
  score: number;
  hairType: string;
  porosity: string;
  density?: string;
  synthesis: string;
  gauges: { label: string; value: number; icon: string }[];
  problems: { sev: string; emoji: string; name: string; desc: string }[];
  advice: { type: string; icon: string; t: string; d: string }[];
  routine: { t: string; f: string; d: string }[];
  recommendedTags?: string[];
};

export class CoachApiError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'CoachApiError';
  }
}

async function isDemoSession(): Promise<boolean> {
  if (!isDemoModeAvailable()) return false;
  const { data: { user } } = await supabase.auth.getUser();
  return isDemoEmail(user?.email);
}

function mapInvokeError(data: unknown, error: { message?: string } | null): never {
  const code = typeof data === 'object' && data && 'error' in data
    ? String((data as { error: unknown }).error)
    : undefined;

  if (code === 'rate_limit') {
    throw new CoachApiError(
      'Tu as atteint la limite quotidienne du coach IA. Réessaie demain 🌙',
      'rate_limit',
    );
  }
  if (code === 'not_authenticated') {
    throw new CoachApiError('Connecte-toi pour utiliser le coach IA.', 'not_authenticated');
  }
  if (code === 'quota_unavailable') {
    throw new CoachApiError(
      'Coach IA temporairement indisponible. Exécute security-coach-edge-function.sql sur Supabase.',
      'quota_unavailable',
    );
  }
  if (code === 'payload_too_large' || code?.includes('trop volumine')) {
    throw new CoachApiError('Photos trop lourdes. Réessaie avec des images plus légères.', code);
  }

  throw new CoachApiError(
    (typeof data === 'object' && data && 'error' in data
      ? String((data as { error: unknown }).error)
      : null) ?? error?.message ?? 'Erreur coach IA',
    code,
  );
}

export async function askCoach(
  userMessage: string,
  profile?: Record<string, unknown>,
  history: ChatMessage[] = [],
): Promise<string> {
  if (await isDemoSession()) {
    return COACH_FALLBACK_ADVICE;
  }

  const messages: ChatMessage[] = [
    ...history,
    { role: 'user', content: userMessage },
  ];

  const { data, error } = await supabase.functions.invoke('coach-coton-noir', {
    body: { messages, profile },
  });

  if (error || (data && typeof data === 'object' && 'error' in data && (data as { error?: string }).error)) {
    mapInvokeError(data, error);
  }

  return (data?.advice as string) ?? COACH_FALLBACK_ADVICE;
}

export async function getDailyAdvice(profile?: Record<string, unknown>): Promise<string> {
  if (await isDemoSession()) {
    return COACH_FALLBACK_ADVICE;
  }
  return askCoach(
    "Donne-moi un conseil capillaire personnalisé et motivant pour aujourd'hui, en 1 ou 2 phrases maximum.",
    profile,
  );
}

export async function getFloatingTips(profile?: Record<string, unknown>): Promise<string[]> {
  if (await isDemoSession()) {
    return getOfflineFloatingTips();
  }

  try {
    const raw = await askCoach(
      'Génère exactement 6 conseils capillaires courts et motivants (une seule phrase chacun). Écris-les un par ligne, sans numérotation ni tiret.',
      profile,
    );
    const tips = raw
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0)
      .slice(0, 6);
    return tips.length >= 2 ? tips : [raw];
  } catch (e) {
    if (e instanceof CoachApiError && e.code === 'rate_limit') {
      return getOfflineFloatingTips();
    }
    throw e;
  }
}

export async function analyzeHairPhoto(
  photos: PhotoInput[],
  profile?: Record<string, unknown>,
  questionnaire?: HairQuestionnaire,
): Promise<HairAnalysis> {
  const { data, error } = await supabase.functions.invoke('coach-coton-noir', {
    body: {
      images: photos,
      profile: pickCoachProfileFields(profile),
      questionnaire,
    },
  });

  if (error || (data && typeof data === 'object' && 'error' in data && (data as { error?: string }).error)) {
    mapInvokeError(data, error);
  }
  if (!data?.analysis) {
    throw new CoachApiError('Réponse analyse vide', 'empty_response');
  }

  return data.analysis as HairAnalysis;
}

/** Résumé stocké en base — pas le détail complet (problèmes, routine, conseils). */
function toStoredAnalysisSummary(analysis: HairAnalysis): Record<string, unknown> {
  return {
    score: analysis.score,
    hairType: analysis.hairType,
    porosity: analysis.porosity,
    density: analysis.density,
    synthesis: analysis.synthesis?.slice(0, 600),
    recommendedTags: analysis.recommendedTags?.slice(0, 8),
  };
}

export async function saveHairAnalysis(args: {
  questionnaire: HairQuestionnaire;
  analysis: HairAnalysis;
  photoMeta: { label: string; byteSize: number }[];
}): Promise<{ ok: boolean; error?: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'not-authenticated' };

  const { error } = await supabase
    .from('hair_analyses')
    .insert({
      user_id:        user.id,
      questionnaire:  args.questionnaire,
      analysis:       toStoredAnalysisSummary(args.analysis),
      photo_meta:     args.photoMeta,
      score:          args.analysis.score,
      hair_type:      args.analysis.hairType,
      porosity:       args.analysis.porosity,
    });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
