"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatsService = void 0;
const database_1 = require("../db/database");
class StatsService {
    async getDailyStats(days = 30) {
        const db = await (0, database_1.getDatabase)();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        const rows = await db.getAllAsync('SELECT * FROM daily_stats WHERE date >= ? ORDER BY date ASC', startDate.toISOString().slice(0, 10));
        return rows.map((r) => ({
            date: r.date,
            readCount: r.read_count,
            addedCount: r.added_count,
            streakEligible: r.streak_eligible,
        }));
    }
    async getSummary() {
        const db = await (0, database_1.getDatabase)();
        const totalRow = await db.getFirstAsync('SELECT COUNT(*) as count FROM bookmarks');
        const readRow = await db.getFirstAsync("SELECT COUNT(*) as count FROM bookmarks WHERE learning_status = 'read'");
        const totalBookmarks = totalRow?.count || 0;
        const totalRead = readRow?.count || 0;
        const readRate = totalBookmarks > 0 ? totalRead / totalBookmarks : 0;
        const today = new Date().toISOString().slice(0, 10);
        const todayRow = await db.getFirstAsync("SELECT COUNT(*) as count FROM bookmarks WHERE learning_status = 'read' AND date(read_at / 1000, 'unixepoch') = ?", today);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const weeklyRow = await db.getFirstAsync("SELECT COUNT(*) as count FROM bookmarks WHERE learning_status = 'read' AND read_at >= ?", weekAgo.getTime());
        const monthAgo = new Date();
        monthAgo.setDate(monthAgo.getDate() - 30);
        const monthlyRow = await db.getFirstAsync("SELECT COUNT(*) as count FROM bookmarks WHERE learning_status = 'read' AND read_at >= ?", monthAgo.getTime());
        const currentStreak = await this.calculateCurrentStreak();
        const longestStreak = await this.calculateLongestStreak();
        return {
            totalBookmarks,
            totalRead,
            readRate: Math.round(readRate * 100) / 100,
            currentStreak,
            longestStreak,
            todayRead: todayRow?.count || 0,
            weeklyRead: weeklyRow?.count || 0,
            monthlyRead: monthlyRow?.count || 0,
        };
    }
    async recordRead() {
        const db = await (0, database_1.getDatabase)();
        const today = new Date().toISOString().slice(0, 10);
        await db.runAsync(`INSERT INTO daily_stats (date, read_count, added_count, streak_eligible)
       VALUES (?, 1, 0, 1)
       ON CONFLICT(date) DO UPDATE SET
         read_count = read_count + 1,
         streak_eligible = 1`, today);
    }
    async recordAddition() {
        const db = await (0, database_1.getDatabase)();
        const today = new Date().toISOString().slice(0, 10);
        await db.runAsync(`INSERT INTO daily_stats (date, read_count, added_count, streak_eligible)
       VALUES (?, 0, 1, 0)
       ON CONFLICT(date) DO UPDATE SET added_count = added_count + 1`, today);
    }
    async calculateCurrentStreak() {
        const db = await (0, database_1.getDatabase)();
        const rows = await db.getAllAsync('SELECT date FROM daily_stats WHERE streak_eligible = 1 ORDER BY date DESC');
        if (rows.length === 0)
            return 0;
        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dateSet = new Set(rows.map((r) => r.date));
        const checkDate = new Date(today);
        if (!dateSet.has(checkDate.toISOString().slice(0, 10))) {
            checkDate.setDate(checkDate.getDate() - 1);
        }
        for (let i = 0; i < 365; i++) {
            const dateStr = checkDate.toISOString().slice(0, 10);
            if (dateSet.has(dateStr)) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            }
            else {
                break;
            }
        }
        return streak;
    }
    async calculateLongestStreak() {
        const db = await (0, database_1.getDatabase)();
        const rows = await db.getAllAsync('SELECT date FROM daily_stats WHERE streak_eligible = 1 ORDER BY date ASC');
        if (rows.length === 0)
            return 0;
        const dateSet = new Set(rows.map((r) => r.date));
        let longest = 0;
        let current = 0;
        let prevDate = null;
        for (const row of rows) {
            const date = new Date(row.date + 'T00:00:00');
            if (prevDate) {
                const diff = (date.getTime() - prevDate.getTime()) / 86400000;
                if (diff === 1) {
                    current++;
                }
                else {
                    longest = Math.max(longest, current);
                    current = 1;
                }
            }
            else {
                current = 1;
            }
            prevDate = date;
        }
        longest = Math.max(longest, current);
        return longest;
    }
}
exports.StatsService = StatsService;
