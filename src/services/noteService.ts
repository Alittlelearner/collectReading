import { getDatabase } from '../db/database';
import { syncAchievements } from './achievementSyncService';
import { generateId } from '../utils/uuid';
import { Note } from '../types';

export class NoteService {
  async getByBookmark(bookmarkId: string): Promise<Note[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      'SELECT * FROM notes WHERE bookmark_id = ? ORDER BY updated_at DESC',
      bookmarkId,
    );
    return rows.map((r) => ({
      id: r.id,
      bookmarkId: r.bookmark_id,
      content: r.content,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  }

  async create(bookmarkId: string, content: string): Promise<Note> {
    const db = await getDatabase();
    const id = generateId();
    const now = Date.now();

    await db.runAsync(
      'INSERT INTO notes (id, bookmark_id, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      id,
      bookmarkId,
      content,
      now,
      now,
    );
    await syncAchievements();

    return {
      id,
      bookmarkId,
      content,
      createdAt: now,
      updatedAt: now,
    };
  }

  async update(id: string, content: string): Promise<Note> {
    const db = await getDatabase();
    const now = Date.now();

    await db.runAsync(
      'UPDATE notes SET content = ?, updated_at = ? WHERE id = ?',
      content,
      now,
      id,
    );

    return {
      id,
      bookmarkId: '',
      content,
      createdAt: 0,
      updatedAt: now,
    };
  }

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM notes WHERE id = ?', id);
  }
}
