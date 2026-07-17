export type SourceType =
  | 'bilibili'
  | 'zhihu'
  | 'wechat'
  | 'ebook'
  | 'website'
  | 'metasearch'
  | 'jike'
  | 'xueqiu'
  | 'other';

export type LearningStatus = 'unread' | 'read';

export interface Bookmark {
  id: string;
  url: string;
  title: string;
  description: string;
  imageUrl: string | null;
  author: string | null;
  sourceType: SourceType;
  sourceDomain: string;
  originalTags: string[];
  publishedAt: number | null;
  learningStatus: LearningStatus;
  isStarred: boolean;
  isArchived: boolean;
  notes: string;
  createdAt: number;
  readAt: number | null;
  readCount: number;
  deletedAt: number | null;
  lastResurfacedAt: number | null;
  resurfaceCount: number;
  updatedAt: number;
  tags: Tag[];
  folders: Folder[];
  noteCount: number;
}

export interface CreateBookmarkDTO {
  url: string;
  tags?: string[];
  folders?: string[];
  notes?: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt: number;
  bookmarkCount: number;
}

export interface Folder {
  id: string;
  name: string;
  createdAt: number;
  bookmarkCount: number;
}

export interface Note {
  id: string;
  bookmarkId: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export type LibraryItemStatus = 'unread' | 'reading' | 'finished';

export interface LibraryItem {
  id: string;
  title: string;
  author: string | null;
  fileName: string;
  fileExt: string;
  mimeType: string | null;
  filePath: string;
  coverPath: string | null;
  fileSize: number;
  sourceUri: string | null;
  status: LibraryItemStatus;
  progress: number;
  currentLocation: string | null;
  importedAt: number;
  updatedAt: number;
  deletedAt: number | null;
}

export interface MarkdownNote {
  id: string;
  title: string;
  slug: string;
  folderPath: string;
  markdownPath: string;
  content: string;
  excerpt: string;
  linkedBookId: string | null;
  linkedBookmarkId: string | null;
  wordCount: number;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
}

export interface NoteAsset {
  id: string;
  noteId: string;
  fileName: string;
  filePath: string;
  mimeType: string | null;
  size: number;
  createdAt: number;
}

export interface DailyStat {
  date: string;
  readCount: number;
  addedCount: number;
  streakEligible: number;
}

export interface StatSummary {
  totalBookmarks: number;
  totalRead: number;
  readRate: number;
  currentStreak: number;
  longestStreak: number;
  todayRead: number;
  weeklyRead: number;
  monthlyRead: number;
}

export interface Achievement {
  id: string;
  achievementKey: string;
  title: string;
  description: string;
  iconName: string;
  unlockedAt: number | null;
}

export interface AchievementContext {
  totalBookmarks: number;
  totalRead: number;
  totalResurfacedRead: number;
  currentStreak: number;
  totalTags: number;
  totalNotes: number;
}

export interface BookmarkFilter {
  sourceType?: SourceType;
  status?: LearningStatus;
  tagId?: string;
  folderId?: string;
  searchQuery?: string;
  starred?: boolean;
  hasNotes?: boolean;
  untagged?: boolean;
  createdAfter?: number;
  scope?: 'all' | 'active' | 'archived' | 'deleted';
  sortBy?: 'createdAt' | 'title' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface SidebarStats {
  allCount: number;
  unreadCount: number;
  starredCount: number;
  todayCount: number;
  noteCount: number;
  untaggedCount: number;
  archivedCount: number;
  deletedCount: number;
}

export type WikiGrouping = 'folder' | 'tag' | 'source' | 'timeline';

export type WikiScopeType = 'all' | 'folder' | 'tag' | 'starred' | 'archived';

export interface WikiFilterSnapshot {
  scopeType: WikiScopeType;
  folderId?: string | null;
  tagId?: string | null;
  includeArchived?: boolean;
}

export interface WikiSpace {
  id: string;
  name: string;
  description: string;
  grouping: WikiGrouping;
  filter: WikiFilterSnapshot;
  createdAt: number;
  updatedAt: number;
  bookmarkCount: number;
}

export interface WikiSection {
  id: string;
  title: string;
  summary: string;
  items: Bookmark[];
}

export interface WikiExportResult {
  directory: string;
  markdownPath: string;
  downloadedImageCount: number;
}

export interface ExtractedMetadata {
  title: string;
  description: string;
  imageUrl: string | null;
  author: string | null;
  sourceType: SourceType;
  sourceDomain: string;
  originalTags?: string[];
  publishedAt?: number | null;
}

export interface ExtractorContext {
  sourceDomain: string;
  html?: string;
}

export interface Extractor {
  readonly id: string;
  readonly displayName: string;
  readonly pattern: RegExp;
  readonly sourceType: SourceType;
  readonly needsHTML: boolean;
  readonly priority?: number;
  canHandle?(url: string): boolean;
  extract(url: string, context: ExtractorContext): Promise<ExtractedMetadata>;
}

export type ViewMode = 'timeline' | 'source' | 'tag';

export interface TimelineGroup {
  date: string;
  items: Bookmark[];
}

export interface SourceGroup {
  sourceType: SourceType;
  count: number;
}
