import { getDatabase } from '../db/database';

export class SettingsService {
  async getValue(key: string, fallback: string): Promise<string> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ value: string }>(
      'SELECT value FROM user_settings WHERE key = ?',
      key,
    );
    return row?.value ?? fallback;
  }

  async setValue(key: string, value: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync(
      'INSERT OR REPLACE INTO user_settings (key, value) VALUES (?, ?)',
      key,
      value,
    );
  }
}
