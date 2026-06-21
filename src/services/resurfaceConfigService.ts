import { getDatabase } from '../db/database';

export interface ResurfaceConfig {
  dailyLimit: number;
  maxPerItem: number;
  cooldownDays: number;
}

const DEFAULT_CONFIG: ResurfaceConfig = {
  dailyLimit: 3,
  maxPerItem: 5,
  cooldownDays: 7,
};

export class ResurfaceConfigService {
  async getConfig(): Promise<ResurfaceConfig> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<{ key: string; value: string }>('SELECT * FROM user_settings');
    const map = new Map(rows.map((row) => [row.key, row.value]));

    return {
      dailyLimit: this.toPositiveInt(map.get('resurface_daily_limit'), DEFAULT_CONFIG.dailyLimit),
      maxPerItem: this.toPositiveInt(map.get('resurface_max_per_item'), DEFAULT_CONFIG.maxPerItem),
      cooldownDays: this.toPositiveInt(map.get('resurface_cooldown_days'), DEFAULT_CONFIG.cooldownDays),
    };
  }

  private toPositiveInt(value: string | undefined, fallback: number): number {
    const parsed = Number.parseInt(value || '', 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  }
}
