import { Platform } from 'react-native';
import type {
  NotificationBehavior,
  NotificationRequestInput,
  NotificationResponse,
} from 'expo-notifications';
import { isWebPlatform } from './webStaging';

/** expo-notifications : iOS / Android uniquement (pas web / PWA). */
export function isNativeNotificationsSupported(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

type ExpoNotificationsModule = typeof import('expo-notifications');

async function loadNotifications(): Promise<ExpoNotificationsModule | null> {
  if (!isNativeNotificationsSupported() || isWebPlatform()) return null;
  try {
    return await import('expo-notifications');
  } catch {
    return null;
  }
}

export async function safeGetLastNotificationResponseAsync(): Promise<NotificationResponse | null> {
  const Notifications = await loadNotifications();
  if (!Notifications) return null;
  try {
    return await Notifications.getLastNotificationResponseAsync();
  } catch {
    return null;
  }
}

export async function safeAddNotificationResponseListener(
  handler: (response: NotificationResponse) => void,
): Promise<{ remove: () => void } | null> {
  const Notifications = await loadNotifications();
  if (!Notifications) return null;
  try {
    return Notifications.addNotificationResponseReceivedListener(handler);
  } catch {
    return null;
  }
}

export async function safeSetupForegroundNotificationHandler(): Promise<void> {
  const Notifications = await loadNotifications();
  if (!Notifications) return;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async (): Promise<NotificationBehavior> => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch {
    /* ignore */
  }
}

export async function safeGetNotificationPermissions(): Promise<boolean> {
  const Notifications = await loadNotifications();
  if (!Notifications) return false;
  try {
    const settings = await Notifications.getPermissionsAsync();
    if (settings.granted) return true;
    if (settings.canAskAgain === false) return false;
    const req = await Notifications.requestPermissionsAsync();
    return req.granted;
  } catch {
    return false;
  }
}

export async function safeCancelScheduledNotification(id: string): Promise<void> {
  const Notifications = await loadNotifications();
  if (!Notifications) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    /* ignore */
  }
}

export async function safeScheduleNotification(
  request: NotificationRequestInput,
): Promise<string | null> {
  const Notifications = await loadNotifications();
  if (!Notifications) return null;
  try {
    return await Notifications.scheduleNotificationAsync(request);
  } catch {
    return null;
  }
}
