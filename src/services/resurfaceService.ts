import { getDatabase } from '../db/database';
import { Bookmark } from '../types';
import { StatsService } from './statsService';
import { syncAchievements } from './achievementSyncService';
import { ResurfaceConfigService } from './resurfaceConfigService';
import { ResurfacePolicy } from './resurfacePolicy';

const statsService = new StatsService();
const configService = new ResurfaceConfigService();
const policy = new ResurfacePolicy();

export class ResurfaceService {
  async getResurfaceCandidates(): Promise<Bookmark[]> {
    const db = await getDatabase();
    const config = await configService.getConfig();

    const rows = await db.getAllAsync<any>(
      `SELECT * FROM bookmarks
       WHERE learning_status = 'unread'
       ORDER BY created_at ASC`,
    );

    return policy
      .sort(rows.map((row) => this.mapRow(row)).filter((bookmark) => policy.isEligible(bookmark, config)))
      .slice(0, config.dailyLimit);
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
       SET learning_status = 'read', read_at = ?, last_resurfaced_at = ?, read_count = read_count + 1, updated_at = ?
       WHERE id = ?`,
      now,
      now,
      now,
      id,
    );
    await statsService.recordRead();
    await syncAchievements();
  }

  private mapRow(row: any): Bookmark {
    return {
      id: row.id,
      url: row.url,
      title: row.title,
      description: row.description || '',
      imageUrl: row.image_url || null,
      author: row.author || null,
      sourceType: row.source_type,
      sourceDomain: row.source_domain,
      originalTags: this.parseOriginalTags(row.original_tags),
      publishedAt: row.published_at || null,
      learningStatus: row.learning_status,
      isStarred: Boolean(row.is_starred),
      isArchived: Boolean(row.is_archived),
      notes: row.notes,
      createdAt: row.created_at,
      readAt: row.read_at,
      readCount: row.read_count || 0,
      deletedAt: row.deleted_at || null,
      lastResurfacedAt: row.last_resurfaced_at,
      resurfaceCount: row.resurface_count,
      updatedAt: row.updated_at,
      tags: [],
      folders: [],
      noteCount: 0,
    };
  }

  private parseOriginalTags(value: unknown): string[] {
    if (!value || typeof value !== 'string') return [];
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
    } catch {
      return [];
    }
  }
}
