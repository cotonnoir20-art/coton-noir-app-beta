import { supabase } from './supabase';

export type HairAnalysisSummary = {
  id: string;
  score: number;
  hairType: string;
  porosity: string;
  synthesis: string;
  createdAt: string;
};

function parseSummary(row: {
  id: string;
  score: number | null;
  hair_type: string | null;
  porosity: string | null;
  analysis: unknown;
  created_at: string;
}): HairAnalysisSummary {
  const a = row.analysis && typeof row.analysis === 'object'
    ? (row.analysis as Record<string, unknown>)
    : {};
  const synthesis = typeof a.synthesis === 'string' ? a.synthesis : '';
  return {
    id: row.id,
    score: row.score ?? (typeof a.score === 'number' ? a.score : 0),
    hairType: row.hair_type ?? (typeof a.hairType === 'string' ? a.hairType : '—'),
    porosity: row.porosity ?? (typeof a.porosity === 'string' ? a.porosity : '—'),
    synthesis: synthesis.slice(0, 120),
    createdAt: row.created_at,
  };
}

export async function fetchHairAnalysisHistory(limit = 10): Promise<HairAnalysisSummary[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('hair_analyses')
    .select('id, score, hair_type, porosity, analysis, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data.map(parseSummary);
}

export function formatAnalysisDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}
