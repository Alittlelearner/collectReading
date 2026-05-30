import { getDatabase } from '../db/database';
import { URLParserService } from './urlParserService';
import { generateId } from '../utils/uuid';
import {
  Bookmark,
  CreateBookmarkDTO,
  BookmarkFilter,
  Tag,
  TimelineGroup,
  LearningStatus,
} from '../types';

const urlParser = new URLParserService();

export class BookmarkService {
  async getAll(filters?: BookmarkFilter): Promise<Bookmark[]> {
    const db = await getDatabase();
    let query = 'SELECT * FROM bookmarks WHERE 1=1';
    const params: (string | number)[] = [];

    if (filters?.sourceType) {
      query += ' AND source_type = ?';
      params.push(filters.sourceType);
    }
    if (filters?.status) {
      query += ' AND learning_status = ?';
      params.push(filters.status);
    }
    if (filters?.searchQuery) {
      query += ' AND (title LIKE ? OR notes LIKE ?)';
      const like = `%${filters.searchQuery}%`;
      params.push(like, like);
    }

    const sortBy = filters?.sortBy || 'created_at';
    const sortOrder = filters?.sortOrder || 'desc';
    const validSortColumns = ['created_at', 'title', 'updated_at'];
    const column = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    query += ` ORDER BY ${column} ${sortOrder === 'asc' ? 'ASC' : 'DESC'}`;

    const rows = await db.getAllAsync<any>(query, ...params);
    const bookmarks = await Promise.all(rows.map((row) => this.mapRow(row)));

    if (filters?.tagId) {
      const taggedIds = await this.getBookmarkIdsByTag(filters.tagId);
      return bookmarks.filter((b) => taggedIds.includes(b.id));
    }

    return bookmarks;
  }

