/**
 * CSP pour export web statique (+html.tsx).
 * Expo / RN web requiert encore 'unsafe-inline' (styles) ; pas d’eval en prod.
 */
export function buildWebContentSecurityPolicy(): string {
  const supabaseHost = tryGetSupabaseHost();
  const connectHosts = [
    "'self'",
    'https://*.supabase.co',
    'wss://*.supabase.co',
    supabaseHost,
  ].filter(Boolean);

  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "form-action 'self'",
    `script-src 'self' 'unsafe-inline'${__DEV__ ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src ${connectHosts.join(' ')}`,
    "media-src 'self' blob:",
    "worker-src 'self' blob:",
  ];

  return directives.join('; ');
}

function tryGetSupabaseHost(): string | null {
  try {
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
    if (!url) return null;
    const host = new URL(url).origin;
    return host;
  } catch {
    return null;
  }
}
