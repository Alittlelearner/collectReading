import { getDatabase } from '../db/database';
import { generateId } from '../utils/uuid';
import { Tag } from '../types';

export class TagService {
  async getAll(): Promise<Tag[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync(
      `SELECT t.*, (SELECT COUNT(*) FROM bookmark_tags bt WHERE bt.tag_id = t.id) as bookmark_count
       FROM tags t
       ORDER BY t.created_at DESC`,
    );
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      color: r.color,
      createdAt: r.created_at,
      bookmarkCount: r.bookmark_count || 0,
    }));
  }

  async create(name: string, color: string = '#6366f1'): Promise<Tag> {
    const db = await getDatabase();
    const id = generateId();
    const now = Date.now();

    await db.runAsync(
      'INSERT INTO tags (id, name, color, created_at) VALUES (?, ?, ?, ?)',
      id,
      name,
      color,
      now,
    );

    return {
      id,
      name,
      color,
      createdAt: now,
      bookmarkCount: 0,
    };
  }

  async update(id: string, data: { name?: string; color?: string }): Promise<Tag> {
    const db = await getDatabase();
    const updates: string[] = [];
    const params: string[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      params.push(data.name);
    }
    if (data.color !== undefined) {
      updates.push('color = ?');
      params.push(data.color);
    }

    if (updates.length > 0) {
      params.push(id);
      await db.runAsync(`UPDATE tags SET ${updates.join(', ')} WHERE id = ?`, ...params);
    }

    const row = await db.getFirstAsync('SELECT * FROM tags WHERE id = ?', id);
    if (!row) throw new Error('NOT_FOUND');

    return this.mapRow(row);
  }

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM tags WHERE id = ?', [id]);
  }

  async attachTag(bookmarkId: string, tagId: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      'INSERT OR IGNORE INTO bookmark_tags (bookmark_id, tag_id) VALUES (?, ?)',
      bookmarkId,
      tagId,
    );
  }

  async detachTag(bookmarkId: string, tagId: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      'DELETE FROM bookmark_tags WHERE bookmark_id = ? AND tag_id = ?',
      bookmarkId,
      tagId,
    );
  }

  private async mapRow(row: any): Promise<Tag> {
    const db = await getDatabase();
    const countRow = await db.getFirstAsync(
      'SELECT COUNT(*) as count FROM bookmark_tags WHERE tag_id = ?',
      row.id,
    );
    return {
      id: row.id,
      name: row.name,
      color: row.color,
      createdAt: row.created_at,
      bookmarkCount: countRow?.count || 0,
    };
  }
}
