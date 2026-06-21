import type { AppDatabase } from './database';

export type BackupPayload = {
  version: 2;
  app: 'collectionRead';
  exportedAt: string;
  tables: {
    bookmarks: any[];
    tags: any[];
    bookmarkTags: any[];
    folders: any[];
    bookmarkFolders: any[];
    notes: any[];
    dailyStats: any[];
    achievements: any[];
    userSettings: any[];
    wikiSpaces: any[];
  };
};

export type ImportSummary = {
  bookmarks: number;
  tags: number;
  folders: number;
  notes: number;
  bookmarkTags: number;
  bookmarkFolders: number;
  dailyStats: number;
  achievements: number;
  userSettings: number;
  wikiSpaces: number;
  skipped: number;
};

type LegacyBackupPayload = {
  version?: string | number;
  exportDate?: string;
  bookmarks?: any[];
  tags?: any[];
  bookmarkTags?: any[];
  folders?: any[];
  bookmarkFolders?: any[];
  notes?: any[];
  dailyStats?: any[];
  achievements?: any[];
  settings?: any[];
  userSettings?: any[];
  wikiSpaces?: any[];
  tables?: Partial<BackupPayload['tables']>;
};

function rows(value: unknown): any[] {
  return Array.isArray(value) ? value : [];
}

function emptySummary(): ImportSummary {
  return {
    bookmarks: 0,
    tags: 0,
    folders: 0,
    notes: 0,
    bookmarkTags: 0,
    bookmarkFolders: 0,
    dailyStats: 0,
    achievements: 0,
    userSettings: 0,
    wikiSpaces: 0,
    skipped: 0,
  };
}

export async function collectBackupPayload(db: AppDatabase): Promise<BackupPayload> {
  return {
    version: 2,
    app: 'collectionRead',
    exportedAt: new Date().toISOString(),
    tables: {
      bookmarks: await db.getAllAsync('SELECT * FROM bookmarks'),
      tags: await db.getAllAsync('SELECT * FROM tags'),
      bookmarkTags: await db.getAllAsync('SELECT * FROM bookmark_tags'),
      folders: await db.getAllAsync('SELECT * FROM folders'),
      bookmarkFolders: await db.getAllAsync('SELECT * FROM bookmark_folders'),
      notes: await db.getAllAsync('SELECT * FROM notes'),
      dailyStats: await db.getAllAsync('SELECT * FROM daily_stats'),
      achievements: await db.getAllAsync('SELECT * FROM achievements'),
      userSettings: await db.getAllAsync('SELECT * FROM user_settings'),
      wikiSpaces: await db.getAllAsync('SELECT * FROM wiki_spaces'),
    },
  };
}

export function normalizeBackupPayload(input: unknown): BackupPayload | null {
  if (!input || typeof input !== 'object') {
    return null;
  }

  const data = input as LegacyBackupPayload;
  const tableSource = data.tables || data;
  const bookmarks = rows(tableSource.bookmarks);

  if (bookmarks.length === 0 && !Array.isArray(tableSource.bookmarks)) {
    return null;
  }

  return {
    version: 2,
    app: 'collectionRead',
    exportedAt: data.exportDate || new Date().toISOString(),
    tables: {
      bookmarks,
      tags: rows(tableSource.tags),
      bookmarkTags: rows(tableSource.bookmarkTags),
      folders: rows(tableSource.folders),
      bookmarkFolders: rows(tableSource.bookmarkFolders),
      notes: rows(tableSource.notes),
      dailyStats: rows(tableSource.dailyStats),
      achievements: rows(tableSource.achievements),
      userSettings: rows(tableSource.userSettings || data.settings),
      wikiSpaces: rows(tableSource.wikiSpaces),
    },
  };
}

export function summarizeBackup(payload: BackupPayload): ImportSummary {
  return {
    ...emptySummary(),
    bookmarks: payload.tables.bookmarks.length,
    tags: payload.tables.tags.length,
    folders: payload.tables.folders.length,
    notes: payload.tables.notes.length,
    bookmarkTags: payload.tables.bookmarkTags.length,
    bookmarkFolders: payload.tables.bookmarkFolders.length,
    dailyStats: payload.tables.dailyStats.length,
    achievements: payload.tables.achievements.length,
    userSettings: payload.tables.userSettings.length,
    wikiSpaces: payload.tables.wikiSpaces.length,
  };
}

