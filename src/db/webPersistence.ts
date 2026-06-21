import type { AppDatabase } from './database';
import { collectBackupPayload, normalizeBackupPayload, restoreBackupPayload } from './backupPayload';

const BACKUP_KEY = 'collectionRead:web-sqlite-backup:v1';
const BACKUP_DEBOUNCE_MS = 600;

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

  const current = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM bookmarks');
  if ((current?.count || 0) > 0) {
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
  if (!backup || backup.tables.bookmarks.length === 0) {
    return false;
  }

  await restoreBackupPayload(db, backup);
  return true;
}

async function writeWebBackup(db: AppDatabase): Promise<void> {
  if (!isWebStorageAvailable()) {
    return;
  }

  const payload = await collectBackupPayload(db);
  window.localStorage.setItem(BACKUP_KEY, JSON.stringify(payload));
}
