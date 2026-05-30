import { getDatabase } from '../db/database';
import { Achievement, AchievementContext } from '../types';

const ACHIEVEMENT_RULES: Record<string, (ctx: AchievementContext) => boolean> = {
  first_blood: (ctx) => ctx.totalBookmarks >= 1,
  collector: (ctx) => ctx.totalBookmarks >= 10,
  hoarder: (ctx) => ctx.totalBookmarks >= 50,
  librarian: (ctx) => ctx.totalBookmarks >= 100,
  beginner: (ctx) => ctx.totalRead >= 1,
  learner: (ctx) => ctx.totalRead >= 10,
  scholar: (ctx) => ctx.totalRead >= 50,
  streak_3: (ctx) => ctx.currentStreak >= 3,
  streak_7: (ctx) => ctx.currentStreak >= 7,
  streak_30: (ctx) => ctx.currentStreak >= 30,
  organizer: (ctx) => ctx.totalTags >= 5,
  note_taker: (ctx) => ctx.totalNotes >= 5,
  resurrector: (ctx) => ctx.totalRead >= 10,
};

export class AchievementService {
  async getAll(): Promise<Achievement[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>('SELECT * FROM achievements ORDER BY id');
    return rows.map((r) => ({
      id: r.id,
      achievementKey: r.achievement_key,
      title: r.title,
      description: r.description,
      iconName: r.icon_name,
      unlockedAt: r.unlocked_at,
    }));
  }

  async checkAndUnlock(context: AchievementContext): Promise<Achievement[]> {
    const db = await getDatabase();
    const all = await this.getAll();
    const unlocked: Achievement[] = [];
    const now = Date.now();

    for (const achievement of all) {
      if (achievement.unlockedAt) continue;

      const rule = ACHIEVEMENT_RULES[achievement.achievementKey];
      if (rule && rule(context)) {
        await db.runAsync(
          'UPDATE achievements SET unlocked_at = ? WHERE id = ?',
          now,
          achievement.id,
        );
        achievement.unlockedAt = now;
        unlocked.push(achievement);
      }
    }

    return unlocked;
  }

  async getContext(): Promise<AchievementContext> {
    const db = await getDatabase();

    const bookmarkRow = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM bookmarks',
    );
    const readRow = await db.getFirstAsync<{ count: number }>(
      "SELECT COUNT(*) as count FROM bookmarks WHERE learning_status = 'read'",
    );
    const tagRow = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM tags',
    );
    const noteRow = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM notes',
    );

    const streak = await this.calculateCurrentStreak();

    return {
      totalBookmarks: bookmarkRow?.count || 0,
      totalRead: readRow?.count || 0,
      currentStreak: streak,
      totalTags: tagRow?.count || 0,
      totalNotes: noteRow?.count || 0,
    };
  }

  private async calculateCurrentStreak(): Promise<number> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{ date: string }>(
      'SELECT date FROM daily_stats WHERE streak_eligible = 1 ORDER BY date DESC',
    );

    if (rows.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < rows.length; i++) {
      const expected = new Date(today);
      expected.setDate(expected.getDate() - streak);

      const dateStr = expected.toISOString().slice(0, 10);
      if (rows.some((r) => r.date === dateStr)) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }
}
