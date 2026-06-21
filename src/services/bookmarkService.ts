import { getDatabase } from '../db/database';
import { URLParserService } from './urlParserService';
import { StatsService } from './statsService';
import { syncAchievements } from './achievementSyncService';
import { generateId } from '../utils/uuid';
import {
  Bookmark,
  BookmarkFilter,
  CreateBookmarkDTO,
  Folder,
  LearningStatus,
  SidebarStats,
  Tag,
  TimelineGroup,
} from '../types';
import { normalizeImageUrl } from '../utils/media';

const urlParser = new URLParserService();
const statsService = new StatsService();

type BookmarkRow = {
  id: string;
  url: string;
  title: string;
  description: string | null;
  image_url: string | null;
  author: string | null;
  source_type: Bookmark['sourceType'];
  source_domain: string;
  original_tags: string | null;
  published_at: number | null;
  learning_status: LearningStatus;
  is_starred: number;
  is_archived: number;
  notes: string;
  created_at: number;
  read_at: number | null;
  read_count: number;
  deleted_at: number | null;
  last_resurfaced_at: number | null;
  resurface_count: number;
  updated_at: number;
};

const metadataQueue: string[] = [];
let metadataQueueRunning = false;

function hasMeaningfulText(value: string | null | undefined): value is string {
  if (!value || typeof value !== 'string') {
    return false;
  }

  const trimmed = value.trim();
  return Boolean(trimmed && trimmed !== '-' && trimmed !== '--');
}

function resolveBookmarkTitle(
  candidates: Array<string | null | undefined>,
  fallback: string,
): string {
  const match = candidates.find((candidate) => hasMeaningfulText(candidate));
  return match?.trim() || fallback;
}

function toSortColumn(sortBy?: BookmarkFilter['sortBy']): string {
  switch (sortBy) {
    case 'title':
      return 'title';
    case 'updatedAt':
      return 'updated_at';
    case 'createdAt':
    default:
      return 'created_at';
  }
}

function getScopeCondition(scope: BookmarkFilter['scope'] = 'active'): string {
  if (scope === 'deleted') {
    return 'b.deleted_at IS NOT NULL';
  }

  if (scope === 'archived') {
    return "b.deleted_at IS NULL AND (b.is_archived = 1 OR b.learning_status = 'read')";
  }

  if (scope === 'all') {
    return 'b.deleted_at IS NULL';
  }

  return "b.deleted_at IS NULL AND b.learning_status <> 'read' AND b.is_archived = 0";
}

function appendCommonFilters(
  conditions: string[],
  params: Array<string | number>,
  filters?: BookmarkFilter,
) {
  if (!filters) {
    return;
  }

  if (filters.sourceType) {
    conditions.push('b.source_type = ?');
    params.push(filters.sourceType);
  }

  if (filters.status) {
    conditions.push('b.learning_status = ?');
    params.push(filters.status);
  }

  if (filters.starred) {
    conditions.push('b.is_starred = 1');
  }

  if (filters.hasNotes) {
    conditions.push("TRIM(IFNULL(b.notes, '')) <> '' OR EXISTS (SELECT 1 FROM notes n WHERE n.bookmark_id = b.id)");
  }

  if (filters.createdAfter) {
    conditions.push('b.created_at >= ?');
    params.push(filters.createdAfter);
  }

  if (filters.searchQuery) {
    const like = `%${filters.searchQuery}%`;
    conditions.push(
      `(b.title LIKE ? OR b.notes LIKE ? OR b.description LIKE ? OR b.author LIKE ? OR b.original_tags LIKE ? OR b.url LIKE ?)`,
    );
    params.push(like, like, like, like, like, like);
  }

  if (filters.tagId) {
    conditions.push(
      'EXISTS (SELECT 1 FROM bookmark_tags bt WHERE bt.bookmark_id = b.id AND bt.tag_id = ?)',
    );
    params.push(filters.tagId);
  }

  if (filters.folderId) {
    conditions.push(
      'EXISTS (SELECT 1 FROM bookmark_folders bf WHERE bf.bookmark_id = b.id AND bf.folder_id = ?)',
    );
    params.push(filters.folderId);
  }

  if (filters.untagged) {
    conditions.push('NOT EXISTS (SELECT 1 FROM bookmark_tags bt WHERE bt.bookmark_id = b.id)');
  }
}

