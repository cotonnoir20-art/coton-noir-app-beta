/** Anti-rafale côté client (complément au rate limit Supabase). */
const MIN_INTERVAL_MS = 1_500;
const COOLDOWN_AFTER_BURST_MS = 60_000;
const MAX_BURST = 5;

let attemptCount = 0;
let windowStart = 0;
let lastAttemptAt = 0;
let cooldownUntil = 0;

export function canAttemptAuth(now = Date.now()): { allowed: true } | { allowed: false; message: string } {
  if (now < cooldownUntil) {
    const sec = Math.ceil((cooldownUntil - now) / 1000);
    return {
      allowed: false,
      message: `Patiente ${sec} s avant une nouvelle tentative.`,
    };
  }
  if (now - lastAttemptAt < MIN_INTERVAL_MS) {
    return {
      allowed: false,
      message: 'Patiente une seconde avant de réessayer.',
    };
  }
  return { allowed: true };
}

export function recordAuthAttempt(success: boolean, now = Date.now()): void {
  lastAttemptAt = now;
  if (success) {
    attemptCount = 0;
    windowStart = now;
    cooldownUntil = 0;
    return;
  }
  if (now - windowStart > COOLDOWN_AFTER_BURST_MS) {
    attemptCount = 0;
    windowStart = now;
  }
  attemptCount += 1;
  if (attemptCount >= MAX_BURST) {
    cooldownUntil = now + COOLDOWN_AFTER_BURST_MS;
    attemptCount = 0;
  }
}