  async getById(id: string): Promise<Bookmark | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<any>('SELECT * FROM bookmarks WHERE id = ?', id);
    if (!row) return null;
    return this.mapRow(row);
  }

  async create(dto: CreateBookmarkDTO): Promise<Bookmark> {
    const db = await getDatabase();

    const existing = await db.getFirstAsync<any>(
      'SELECT id FROM bookmarks WHERE url = ?',
      dto.url,
    );
    if (existing) {
      throw new Error('DUPLICATE_URL');
    }

    const metadata = await urlParser.parse(dto.url);
    const id = generateId();
    const now = Date.now();

    await db.runAsync(
      `INSERT INTO bookmarks (id, url, title, source_type, source_domain, learning_status, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'unread', ?, ?, ?)`,
      id,
      dto.url,
      metadata.title || '',
      metadata.sourceType,
      metadata.sourceDomain,
      dto.notes || '',
      now,
      now,
    );

    if (dto.tags && dto.tags.length > 0) {
      for (const tagId of dto.tags) {
        await db.runAsync(
          'INSERT OR IGNORE INTO bookmark_tags (bookmark_id, tag_id) VALUES (?, ?)',
          id,
          tagId,
        );
      }
    }

    return (await this.getById(id))!;
  }

  async update(id: string, data: Partial<Pick<Bookmark, 'title' | 'notes'>>): Promise<Bookmark> {
    const db = await getDatabase();
    const now = Date.now();
    const updates: string[] = ['updated_at = ?'];
    const params: (string | number)[] = [now];

    if (data.title !== undefined) {
      updates.push('title = ?');
      params.push(data.title);
    }
    if (data.notes !== undefined) {
      updates.push('notes = ?');
      params.push(data.notes);
    }

    params.push(id);
    await db.runAsync(`UPDATE bookmarks SET ${updates.join(', ')} WHERE id = ?`, ...params);
    return (await this.getById(id))!;
  }

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM bookmarks WHERE id = ?', id);
  }

  async toggleStatus(id: string): Promise<Bookmark> {
    const db = await getDatabase();
    const bookmark = await this.getById(id);
    if (!bookmark) throw new Error('NOT_FOUND');

    const newStatus: LearningStatus = bookmark.learningStatus === 'unread' ? 'read' : 'unread';
    const now = Date.now();

    if (newStatus === 'read') {
      await db.runAsync(
        'UPDATE bookmarks SET learning_status = ?, read_at = ?, updated_at = ? WHERE id = ?',
        newStatus,
        now,
        now,
        id,
      );
    } else {
      await db.runAsync(
        'UPDATE bookmarks SET learning_status = ?, read_at = NULL, updated_at = ? WHERE id = ?',
        newStatus,
        now,
        id,
      );
    }

    return (await this.getById(id))!;
  }

  async search(query: string): Promise<Bookmark[]> {
    return this.getAll({ searchQuery: query });
  }

  async getByTag(tagId: string): Promise<Bookmark[]> {
    return this.getAll({ tagId });
  }

  async getBySource(sourceType: BookmarkFilter['sourceType']): Promise<Bookmark[]> {
    return this.getAll({ sourceType });
  }

  async getByTimeline(): Promise<TimelineGroup[]> {
    const bookmarks = await this.getAll({ sortBy: 'createdAt', sortOrder: 'desc' });
    const groups: Map<string, Bookmark[]> = new Map();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 86400000;
    const weekAgo = today - 7 * 86400000;

    for (const b of bookmarks) {
      const createdDate = new Date(b.createdAt);
      const createdDay = new Date(
        createdDate.getFullYear(),
        createdDate.getMonth(),
        createdDate.getDate(),
      ).getTime();

      let label: string;
      if (createdDay === today) {
        label = '今天';
      } else if (createdDay === yesterday) {
        label = '昨天';
      } else if (createdDay >= weekAgo) {
        label = '本周';
      } else {
        label = '更早';
      }

      if (!groups.has(label)) groups.set(label, []);
      groups.get(label)!.push(b);
    }

    const order = ['今天', '昨天', '本周', '更早'];
    return order
      .filter((label) => groups.has(label))
      .map((date) => ({ date, items: groups.get(date)! }));
  }

  async exists(url: string): Promise<boolean> {
    const db = await getDatabase();
    const row = await db.getFirstAsync('SELECT id FROM bookmarks WHERE url = ?', url);
    return !!row;
  }

  private async getBookmarkIdsByTag(tagId: string): Promise<string[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{ bookmark_id: string }>(
      'SELECT bookmark_id FROM bookmark_tags WHERE tag_id = ?',
      tagId,
    );
    return rows.map((r) => r.bookmark_id);
  }

  private async mapRow(row: any): Promise<Bookmark> {
    const tags = await this.getTagsForBookmark(row.id);
    const noteCount = await this.getNoteCount(row.id);
    return {
      id: row.id,
      url: row.url,
      title: row.title,
      sourceType: row.source_type,
      sourceDomain: row.source_domain,
      learningStatus: row.learning_status,
      notes: row.notes,
      createdAt: row.created_at,
      readAt: row.read_at,
      lastResurfacedAt: row.last_resurfaced_at,
      resurfaceCount: row.resurface_count,
      updatedAt: row.updated_at,
      tags,
      noteCount,
    };
  }

  private async getTagsForBookmark(bookmarkId: string): Promise<Tag[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      `SELECT t.*, (SELECT COUNT(*) FROM bookmark_tags bt WHERE bt.tag_id = t.id) as bookmark_count
       FROM tags t
       INNER JOIN bookmark_tags bt ON bt.tag_id = t.id
       WHERE bt.bookmark_id = ?`,
      bookmarkId,
    );
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      color: r.color,
      createdAt: r.created_at,
      bookmarkCount: r.bookmark_count || 0,
    }));
  }

  private async getNoteCount(bookmarkId: string): Promise<number> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM notes WHERE bookmark_id = ?',
      bookmarkId,
    );
    return row?.count || 0;
  }
}
