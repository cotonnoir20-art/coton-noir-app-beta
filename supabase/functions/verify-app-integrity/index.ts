// @ts-nocheck
// Edge Function — App Attest (iOS) + Play Integrity (Android)
// Complément serveur : ne remplace pas RLS / RPC security definer.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const CORS_ALLOW_HEADERS = 'authorization, x-client-info, apikey, content-type';

/** Origines web autorisées (virgules). Ex. https://coton-noir-app.vercel.app,http://localhost:8081 */
function getAllowedOrigins(): string[] {
  const raw = Deno.env.get('INTEGRITY_ALLOWED_ORIGINS') ?? '';
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

function randomChallenge(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

Deno.serve(async (req: Request) => {
  const cors = corsHeadersFor(req);

  if (req.method === 'OPTIONS') {
    if (req.headers.get('Origin') && !cors) {
      return new Response('forbidden', { status: 403 });
    }
    return new Response('ok', {
      headers: cors ?? { 'Access-Control-Allow-Headers': CORS_ALLOW_HEADERS },
    });
  }

  try {
    if (req.headers.get('Origin') && !cors) {
      return json({ ok: false, error: 'origin_not_allowed' }, req, 403);
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ ok: false, error: 'unauthorized' }, req, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return json({ ok: false, error: 'unauthorized' }, req, 401);
    }

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action ?? '');

    if (action === 'challenge') {
      const challenge = randomChallenge();
      // TODO: persister challenge (user_id, challenge, expires_at) en base avant prod
      return json({ ok: true, challenge, userId: user.id }, req);
    }

    if (action === 'register') {
      const token = body?.token;
      const challenge = body?.challenge;
      if (!token || !challenge) {
        return json({ ok: false, error: 'missing_token_or_challenge' }, req, 400);
      }

      // TODO prod :
      // • Android : décrypter le verdict Play Integrity (Google API) avec le cloud project
      // • iOS : valider attestationObject / assertion (App Attest, doc Apple)
      // • Refuser si appRecognitionVerdict != PLAY_RECOGNIZED / app non reconnue
      // • Lier device_id + user_id ; optionnel : flag profiles.device_integrity_ok

      const enforce = Deno.env.get('INTEGRITY_ENFORCE_SERVER') === 'true';
      if (enforce) {
        return json({
          ok: false,
          error: 'server_verification_not_configured',
          hint: 'Configure Play Integrity API + App Attest verification before enforcing.',
        }, req, 503);
      }

      return json({
        ok: true,
        registered: true,
        verified: false,
        message: 'Token reçu — validation serveur à activer (voir security-device-integrity.sql).',
      }, req);
    }

    return json({ ok: false, error: 'unknown_action' }, req, 400);
  } catch (e) {
    return json({ ok: false, error: String(e) }, req, 500);
  }
});

function json(payload: unknown, req: Request, status = 200): Response {
  const cors = corsHeadersFor(req);
  if (req.headers.get('Origin') && !cors) {
    return new Response(JSON.stringify({ ok: false, error: 'origin_not_allowed' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...(cors ?? {}), 'Content-Type': 'application/json' },
  });
}
