/** Aligné avec la politique recommandée Supabase (Dashboard → Auth → Settings). */
export const PASSWORD_MIN_LENGTH = 8;

const HAS_LOWER = /[a-z]/;
const HAS_UPPER = /[A-Z]/;
const HAS_DIGIT = /[0-9]/;
const HAS_SYMBOL = /[^A-Za-z0-9]/;

export const PASSWORD_POLICY_HINT =
  `Au moins ${PASSWORD_MIN_LENGTH} caractères, avec une majuscule, une minuscule, un chiffre et un symbole.`;

export type PasswordValidationResult =
  | { ok: true }
  | { ok: false; message: string };

export function validatePassword(password: string): PasswordValidationResult {
  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    return {
      ok: false,
      message: `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LENGTH} caractères.`,
    };
  }
  if (!HAS_LOWER.test(password)) {
    return { ok: false, message: 'Ajoute au moins une lettre minuscule.' };
  }
  if (!HAS_UPPER.test(password)) {
    return { ok: false, message: 'Ajoute au moins une lettre majuscule.' };
  }
  if (!HAS_DIGIT.test(password)) {
    return { ok: false, message: 'Ajoute au moins un chiffre.' };
  }
  if (!HAS_SYMBOL.test(password)) {
    return { ok: false, message: 'Ajoute au moins un symbole (!@#$…).' };
  }
  return { ok: true };
}

/** Messages utilisateur pour erreurs Auth Supabase (rate limit, politique, etc.). */
export function mapSupabaseAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('rate limit') || m.includes('too many requests') || m.includes('email rate limit')) {
    return 'Trop de tentatives. Attends quelques minutes avant de réessayer.';
  }
  if (
    m.includes('password should be') ||
    m.includes('weak password') ||
    m.includes('password is too weak') ||
    m.includes('at least')
  ) {
    return PASSWORD_POLICY_HINT;
  }
  if (m.includes('invalid login credentials') || m.includes('invalid credentials')) {
    return 'Email ou mot de passe incorrect.';
  }
  return message;
}
