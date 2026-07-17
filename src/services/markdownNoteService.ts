import type { DocumentPickerAsset } from 'expo-document-picker';
import { getDatabase } from '../db/database';
import { generateId } from '../utils/uuid';
import { MarkdownNote, NoteAsset } from '../types';
import {
  deleteDirectory,
  ensureDirectory,
  ensureLibraryDirectories,
  getNotesRootDir,
  readMarkdownFile,
  slugifyFileName,
  storePickedFile,
  writeMarkdownFile,
} from './libraryFileService';

type MarkdownNoteRow = {
  id: string;
  title: string;
  slug: string;
  folder_path: string;
  markdown_path: string;
  content_cache: string;
  excerpt: string;
  linked_book_id: string | null;
  linked_bookmark_id: string | null;
  word_count: number;
  created_at: number;
  updated_at: number;
  deleted_at: number | null;
};

type NoteAssetRow = {
  id: string;
  note_id: string;
  file_name: string;
  file_path: string;
  mime_type: string | null;
  size: number;
  created_at: number;
};

function extractTitle(content: string, fallback: string): string {
  const heading = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line.startsWith('# '));
  return heading?.replace(/^#\s+/, '').trim() || fallback;
}

function createExcerpt(content: string): string {
  return content
    .replace(/^# .+$/m, '')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/[#>*_`-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 140);
}

function countWords(content: string): number {
  const chineseChars = content.match(/[\u4e00-\u9fa5]/g)?.length || 0;
  const westernWords = content.replace(/[\u4e00-\u9fa5]/g, ' ').match(/[A-Za-z0-9_]+/g)?.length || 0;
  return chineseChars + westernWords;
}

export class MarkdownNoteService {
  async getAll(): Promise<MarkdownNote[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<MarkdownNoteRow>(
      `SELECT * FROM markdown_notes
       WHERE deleted_at IS NULL
       ORDER BY updated_at DESC, created_at DESC`,
    );
    return Promise.all(rows.map((row) => this.mapRow(row)));
  }

  async getById(id: string): Promise<MarkdownNote | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<MarkdownNoteRow>('SELECT * FROM markdown_notes WHERE id = ?', id);
    return row ? this.mapRow(row) : null;
  }

  async getAssets(noteId: string): Promise<NoteAsset[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<NoteAssetRow>(
      'SELECT * FROM note_assets WHERE note_id = ? ORDER BY created_at DESC',
      noteId,
    );
    return rows.map((row) => ({
      id: row.id,
      noteId: row.note_id,
      fileName: row.file_name,
      filePath: row.file_path,
      mimeType: row.mime_type,
      size: row.size,
      createdAt: row.created_at,
    }));
  }

  async create(input?: {
    title?: string;
    linkedBookId?: string | null;
    linkedBookmarkId?: string | null;
  }): Promise<MarkdownNote> {
    await ensureLibraryDirectories();

    const db = await getDatabase();
    const id = generateId();
    const now = Date.now();
    const title = input?.title?.trim() || 'Untitled Note';
    const slug = slugifyFileName(title);
    const folderPath = `${getNotesRootDir()}${id}-${slug}/`;
    const assetsDir = `${folderPath}assets/`;
    const markdownPath = `${folderPath}index.md`;
    const content = `# ${title}\n\n`;

    await ensureDirectory(folderPath);
    await ensureDirectory(assetsDir);
    await writeMarkdownFile(markdownPath, content);

    await db.runAsync(
      `INSERT INTO markdown_notes (
         id, title, slug, folder_path, markdown_path, content_cache, excerpt,
         linked_book_id, linked_bookmark_id, word_count, created_at, updated_at, deleted_at
       )
       VALUES (?, ?, ?, ?, ?, ?, '', ?, ?, ?, ?, ?, NULL)`,
      id,
      title,
      slug,
      folderPath,
      markdownPath,
      content,
      input?.linkedBookId || null,
      input?.linkedBookmarkId || null,
      countWords(content),
      now,
      now,
    );

    return (await this.getById(id))!;
  }

  async updateContent(id: string, content: string): Promise<MarkdownNote> {
    const existing = await this.getById(id);
    if (!existing) {
      throw new Error('NOT_FOUND');
    }

    const db = await getDatabase();
    const now = Date.now();
    const title = extractTitle(content, existing.title);
    const excerpt = createExcerpt(content);

    await writeMarkdownFile(existing.markdownPath, content);
    await db.runAsync(
      `UPDATE markdown_notes
       SET title = ?, content_cache = ?, excerpt = ?, word_count = ?, updated_at = ?
       WHERE id = ?`,
      title,
      content,
      excerpt,
      countWords(content),
      now,
      id,
    );

    return (await this.getById(id))!;
  }

  async addAsset(noteId: string, asset: DocumentPickerAsset): Promise<NoteAsset> {
    const note = await this.getById(noteId);
    if (!note) {
      throw new Error('NOT_FOUND');
    }

    const db = await getDatabase();
    const id = generateId();
    const now = Date.now();
    const assetsDir = `${note.folderPath}assets/`;
    const stored = await storePickedFile(asset, assetsDir, 'png');

    await db.runAsync(
      `INSERT INTO note_assets (id, note_id, file_name, file_path, mime_type, size, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      id,
      noteId,
      stored.fileName,
      stored.filePath,
      asset.mimeType || null,
      stored.fileSize,
      now,
    );

    return {
      id,
      noteId,
      fileName: stored.fileName,
      filePath: stored.filePath,
      mimeType: asset.mimeType || null,
      size: stored.fileSize,
      createdAt: now,
    };
  }

  async delete(id: string): Promise<void> {
    const note = await this.getById(id);
    if (!note) {
      return;
    }

    const db = await getDatabase();
    const now = Date.now();
    await db.runAsync('UPDATE markdown_notes SET deleted_at = ?, updated_at = ? WHERE id = ?', now, now, id);
    await deleteDirectory(note.folderPath);
  }

  private async mapRow(row: MarkdownNoteRow): Promise<MarkdownNote> {
    const fileContent = await readMarkdownFile(row.markdown_path);
    const content = fileContent || row.content_cache || '';

    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      folderPath: row.folder_path,
      markdownPath: row.markdown_path,
      content,
      excerpt: row.excerpt,
      linkedBookId: row.linked_book_id,
      linkedBookmarkId: row.linked_bookmark_id,
      wordCount: row.word_count || countWords(content),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      deletedAt: row.deleted_at,
    };
  }
}
