"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runMigrations = runMigrations;
const database_1 = require("./database");
async function runMigrations() {
    const db = await (0, database_1.getDatabase)();
    await db.execAsync(`
    CREATE TABLE IF NOT EXISTS bookmarks (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL DEFAULT '',
      source_type TEXT NOT NULL DEFAULT 'website',
      source_domain TEXT NOT NULL DEFAULT '',
      learning_status TEXT NOT NULL DEFAULT 'unread',
      notes TEXT NOT NULL DEFAULT '',
      created_at INTEGER NOT NULL,
      read_at INTEGER,
      last_resurfaced_at INTEGER,
      resurface_count INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL DEFAULT '#6366f1',
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bookmark_tags (
      bookmark_id TEXT NOT NULL,
      tag_id TEXT NOT NULL,
      PRIMARY KEY (bookmark_id, tag_id),
      FOREIGN KEY (bookmark_id) REFERENCES bookmarks(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      bookmark_id TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (bookmark_id) REFERENCES bookmarks(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS daily_stats (
      date TEXT PRIMARY KEY,
      read_count INTEGER NOT NULL DEFAULT 0,
      added_count INTEGER NOT NULL DEFAULT 0,
      streak_eligible INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS achievements (
      id TEXT PRIMARY KEY,
      achievement_key TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      icon_name TEXT NOT NULL,
      unlocked_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS user_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_bookmarks_status ON bookmarks(learning_status);
    CREATE INDEX IF NOT EXISTS idx_bookmarks_source ON bookmarks(source_type);
    CREATE INDEX IF NOT EXISTS idx_bookmarks_created ON bookmarks(created_at);
    CREATE INDEX IF NOT EXISTS idx_bookmark_tags_bookmark ON bookmark_tags(bookmark_id);
    CREATE INDEX IF NOT EXISTS idx_bookmark_tags_tag ON bookmark_tags(tag_id);
    CREATE INDEX IF NOT EXISTS idx_notes_bookmark ON notes(bookmark_id);
  `);
    await addColumnIfMissing('bookmarks', 'description', "TEXT NOT NULL DEFAULT ''");
    await addColumnIfMissing('bookmarks', 'image_url', 'TEXT');
    await addColumnIfMissing('bookmarks', 'author', 'TEXT');
    await addColumnIfMissing('bookmarks', 'original_tags', "TEXT NOT NULL DEFAULT '[]'");
    await addColumnIfMissing('bookmarks', 'published_at', 'INTEGER');
    await addColumnIfMissing('bookmarks', 'read_count', 'INTEGER NOT NULL DEFAULT 0');
    async function addColumnIfMissing(table, column, definition) {
        const columns = await db.getAllAsync(`PRAGMA table_info(${table})`);
        if (!columns.some((item) => item.name === column)) {
            await db.execAsync(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
        }
    }
}
