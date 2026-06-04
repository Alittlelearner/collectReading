import { getDatabase } from './database';

export async function runMigrations(): Promise<void> {
  const db = await getDatabase();

  // 初始化表结构（实际上只需要确保数据存在）
  await db.execAsync(`CREATE TABLE IF NOT EXISTS bookmarks (id TEXT PRIMARY KEY)`);
  await db.execAsync(`CREATE TABLE IF NOT EXISTS tags (id TEXT PRIMARY KEY)`);
  await db.execAsync(`CREATE TABLE IF NOT EXISTS bookmark_tags (bookmark_id TEXT, tag_id TEXT)`);
  await db.execAsync(`CREATE TABLE IF NOT EXISTS notes (id TEXT PRIMARY KEY)`);
  await db.execAsync(`CREATE TABLE IF NOT EXISTS daily_stats (date TEXT PRIMARY KEY)`);
  await db.execAsync(`CREATE TABLE IF NOT EXISTS achievements (id INTEGER PRIMARY KEY)`);
  await db.execAsync(`CREATE TABLE IF NOT EXISTS user_settings (key TEXT PRIMARY KEY)`);
}

export async function dropAllTables(): Promise<void> {
  const db = await getDatabase();
  await db.execAsync('DROP TABLE IF EXISTS bookmarks');
  await db.execAsync('DROP TABLE IF EXISTS tags');
  await db.execAsync('DROP TABLE IF EXISTS bookmark_tags');
  await db.execAsync('DROP TABLE IF EXISTS notes');
  await db.execAsync('DROP TABLE IF EXISTS daily_stats');
  await db.execAsync('DROP TABLE IF EXISTS achievements');
  await db.execAsync('DROP TABLE IF EXISTS user_settings');
}
