import { getDatabase } from '../db/database';
import { generateId } from '../utils/uuid';
import { Folder } from '../types';

export class FolderService {
  async getAll(): Promise<Folder[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      `SELECT f.*, (
          SELECT COUNT(*)
          FROM bookmark_folders bf
          INNER JOIN bookmarks b ON b.id = bf.bookmark_id
          WHERE bf.folder_id = f.id AND b.deleted_at IS NULL
        ) as bookmark_count
       FROM folders f
       ORDER BY f.created_at DESC`,
    );

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      createdAt: row.created_at,
      bookmarkCount: row.bookmark_count || 0,
    }));
  }

  async create(name: string): Promise<Folder> {
    const db = await getDatabase();
    const id = generateId();
    const now = Date.now();
    await db.runAsync('INSERT INTO folders (id, name, created_at) VALUES (?, ?, ?)', id, name, now);
    return {
      id,
      name,
      createdAt: now,
      bookmarkCount: 0,
    };
  }

  async update(id: string, data: { name?: string }): Promise<Folder> {
    const db = await getDatabase();
    if (data.name !== undefined) {
      await db.runAsync('UPDATE folders SET name = ? WHERE id = ?', data.name, id);
    }
    const row = await db.getFirstAsync<any>('SELECT * FROM folders WHERE id = ?', id);
    if (!row) {
      throw new Error('NOT_FOUND');
    }
    const countRow = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count
       FROM bookmark_folders bf
       INNER JOIN bookmarks b ON b.id = bf.bookmark_id
       WHERE bf.folder_id = ? AND b.deleted_at IS NULL`,
      id,
    );
    return {
      id: row.id,
      name: row.name,
      createdAt: row.created_at,
      bookmarkCount: countRow?.count || 0,
    };
  }

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM folders WHERE id = ?', id);
  }

  async attachFolder(bookmarkId: string, folderId: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      'INSERT OR IGNORE INTO bookmark_folders (bookmark_id, folder_id) VALUES (?, ?)',
      bookmarkId,
      folderId,
    );
  }

  async detachFolder(bookmarkId: string, folderId: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      'DELETE FROM bookmark_folders WHERE bookmark_id = ? AND folder_id = ?',
      bookmarkId,
      folderId,
    );
  }
}
