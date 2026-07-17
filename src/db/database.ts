import type { SQLiteDatabase } from 'expo-sqlite';
import { Platform } from 'react-native';
import { createRemoteDatabase, getRemoteDatabaseUrl } from './remoteDatabase';
import { scheduleWebBackup } from './webPersistence';

export type AppDatabase = Pick<
  SQLiteDatabase,
  'runAsync' | 'getAllAsync' | 'getFirstAsync' | 'execAsync' | 'closeAsync'
>;

const DATABASE_NAME = 'collection-read.global.db';

let db: AppDatabase | null = null;

export async function getDatabase(): Promise<AppDatabase> {
  if (!db) {
    if (Platform.OS === 'web') {
      const remoteDb = await tryOpenRemoteDatabase();
      if (remoteDb) {
        db = remoteDb;
        return db;
      }
    }

    const SQLite = await import('expo-sqlite');
    const rawDb = await SQLite.openDatabaseAsync(DATABASE_NAME);
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

async function tryOpenRemoteDatabase(): Promise<AppDatabase | null> {
  const url = getRemoteDatabaseUrl();
  if (!url) {
    return null;
  }

  try {
    const remoteDb = await createRemoteDatabase(url, () => {
      if (db) {
        scheduleWebBackup(db);
      }
    });
    console.info(`[database] Using global SQLite database at ${url}`);
    return remoteDb;
  } catch (err) {
    console.warn(
      `[database] Global SQLite service unavailable at ${url}; falling back to browser SQLite cache.`,
      err,
    );
    return null;
  }
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.closeAsync();
  }
  db = null;
}
