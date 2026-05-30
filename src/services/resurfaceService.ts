import { getDatabase } from '../db/database';
import { Bookmark } from '../types';

export class ResurfaceService {
  async getResurfaceCandidates(limit: number = 3, maxPerItem: number = 5): Promise<Bookmark[]> {
    const db = await getDatabase();
    const sevenDaysAgo = Date.now() - 7 * 86400000;

    const rows = await db.getAllAsync<any>(
      `SELECT * FROM bookmarks
       WHERE learning_status = 'unread'
         AND resurface_count < ?
         AND (
           last_resurfaced_at IS NULL
           OR last_resurfaced_at < ?
         )
       ORDER BY
         CASE WHEN last_resurfaced_at IS NULL THEN 0 ELSE 1 END,
         created_at ASC
       LIMIT ?`,
      maxPerItem,
      sevenDaysAgo,
      limit,
    );

    return rows.map((row) => this.mapRow(row));
  }

  async markResurfaced(id: string): Promise<void> {
    const db = await getDatabase();
    const now = Date.now();
    await db.runAsync(
      `UPDATE bookmarks
       SET last_resurfaced_at = ?, resurface_count = resurface_count + 1, updated_at = ?
       WHERE id = ?`,
      now,
      now,
      id,
    );
  }

  async markResurfaceSkipped(id: string): Promise<void> {
    await this.markResurfaced(id);
  }

  async markResurfaceDone(id: string): Promise<void> {
    const db = await getDatabase();
    const now = Date.now();
    await db.runAsync(
      `UPDATE bookmarks
       SET learning_status = 'read', read_at = ?, last_resurfaced_at = ?, updated_at = ?
       WHERE id = ?`,
      now,
      now,
      now,
      id,
    );
  }

  private mapRow(row: any): Bookmark {
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
      tags: [],
      noteCount: 0,
    };
  }
}
