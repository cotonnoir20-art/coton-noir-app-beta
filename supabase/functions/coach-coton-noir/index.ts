// @ts-nocheck
// Deno Edge Function — Coach Coton Noir (Anthropic via serveur uniquement)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const CORS_ALLOW_HEADERS = 'authorization, x-client-info, apikey, content-type';

/** Origines web autorisées (séparées par des virgules). Ex. https://app.cotonnoir.app,http://localhost:8081 */
function getAllowedOrigins(): string[] {
  const raw = Deno.env.get('COACH_ALLOWED_ORIGINS') ?? '';
  const fromEnv = raw.split(',').map(s => s.trim()).filter(Boolean);
  if (fromEnv.length > 0) return fromEnv;
  return [
    'http://localhost:8081',
    'http://localhost:19006',
    'http://127.0.0.1:8081',
    'http://127.0.0.1:19006',
  ];
}

/** Apps natives : pas d’en-tête Origin → CORS navigateur N/A. Web : allowlist stricte. */
function corsHeadersFor(req: Request): Record<string, string> | null {
  const origin = req.headers.get('Origin');
  if (!origin) {
    return { 'Access-Control-Allow-Headers': CORS_ALLOW_HEADERS };
  }
  const allowed = getAllowedOrigins();
  if (!allowed.includes(origin)) return null;
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': CORS_ALLOW_HEADERS,
    'Vary': 'Origin',
  };
}

const MAX_PHOTOS = 4;
const MAX_IMAGE_BYTES = 2_000_000;
const MAX_TOTAL_IMAGE_BYTES = 4_500_000;
const MAX_HISTORY = 12;
const MAX_MESSAGE_CHARS = 2_000;
const MAX_PROFILE_JSON = 4_000;

const PROFILE_KEYS = new Set([
  'hairType', 'porosity', 'density', 'length', 'targetLength',
  'routineType', 'budget', 'region', 'climate', 'objective', 'careStyle',
]);

const CHAT_SYSTEM = `Tu es Coach Coton Noir, une experte bienveillante et passionnée des cheveux naturels, crépus et texturés.
Tu accompagnes les femmes noires dans leur parcours capillaire avec des conseils personnalisés, scientifiquement fondés et culturellement adaptés.

Ton style : chaleureux, encourageant, jamais condescendant. Tu utilises un français naturel.
Tu es concise : 1 à 3 phrases maximum pour un conseil du jour, 5 phrases max pour une analyse.
Tu maîtrises la méthode LOC, les types de porosité, les routines wash day, les soins naturels (karité, huile de coco, aloe vera, glycérine, huile de ricin...).
Tu ne prescris jamais de traitement médical. Tu restes dans le domaine capillaire.`;

