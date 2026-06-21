"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookmarkService = void 0;
const database_1 = require("../db/database");
const urlParserService_1 = require("./urlParserService");
const statsService_1 = require("./statsService");
const achievementSyncService_1 = require("./achievementSyncService");
const uuid_1 = require("../utils/uuid");
const media_1 = require("../utils/media");
const urlParser = new urlParserService_1.URLParserService();
const statsService = new statsService_1.StatsService();
function hasMeaningfulText(value) {
    if (!value || typeof value !== 'string') {
        return false;
    }
    const trimmed = value.trim();
    return Boolean(trimmed && trimmed !== '-' && trimmed !== '--' && trimmed !== '—');
}
function resolveBookmarkTitle(candidates, fallback) {
    const match = candidates.find((candidate) => hasMeaningfulText(candidate));
    return match?.trim() || fallback;
}
class BookmarkService {
    async getAll(filters) {
        const db = await (0, database_1.getDatabase)();
        let query = 'SELECT * FROM bookmarks WHERE 1=1';
        const params = [];
        if (filters?.sourceType) {
            query += ' AND source_type = ?';
            params.push(filters.sourceType);
        }
        if (filters?.status) {
            query += ' AND learning_status = ?';
            params.push(filters.status);
        }
        if (filters?.searchQuery) {
            query += ' AND (title LIKE ? OR notes LIKE ? OR description LIKE ? OR author LIKE ? OR original_tags LIKE ?)';
            const like = `%${filters.searchQuery}%`;
            params.push(like, like, like, like, like);
        }
        const sortBy = filters?.sortBy || 'created_at';
        const sortOrder = filters?.sortOrder || 'desc';
        const validSortColumns = ['created_at', 'title', 'updated_at'];
        const column = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
        query += ` ORDER BY ${column} ${sortOrder === 'asc' ? 'ASC' : 'DESC'}`;
        const rows = await db.getAllAsync(query, ...params);
        const bookmarks = await Promise.all(rows.map((row) => this.mapRow(row)));
        if (filters?.tagId) {
            const taggedIds = await this.getBookmarkIdsByTag(filters.tagId);
            return bookmarks.filter((b) => taggedIds.includes(b.id));
        }
        return bookmarks;
    }
    async getById(id) {
        const db = await (0, database_1.getDatabase)();
        const row = await db.getFirstAsync('SELECT * FROM bookmarks WHERE id = ?', id);
        if (!row)
            return null;
        return this.mapRow(row);
    }
    async create(dto) {
        const db = await (0, database_1.getDatabase)();
        const existing = await db.getFirstAsync('SELECT id FROM bookmarks WHERE url = ?', dto.url);
        if (existing) {
            throw new Error('DUPLICATE_URL');
        }
        const metadata = await urlParser.parse(dto.url);
        const id = (0, uuid_1.generateId)();
        const now = Date.now();
        const title = resolveBookmarkTitle([metadata.title, metadata.sourceDomain], dto.url);
        await db.runAsync(`INSERT INTO bookmarks (
         id, url, title, description, image_url, author, source_type, source_domain,
         original_tags, published_at, learning_status, notes, created_at, updated_at
       )
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'unread', ?, ?, ?)`, id, dto.url, title, metadata.description || '', (0, media_1.normalizeImageUrl)(metadata.imageUrl), metadata.author, metadata.sourceType, metadata.sourceDomain, JSON.stringify(metadata.originalTags || []), metadata.publishedAt || null, dto.notes || '', now, now);
        if (dto.tags && dto.tags.length > 0) {
            for (const tagId of dto.tags) {
                await db.runAsync('INSERT OR IGNORE INTO bookmark_tags (bookmark_id, tag_id) VALUES (?, ?)', id, tagId);
            }
        }
        await statsService.recordAddition();
        await (0, achievementSyncService_1.syncAchievements)();
        return (await this.getById(id));
    }
    async update(id, data) {
        const db = await (0, database_1.getDatabase)();
        const now = Date.now();
        const updates = ['updated_at = ?'];
        const params = [now];
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
        return (await this.getById(id));
    }
    async hydrateMetadataIfNeeded(id) {
        const db = await (0, database_1.getDatabase)();
        const bookmark = await this.getById(id);
        if (!bookmark)
            return null;
        const shouldRefresh = !hasMeaningfulText(bookmark.title) ||
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
        await db.runAsync(`UPDATE bookmarks
       SET title = ?, description = ?, image_url = ?, author = ?, source_type = ?, source_domain = ?,
           original_tags = ?, published_at = ?, updated_at = ?
       WHERE id = ?`, resolveBookmarkTitle([metadata.title, bookmark.title, bookmark.sourceDomain], bookmark.url), metadata.description || bookmark.description, (0, media_1.normalizeImageUrl)(metadata.imageUrl), metadata.author || bookmark.author, metadata.sourceType || bookmark.sourceType, metadata.sourceDomain || bookmark.sourceDomain, JSON.stringify(metadata.originalTags || bookmark.originalTags || []), metadata.publishedAt || bookmark.publishedAt, now, id);
        return this.getById(id);
    }
    async delete(id) {
        const db = await (0, database_1.getDatabase)();
        await db.runAsync('DELETE FROM bookmarks WHERE id = ?', id);
    }
    async toggleStatus(id) {
        const db = await (0, database_1.getDatabase)();
        const bookmark = await this.getById(id);
        if (!bookmark)
            throw new Error('NOT_FOUND');
        const newStatus = bookmark.learningStatus === 'unread' ? 'read' : 'unread';
        const now = Date.now();
        if (newStatus === 'read') {
            await db.runAsync('UPDATE bookmarks SET learning_status = ?, read_at = ?, read_count = read_count + 1, updated_at = ? WHERE id = ?', newStatus, now, now, id);
            await statsService.recordRead();
            await (0, achievementSyncService_1.syncAchievements)();
        }
        else {
            await db.runAsync('UPDATE bookmarks SET learning_status = ?, read_at = NULL, updated_at = ? WHERE id = ?', newStatus, now, id);
        }
        return (await this.getById(id));
    }
    async incrementReadCount(id) {
        const db = await (0, database_1.getDatabase)();
        const now = Date.now();
        await db.runAsync('UPDATE bookmarks SET read_count = read_count + 1, updated_at = ? WHERE id = ?', now, id);
        return (await this.getById(id));
    }
    async search(query) {
        return this.getAll({ searchQuery: query });
    }
    async getByTag(tagId) {
        return this.getAll({ tagId });
    }
    async getBySource(sourceType) {
        return this.getAll({ sourceType });
    }
    async getByTimeline() {
        const bookmarks = await this.getAll({ sortBy: 'createdAt', sortOrder: 'desc' });
        const groups = new Map();
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const yesterday = today - 86400000;
        const weekAgo = today - 7 * 86400000;
        for (const b of bookmarks) {
            const createdDate = new Date(b.createdAt);
            const createdDay = new Date(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate()).getTime();
            let label;
            if (createdDay === today) {
                label = '今天';
            }
            else if (createdDay === yesterday) {
                label = '昨天';
            }
            else if (createdDay >= weekAgo) {
                label = '本周';
            }
            else {
                label = '更早';
            }
            if (!groups.has(label))
                groups.set(label, []);
            groups.get(label).push(b);
        }
        const order = ['今天', '昨天', '本周', '更早'];
        return order
            .filter((label) => groups.has(label))
            .map((date) => ({ date, items: groups.get(date) }));
    }
    async exists(url) {
        const db = await (0, database_1.getDatabase)();
        const row = await db.getFirstAsync('SELECT id FROM bookmarks WHERE url = ?', url);
        return !!row;
    }
    async getBookmarkIdsByTag(tagId) {
        const db = await (0, database_1.getDatabase)();
        const rows = await db.getAllAsync('SELECT bookmark_id FROM bookmark_tags WHERE tag_id = ?', tagId);
        return rows.map((r) => r.bookmark_id);
    }
    async mapRow(row) {
        const tags = await this.getTagsForBookmark(row.id);
        const noteCount = await this.getNoteCount(row.id);
        return {
            id: row.id,
            url: row.url,
            title: row.title,
            description: row.description || '',
            imageUrl: (0, media_1.normalizeImageUrl)(row.image_url),
            author: row.author || null,
            sourceType: row.source_type,
            sourceDomain: row.source_domain,
            originalTags: this.parseOriginalTags(row.original_tags),
            publishedAt: row.published_at || null,
            learningStatus: row.learning_status,
            notes: row.notes,
            createdAt: row.created_at,
            readAt: row.read_at,
            readCount: row.read_count || 0,
            lastResurfacedAt: row.last_resurfaced_at,
            resurfaceCount: row.resurface_count,
            updatedAt: row.updated_at,
            tags,
            noteCount,
        };
    }
    async getTagsForBookmark(bookmarkId) {
        const db = await (0, database_1.getDatabase)();
        const rows = await db.getAllAsync(`SELECT t.*, (SELECT COUNT(*) FROM bookmark_tags bt WHERE bt.tag_id = t.id) as bookmark_count
       FROM tags t
       INNER JOIN bookmark_tags bt ON bt.tag_id = t.id
       WHERE bt.bookmark_id = ?`, bookmarkId);
        return rows.map((r) => ({
            id: r.id,
            name: r.name,
            color: r.color,
            createdAt: r.created_at,
            bookmarkCount: r.bookmark_count || 0,
        }));
    }
    async getNoteCount(bookmarkId) {
        const db = await (0, database_1.getDatabase)();
        const row = await db.getFirstAsync('SELECT COUNT(*) as count FROM notes WHERE bookmark_id = ?', bookmarkId);
        return row?.count || 0;
    }
    parseOriginalTags(value) {
        if (!value || typeof value !== 'string')
            return [];
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
        }
        catch {
            return [];
        }
    }
}
exports.BookmarkService = BookmarkService;
