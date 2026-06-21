"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedData = seedData;
const database_1 = require("./database");
async function seedData() {
    const db = await (0, database_1.getDatabase)();
    const achievements = [
        ['first_blood', '初次收藏', '收藏第 1 条内容', 'star-outline'],
        ['collector', '收藏达人', '累计收藏 10 条内容', 'bookmark'],
        ['hoarder', '收藏能手', '累计收藏 50 条内容', 'archive'],
        ['librarian', '收藏馆长', '累计收藏 100 条内容', 'library'],
        ['beginner', '开始阅读', '完成第 1 条阅读', 'check-circle'],
        ['learner', '持续输入', '累计完成 10 条阅读', 'book-open'],
        ['scholar', '深度阅读', '累计完成 50 条阅读', 'award'],
        ['streak_3', '三日连读', '连续 3 天完成阅读', 'flame'],
        ['streak_7', '七日连读', '连续 7 天完成阅读', 'trending-up'],
        ['streak_30', '阅读满月', '连续 30 天完成阅读', 'star'],
        ['organizer', '标签整理师', '创建 5 个标签', 'tag'],
        ['note_taker', '笔记习惯', '写下 5 条笔记', 'edit'],
        ['resurrector', '旧藏唤醒者', '通过擦亮完成 10 条阅读', 'clock'],
    ];
    await db.execAsync(`
    INSERT OR IGNORE INTO achievements (id, achievement_key, title, description, icon_name) VALUES
    ('1', 'first_blood', '初次收藏', '收藏第 1 条内容', 'star-outline'),
    ('2', 'collector', '收藏达人', '累计收藏 10 条内容', 'bookmark'),
    ('3', 'hoarder', '收藏能手', '累计收藏 50 条内容', 'archive'),
    ('4', 'librarian', '收藏馆长', '累计收藏 100 条内容', 'library'),
    ('5', 'beginner', '开始阅读', '完成第 1 条阅读', 'check-circle'),
    ('6', 'learner', '持续输入', '累计完成 10 条阅读', 'book-open'),
    ('7', 'scholar', '深度阅读', '累计完成 50 条阅读', 'award'),
    ('8', 'streak_3', '三日连读', '连续 3 天完成阅读', 'flame'),
    ('9', 'streak_7', '七日连读', '连续 7 天完成阅读', 'trending-up'),
    ('10', 'streak_30', '阅读满月', '连续 30 天完成阅读', 'star'),
    ('11', 'organizer', '标签整理师', '创建 5 个标签', 'tag'),
    ('12', 'note_taker', '笔记习惯', '写下 5 条笔记', 'edit'),
    ('13', 'resurrector', '旧藏唤醒者', '通过擦亮完成 10 条阅读', 'clock');

    INSERT OR IGNORE INTO user_settings (key, value) VALUES
    ('reminder_interval', '7'),
    ('resurface_daily_limit', '3'),
    ('resurface_max_per_item', '5'),
    ('resurface_cooldown_days', '7');
  `);
    for (const [key, title, description, iconName] of achievements) {
        await db.runAsync('UPDATE achievements SET title = ?, description = ?, icon_name = ? WHERE achievement_key = ?', title, description, iconName, key);
    }
}
