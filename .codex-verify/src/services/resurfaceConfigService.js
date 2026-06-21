"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResurfaceConfigService = void 0;
const database_1 = require("../db/database");
const DEFAULT_CONFIG = {
    dailyLimit: 3,
    maxPerItem: 5,
    cooldownDays: 7,
};
class ResurfaceConfigService {
    async getConfig() {
        const db = await (0, database_1.getDatabase)();
        const rows = await db.getAllAsync('SELECT * FROM user_settings');
        const map = new Map(rows.map((row) => [row.key, row.value]));
        return {
            dailyLimit: this.toPositiveInt(map.get('resurface_daily_limit'), DEFAULT_CONFIG.dailyLimit),
            maxPerItem: this.toPositiveInt(map.get('resurface_max_per_item'), DEFAULT_CONFIG.maxPerItem),
            cooldownDays: this.toPositiveInt(map.get('resurface_cooldown_days'), DEFAULT_CONFIG.cooldownDays),
        };
    }
    toPositiveInt(value, fallback) {
        const parsed = Number.parseInt(value || '', 10);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
    }
}
exports.ResurfaceConfigService = ResurfaceConfigService;
