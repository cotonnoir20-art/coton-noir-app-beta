/**
 * Système couleur Coton Noir — règle 60 / 30 / 10
 *
 *   60% NOIR + NEUTRES    → structure, calme, élégance
 *   30% AMBRE             → identité signature, valeur, progression, motivation
 *   10% ROSE              → émotion pure (favoris, likes, célébrations) — JAMAIS structurel
 *
 * Sémantique stricte : chaque couleur a UN rôle unique, jamais redondant.
 * Voir le tableau de rôles ci-dessous avant tout nouvel usage.
 */
export const Colors = {

  // ── PRIMARY — NOIR ────────────────────────────────────────────────────
  // RÔLE : action & autorité.
  // USAGES : TOUS les CTAs primaires, titres, nav active, badge coins,
  // card-on-image, icônes d'action.
  ink:      '#1A1209',   // noir chaud (quasi-noir espresso)
  inkSoft:  '#2C1F14',   // variante légèrement plus douce

  // ── SIGNATURE — AMBRE ─────────────────────────────────────────────────
  // RÔLE : identité de la marque, valeur, motivation.
  // USAGES : CotonCoins, jauges de progression, badges "premium/featured",
  // niveau atteint, étoile de note, accent informatif.
  // INTERDITS : pas de CTA structurel (réservé au noir).
  amber:       '#F2A04A',  // orange chaud principal
  amberDark:   '#D4822A',  // orange foncé (hover, actif, accent prix)
  amberInk:    '#7A4E0A',  // texte ambre foncé sur fond amberPowder/Light
  amberLight:  '#FDE8C8',  // fond doux ambre (cards "valeur", pills actives)
  amberPowder: '#FDF1E2',  // ambre poudré ultra dilué — fond hero / sections "warm"

  // ── ACCENT ÉMOTION — ROSE ─────────────────────────────────────────────
  // RÔLE : émotion pure, féminité, coup de cœur.
  // USAGES : cœur favori actif, badge "communauté", célébration de niveau,
  // sélection de date calendrier, dot "soin programmé", offBadge promo.
  // INTERDITS : pas de CTA, pas de "Voir tout", pas de bouton structurel.
  rose:  '#D4748C',  // rose vif (favori, sélection, promo)
  blush: '#F2C4CC',  // fond doux rose (badges affectifs, tags)

  // ── SUCCÈS — SAGE ─────────────────────────────────────────────────────
  // RÔLE : validation, état "validé/sain" UNIQUEMENT.
  // USAGES : check routine validée, score santé > 55%, badge débloqué.
  // INTERDITS : ne pas l'utiliser comme "vert d'envie" générique.
  sage:       '#8BAF7A',  // vert doux (badges, validations)
  sageBright: '#3DDC84',  // vert "néon doux" — réservé donut score >= 55
  sageDark:   '#3A6B2A',  // texte vert foncé sur fond sageLight
  sageLight:  '#E2EDD8',  // fond doux vert

  // ── POUSSE — BLEU ─────────────────────────────────────────────────────
  // RÔLE : progression longueur (delta mensuel, chip anneau accueil).
  growth:      '#2563EB',  // accent pousse
  growthDark:  '#1E40AF',  // texte sur fond growthLight
  growthLight: '#DBEAFE',  // fond chip pousse

  // ── ALERTE — ROUGE ────────────────────────────────────────────────────
  // RÔLE : urgence ou suppression destructive UNIQUEMENT.
  // USAGES : score santé < 30, suppression définitive, notification critique,
  // streak en danger (badge timer).
  // INTERDITS : ne JAMAIS l'utiliser pour une promo (c'est le rôle du rose).
  alert:      '#E53935',
  alertDark:  '#7A1F1F',  // texte rouge foncé sur fond alertLight
  alertLight: '#FEE2E2',

  // ── NEUTRES ───────────────────────────────────────────────────────────
  bg:       '#FDF8F4',  // fond global app (blanc cassé chaud)
  bgShell:  '#EDE8E2',  // fond légèrement plus sombre
  surface:  '#FFFFFF',  // fond carte / modale
  cream:    '#FAF3EC',  // fond input, sections internes
  border:   '#E8DDD5',  // bordures, séparateurs
  warmGray: '#7A6E66',  // textes secondaires, placeholders
  white:    '#FFFFFF',
};
