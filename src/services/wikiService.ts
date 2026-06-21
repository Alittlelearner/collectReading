import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { getDatabase } from '../db/database';
import { generateId } from '../utils/uuid';
import {
  Bookmark,
  SourceType,
  WikiExportResult,
  WikiFilterSnapshot,
  WikiGrouping,
  WikiScopeType,
  WikiSection,
  WikiSpace,
} from '../types';
import { BookmarkService } from './bookmarkService';

type WikiSpaceRow = {
  id: string;
  name: string;
  description: string;
  grouping: WikiGrouping;
  filter_json: string;
  created_at: number;
  updated_at: number;
};

type SectionExportFile = {
  fileName: string;
  content: string;
};

type ExportedAsset = {
  fileName: string;
  sourceUrl: string;
  blob?: Blob;
};

type RenderedExport = {
  directoryName: string;
  rootMarkdown: string;
  sectionFiles: SectionExportFile[];
  assets: ExportedAsset[];
  downloadedImageCount: number;
};

type FileSystemDirectoryHandleLike = {
  getDirectoryHandle: (
    name: string,
    options?: { create?: boolean },
  ) => Promise<FileSystemDirectoryHandleLike>;
  getFileHandle: (
    name: string,
    options?: { create?: boolean },
  ) => Promise<{
    createWritable: () => Promise<{
      write: (data: string | Blob) => Promise<void>;
      close: () => Promise<void>;
    }>;
  }>;
};

const bookmarkService = new BookmarkService();

function slugify(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^\w\u4e00-\u9fa5-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'wiki'
  );
}

function inferSourceLabel(sourceType: SourceType): string {
  const labels: Record<SourceType, string> = {
    bilibili: 'Bilibili',
    zhihu: '知乎',
    wechat: '微信公众号',
    ebook: '电子书',
    website: '网页',
    metasearch: '聚合来源',
    jike: '即刻',
    xueqiu: '雪球',
    other: '其他来源',
  };
  return labels[sourceType] || '其他来源';
}

function normalizeText(value: string | null | undefined): string {
  return (value || '').trim();
}

