// @ts-nocheck
// Edge Function — App Attest (iOS) + Play Integrity (Android)
// Complément serveur : ne remplace pas RLS / RPC security definer.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function randomChallenge(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ ok: false, error: 'unauthorized' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return json({ ok: false, error: 'unauthorized' }, 401);
    }

    const body = await req.json().catch(() => ({}));
    const action = String(body?.action ?? '');

    if (action === 'challenge') {
      const challenge = randomChallenge();
      // TODO: persister challenge (user_id, challenge, expires_at) en base avant prod
      return json({ ok: true, challenge, userId: user.id });
    }

    if (action === 'register') {
      const token = body?.token;
      const challenge = body?.challenge;
      if (!token || !challenge) {
        return json({ ok: false, error: 'missing_token_or_challenge' }, 400);
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
        }, 503);
      }

      return json({
        ok: true,
        registered: true,
        verified: false,
        message: 'Token reçu — validation serveur à activer (voir security-device-integrity.sql).',
      });
    }

    return json({ ok: false, error: 'unknown_action' }, 400);
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
});

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}
