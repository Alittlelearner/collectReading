"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = void 0;
const database_1 = require("../db/database");
class SettingsService {
    async getValue(key, fallback) {
        const db = await (0, database_1.getDatabase)();
        const row = await db.getFirstAsync('SELECT value FROM user_settings WHERE key = ?', key);
        return row?.value ?? fallback;
    }
    async setValue(key, value) {
        const db = await (0, database_1.getDatabase)();
        await db.runAsync('INSERT OR REPLACE INTO user_settings (key, value) VALUES (?, ?)', key, value);
    }
}
exports.SettingsService = SettingsService;
