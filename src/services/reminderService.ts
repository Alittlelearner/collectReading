import { getDatabase } from '../db/database';

type NotificationsModule = typeof import('expo-notifications');

let notificationsModule: NotificationsModule | null | undefined;
let notificationListenerReady = false;

async function getNotifications(): Promise<NotificationsModule | null> {
  if (notificationsModule !== undefined) {
    return notificationsModule;
  }

  try {
    notificationsModule = await import('expo-notifications');
    notificationsModule.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    if (!notificationListenerReady) {
      notificationsModule.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        if (data?.type === 'reminder' && data?.bookmarkId) {
          console.log('[Notification] 点击了阅读提醒，收藏 ID:', data.bookmarkId);
        }
      });
      notificationListenerReady = true;
    }
  } catch (error) {
    notificationsModule = null;
    console.warn('[Notification] 当前运行环境不支持通知功能。', error);
  }

  return notificationsModule;
}

interface ReminderConfig {
  enabled: boolean;
  intervalDays: number;
  dailyLimit: number;
}

export class ReminderService {
  async requestPermission(): Promise<boolean> {
    const Notifications = await getNotifications();
    if (!Notifications) {
      return false;
    }

    const result = await Notifications.requestPermissionsAsync() as any;
    return result.status === 'granted' || result.granted === true;
  }

  async scheduleUnreadReminders(config: ReminderConfig): Promise<void> {
    const Notifications = await getNotifications();
    if (!Notifications) {
      return;
    }

    if (!config.enabled) {
      await Notifications.cancelAllScheduledNotificationsAsync();
      return;
    }

    const db = await getDatabase();
    const daysMs = config.intervalDays * 86400000;
    const cutoffTime = Date.now() - daysMs;

    const rows = await db.getAllAsync<any>(
      `SELECT * FROM bookmarks 
       WHERE learning_status = 'unread' 
         AND created_at < ?
       ORDER BY created_at ASC
       LIMIT ?`,
      cutoffTime,
      config.dailyLimit,
    );

    await Notifications.cancelAllScheduledNotificationsAsync();

    for (const row of rows) {
      await this.scheduleNotification(
        row.id,
        row.title || '待阅读收藏',
        config.intervalDays,
      );
    }
  }

  private async scheduleNotification(
    id: string,
    title: string,
    intervalDays: number,
  ): Promise<void> {
    const Notifications = await getNotifications();
    if (!Notifications) {
      return;
    }

    const seconds = intervalDays * 24 * 60 * 60;

    await Notifications.scheduleNotificationAsync({
      identifier: `reminder-${id}`,
      content: {
        title: '📚 阅读提醒',
        subtitle: title.length > 50 ? title.slice(0, 47) + '...' : title,
        body: '这条收藏已经放了一段时间，现在读掉它吧。',
        data: { bookmarkId: id, type: 'reminder' },
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        type: 'time-interval',
        seconds,
        repeats: true,
      } as any,
    });
  }

  async cancelReminder(bookmarkId: string): Promise<void> {
    const Notifications = await getNotifications();
    if (!Notifications) {
      return;
    }

    await Notifications.cancelScheduledNotificationAsync(`reminder-${bookmarkId}`);
  }

  async getPermissionsStatus(): Promise<'granted' | 'denied' | 'undetermined'> {
    const Notifications = await getNotifications();
    if (!Notifications) {
      return 'undetermined';
    }

    const result = await Notifications.getPermissionsAsync() as any;
    return result.status || 'undetermined';
  }

  async getAllScheduled(): Promise<unknown[]> {
    const Notifications = await getNotifications();
    if (!Notifications) {
      return [];
    }

    return await Notifications.getAllScheduledNotificationsAsync();
  }
}
