import type { GrowthEntry, HairProfile } from '../context/AppContext';
import type { HairAnalysis } from '../services/coachApi';
import type { RoutineType } from '../data/routines';
import { ROUTINE_TYPES } from '../data/routines';
import type { BlackCottonMood, TriggerContext } from '../components/blackCotton/types';
import { defaultActionForTrigger } from './bcCoachActions';

function actionCtx(trigger: Parameters<typeof defaultActionForTrigger>[0]): Pick<
  TriggerContext,
  'actionLabel' | 'actionRoute'
> {
  const a = defaultActionForTrigger(trigger);
  return a ? { actionLabel: a.label, actionRoute: a.route } : {};
}

/** Conseil après validation routine (streak, type, profil). */
export function buildPostRoutineContext(args: {
  streak: number;
  routineType: RoutineType;
  profile: HairProfile;
  isFirstRoutine: boolean;
}): TriggerContext {
  const label = ROUTINE_TYPES[args.routineType].label;
  const porosity = args.profile.porosity?.trim();

  let text = 'Routine validée ! 💜';
  let subtext = `Bravo pour ta ${label.toLowerCase()} aujourd'hui.`;
  let mood: BlackCottonMood = 'encouraging';

  if (args.streak >= 7) {
    text = `${args.streak} jours de régularité 🔥`;
    subtext = 'Ta constance fait la différence. Garde ce rythme cette semaine.';
    mood = 'proud';
  } else if (args.routineType === 'washday') {
    text = 'Wash day bien noté 🚿';
    subtext = 'Hydrate et scelle bien — tes boucles vont te remercier.';
    mood = 'coaching';
  } else if (porosity === 'Élevée') {
    subtext = 'Porosité haute : pense scellage (crème + huile) après ton leave-in.';
    mood = 'coaching';
  }

  return {
    text,
    subtext,
    mood,
    displayMode: 'toast',
    ...actionCtx('post_routine'),
  };
}

/** Suivi des recommandations après analyse. */
export function buildPostAnalysisContext(analysis: HairAnalysis): TriggerContext {
  const topProblem = analysis.problems?.[0]?.name;
  const routineStep = analysis.routine?.[0]?.t;

  return {
    text: 'Diagnostic enregistré ✨',
    subtext: topProblem
      ? `Priorité : ${topProblem}. ${routineStep ? `Commence par « ${routineStep} ».` : 'Adapte ta routine quotidienne.'}`
      : 'Adapte ta routine pour appliquer les conseils Black Cotton.',
    mood: 'coaching',
    displayMode: 'popup',
    actionLabel: 'Adapter ma routine',
    actionRoute: '/routine-plan',
  };
}

/** Moyenne cm sur la date la plus récente de l'historique. */
export function avgLatestGrowthCm(history: GrowthEntry[]): number | null {
  if (history.length === 0) return null;
  const latestDate = [...history].map(e => e.date).sort().pop()!;
  const vals = history.filter(e => e.date === latestDate).map(e => e.cm);
  if (vals.length === 0) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

/** Encouragement après une mesure de longueur. */
export function buildPostMeasurementContext(args: {
  streak: number;
  deltaCm: number | null;
  currentCm: number | null;
}): TriggerContext {
  if (args.deltaCm != null && args.deltaCm > 0.2) {
    return {
      text: `+${args.deltaCm.toFixed(1)} cm depuis ta dernière mesure 📏`,
      subtext: 'Ta pousse avance — continue ta routine et note tes wash days.',
      mood: 'celebrating',
      displayMode: 'popup',
      ...actionCtx('post_measurement'),
    };
  }

  if (args.currentCm != null) {
    return {
      text: 'Mesure enregistrée 📏',
      subtext: `${args.currentCm.toFixed(1)} cm notés. Refais un point dans ~4 semaines pour suivre l'évolution.`,
      mood: 'encouraging',
      displayMode: 'toast',
      ...actionCtx('post_measurement'),
    };
  }

  return {
    text: 'Première mesure notée 🌱',
    subtext: 'Tu as une base pour suivre ta pousse. Prochaine mesure dans 3–4 semaines.',
    mood: 'happy',
    displayMode: 'popup',
    ...actionCtx('post_measurement'),
  };
}
