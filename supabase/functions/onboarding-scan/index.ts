// @ts-nocheck
// Deno Edge Function — Scan onboarding (sans auth utilisateur, 1 photo, Haiku)

const CORS_ALLOW_HEADERS = 'authorization, x-client-info, apikey, content-type, x-onboarding-token';

function corsHeaders(origin: string | null): Record<string, string> {
  const base = { 'Access-Control-Allow-Headers': CORS_ALLOW_HEADERS };
  if (!origin) return base;
  // Mobile (pas d'Origin) ou dev local
  return {
    'Access-Control-Allow-Origin': '*',
    ...base,
  };
}

function jsonResponse(body: Record<string, unknown>, origin: string | null, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
  });
}

// ── Rate limit IP (in-memory, reset sur cold start) ─────────────────────────
const IP_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const IP_MAX = 3;
const ipMap = new Map<string, { count: number; since: number }>();

function checkIpRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipMap.get(ip);
  if (!entry || now - entry.since > IP_WINDOW_MS) {
    ipMap.set(ip, { count: 1, since: now });
    return true;
  }
  if (entry.count >= IP_MAX) return false;
  entry.count++;
  return true;
}

// ── Validation photo ─────────────────────────────────────────────────────────
const MAX_IMAGE_BYTES = 2_000_000;

function estimateBase64Bytes(b64: string): number {
  return Math.floor(b64.replace(/\s/g, '').length * 0.75);
}

// ── Prompt Haiku — analyse 1 photo + contexte onboarding ────────────────────
const SYSTEM = `Tu es une experte trichologue spécialisée en cheveux afro-texturés (types 3A–4C).
Tu analyses UNE photo de cheveux en la croisant avec le profil déclaré par l'utilisatrice.
Tu retournes UNIQUEMENT un objet JSON valide, sans texte avant ni après, sans markdown.

RÈGLES :
- Pondère ce que tu vois sur la photo (50 %) et les données déclarées (50 %).
- Si la photo est floue ou de mauvaise qualité, accorde plus de poids aux données déclarées.
- Sois précise mais encourageante — jamais condescendante.
- La synthesis doit faire 2 phrases maximum, en français naturel.
- Les highlights sont 3 constats courts (< 8 mots chacun).

JSON à retourner (rien d'autre) :
{
  "hairType": "<ex: 4A · Crépu dense>",
  "porosity": "<Faible|Moyenne|Élevée>",
  "score": <entier 0-100>,
  "synthesis": "<2 phrases>",
  "highlights": ["<constat 1>", "<constat 2>", "<constat 3>"]
}`;

function buildUserMessage(profile: Record<string, string>): string {
  const lines: string[] = ['Analyse cette photo de cheveux.'];
  if (profile.hairType)      lines.push(`Type déclaré : ${profile.hairType}`);
  if (profile.porosity)      lines.push(`Porosité déclarée : ${profile.porosity}`);
  if (profile.density)       lines.push(`Densité : ${profile.density}`);
  if (profile.objective)     lines.push(`Objectif : ${profile.objective}`);
  if (profile.problematics)  lines.push(`Problématiques : ${profile.problematics}`);
  return lines.join('\n');
}

// ── Handler principal ────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  const origin = req.headers.get('Origin');

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(origin) });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, origin, 405);
  }

  // Vérification token onboarding
  const expectedToken = Deno.env.get('ONBOARDING_SCAN_TOKEN');
  if (expectedToken) {
    const clientToken = req.headers.get('x-onboarding-token');
    if (clientToken !== expectedToken) {
      return jsonResponse({ error: 'unauthorized' }, origin, 401);
    }
  }

  // Rate limit IP
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('cf-connecting-ip') ??
    'unknown';
  if (!checkIpRateLimit(ip)) {
    return jsonResponse({ error: 'rate_limit', retryAfterMs: IP_WINDOW_MS }, origin, 429);
  }

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    return jsonResponse({ error: 'server_misconfigured' }, origin, 500);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'invalid_json' }, origin, 400);
  }

  // Validation photo
  const photoRaw = body.photo as { base64?: string; mimeType?: string } | undefined;
  if (!photoRaw?.base64 || typeof photoRaw.base64 !== 'string') {
    return jsonResponse({ error: 'photo_required' }, origin, 400);
  }
  if (estimateBase64Bytes(photoRaw.base64) > MAX_IMAGE_BYTES) {
    return jsonResponse({ error: 'photo_too_large' }, origin, 400);
  }
  const mimeType = typeof photoRaw.mimeType === 'string' ? photoRaw.mimeType : 'image/jpeg';

  // Profil onboarding (optionnel)
  const profileRaw = (body.profile ?? {}) as Record<string, unknown>;
  const ALLOWED_PROFILE_KEYS = new Set(['hairType', 'porosity', 'density', 'objective', 'problematics']);
  const profile: Record<string, string> = {};
  for (const [k, v] of Object.entries(profileRaw)) {
    if (!ALLOWED_PROFILE_KEYS.has(k)) continue;
    if (typeof v === 'string') profile[k] = v.slice(0, 120);
    else if (Array.isArray(v)) profile[k] = v.map(String).slice(0, 5).join(', ');
  }

  // Appel Haiku 4.5
  const anthropicBody = {
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 400,
    system: SYSTEM,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mimeType, data: photoRaw.base64 },
          },
          {
            type: 'text',
            text: buildUserMessage(profile),
          },
        ],
      },
    ],
  };

  let raw: string;
  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify(anthropicBody),
    });
    if (!resp.ok) {
      const err = await resp.text().catch(() => '');
      console.error('[onboarding-scan] Anthropic error', resp.status, err.slice(0, 200));
      return jsonResponse({ error: 'ai_error' }, origin, 502);
    }
    const data = await resp.json();
    raw = data?.content?.[0]?.text ?? '';
  } catch (e) {
    console.error('[onboarding-scan] fetch error', String(e).slice(0, 200));
    return jsonResponse({ error: 'ai_unavailable' }, origin, 503);
  }

  // Parse JSON
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error('[onboarding-scan] no JSON in response', raw.slice(0, 300));
    return jsonResponse({ error: 'parse_error' }, origin, 502);
  }
  let result: Record<string, unknown>;
  try {
    result = JSON.parse(jsonMatch[0]);
  } catch {
    return jsonResponse({ error: 'parse_error' }, origin, 502);
  }

  // Validation + sanitisation de la réponse
  const hairType = typeof result.hairType === 'string' ? result.hairType.slice(0, 60) : '—';
  const porosity = typeof result.porosity === 'string' ? result.porosity.slice(0, 20) : '—';
  const score = typeof result.score === 'number' ? Math.max(0, Math.min(100, Math.round(result.score))) : 50;
  const synthesis = typeof result.synthesis === 'string' ? result.synthesis.slice(0, 300) : '';
  const highlights = Array.isArray(result.highlights)
    ? result.highlights.slice(0, 3).map(h => String(h).slice(0, 80))
    : [];

  return jsonResponse({ hairType, porosity, score, synthesis, highlights }, origin);
});