export class BookmarkService {
  async getAll(filters?: BookmarkFilter): Promise<Bookmark[]> {
    const db = await getDatabase();
    const params: Array<string | number> = [];
    const conditions = [getScopeCondition(filters?.scope)];

    appendCommonFilters(conditions, params, filters);

    const query = `
      SELECT b.*
      FROM bookmarks b
      WHERE ${conditions.join(' AND ')}
      ORDER BY ${toSortColumn(filters?.sortBy)} ${filters?.sortOrder === 'asc' ? 'ASC' : 'DESC'}
    `;

    const rows = await db.getAllAsync<BookmarkRow>(query, ...params);
    return Promise.all(rows.map((row) => this.mapRow(row)));
  }

  async getById(id: string): Promise<Bookmark | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<BookmarkRow>('SELECT * FROM bookmarks WHERE id = ?', id);
    if (!row) {
      return null;
    }
    return this.mapRow(row);
  }

  async create(dto: CreateBookmarkDTO): Promise<Bookmark> {
    const db = await getDatabase();
    const existing = await db.getFirstAsync<{ id: string }>('SELECT id FROM bookmarks WHERE url = ?', dto.url);
    if (existing) {
      throw new Error('DUPLICATE_URL');
    }

    const metadata = await urlParser.parse(dto.url);
    const id = generateId();
    const now = Date.now();
    const title = resolveBookmarkTitle([metadata.title, metadata.sourceDomain], dto.url);

    await db.runAsync(
      `INSERT INTO bookmarks (
         id, url, title, description, image_url, author, source_type, source_domain,
         original_tags, published_at, learning_status, is_starred, is_archived, notes,
         created_at, read_at, read_count, deleted_at, last_resurfaced_at, resurface_count, updated_at
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'unread', 0, 0, ?, ?, NULL, 0, NULL, NULL, 0, ?)`,
      id,
      dto.url,
      title,
      metadata.description || '',
      normalizeImageUrl(metadata.imageUrl),
      metadata.author,
      metadata.sourceType,
      metadata.sourceDomain,
      JSON.stringify(metadata.originalTags || []),
      metadata.publishedAt || null,
      dto.notes || '',
      now,
      now,
    );

    if (dto.tags?.length) {
      for (const tagId of dto.tags) {
        await db.runAsync(
          'INSERT OR IGNORE INTO bookmark_tags (bookmark_id, tag_id) VALUES (?, ?)',
          id,
          tagId,
        );
      }
    }

    if (dto.folders?.length) {
      for (const folderId of dto.folders) {
        await db.runAsync(
          'INSERT OR IGNORE INTO bookmark_folders (bookmark_id, folder_id) VALUES (?, ?)',
          id,
          folderId,
        );
      }
    }

    await statsService.recordAddition();
    await syncAchievements();

    return (await this.getById(id))!;
  }

  async createPlaceholder(dto: CreateBookmarkDTO): Promise<Bookmark> {
    const db = await getDatabase();
    const existing = await db.getFirstAsync<{ id: string }>('SELECT id FROM bookmarks WHERE url = ?', dto.url);
    if (existing) {
      throw new Error('DUPLICATE_URL');
    }

    const id = generateId();
    const now = Date.now();
    const sourceDomain = urlParser.detectSourceDomain(dto.url);
    const sourceType = urlParser.detectSourceType(dto.url);
    const title = resolveBookmarkTitle([sourceDomain], dto.url);

    await db.runAsync(
      `INSERT INTO bookmarks (
         id, url, title, description, image_url, author, source_type, source_domain,
         original_tags, published_at, learning_status, is_starred, is_archived, notes,
         created_at, read_at, read_count, deleted_at, last_resurfaced_at, resurface_count, updated_at
       )
       VALUES (?, ?, ?, '', NULL, NULL, ?, ?, '[]', NULL, 'unread', 0, 0, ?, ?, NULL, 0, NULL, NULL, 0, ?)`,
      id,
      dto.url,
      title,
      sourceType,
      sourceDomain,
      dto.notes || '',
      now,
      now,
    );

    if (dto.tags?.length) {
      for (const tagId of dto.tags) {
        await db.runAsync(
          'INSERT OR IGNORE INTO bookmark_tags (bookmark_id, tag_id) VALUES (?, ?)',
          id,
          tagId,
        );
      }
    }

    if (dto.folders?.length) {
      for (const folderId of dto.folders) {
        await db.runAsync(
          'INSERT OR IGNORE INTO bookmark_folders (bookmark_id, folder_id) VALUES (?, ?)',
          id,
          folderId,
        );
      }
    }

    await statsService.recordAddition();
    await syncAchievements();

    return (await this.getById(id))!;
  }

  enqueueMetadataHydration(id: string): void {
    if (!metadataQueue.includes(id)) {
      metadataQueue.push(id);
    }

    if (!metadataQueueRunning) {
      metadataQueueRunning = true;
      this.runMetadataQueue();
    }
  }

  async update(
    id: string,
    data: Partial<Pick<Bookmark, 'title' | 'notes'>> & {
      tagIds?: string[];
      folderIds?: string[];
    },
  ): Promise<Bookmark> {
    const db = await getDatabase();
    const now = Date.now();
    const updates: string[] = ['updated_at = ?'];
    const params: Array<string | number> = [now];

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

    if (data.tagIds) {
      await db.runAsync('DELETE FROM bookmark_tags WHERE bookmark_id = ?', id);
      for (const tagId of data.tagIds) {
        await db.runAsync(
          'INSERT OR IGNORE INTO bookmark_tags (bookmark_id, tag_id) VALUES (?, ?)',
          id,
          tagId,
        );
      }
    }

    if (data.folderIds) {
      await db.runAsync('DELETE FROM bookmark_folders WHERE bookmark_id = ?', id);
      for (const folderId of data.folderIds) {
        await db.runAsync(
          'INSERT OR IGNORE INTO bookmark_folders (bookmark_id, folder_id) VALUES (?, ?)',
          id,
          folderId,
        );
      }
    }

    return (await this.getById(id))!;
  }

  async hydrateMetadataIfNeeded(id: string): Promise<Bookmark | null> {
    const db = await getDatabase();
    const bookmark = await this.getById(id);
    if (!bookmark) {
      return null;
    }

    const shouldRefresh =
      !hasMeaningfulText(bookmark.title) ||
      bookmark.title === bookmark.sourceDomain ||
      bookmark.title === bookmark.url ||
      !bookmark.imageUrl ||
      !bookmark.author ||
      !bookmark.description ||
      bookmark.originalTags.length === 0 ||
      !bookmark.publishedAt;

    if (!shouldRefresh) {
      return bookmark;
    }

    const metadata = await urlParser.parse(bookmark.url);
    const now = Date.now();

    await db.runAsync(
      `UPDATE bookmarks
       SET title = ?, description = ?, image_url = ?, author = ?, source_type = ?, source_domain = ?,
           original_tags = ?, published_at = ?, updated_at = ?
       WHERE id = ?`,
      resolveBookmarkTitle([metadata.title, bookmark.title, bookmark.sourceDomain], bookmark.url),
      metadata.description || bookmark.description,
      normalizeImageUrl(metadata.imageUrl),
      metadata.author || bookmark.author,
      metadata.sourceType || bookmark.sourceType,
      metadata.sourceDomain || bookmark.sourceDomain,
      JSON.stringify(metadata.originalTags || bookmark.originalTags || []),
      metadata.publishedAt || bookmark.publishedAt,
      now,
      id,
    );

    return this.getById(id);
  }

  private async runMetadataQueue(): Promise<void> {
    while (metadataQueue.length > 0) {
      const id = metadataQueue.shift();
      if (!id) {
        continue;
      }

      try {
        await this.hydrateMetadataIfNeeded(id);
      } catch {
        // Metadata can be retried later by opening the bookmark detail page.
      }
    }

    metadataQueueRunning = false;
  }

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    const now = Date.now();
    await db.runAsync(
      'UPDATE bookmarks SET deleted_at = ?, updated_at = ? WHERE id = ?',
      now,
      now,
      id,
    );
  }

  async restore(id: string): Promise<Bookmark> {
    const db = await getDatabase();
    const now = Date.now();
    await db.runAsync(
      "UPDATE bookmarks SET deleted_at = NULL, learning_status = 'unread', is_archived = 0, read_at = NULL, updated_at = ? WHERE id = ?",
      now,
      id,
    );
    return (await this.getById(id))!;
  }

  async archive(id: string): Promise<Bookmark> {
    const db = await getDatabase();
    const now = Date.now();
    await db.runAsync(
      'UPDATE bookmarks SET is_archived = 1, deleted_at = NULL, updated_at = ? WHERE id = ?',
      now,
      id,
    );
    return (await this.getById(id))!;
  }

  async unarchive(id: string): Promise<Bookmark> {
    const db = await getDatabase();
    const now = Date.now();
    await db.runAsync(
      "UPDATE bookmarks SET is_archived = 0, learning_status = CASE WHEN learning_status = 'read' THEN 'unread' ELSE learning_status END, read_at = CASE WHEN learning_status = 'read' THEN NULL ELSE read_at END, updated_at = ? WHERE id = ?",
      now,
      id,
    );
    return (await this.getById(id))!;
  }

  async toggleStar(id: string): Promise<Bookmark> {
    const db = await getDatabase();
    const now = Date.now();
    await db.runAsync(
      'UPDATE bookmarks SET is_starred = CASE WHEN is_starred = 1 THEN 0 ELSE 1 END, updated_at = ? WHERE id = ?',
      now,
      id,
    );
    return (await this.getById(id))!;
  }

  async toggleStatus(id: string): Promise<Bookmark> {
    const db = await getDatabase();
    const bookmark = await this.getById(id);
    if (!bookmark) {
      throw new Error('NOT_FOUND');
    }

    const now = Date.now();
    const nextStatus: LearningStatus = bookmark.learningStatus === 'unread' ? 'read' : 'unread';

    if (nextStatus === 'read') {
      await db.runAsync(
        `UPDATE bookmarks
         SET learning_status = 'read', read_at = ?, read_count = read_count + 1, is_archived = 1, deleted_at = NULL, updated_at = ?
         WHERE id = ?`,
        now,
        now,
        id,
      );
      await statsService.recordRead();
      await syncAchievements();
    } else {
      await db.runAsync(
        `UPDATE bookmarks
         SET learning_status = 'unread', read_at = NULL, is_archived = 0, updated_at = ?
         WHERE id = ?`,
        now,
        id,
      );
    }

    return (await this.getById(id))!;
  }

  async incrementReadCount(id: string): Promise<Bookmark> {
    const db = await getDatabase();
    const now = Date.now();
    await db.runAsync(
      'UPDATE bookmarks SET read_count = read_count + 1, updated_at = ? WHERE id = ?',
      now,
      id,
    );
    return (await this.getById(id))!;
  }

  async search(query: string): Promise<Bookmark[]> {
    return this.getAll({ scope: 'all', searchQuery: query });
  }

  async getByTag(tagId: string): Promise<Bookmark[]> {
    return this.getAll({ scope: 'all', tagId });
  }

  async getBySource(sourceType: BookmarkFilter['sourceType']): Promise<Bookmark[]> {
    return this.getAll({ scope: 'all', sourceType });
  }

  async getSidebarStats(): Promise<SidebarStats> {
    const db = await getDatabase();
    const startOfToday = new Date(new Date().setHours(0, 0, 0, 0)).getTime();

    const row = await db.getFirstAsync<SidebarStats & { untagged_count: number }>(
      `
        SELECT
          SUM(CASE WHEN b.deleted_at IS NULL AND b.learning_status <> 'read' AND b.is_archived = 0 THEN 1 ELSE 0 END) AS allCount,
          SUM(CASE WHEN b.deleted_at IS NULL AND b.learning_status = 'unread' AND b.is_archived = 0 THEN 1 ELSE 0 END) AS unreadCount,
          SUM(CASE WHEN b.deleted_at IS NULL AND b.is_starred = 1 THEN 1 ELSE 0 END) AS starredCount,
          SUM(CASE WHEN b.deleted_at IS NULL AND b.created_at >= ? AND b.learning_status <> 'read' AND b.is_archived = 0 THEN 1 ELSE 0 END) AS todayCount,
          SUM(CASE WHEN b.deleted_at IS NULL AND (TRIM(IFNULL(b.notes, '')) <> '' OR EXISTS (SELECT 1 FROM notes n WHERE n.bookmark_id = b.id)) THEN 1 ELSE 0 END) AS noteCount,
          SUM(CASE WHEN b.deleted_at IS NULL AND (b.is_archived = 1 OR b.learning_status = 'read') THEN 1 ELSE 0 END) AS archivedCount,
          SUM(CASE WHEN b.deleted_at IS NOT NULL THEN 1 ELSE 0 END) AS deletedCount,
          SUM(CASE WHEN b.deleted_at IS NULL AND NOT EXISTS (SELECT 1 FROM bookmark_tags bt WHERE bt.bookmark_id = b.id) AND b.learning_status <> 'read' AND b.is_archived = 0 THEN 1 ELSE 0 END) AS untaggedCount
        FROM bookmarks b
      `,
      startOfToday,
    );

    return {
      allCount: row?.allCount || 0,
      unreadCount: row?.unreadCount || 0,
      starredCount: row?.starredCount || 0,
      todayCount: row?.todayCount || 0,
      noteCount: row?.noteCount || 0,
      untaggedCount: row?.untaggedCount || 0,
      archivedCount: row?.archivedCount || 0,
      deletedCount: row?.deletedCount || 0,
    };
  }

  async getByTimeline(): Promise<TimelineGroup[]> {
    const bookmarks = await this.getAll({ scope: 'active', sortBy: 'createdAt', sortOrder: 'desc' });
    const groups = new Map<string, Bookmark[]>();
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 86400000;
    const weekAgo = today - 7 * 86400000;

    for (const bookmark of bookmarks) {
      const createdDate = new Date(bookmark.createdAt);
      const createdDay = new Date(
        createdDate.getFullYear(),
        createdDate.getMonth(),
        createdDate.getDate(),
      ).getTime();

      let label = '更早';
      if (createdDay === today) {
        label = '今天';
      } else if (createdDay === yesterday) {
        label = '昨天';
      } else if (createdDay >= weekAgo) {
        label = '本周';
      }

      if (!groups.has(label)) {
        groups.set(label, []);
      }
      groups.get(label)!.push(bookmark);
    }

    return ['今天', '昨天', '本周', '更早']
      .filter((label) => groups.has(label))
      .map((date) => ({ date, items: groups.get(date)! }));
  }

  async exists(url: string): Promise<boolean> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ id: string }>('SELECT id FROM bookmarks WHERE url = ?', url);
    return Boolean(row);
  }

  private async mapRow(row: BookmarkRow): Promise<Bookmark> {
    const [tags, folders, noteCount] = await Promise.all([
      this.getTagsForBookmark(row.id),
      this.getFoldersForBookmark(row.id),
      this.getNoteCount(row.id),
    ]);

    return {
      id: row.id,
      url: row.url,
      title: row.title,
      description: row.description || '',
      imageUrl: normalizeImageUrl(row.image_url),
      author: row.author || null,
      sourceType: row.source_type,
      sourceDomain: row.source_domain,
      originalTags: this.parseOriginalTags(row.original_tags),
      publishedAt: row.published_at || null,
      learningStatus: row.learning_status,
      isStarred: Boolean(row.is_starred),
      isArchived: Boolean(row.is_archived) || row.learning_status === 'read',
      notes: row.notes,
      createdAt: row.created_at,
      readAt: row.read_at,
      readCount: row.read_count || 0,
      deletedAt: row.deleted_at || null,
      lastResurfacedAt: row.last_resurfaced_at,
      resurfaceCount: row.resurface_count,
      updatedAt: row.updated_at,
      tags,
      folders,
      noteCount,
    };
  }

  private async getTagsForBookmark(bookmarkId: string): Promise<Tag[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      `
        SELECT
          t.*,
          (
            SELECT COUNT(*)
            FROM bookmark_tags bt2
            INNER JOIN bookmarks b2 ON b2.id = bt2.bookmark_id
            WHERE bt2.tag_id = t.id AND b2.deleted_at IS NULL
          ) AS bookmark_count
        FROM tags t
        INNER JOIN bookmark_tags bt ON bt.tag_id = t.id
        WHERE bt.bookmark_id = ?
        ORDER BY t.created_at DESC
      `,
      bookmarkId,
    );

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      color: row.color,
      createdAt: row.created_at,
      bookmarkCount: row.bookmark_count || 0,
    }));
  }

  private async getFoldersForBookmark(bookmarkId: string): Promise<Folder[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<any>(
      `
        SELECT
          f.*,
          (
            SELECT COUNT(*)
            FROM bookmark_folders bf2
            INNER JOIN bookmarks b2 ON b2.id = bf2.bookmark_id
            WHERE bf2.folder_id = f.id AND b2.deleted_at IS NULL
          ) AS bookmark_count
        FROM folders f
        INNER JOIN bookmark_folders bf ON bf.folder_id = f.id
        WHERE bf.bookmark_id = ?
        ORDER BY f.created_at DESC
      `,
      bookmarkId,
    );

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      createdAt: row.created_at,
      bookmarkCount: row.bookmark_count || 0,
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

  private parseOriginalTags(value: unknown): string[] {
    if (!value || typeof value !== 'string') {
      return [];
    }

    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
    } catch {
      return [];
    }
  }
}
