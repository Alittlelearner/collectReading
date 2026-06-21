"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReminderService = void 0;
const Notifications = __importStar(require("expo-notifications"));
const database_1 = require("../db/database");
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});
class ReminderService {
    async requestPermission() {
        const result = await Notifications.requestPermissionsAsync();
        return result.status === 'granted' || result.granted === true;
    }
    async scheduleUnreadReminders(config) {
        if (!config.enabled) {
            await Notifications.cancelAllScheduledNotificationsAsync();
            return;
        }
        const db = await (0, database_1.getDatabase)();
        const daysMs = config.intervalDays * 86400000;
        const cutoffTime = Date.now() - daysMs;
        const rows = await db.getAllAsync(`SELECT * FROM bookmarks 
       WHERE learning_status = 'unread' 
         AND created_at < ?
       ORDER BY created_at ASC
       LIMIT ?`, cutoffTime, config.dailyLimit);
        await Notifications.cancelAllScheduledNotificationsAsync();
        for (const row of rows) {
            await this.scheduleNotification(row.id, row.title || '待阅读收藏', config.intervalDays);
        }
    }
    async scheduleNotification(id, title, intervalDays) {
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
            },
        });
    }
    async cancelReminder(bookmarkId) {
        await Notifications.cancelScheduledNotificationAsync(`reminder-${bookmarkId}`);
    }
    async getPermissionsStatus() {
        const result = await Notifications.getPermissionsAsync();
        return result.status || 'undetermined';
    }
    async getAllScheduled() {
        return await Notifications.getAllScheduledNotificationsAsync();
    }
}
exports.ReminderService = ReminderService;
Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data;
    if (data?.type === 'reminder' && data?.bookmarkId) {
        console.log('[Notification] 点击了阅读提醒，收藏 ID:', data.bookmarkId);
    }
});