const ANALYSIS_SYSTEM = `Tu es Coach Coton Noir, experte certifiée en trichologie capillaire pour cheveux naturels, crépus et texturés.
Tu analyses des photos de cheveux ET un questionnaire ciblé pour produire un diagnostic d'une précision professionnelle.
Tu retournes UNIQUEMENT un objet JSON valide, sans texte avant ni après, sans balises markdown.

═══ MÉTHODOLOGIE EN 2 TEMPS ═══

[ 1 — Analyse visuelle des photos ]
- Pattern de boucles/coils : classification 1A à 4C (échelle André Walker + LOIS)
- Porosité visible : cuticule fermée (brillance vitreuse), moyenne (mat doux), haute (gonflé, terne, irrégulier)
- Densité : clairsemée (cuir chevelu visible), moyenne, dense
- État fibre : brillance, élasticité, casse visible, fourches, fragilité pointes
- Hydratation : sécheresse (frisottis, fils ternes cassants) vs souplesse définie
- Cuir chevelu : irritation, sébum, sécheresse
- Buildup produits : agglutination, lourdeur
- Si plusieurs photos : compare entre les angles fournis (face, côté gauche, côté droit, dessus)

[ 2 — Croisement avec le questionnaire utilisateur ]
Le questionnaire est CRUCIAL. Il te donne des infos invisibles à la photo :
- lastWash : si "today" alors apparence peut être sur-hydratée ; si "over-week" alors buildup probable.
- texture (toucher) : "brittle"/"dry-rough" = casse imminente, prioriser protéines + scellage ; "oily" = sébum excessif, alléger le scalp ; "soft-supple" = état d'équilibre.
- porosityTest (test du verre d'eau) :
  · "sinks-fast" → porosité haute confirmée (cuticule ouverte)
  · "sinks-slow" → porosité moyenne
  · "floats"    → porosité faible (cuticule fermée)
  Croise avec ton analyse visuelle pour fiabiliser le verdict "porosity".
- mainConcern : oriente l'ordre des "problems" et la priorité des conseils.
- recentStress : si "heat"/"color"/"relaxer" récent → réintroduire protéines + soins reconstructeurs ;
  si "protective-style" → focus rehydratation post-protective et scalp soin doux.

═══ RÈGLES D'OR ═══

1. Si questionnaire CONTREDIT la photo, explique en synthesis et ajuste vers une moyenne pondérée.
2. Les "problems" doivent matcher le "mainConcern" en priorité (max 5, tri par sévérité).
3. Les "advice" doivent être ACTIONNABLES.
4. Le "score" doit refléter l'écart entre l'état actuel et l'état idéal pour ce type capillaire.
5. Les "recommendedTags" : 2 à 4 tags parmi : hydratation, casse, sécheresse, frisottis, brillance, pousse, scalp, protéines, scellage, anti-buildup, leave-in, masque, huile.

═══ STRUCTURE JSON EXACTE (rien avant ni après) ═══

{
  "score": <entier 0-100>,
  "hairType": "<classification ex: 4C · Crépu dense>",
  "porosity": "<Faible|Moyenne|Élevée>",
  "density": "<Clairsemée|Moyenne|Dense>",
  "synthesis": "<3-4 phrases>",
  "gauges": [
    { "label": "Hydratation", "value": <0-100>, "icon": "💧" },
    { "label": "Solidité",    "value": <0-100>, "icon": "💪" },
    { "label": "Brillance",   "value": <0-100>, "icon": "✨" }
  ],
  "problems": [
    { "sev": "<high|med|low>", "emoji": "<emoji>", "name": "<nom court>", "desc": "<1 phrase>" }
  ],
  "advice": [
    { "type": "<produit|soin|habitude>", "icon": "<emoji>", "t": "<titre>", "d": "<conseil>" }
  ],
  "routine": [
    { "t": "<nom>", "f": "<fréquence>", "d": "<instruction>" }
  ],
  "recommendedTags": ["<tag1>", "<tag2>"]
}

Retourne 2 à 5 problèmes, exactement 3 conseils, et 4 à 6 étapes de routine.`;

const QUESTIONNAIRE_KEYS = new Set([
  'lastWash', 'texture', 'porosityTest', 'mainConcern', 'recentStress',
]);

const QUESTIONNAIRE_VALUES: Record<string, Set<string>> = {
  lastWash: new Set(['today', '1-3d', '4-7d', 'over-week', 'unknown']),
  texture: new Set(['dry-rough', 'dry-soft', 'soft-supple', 'oily', 'brittle']),
  porosityTest: new Set(['sinks-fast', 'sinks-slow', 'floats', 'not-done']),
  mainConcern: new Set(['breakage', 'dryness', 'definition', 'growth', 'scalp', 'frizz', 'volume']),
  recentStress: new Set(['heat', 'color', 'relaxer', 'protective-style', 'none']),
};

const QUESTION_LABELS: Record<string, Record<string, string>> = {
  lastWash: {
    'today': "aujourd'hui", '1-3d': 'il y a 1 à 3 jours', '4-7d': 'il y a 4 à 7 jours',
    'over-week': "il y a plus d'une semaine", 'unknown': 'ne sait plus',
  },
  texture: {
    'dry-rough': 'sec et rêche', 'dry-soft': 'sec mais doux', 'soft-supple': 'souple et hydraté',
    'oily': 'gras / film de sébum', 'brittle': 'cassant et fragile',
  },
  porosityTest: {
    'sinks-fast': 'coule rapidement (porosité haute)', 'sinks-slow': 'coule lentement (porosité moyenne)',
    'floats': 'flotte (porosité faible)', 'not-done': 'test non réalisé',
  },
  mainConcern: {
    'breakage': 'casse', 'dryness': 'sécheresse', 'definition': 'manque de définition',
    'growth': 'pousse / longueur', 'scalp': 'cuir chevelu', 'frizz': 'frisottis', 'volume': 'volume',
  },
  recentStress: {
    'heat': 'chaleur', 'color': 'coloration', 'relaxer': 'défrisage',
    'protective-style': 'coiffure protectrice', 'none': 'aucune agression récente',
  },
};

/** Ne jamais logger de payloads santé / images en prod. */
function logCoachError(scope: string, status?: number, detail?: string) {
  const msg = detail ? String(detail).slice(0, 200) : 'error';
  console.error(`[coach] ${scope}`, status ?? '', msg);
}

