import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import {
  isNativeNotificationsSupported,
  safeAddNotificationResponseListener,
  safeGetLastNotificationResponseAsync,
} from '../lib/notificationsPlatform';
import {
  notificationToRoute,
  type NotificationNavPayload,
} from '../lib/notificationNavigation';

function handlePayload(
  router: ReturnType<typeof useRouter>,
  data: NotificationNavPayload | undefined,
) {
  if (!data) return;
  const route = notificationToRoute(data);
  if (!route) return;
  router.push({
    pathname: route.pathname as any,
    params: route.params as any,
  });
}

/**
 * Ouvre Routine au tap sur une notif locale (iOS / Android uniquement).
 */
export function NotificationDeepLinkHandler() {
  const router = useRouter();

  useEffect(() => {
    if (!isNativeNotificationsSupported()) return;

    let sub: { remove: () => void } | null = null;
    let cancelled = false;

    (async () => {
      const last = await safeGetLastNotificationResponseAsync();
      if (!cancelled && last) {
        handlePayload(
          router,
          last.notification.request.content.data as NotificationNavPayload,
        );
      }

      sub = await safeAddNotificationResponseListener(response => {
        handlePayload(
          router,
          response.notification.request.content.data as NotificationNavPayload,
        );
      });
    })();

    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [router]);

  return null;
}
