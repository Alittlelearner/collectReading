import type { AppDatabase } from './database';
import { collectBackupPayload, normalizeBackupPayload, restoreBackupPayload } from './backupPayload';

const BACKUP_KEY = 'collectionRead:web-sqlite-backup:v1';
const BACKUP_DEBOUNCE_MS = 600;
const LEGACY_WEB_SQLITE_DATABASES = ['bookmarks.db'];
const USER_DATA_TABLES = [
  'bookmarks',
  'tags',
  'folders',
  'notes',
  'daily_stats',
  'wiki_spaces',
  'library_items',
  'markdown_notes',
  'note_assets',
] as const;
const RESTORABLE_TABLES = [
  'bookmarks',
  'tags',
  'folders',
  'notes',
  'dailyStats',
  'achievements',
  'userSettings',
  'wikiSpaces',
  'libraryItems',
  'markdownNotes',
  'noteAssets',
] as const;

let backupSyncEnabled = false;
let backupTimer: ReturnType<typeof setTimeout> | null = null;

function isWebStorageAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function enableWebBackupSync(): void {
  backupSyncEnabled = true;
}

export function disableWebBackupSync(): void {
  backupSyncEnabled = false;
  if (backupTimer) {
    clearTimeout(backupTimer);
    backupTimer = null;
  }
}

export function clearWebBackup(): void {
  if (!isWebStorageAvailable()) {
    return;
  }
  window.localStorage.removeItem(BACKUP_KEY);
}

export function scheduleWebBackup(db: AppDatabase): void {
  if (!backupSyncEnabled || !isWebStorageAvailable()) {
    return;
  }

  if (backupTimer) {
    clearTimeout(backupTimer);
  }

  backupTimer = setTimeout(() => {
    backupTimer = null;
    writeWebBackup(db).catch((err) => {
      console.warn('[webPersistence] Failed to write backup', err);
    });
  }, BACKUP_DEBOUNCE_MS);
}

export async function restoreFromWebBackupIfNeeded(db: AppDatabase): Promise<boolean> {
  if (!isWebStorageAvailable()) {
    return false;
  }

  if (await hasUserData(db)) {
    return false;
  }

  const raw = window.localStorage.getItem(BACKUP_KEY);
  if (!raw) {
    return false;
  }

  let rawBackup: unknown;
  try {
    rawBackup = JSON.parse(raw);
  } catch {
    return false;
  }

  const backup = normalizeBackupPayload(rawBackup);
  if (!backup || !hasRestorableRows(backup.tables)) {
    return false;
  }

  await restoreBackupPayload(db, backup);
  return true;
}

export async function restoreFromLegacyWebSQLiteIfNeeded(db: AppDatabase): Promise<boolean> {
  if (!isWebStorageAvailable()) {
    return false;
  }

  if (await hasUserData(db)) {
    return false;
  }

  for (const databaseName of LEGACY_WEB_SQLITE_DATABASES) {
    const restored = await restoreFromLegacyWebSQLite(db, databaseName);
    if (restored) {
      return true;
    }
  }

  return false;
}

async function restoreFromLegacyWebSQLite(db: AppDatabase, databaseName: string): Promise<boolean> {
  let legacyDb: AppDatabase | null = null;

  try {
    const SQLite = await import('expo-sqlite');
    legacyDb = await SQLite.openDatabaseAsync(databaseName);

    if (await isDatabaseEmpty(legacyDb)) {
      return false;
    }

    const backup = await collectBackupPayload(legacyDb);
    if (!hasRestorableRows(backup.tables)) {
      return false;
    }

    await restoreBackupPayload(db, backup);
    console.info(`[webPersistence] Restored data from legacy Web SQLite database ${databaseName}`);
    return true;
  } catch (err) {
    console.warn(`[webPersistence] Failed to restore legacy Web SQLite database ${databaseName}`, err);
    return false;
  } finally {
    await legacyDb?.closeAsync().catch(() => undefined);
  }
}

async function isDatabaseEmpty(db: AppDatabase): Promise<boolean> {
  const counts = await Promise.all([
    countRows(db, 'bookmarks'),
    countRows(db, 'tags'),
    countRows(db, 'folders'),
    countRows(db, 'notes'),
    countRows(db, 'daily_stats'),
    countRows(db, 'achievements'),
    countRows(db, 'user_settings'),
    countRows(db, 'wiki_spaces'),
    countRows(db, 'library_items'),
    countRows(db, 'markdown_notes'),
    countRows(db, 'note_assets'),
  ]);

  return counts.every((count) => count === 0);
}

function hasRestorableRows(tables: Record<string, any[]>): boolean {
  return RESTORABLE_TABLES.some((tableName) => (tables[tableName]?.length || 0) > 0);
}

async function hasUserData(db: AppDatabase): Promise<boolean> {
  const counts = await Promise.all(USER_DATA_TABLES.map((tableName) => countRows(db, tableName)));
  return counts.some((count) => count > 0);
}

async function countRows(db: AppDatabase, tableName: string): Promise<number> {
  try {
    const row = await db.getFirstAsync<{ count: number }>(`SELECT COUNT(*) as count FROM ${tableName}`);
    return row?.count || 0;
  } catch {
    return 0;
  }
}

async function writeWebBackup(db: AppDatabase): Promise<void> {
  if (!isWebStorageAvailable()) {
    return;
  }

  const payload = await collectBackupPayload(db);
  window.localStorage.setItem(BACKUP_KEY, JSON.stringify(payload));
}