function escapeMarkdown(value: string): string {
  return value.replace(/([\\`*_{}\[\]()#+\-.!|>])/g, '\\$1');
}

function sanitizeFileName(value: string): string {
  return value.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-').trim();
}

function formatTime(timestamp: number | null | undefined): string {
  if (!timestamp) {
    return '未记录';
  }
  return new Date(timestamp).toLocaleString('zh-CN');
}

function createSectionSummary(title: string, items: Bookmark[]): string {
  const authors = Array.from(
    new Set(items.map((item) => item.author?.trim()).filter((value): value is string => Boolean(value))),
  ).slice(0, 3);
  const sourceDomains = Array.from(new Set(items.map((item) => item.sourceDomain).filter(Boolean))).slice(0, 3);
  const parts = [`共 ${items.length} 条内容`];

  if (authors.length) {
    parts.push(`作者包括 ${authors.join('、')}`);
  }
  if (sourceDomains.length) {
    parts.push(`主要来源 ${sourceDomains.join('、')}`);
  }

  return `${title}：${parts.join('；')}。`;
}

function toTimelineLabel(timestamp: number): string {
  const date = new Date(timestamp);
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}`;
}

async function triggerWebDownload(fileName: string, data: string | Blob, mimeType?: string) {
  if (typeof document === 'undefined' || typeof URL === 'undefined') {
    throw new Error('当前环境不支持浏览器下载。');
  }

  const blob = typeof data === 'string' ? new Blob([data], { type: mimeType || 'text/plain;charset=utf-8' }) : data;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function writeFileHandle(
  directory: FileSystemDirectoryHandleLike,
  fileName: string,
  data: string | Blob,
) {
  const fileHandle = await directory.getFileHandle(fileName, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(data);
  await writable.close();
}

async function fetchImageBlob(url: string): Promise<Blob> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`下载图片失败：${url}`);
  }
  return response.blob();
}

export class WikiService {
  async getAllSpaces(): Promise<WikiSpace[]> {
    const db = await getDatabase();
    const rows = await db.getAllAsync<WikiSpaceRow>(
      'SELECT * FROM wiki_spaces ORDER BY updated_at DESC, created_at DESC',
    );

    return Promise.all(rows.map((row) => this.mapRow(row)));
  }

  async getSpaceById(id: string): Promise<WikiSpace | null> {
    const db = await getDatabase();
    const row = await db.getFirstAsync<WikiSpaceRow>('SELECT * FROM wiki_spaces WHERE id = ?', id);
    if (!row) {
      return null;
    }
    return this.mapRow(row);
  }

  async createSpace(input: {
    name: string;
    description?: string;
    grouping: WikiGrouping;
    filter: WikiFilterSnapshot;
  }): Promise<WikiSpace> {
    const db = await getDatabase();
    const id = generateId();
    const now = Date.now();

    await db.runAsync(
      `INSERT INTO wiki_spaces (id, name, description, grouping, filter_json, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      id,
      input.name.trim(),
      input.description?.trim() || '',
      input.grouping,
      JSON.stringify(input.filter),
      now,
      now,
    );

    return (await this.getSpaceById(id))!;
  }

  async updateSpace(
    id: string,
    input: Partial<{
      name: string;
      description: string;
      grouping: WikiGrouping;
      filter: WikiFilterSnapshot;
    }>,
  ): Promise<WikiSpace> {
    const db = await getDatabase();
    const now = Date.now();
    const updates: string[] = ['updated_at = ?'];
    const params: Array<string | number> = [now];

    if (input.name !== undefined) {
      updates.push('name = ?');
      params.push(input.name.trim());
    }
    if (input.description !== undefined) {
      updates.push('description = ?');
      params.push(input.description.trim());
    }
    if (input.grouping !== undefined) {
      updates.push('grouping = ?');
      params.push(input.grouping);
    }
    if (input.filter !== undefined) {
      updates.push('filter_json = ?');
      params.push(JSON.stringify(input.filter));
    }

    params.push(id);
    await db.runAsync(`UPDATE wiki_spaces SET ${updates.join(', ')} WHERE id = ?`, ...params);

    const updated = await this.getSpaceById(id);
    if (!updated) {
      throw new Error('NOT_FOUND');
    }
    return updated;
  }

  async deleteSpace(id: string): Promise<void> {
    const db = await getDatabase();
    await db.runAsync('DELETE FROM wiki_spaces WHERE id = ?', id);
  }

  async ensureDefaultSpaces(): Promise<void> {
    const existing = await this.getAllSpaces();
    if (existing.length > 0) {
      return;
    }

    await this.createSpace({
      name: '全部收藏知识架',
      description: '把当前收藏按收藏夹归拢成一套知识架。',
      grouping: 'folder',
      filter: { scopeType: 'all' },
    });

    await this.createSpace({
      name: '星标精选',
      description: '面向重点内容的实验性 Wiki 视图。',
      grouping: 'tag',
      filter: { scopeType: 'starred' },
    });
  }

  async buildSections(spaceId: string): Promise<WikiSection[]> {
    const space = await this.getSpaceById(spaceId);
    if (!space) {
      throw new Error('NOT_FOUND');
    }

    const bookmarks = await this.resolveBookmarksByFilter(space.filter);
    return this.groupBookmarks(space.grouping, bookmarks);
  }

  async exportSpaceToMarkdown(spaceId: string): Promise<WikiExportResult> {
    const space = await this.getSpaceById(spaceId);
    if (!space) {
      throw new Error('NOT_FOUND');
    }

    const sections = await this.buildSections(spaceId);
    const directoryName = `${new Date().toISOString().slice(0, 10)}-${slugify(space.name)}`;

    if (Platform.OS === 'web') {
      return this.exportForWeb(space, sections, directoryName);
    }

    return this.exportForNative(space, sections, directoryName);
  }

  private async exportForNative(
    space: WikiSpace,
    sections: WikiSection[],
    directoryName: string,
  ): Promise<WikiExportResult> {
    const rootDir = `${FileSystem.documentDirectory}wiki_exports/`;
    const exportDir = `${rootDir}${directoryName}/`;
    const sectionDir = `${exportDir}sections/`;
    const assetsDir = `${exportDir}assets/`;

    await FileSystem.makeDirectoryAsync(rootDir, { intermediates: true });
    await FileSystem.makeDirectoryAsync(exportDir, { intermediates: true });
    await FileSystem.makeDirectoryAsync(sectionDir, { intermediates: true });
    await FileSystem.makeDirectoryAsync(assetsDir, { intermediates: true });

    const rendered = await this.renderExport(space, sections, async ({ assetName, sourceUrl }) => {
      const assetPath = `${assetsDir}${assetName}`;

      try {
        await FileSystem.downloadAsync(sourceUrl, assetPath);
        return { success: true };
      } catch {
        return { success: false };
      }
    });

    for (const section of rendered.sectionFiles) {
      await FileSystem.writeAsStringAsync(`${sectionDir}${section.fileName}`, section.content, {
        encoding: FileSystem.EncodingType.UTF8,
      });
    }

    const markdownPath = `${exportDir}README.md`;
    await FileSystem.writeAsStringAsync(markdownPath, rendered.rootMarkdown, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    return {
      directory: exportDir,
      markdownPath,
      downloadedImageCount: rendered.downloadedImageCount,
    };
  }

  private async exportForWeb(
    space: WikiSpace,
    sections: WikiSection[],
    directoryName: string,
  ): Promise<WikiExportResult> {
    const rendered = await this.renderExport(space, sections, async ({ assetName, sourceUrl }) => {
      try {
        const blob = await fetchImageBlob(sourceUrl);
        return {
          success: true,
          asset: {
            fileName: assetName,
            sourceUrl,
            blob,
          },
        };
      } catch {
        return { success: false };
      }
    });

    const picker = (globalThis as any).showDirectoryPicker as undefined | (() => Promise<FileSystemDirectoryHandleLike>);

    if (picker) {
      const rootHandle = await picker();
      const exportHandle = await rootHandle.getDirectoryHandle(directoryName, { create: true });
      const sectionsHandle = await exportHandle.getDirectoryHandle('sections', { create: true });
      const assetsHandle = await exportHandle.getDirectoryHandle('assets', { create: true });

      await writeFileHandle(exportHandle, 'README.md', rendered.rootMarkdown);

      for (const section of rendered.sectionFiles) {
        await writeFileHandle(sectionsHandle, section.fileName, section.content);
      }

      for (const asset of rendered.assets) {
        if (asset.blob) {
          await writeFileHandle(assetsHandle, asset.fileName, asset.blob);
        }
      }

      return {
        directory: directoryName,
        markdownPath: `${directoryName}/README.md`,
        downloadedImageCount: rendered.downloadedImageCount,
      };
    }

    await triggerWebDownload(`${directoryName}-README.md`, rendered.rootMarkdown, 'text/markdown;charset=utf-8');

    for (const section of rendered.sectionFiles) {
      await triggerWebDownload(section.fileName, section.content, 'text/markdown;charset=utf-8');
    }

    for (const asset of rendered.assets) {
      if (asset.blob) {
        await triggerWebDownload(asset.fileName, asset.blob);
      }
    }

    return {
      directory: `浏览器下载：${directoryName}`,
      markdownPath: `${directoryName}-README.md`,
      downloadedImageCount: rendered.downloadedImageCount,
    };
  }

  private async renderExport(
    space: WikiSpace,
    sections: WikiSection[],
    resolveAsset: (input: {
      assetName: string;
      sourceUrl: string;
    }) => Promise<{
      success: boolean;
      asset?: ExportedAsset;
    }>,
  ): Promise<RenderedExport> {
    const directoryName = `${new Date().toISOString().slice(0, 10)}-${slugify(space.name)}`;
    const sectionFiles: SectionExportFile[] = [];
    const assets: ExportedAsset[] = [];
    const sectionIndexEntries: Array<{ title: string; fileName: string }> = [];
    let downloadedImageCount = 0;

    for (const section of sections) {
      const sectionSlug = sanitizeFileName(slugify(section.title));
      const sectionFileName = `${sectionSlug || 'section'}.md`;
      sectionIndexEntries.push({ title: section.title, fileName: sectionFileName });

      const lines: string[] = [];
      lines.push(`# ${section.title}`);
      lines.push('');
      lines.push(section.summary);
      lines.push('');

      for (let index = 0; index < section.items.length; index += 1) {
        const item = section.items[index];
        lines.push(`## ${index + 1}. ${escapeMarkdown(item.title || '未命名内容')}`);
        lines.push('');

        const bulletLines = [
          `- 来源：${inferSourceLabel(item.sourceType)} / ${item.sourceDomain}`,
          `- 原始链接：${item.url}`,
          item.author ? `- 作者：${item.author}` : null,
          item.publishedAt ? `- 创作时间：${formatTime(item.publishedAt)}` : null,
          `- 收藏时间：${formatTime(item.createdAt)}`,
          `- 阅读状态：${item.learningStatus === 'read' ? '已读' : '未读'}`,
          item.readAt ? `- 最近读完：${formatTime(item.readAt)}` : null,
          item.isStarred ? '- 星标：是' : null,
          item.tags.length ? `- 标签：${item.tags.map((tag) => tag.name).join('、')}` : null,
          item.originalTags.length ? `- 原始标签：${item.originalTags.join('、')}` : null,
          item.folders.length ? `- 收藏夹：${item.folders.map((folder) => folder.name).join('、')}` : null,
          item.readCount ? `- 阅读次数：${item.readCount}` : null,
          item.noteCount ? `- 标注数：${item.noteCount}` : null,
        ].filter((line): line is string => Boolean(line));

        lines.push(...bulletLines);
        lines.push('');

        if (item.description.trim()) {
          lines.push(item.description.trim());
          lines.push('');
        }

        if (item.imageUrl) {
          const extMatch = item.imageUrl.match(/\.(png|jpg|jpeg|webp|gif)(?:\?|$)/i);
          const fileExt = extMatch?.[1]?.toLowerCase() || 'jpg';
          const assetName = sanitizeFileName(`${sectionSlug}-${index + 1}.${fileExt}`);
          const assetResult = await resolveAsset({
            assetName,
            sourceUrl: item.imageUrl,
          });

          if (assetResult.success) {
            downloadedImageCount += 1;
            if (assetResult.asset) {
              assets.push(assetResult.asset);
            }
            lines.push(`![${escapeMarkdown(item.title || section.title)}](../assets/${assetName})`);
            lines.push('');
          } else {
            lines.push(`> 图片下载失败：${item.imageUrl}`);
            lines.push('');
          }
        }

        if (item.notes.trim()) {
          lines.push('### 备注');
          lines.push('');
          lines.push(item.notes.trim());
          lines.push('');
        }
      }

      sectionFiles.push({
        fileName: sectionFileName,
        content: lines.join('\n'),
      });
    }

    const rootLines: string[] = [];
    rootLines.push(`# ${space.name}`);
    rootLines.push('');
    if (space.description.trim()) {
      rootLines.push(space.description.trim());
      rootLines.push('');
    }
    rootLines.push(`导出时间：${new Date().toLocaleString('zh-CN')}`);
    rootLines.push(`总条目数：${space.bookmarkCount}`);
    rootLines.push(`章节数：${sections.length}`);
    rootLines.push('');
    rootLines.push('## 目录');
    rootLines.push('');

    sectionIndexEntries.forEach((section, index) => {
      rootLines.push(`${index + 1}. [${section.title}](./sections/${section.fileName})`);
    });

    rootLines.push('');
    rootLines.push('## 说明');
    rootLines.push('');
    rootLines.push('- `sections/` 目录按专题拆分内容，便于继续整理或交给大模型加工。');
    rootLines.push('- `assets/` 目录存放成功下载的封面或配图。');
    rootLines.push('- 如果某张图片下载失败，会在对应章节里保留原图链接提示。');
    rootLines.push('');

    return {
      directoryName,
      rootMarkdown: rootLines.join('\n'),
      sectionFiles,
      assets,
      downloadedImageCount,
    };
  }

  private async resolveBookmarksByFilter(filter: WikiFilterSnapshot): Promise<Bookmark[]> {
    switch (filter.scopeType) {
      case 'folder':
        return bookmarkService.getAll({
          scope: filter.includeArchived ? 'all' : 'active',
          folderId: filter.folderId || undefined,
        });
      case 'tag':
        return bookmarkService.getAll({
          scope: filter.includeArchived ? 'all' : 'active',
          tagId: filter.tagId || undefined,
        });
      case 'starred':
        return bookmarkService.getAll({
          scope: filter.includeArchived ? 'all' : 'active',
          starred: true,
        });
      case 'archived':
        return bookmarkService.getAll({ scope: 'archived' });
      case 'all':
      default:
        return bookmarkService.getAll({
          scope: filter.includeArchived ? 'all' : 'active',
        });
    }
  }

  private groupBookmarks(grouping: WikiGrouping, bookmarks: Bookmark[]): WikiSection[] {
    const groups = new Map<string, Bookmark[]>();

    for (const bookmark of bookmarks) {
      const keys = this.resolveGroupingKeys(grouping, bookmark);
      for (const key of keys) {
        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key)!.push(bookmark);
      }
    }

    return Array.from(groups.entries())
      .sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0], 'zh-CN'))
      .map(([title, items]) => ({
        id: `${grouping}:${title}`,
        title,
        summary: createSectionSummary(title, items),
        items: items.sort((a, b) => b.createdAt - a.createdAt),
      }));
  }

  private resolveGroupingKeys(grouping: WikiGrouping, bookmark: Bookmark): string[] {
    if (grouping === 'folder') {
      return bookmark.folders.length ? bookmark.folders.map((folder) => folder.name) : ['未归入收藏夹'];
    }

    if (grouping === 'tag') {
      return bookmark.tags.length ? bookmark.tags.map((tag) => tag.name) : ['未打标签'];
    }

    if (grouping === 'source') {
      return [inferSourceLabel(bookmark.sourceType)];
    }

    return [toTimelineLabel(bookmark.createdAt)];
  }

  private async mapRow(row: WikiSpaceRow): Promise<WikiSpace> {
    const filter = this.parseFilter(row.filter_json);
    const bookmarkCount = (await this.resolveBookmarksByFilter(filter)).length;

    return {
      id: row.id,
      name: normalizeText(row.name),
      description: normalizeText(row.description),
      grouping: row.grouping,
      filter,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      bookmarkCount,
    };
  }

  private parseFilter(value: string): WikiFilterSnapshot {
    try {
      const parsed = JSON.parse(value);
      return {
        scopeType: (parsed.scopeType as WikiScopeType) || 'all',
        folderId: parsed.folderId || null,
        tagId: parsed.tagId || null,
        includeArchived: Boolean(parsed.includeArchived),
      };
    } catch {
      return { scopeType: 'all' };
    }
  }
}
