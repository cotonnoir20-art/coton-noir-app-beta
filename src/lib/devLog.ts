/** Logs réservés au développement — rien en production (build release). */
export const devLog = {
  warn(...args: unknown[]) {
    if (__DEV__) console.warn(...args);
  },
  log(...args: unknown[]) {
    if (__DEV__) console.log(...args);
  },
  error(...args: unknown[]) {
    if (__DEV__) console.error(...args);
  },
};
