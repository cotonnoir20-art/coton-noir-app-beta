import type { RoutineType } from '../data/routines';

export type NotificationNavPayload = {
  kind?: string;
  deeplink?: string;
  routine?: string;
  routineType?: string;
};

const ROUTINE_TYPES = new Set<RoutineType>(['daily', 'night', 'washday']);

function parseRoutineType(data: NotificationNavPayload): RoutineType {
  const raw = data.routine ?? data.routineType;
  if (typeof raw === 'string' && ROUTINE_TYPES.has(raw as RoutineType)) {
    return raw as RoutineType;
  }
  if (data.kind === 'routine-reminder' && data.routine === 'night') return 'night';
  return 'daily';
}

/**
 * Route Expo Router pour une notif (coach streak, rappel profil…).
 */
export function notificationToRoute(data: NotificationNavPayload): {
  pathname: string;
  params?: { routine: RoutineType };
} | null {
  const kind = data.kind;
  const deeplink = typeof data.deeplink === 'string' ? data.deeplink : '';

  if (kind === 'washday-reminder' || deeplink.includes('/washday')) {
    return { pathname: '/washday' };
  }

  if (kind === 'growth-monthly' || deeplink.includes('/hair-length')) {
    return { pathname: '/hair-length' };
  }

  if (kind === 'washday-growth' || deeplink.includes('/growth')) {
    return { pathname: '/growth' };
  }

  if (
    kind === 'daily-coach' ||
    kind === 'routine-reminder' ||
    deeplink.includes('/routine')
  ) {
    return {
      pathname: '/(tabs)/routine',
      params: { routine: parseRoutineType(data) },
    };
  }

  return null;
}