function jsonResponse(body: Record<string, unknown>, req: Request, status = 200) {
  const cors = corsHeadersFor(req);
  if (req.headers.get('Origin') && !cors) {
    return new Response(JSON.stringify({ error: 'origin_not_allowed' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...(cors ?? {}), 'Content-Type': 'application/json' },
  });
}

function estimateBase64Bytes(b64: string): number {
  const len = b64.replace(/\s/g, '').length;
  return Math.floor(len * 0.75);
}

function sanitizeProfile(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== 'object') return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (!PROFILE_KEYS.has(k)) continue;
    if (typeof v !== 'string' && typeof v !== 'number') continue;
    const s = String(v).slice(0, 120);
    if (s) out[k] = s;
  }
  return out;
}

function sanitizeQuestionnaire(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== 'object') return {};
  const out: Record<string, string> = {};
  for (const key of QUESTIONNAIRE_KEYS) {
    const val = (raw as Record<string, unknown>)[key];
    if (typeof val !== 'string') continue;
    if (!QUESTIONNAIRE_VALUES[key]?.has(val)) continue;
    out[key] = val;
  }
  return out;
}

function buildProfileCtx(profile: Record<string, string>): string {
  const fields = [
    profile.hairType     && `Type déclaré : ${profile.hairType}`,
    profile.porosity     && `Porosité déclarée : ${profile.porosity}`,
    profile.density      && `Densité : ${profile.density}`,
    profile.length       && `Longueur : ${profile.length} cm`,
    profile.targetLength && `Objectif longueur : ${profile.targetLength} cm`,
    profile.routineType  && `Routine préférée : ${profile.routineType}`,
    profile.budget       && `Budget produits : ${profile.budget}`,
    profile.region       && `Région : ${profile.region}`,
  ].filter(Boolean);
  return fields.length > 0
    ? "\n\nProfil déclaré par l'utilisatrice :\n" + fields.map(f => `- ${f}`).join('\n')
    : '';
}

function buildQuestionnaireCtx(q: Record<string, string>): string {
  const lines: string[] = [];
  for (const key of QUESTIONNAIRE_KEYS) {
    const val = q[key];
    if (!val) continue;
    lines.push(`- ${key} : ${QUESTION_LABELS[key]?.[val] ?? val}`);
  }
  if (lines.length === 0) return '';
  return '\n\n=== Questionnaire utilisateur ===\n' + lines.join('\n');
}

function sanitizeMessages(raw: unknown): { role: string; content: string }[] {
  if (!Array.isArray(raw)) return [];
  const out: { role: string; content: string }[] = [];
  for (const m of raw.slice(-MAX_HISTORY)) {
    if (!m || typeof m !== 'object') continue;
    const role = (m as { role?: string }).role;
    const content = (m as { content?: string }).content;
    if (role !== 'user' && role !== 'assistant') continue;
    if (typeof content !== 'string' || !content.trim()) continue;
    out.push({ role, content: content.trim().slice(0, MAX_MESSAGE_CHARS) });
  }
  return out;
}

function normalizePhotos(body: Record<string, unknown>) {
  const list: { base64: string; mediaType: string; label: string }[] = [];

  if (Array.isArray(body.images)) {
    for (const p of body.images.slice(0, MAX_PHOTOS)) {
      if (!p || typeof p !== 'object') continue;
      const base64 = (p as { base64?: string }).base64;
      const mediaType = (p as { mediaType?: string }).mediaType ?? 'image/jpeg';
      const label = String((p as { label?: string }).label ?? 'Photo').slice(0, 40);
      if (typeof base64 !== 'string' || !base64) continue;
      list.push({ base64, mediaType: String(mediaType).slice(0, 32), label });
    }
  } else if (typeof body.imageBase64 === 'string' && body.imageBase64) {
    list.push({
      base64: body.imageBase64,
      mediaType: String(body.mediaType ?? 'image/jpeg').slice(0, 32),
      label: 'Photo',
    });
  }

  if (list.length === 0) return { error: 'Aucune photo valide.' };

  let totalBytes = 0;
  for (const p of list) {
    const bytes = estimateBase64Bytes(p.base64);
    if (bytes > MAX_IMAGE_BYTES) {
      return { error: `Image trop volumineuse (max ${Math.round(MAX_IMAGE_BYTES / 1024)} Ko par photo).` };
    }
    totalBytes += bytes;
  }
  if (totalBytes > MAX_TOTAL_IMAGE_BYTES) {
    return { error: 'Taille totale des photos trop élevée.' };
  }

  return { photos: list };
}

async function consumeQuota(
  supabaseUser: ReturnType<typeof createClient>,
  kind: 'chat' | 'analysis',
) {
  const { data, error } = await supabaseUser.rpc('coach_consume_quota', { p_kind: kind });
  if (error) {
    if (error.message?.includes('coach_consume_quota')) {
      return { ok: false, error: 'quota_unavailable', status: 503 };
    }
    return { ok: false, error: error.message, status: 500 };
  }
  const row = (data ?? {}) as { ok?: boolean; error?: string };
  if (!row.ok) {
    if (row.error === 'rate_limit') return { ok: false, error: 'rate_limit', status: 429 };
    if (row.error === 'not_authenticated') return { ok: false, error: 'not_authenticated', status: 401 };
    return { ok: false, error: row.error ?? 'quota_denied', status: 403 };
  }
  return { ok: true };
}

