import { getDatabase } from './database';

export async function seedData(): Promise<void> {
  const db = await getDatabase();

  await db.execAsync(`
    INSERT OR IGNORE INTO achievements (id, achievement_key, title, description, icon_name) VALUES
    ('1', 'first_blood', '初来乍到', '添加第 1 条收藏', 'star-outline'),
    ('2', 'collector', '收藏家', '累计收藏 10 条', 'bookmark'),
    ('3', 'hoarder', '囤积达人', '累计收藏 50 条', 'archive'),
    ('4', 'librarian', '图书管理员', '累计收藏 100 条', 'library'),
    ('5', 'beginner', '学海启航', '完成第 1 条收藏', 'check-circle'),
    ('6', 'learner', '学无止境', '累计完成 10 条', 'book-open'),
    ('7', 'scholar', '学霸附体', '累计完成 50 条', 'award'),
    ('8', 'streak_3', '三天打鱼', '连续 3 天有完成', 'flame'),
    ('9', 'streak_7', '一周之约', '连续 7 天有完成', 'trending-up'),
    ('10', 'streak_30', '月度之星', '连续 30 天有完成', 'star'),
    ('11', 'organizer', '整理癖', '创建 5 个标签', 'tag'),
    ('12', 'note_taker', '笔记达人', '写 5 条笔记', 'edit'),
    ('13', 'resurrector', '考古学家', '阅读 10 条通过擦亮发现的收藏', 'clock');

    INSERT OR IGNORE INTO user_settings (key, value) VALUES
    ('reminder_interval', '7'),
    ('resurface_daily_limit', '3'),
    ('resurface_max_per_item', '5');
  `);
}