export async function restoreBackupPayload(db: AppDatabase, payload: BackupPayload): Promise<ImportSummary> {
  const summary = emptySummary();
  const tagIdMap = new Map<string, string>();
  const folderIdMap = new Map<string, string>();
  const bookmarkIdMap = new Map<string, string>();

  await db.execAsync('BEGIN TRANSACTION');

  try {
    for (const tag of payload.tables.tags) {
      if (!tag?.id || !tag?.name) {
        summary.skipped += 1;
        continue;
      }

      const existing = await db.getFirstAsync<{ id: string }>('SELECT id FROM tags WHERE name = ?', tag.name);
      const targetId = existing?.id || tag.id;
      tagIdMap.set(tag.id, targetId);

      if (existing) {
        await db.runAsync('UPDATE tags SET color = ?, created_at = ? WHERE id = ?', tag.color, tag.created_at, targetId);
      } else {
        await db.runAsync(
          'INSERT OR REPLACE INTO tags (id, name, color, created_at) VALUES (?, ?, ?, ?)',
          targetId,
          tag.name,
          tag.color || '#6366f1',
          tag.created_at || Date.now(),
        );
      }
      summary.tags += 1;
    }

    for (const folder of payload.tables.folders) {
      if (!folder?.id || !folder?.name) {
        summary.skipped += 1;
        continue;
      }

      const existing = await db.getFirstAsync<{ id: string }>('SELECT id FROM folders WHERE name = ?', folder.name);
      const targetId = existing?.id || folder.id;
      folderIdMap.set(folder.id, targetId);

      if (existing) {
        await db.runAsync('UPDATE folders SET created_at = ? WHERE id = ?', folder.created_at, targetId);
      } else {
        await db.runAsync(
          'INSERT OR REPLACE INTO folders (id, name, created_at) VALUES (?, ?, ?)',
          targetId,
          folder.name,
          folder.created_at || Date.now(),
        );
      }
      summary.folders += 1;
    }

    for (const bookmark of payload.tables.bookmarks) {
      if (!bookmark?.id || !bookmark?.url) {
        summary.skipped += 1;
        continue;
      }

      const existing = await db.getFirstAsync<{ id: string }>('SELECT id FROM bookmarks WHERE url = ?', bookmark.url);
      const targetId = existing?.id || bookmark.id;
      bookmarkIdMap.set(bookmark.id, targetId);

      if (existing) {
        await db.runAsync(
          `UPDATE bookmarks
           SET title = ?, source_type = ?, source_domain = ?, learning_status = ?, notes = ?,
               created_at = ?, read_at = ?, last_resurfaced_at = ?, resurface_count = ?, updated_at = ?,
               description = ?, image_url = ?, author = ?, original_tags = ?, published_at = ?, read_count = ?,
               is_starred = ?, is_archived = ?, deleted_at = ?
           WHERE id = ?`,
          bookmark.title || bookmark.url,
          bookmark.source_type || 'website',
          bookmark.source_domain || '',
          bookmark.learning_status || 'unread',
          bookmark.notes || '',
          bookmark.created_at || Date.now(),
          bookmark.read_at ?? null,
          bookmark.last_resurfaced_at ?? null,
          bookmark.resurface_count ?? 0,
          bookmark.updated_at || Date.now(),
          bookmark.description ?? '',
          bookmark.image_url ?? null,
          bookmark.author ?? null,
          bookmark.original_tags ?? '[]',
          bookmark.published_at ?? null,
          bookmark.read_count ?? 0,
          bookmark.is_starred ?? 0,
          bookmark.is_archived ?? 0,
          bookmark.deleted_at ?? null,
          targetId,
        );
      } else {
        await db.runAsync(
          `INSERT OR REPLACE INTO bookmarks (
            id, url, title, source_type, source_domain, learning_status, notes,
            created_at, read_at, last_resurfaced_at, resurface_count, updated_at,
            description, image_url, author, original_tags, published_at, read_count,
            is_starred, is_archived, deleted_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          targetId,
          bookmark.url,
          bookmark.title || bookmark.url,
          bookmark.source_type || 'website',
          bookmark.source_domain || '',
          bookmark.learning_status || 'unread',
          bookmark.notes || '',
          bookmark.created_at || Date.now(),
          bookmark.read_at ?? null,
          bookmark.last_resurfaced_at ?? null,
          bookmark.resurface_count ?? 0,
          bookmark.updated_at || Date.now(),
          bookmark.description ?? '',
          bookmark.image_url ?? null,
          bookmark.author ?? null,
          bookmark.original_tags ?? '[]',
          bookmark.published_at ?? null,
          bookmark.read_count ?? 0,
          bookmark.is_starred ?? 0,
          bookmark.is_archived ?? 0,
          bookmark.deleted_at ?? null,
        );
      }
      summary.bookmarks += 1;
    }

    for (const rel of payload.tables.bookmarkTags) {
      const bookmarkId = bookmarkIdMap.get(rel?.bookmark_id) || rel?.bookmark_id;
      const tagId = tagIdMap.get(rel?.tag_id) || rel?.tag_id;
      if (!bookmarkId || !tagId) {
        summary.skipped += 1;
        continue;
      }
      await db.runAsync('INSERT OR IGNORE INTO bookmark_tags (bookmark_id, tag_id) VALUES (?, ?)', bookmarkId, tagId);
      summary.bookmarkTags += 1;
    }

    for (const rel of payload.tables.bookmarkFolders) {
      const bookmarkId = bookmarkIdMap.get(rel?.bookmark_id) || rel?.bookmark_id;
      const folderId = folderIdMap.get(rel?.folder_id) || rel?.folder_id;
      if (!bookmarkId || !folderId) {
        summary.skipped += 1;
        continue;
      }
      await db.runAsync(
        'INSERT OR IGNORE INTO bookmark_folders (bookmark_id, folder_id) VALUES (?, ?)',
        bookmarkId,
        folderId,
      );
      summary.bookmarkFolders += 1;
    }

    for (const note of payload.tables.notes) {
      const bookmarkId = bookmarkIdMap.get(note?.bookmark_id) || note?.bookmark_id;
      if (!note?.id || !bookmarkId) {
        summary.skipped += 1;
        continue;
      }
      await db.runAsync(
        'INSERT OR REPLACE INTO notes (id, bookmark_id, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
        note.id,
        bookmarkId,
        note.content || '',
        note.created_at || Date.now(),
        note.updated_at || Date.now(),
      );
      summary.notes += 1;
    }

    for (const stat of payload.tables.dailyStats) {
      if (!stat?.date) {
        summary.skipped += 1;
        continue;
      }
      await db.runAsync(
        'INSERT OR REPLACE INTO daily_stats (date, read_count, added_count, streak_eligible) VALUES (?, ?, ?, ?)',
        stat.date,
        stat.read_count ?? 0,
        stat.added_count ?? 0,
        stat.streak_eligible ?? 0,
      );
      summary.dailyStats += 1;
    }

    for (const achievement of payload.tables.achievements) {
      if (!achievement?.id || !achievement?.achievement_key) {
        summary.skipped += 1;
        continue;
      }
      await db.runAsync(
        `INSERT OR REPLACE INTO achievements
         (id, achievement_key, title, description, icon_name, unlocked_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        achievement.id,
        achievement.achievement_key,
        achievement.title || '',
        achievement.description || '',
        achievement.icon_name || 'star-outline',
        achievement.unlocked_at ?? null,
      );
      summary.achievements += 1;
    }

    for (const setting of payload.tables.userSettings) {
      if (!setting?.key) {
        summary.skipped += 1;
        continue;
      }
      await db.runAsync('INSERT OR REPLACE INTO user_settings (key, value) VALUES (?, ?)', setting.key, setting.value);
      summary.userSettings += 1;
    }

    for (const wiki of payload.tables.wikiSpaces) {
      if (!wiki?.id || !wiki?.name) {
        summary.skipped += 1;
        continue;
      }
      await db.runAsync(
        `INSERT OR REPLACE INTO wiki_spaces
         (id, name, description, grouping, filter_json, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        wiki.id,
        wiki.name,
        wiki.description ?? '',
        wiki.grouping ?? 'folder',
        wiki.filter_json ?? '{}',
        wiki.created_at || Date.now(),
        wiki.updated_at || Date.now(),
      );
      summary.wikiSpaces += 1;
    }

    await db.execAsync('COMMIT');
    return summary;
  } catch (err) {
    await db.execAsync('ROLLBACK');
    throw err;
  }
}
