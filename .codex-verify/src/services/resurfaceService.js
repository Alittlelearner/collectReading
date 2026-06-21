"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResurfaceService = void 0;
const database_1 = require("../db/database");
const statsService_1 = require("./statsService");
const achievementSyncService_1 = require("./achievementSyncService");
const resurfaceConfigService_1 = require("./resurfaceConfigService");
const resurfacePolicy_1 = require("./resurfacePolicy");
const statsService = new statsService_1.StatsService();
const configService = new resurfaceConfigService_1.ResurfaceConfigService();
const policy = new resurfacePolicy_1.ResurfacePolicy();
class ResurfaceService {
    async getResurfaceCandidates() {
        const db = await (0, database_1.getDatabase)();
        const config = await configService.getConfig();
        const rows = await db.getAllAsync(`SELECT * FROM bookmarks
       WHERE learning_status = 'unread'
       ORDER BY created_at ASC`);
        return policy
            .sort(rows.map((row) => this.mapRow(row)).filter((bookmark) => policy.isEligible(bookmark, config)))
            .slice(0, config.dailyLimit);
    }
    async markResurfaced(id) {
        const db = await (0, database_1.getDatabase)();
        const now = Date.now();
        await db.runAsync(`UPDATE bookmarks
       SET last_resurfaced_at = ?, resurface_count = resurface_count + 1, updated_at = ?
       WHERE id = ?`, now, now, id);
    }
    async markResurfaceSkipped(id) {
        await this.markResurfaced(id);
    }
    async markResurfaceDone(id) {
        const db = await (0, database_1.getDatabase)();
        const now = Date.now();
        await db.runAsync(`UPDATE bookmarks
       SET learning_status = 'read', read_at = ?, last_resurfaced_at = ?, read_count = read_count + 1, updated_at = ?
       WHERE id = ?`, now, now, now, id);
        await statsService.recordRead();
        await (0, achievementSyncService_1.syncAchievements)();
    }
    mapRow(row) {
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
            notes: row.notes,
            createdAt: row.created_at,
            readAt: row.read_at,
            readCount: row.read_count || 0,
            lastResurfacedAt: row.last_resurfaced_at,
            resurfaceCount: row.resurface_count,
            updatedAt: row.updated_at,
            tags: [],
            noteCount: 0,
        };
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
exports.ResurfaceService = ResurfaceService;