Deno.serve(async (req) => {
  const cors = corsHeadersFor(req);

  if (req.method === 'OPTIONS') {
    if (req.headers.get('Origin') && !cors) {
      return new Response('forbidden', { status: 403 });
    }
    return new Response('ok', { headers: cors ?? { 'Access-Control-Allow-Headers': CORS_ALLOW_HEADERS } });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, req, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');

  if (!supabaseUrl || !supabaseAnonKey) {
    return jsonResponse({ error: 'server_misconfigured' }, req, 500);
  }
  if (!apiKey) {
    return jsonResponse({ error: 'Clé API manquante' }, req, 500);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return jsonResponse({ error: 'not_authenticated' }, req, 401);
  }

  const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
  if (userError || !user) {
    return jsonResponse({ error: 'not_authenticated' }, req, 401);
  }

  let body: Record<string, unknown>;
  try {
    const raw = await req.text();
    if (raw.length > 8_000_000) {
      return jsonResponse({ error: 'payload_too_large' }, req, 413);
    }
    body = JSON.parse(raw);
  } catch {
    return jsonResponse({ error: 'invalid_json' }, req, 400);
  }

  const profile = sanitizeProfile(body.profile);
  if (JSON.stringify(profile).length > MAX_PROFILE_JSON) {
    return jsonResponse({ error: 'profile_too_large' }, req, 400);
  }

  try {
    // ── Mode analyse photo (vision) ─────────────────────────────────────
    if (body.images || body.imageBase64) {
      const quota = await consumeQuota(supabaseUser, 'analysis');
      if (!quota.ok) {
        return jsonResponse({ error: quota.error }, req, quota.status);
      }

      const normalized = normalizePhotos(body);
      if ('error' in normalized) {
        return jsonResponse({ error: normalized.error }, req, 400);
      }

      const questionnaire = sanitizeQuestionnaire(body.questionnaire);
      const photoList = normalized.photos!;

      const content: unknown[] = [];
      for (const photo of photoList) {
        content.push({ type: 'text', text: `📸 ${photo.label} :` });
        content.push({
          type: 'image',
          source: { type: 'base64', media_type: photo.mediaType, data: photo.base64 },
        });
      }

      const qctx = buildQuestionnaireCtx(questionnaire);
      content.push({
        type: 'text',
        text:
          `Analyse ${photoList.length > 1 ? `ces ${photoList.length} photos` : 'cette photo'} et retourne le JSON de diagnostic complet.` +
          (qctx ? `\n\n${qctx}` : ''),
      });

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1800,
          system: ANALYSIS_SYSTEM + buildProfileCtx(profile),
          messages: [{ role: 'user', content }],
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        logCoachError('anthropic_analysis', response.status, data?.error?.message);
        return jsonResponse({ error: data.error?.message ?? `Anthropic ${response.status}` }, req, 502);
      }

      const raw = data.content?.[0]?.text ?? '{}';
      const match = raw.match(/\{[\s\S]*\}/);
      let analysis: unknown;
      try {
        analysis = JSON.parse(match ? match[0] : raw);
      } catch {
        return jsonResponse({ error: 'invalid_analysis_json' }, req, 502);
      }

      return jsonResponse({ analysis }, req);
    }

    // ── Mode chat ───────────────────────────────────────────────────────
    const quota = await consumeQuota(supabaseUser, 'chat');
    if (!quota.ok) {
      return jsonResponse({ error: quota.error }, req, quota.status);
    }

    const messages = sanitizeMessages(body.messages);
    if (messages.length === 0) {
      messages.push({
        role: 'user',
        content: "Donne-moi un conseil capillaire personnalisé et motivant pour aujourd'hui, en 1 ou 2 phrases maximum.",
      });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 350,
        system: CHAT_SYSTEM + buildProfileCtx(profile),
        messages,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      logCoachError('anthropic_chat', response.status, data?.error?.message);
      return jsonResponse({ error: data.error?.message ?? `Anthropic ${response.status}` }, req, 502);
    }

    const advice = data.content?.[0]?.text ?? "Pense à hydrater tes longueurs aujourd'hui 💧";
    return jsonResponse({ advice }, req);

  } catch (err) {
    logCoachError('unhandled', 500, err instanceof Error ? err.message : 'internal');
    return jsonResponse({ error: 'internal_error' }, req, 500);
  }
});
