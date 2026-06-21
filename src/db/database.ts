import type { SQLiteDatabase } from 'expo-sqlite';
import { scheduleWebBackup } from './webPersistence';

export type AppDatabase = Pick<
  SQLiteDatabase,
  'runAsync' | 'getAllAsync' | 'getFirstAsync' | 'execAsync' | 'closeAsync'
>;

let db: AppDatabase | null = null;

export async function getDatabase(): Promise<AppDatabase> {
  if (!db) {
    const SQLite = await import('expo-sqlite');
    const rawDb = await SQLite.openDatabaseAsync('bookmarks.db');
    db = {
      runAsync: async (...args: any[]) => {
        const result = await (rawDb.runAsync as any)(...args);
        scheduleWebBackup(db!);
        return result;
      },
      execAsync: async (...args: any[]) => {
        const result = await (rawDb.execAsync as any)(...args);
        scheduleWebBackup(db!);
        return result;
      },
      getAllAsync: rawDb.getAllAsync.bind(rawDb),
      getFirstAsync: rawDb.getFirstAsync.bind(rawDb),
      closeAsync: rawDb.closeAsync.bind(rawDb),
    } as AppDatabase;
  }
  return db!;
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
  }
  db = null;
}
