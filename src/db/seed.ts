import { getDatabase } from './database';
import { Achievement } from '../types';

export async function seedData(): Promise<void> {
  const db = await getDatabase();

  // 检查是否已有成就数据
  const existingAchievements = await db.getAllAsync('SELECT * FROM achievements');
  if (existingAchievements.length > 0) {
    return; // 已有数据，跳过 seeding
  }

  const achievements: Achievement[] = [
    { id: '1', achievementKey: 'first_blood', title: '第一滴血', description: '添加第一个收藏', iconName: 'first_blood', unlockedAt: null },
    { id: '2', achievementKey: 'collector', title: '收藏家', description: '收藏达到 10 个', iconName: 'collector', unlockedAt: null },
    { id: '3', achievementKey: 'hoarder', title: '囤积者', description: '收藏达到 50 个', iconName: 'hoarder', unlockedAt: null },
    { id: '4', achievementKey: 'librarian', title: '图书管理员', description: '收藏达到 100 个', iconName: 'librarian', unlockedAt: null },
    { id: '5', achievementKey: 'beginner', title: '初学者', description: '读完 1 个收藏', iconName: 'beginner', unlockedAt: null },
    { id: '6', achievementKey: 'learner', title: '学习者', description: '读完 10 个收藏', iconName: 'learner', unlockedAt: null },
    { id: '7', achievementKey: 'scholar', title: '学者', description: '读完 50 个收藏', iconName: 'scholar', unlockedAt: null },
    { id: '8', achievementKey: 'streak_3', title: '三日打鱼', description: '连续学习 3 天', iconName: 'streak_3', unlockedAt: null },
    { id: '9', achievementKey: 'streak_7', title: '七日晒网', description: '连续学习 7 天', iconName: 'streak_7', unlockedAt: null },
    { id: '10', achievementKey: 'streak_30', title: '坚持不懈', description: '连续学习 30 天', iconName: 'streak_30', unlockedAt: null },
    { id: '11', achievementKey: 'organizer', title: '整理大师', description: '创建 5 个标签', iconName: 'organizer', unlockedAt: null },
    { id: '12', achievementKey: 'note_taker', title: '笔记达人', description: '添加 5 条笔记', iconName: 'note_taker', unlockedAt: null },
    { id: '13', achievementKey: 'resurrector', title: '复活者', description: '重新阅读 10 个旧收藏', iconName: 'resurrector', unlockedAt: null },
  ];

  const now = Date.now();
  for (const achievement of achievements) {
    await db.runAsync(
      'INSERT OR REPLACE INTO achievements (id, achievement_key, title, description, icon_name, unlocked_at) VALUES (?, ?, ?, ?, ?, ?)',
      [achievement.id, achievement.achievementKey, achievement.title, achievement.description, achievement.iconName, achievement.unlockedAt],
    );
  }

  // 插入默认设置
  await db.runAsync(
    'INSERT OR REPLACE INTO user_settings (key, value) VALUES (?, ?)',
    ['reminder_interval', '7'],
  );
}
