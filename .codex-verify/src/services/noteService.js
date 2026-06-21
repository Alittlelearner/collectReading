"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoteService = void 0;
const database_1 = require("../db/database");
const achievementSyncService_1 = require("./achievementSyncService");
const uuid_1 = require("../utils/uuid");
class NoteService {
    async getByBookmark(bookmarkId) {
        const db = await (0, database_1.getDatabase)();
        const rows = await db.getAllAsync('SELECT * FROM notes WHERE bookmark_id = ? ORDER BY updated_at DESC', bookmarkId);
        return rows.map((r) => ({
            id: r.id,
            bookmarkId: r.bookmark_id,
            content: r.content,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
        }));
    }
    async create(bookmarkId, content) {
        const db = await (0, database_1.getDatabase)();
        const id = (0, uuid_1.generateId)();
        const now = Date.now();
        await db.runAsync('INSERT INTO notes (id, bookmark_id, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?)', id, bookmarkId, content, now, now);
        await (0, achievementSyncService_1.syncAchievements)();
        return {
            id,
            bookmarkId,
            content,
            createdAt: now,
            updatedAt: now,
        };
    }
    async update(id, content) {
        const db = await (0, database_1.getDatabase)();
        const now = Date.now();
        await db.runAsync('UPDATE notes SET content = ?, updated_at = ? WHERE id = ?', content, now, id);
        return {
            id,
            bookmarkId: '',
            content,
            createdAt: 0,
            updatedAt: now,
        };
    }
    async delete(id) {
        const db = await (0, database_1.getDatabase)();
        await db.runAsync('DELETE FROM notes WHERE id = ?', id);
    }
}
exports.NoteService = NoteService;
