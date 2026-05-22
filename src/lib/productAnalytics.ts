import { supabase } from './supabase';

export type ProductEventName =
  | 'onboarding_completed'
  | 'first_routine_validated'
  | 'first_measurement'
  | 'routine_validated'
  | 'washday_planned'
  | 'washday_checklist_pct'
  | 'measurement_saved'
  | 'growth_goal_set'
  | 'analysis_completed'
  | 'analysis_routine_adopted'
  | 'product_added_to_routine'
  | 'product_tested_evolution_saved'
  | 'recipe_added_to_routine'
  | 'similar_profiles_reco_viewed'
  | 'reward_redeemed'
  | 'level_up'
  | 'achievement_unlocked'
  | 'community_post_published'
  | 'challenge_joined'
  | 'invite_shared'
  | 'product_review_saved'
  | 'premium_paywall_shown'
  | 'premium_trial_started'
  | 'premium_trial_first_value';

export type ProductEventPayload = Record<string, string | number | boolean | null>;

/**
 * Événements produit (KPI J1 / J7) — insert best-effort, ne bloque jamais l’UI.
 */
export async function trackProductEvent(
  eventName: ProductEventName,
  payload: ProductEventPayload = {},
): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const userCreatedAt = user.created_at ?? null;

    const { error } = await supabase.from('product_events').insert({
      user_id:         user.id,
      event_name:      eventName,
      user_created_at: userCreatedAt,
      payload,
    });

    if (error && __DEV__) {
      console.warn('[productAnalytics]', eventName, error.message);
    }
  } catch (e) {
    if (__DEV__) {
      console.warn('[productAnalytics]', eventName, e);
    }
  }
}
