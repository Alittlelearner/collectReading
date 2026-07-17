import type { DocumentPickerAsset } from 'expo-document-picker';
import { getDatabase } from '../db/database';
import { generateId } from '../utils/uuid';
import { LibraryItem, LibraryItemStatus } from '../types';
import {
  ensureLibraryDirectories,
  getBooksRootDir,
  getFileExtension,
  slugifyFileName,
  storePickedFile,
} from './libraryFileService';

type LibraryItemRow = {
  id: string;
  title: string;
  author: string | null;
  file_name: string;
  file_ext: string;
  mime_type: string | null;
  file_path: string;
  cover_path: string | null;
  file_size: number;
  source_uri: string | null;
  status: LibraryItemStatus;
  progress: number;
  current_location: string | null;
  imported_at: number;
  updated_at: number;
  deleted_at: number | null;
};

const SUPPORTED_EXTENSIONS = new Set([
  'pdf',
  'epub',
  'txt',
  'md',
  'markdown',
  'doc',
  'docx',
  'mobi',
  'azw3',
  'html',
  'htm',
]);

function inferTitle(fileName: string): string {
  return fileName.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim() || fileName;
}

export function isSupportedLibraryFile(fileName: string): boolean {
  return SUPPORTED_EXTENSIONS.has(getFileExtension(fileName));
}

export class LibraryService {
  async getAll(includeDeleted = false): Promise<LibraryItem[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<LibraryItemRow>(
      `SELECT * FROM library_items
       ${includeDeleted ? '' : 'WHERE deleted_at IS NULL'}
       ORDER BY updated_at DESC, imported_at DESC`,
    );
    return rows.map(this.mapRow);
  }

  async getById(id: string): Promise<LibraryItem | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<LibraryItemRow>('SELECT * FROM library_items WHERE id = ?', id);
    return row ? this.mapRow(row) : null;
  }

  async importAssets(assets: DocumentPickerAsset[]): Promise<LibraryItem[]> {
    await ensureLibraryDirectories();
    const imported: LibraryItem[] = [];
    console.info('[Library] Import requested', assets.map((asset) => ({
      name: asset.name,
      mimeType: asset.mimeType,
      size: asset.size,
    })));

    for (const asset of assets) {
      if (!isSupportedLibraryFile(asset.name)) {
        console.warn('[Library] Skipped unsupported file', asset.name);
        continue;
      }

      imported.push(await this.importOne(asset));
    }

    console.info('[Library] Import finished', {
      selected: assets.length,
      imported: imported.length,
    });
    return imported;
  }

  async updateStatus(id: string, status: LibraryItemStatus): Promise<LibraryItem> {
    const db = await getDatabase();
    const now = Date.now();
    await db.runAsync('UPDATE library_items SET status = ?, updated_at = ? WHERE id = ?', status, now, id);

    const updated = await this.getById(id);
    if (!updated) {
      throw new Error('NOT_FOUND');
    }
    return updated;
  }

  async updateProgress(id: string, progress: number, currentLocation?: string | null): Promise<LibraryItem> {
    const db = await getDatabase();
    const now = Date.now();
    await db.runAsync(
      'UPDATE library_items SET progress = ?, current_location = ?, updated_at = ? WHERE id = ?',
      Math.max(0, Math.min(1, progress)),
      currentLocation || null,
      now,
      id,
    );

    const updated = await this.getById(id);
    if (!updated) {
      throw new Error('NOT_FOUND');
    }
    return updated;
  }

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    const now = Date.now();
    await db.runAsync('UPDATE library_items SET deleted_at = ?, updated_at = ? WHERE id = ?', now, now, id);
  }

  private async importOne(asset: DocumentPickerAsset): Promise<LibraryItem> {
    const db = await getDatabase();
    const id = generateId();
    const now = Date.now();
    const title = inferTitle(asset.name);
    const bookDir = `${getBooksRootDir()}${id}-${slugifyFileName(title)}/`;
    const stored = await storePickedFile(asset, bookDir, 'bin');
    console.info('[Library] Stored file for import', {
      id,
      title,
      fileName: stored.fileName,
      fileExt: stored.fileExt,
      fileSize: stored.fileSize,
      filePath: stored.filePath,
    });

    await db.runAsync(
      `INSERT INTO library_items (
         id, title, author, file_name, file_ext, mime_type, file_path, cover_path,
         file_size, source_uri, status, progress, current_location, imported_at, updated_at, deleted_at
       )
       VALUES (?, ?, NULL, ?, ?, ?, ?, NULL, ?, ?, 'unread', 0, NULL, ?, ?, NULL)`,
      id,
      title,
      stored.fileName,
      stored.fileExt,
      asset.mimeType || null,
      stored.filePath,
      stored.fileSize,
      asset.uri || null,
      now,
      now,
    );

    const created = await this.getById(id);
    console.info('[Library] Created library item', created);
    return created!;
  }

  private mapRow(row: LibraryItemRow): LibraryItem {
    return {
      id: row.id,
      title: row.title,
      author: row.author,
      fileName: row.file_name,
      fileExt: row.file_ext,
      mimeType: row.mime_type,
      filePath: row.file_path,
      coverPath: row.cover_path,
      fileSize: row.file_size || 0,
      sourceUri: row.source_uri,
      status: row.status,
      progress: row.progress || 0,
      currentLocation: row.current_location,
      importedAt: row.imported_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
    };
  }
}
