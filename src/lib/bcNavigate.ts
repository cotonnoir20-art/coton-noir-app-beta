import type { Router } from 'expo-router';
import type { BCActionRoute, BCMessage, BlackCottonTrigger } from '../components/blackCotton/types';

export function navigateBcAction(
  router: Router,
  msg: Pick<BCMessage, 'actionRoute' | 'onAction' | 'trigger'>,
): boolean {
  if (msg.onAction) {
    msg.onAction();
    return true;
  }
  if (!msg.actionRoute) return false;

  if (
    msg.trigger === 'post_analysis' ||
    msg.actionRoute === '/routine-plan'
  ) {
    router.push({
      pathname: '/routine-plan',
      params: { kind: 'daily', source: 'analysis' },
    });
    return true;
  }

  router.push(msg.actionRoute as BCActionRoute);
  return true;
}
