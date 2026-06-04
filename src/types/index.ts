export type SourceType = 'bilibili' | 'zhihu' | 'wechat' | 'ebook' | 'website' | 'metasearch' | 'other';

export type LearningStatus = 'unread' | 'read' | 'archived';

export interface Bookmark {
  id: string;
  url: string;
  title: string;
  sourceType: SourceType;
  sourceDomain: string;
  learningStatus: LearningStatus;
  notes: string;
  createdAt: number;
  readAt: number | null;
  lastResurfacedAt: number | null;
  resurfaceCount: number;
  updatedAt: number;
  tags: Tag[];
  noteCount: number;
}

export interface CreateBookmarkDTO {
  url: string;
  tags?: string[];
  notes?: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
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
  currentStreak: number;
  totalTags: number;
  totalNotes: number;
}

export interface BookmarkFilter {
  sourceType?: SourceType;
  status?: LearningStatus;
  tagId?: string;
  searchQuery?: string;
  sortBy?: 'createdAt' | 'title' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

export interface ExtractedMetadata {
  title: string;
  description: string;
  imageUrl: string | null;
  author: string | null;
  sourceType: SourceType;
  sourceDomain: string;
}

export interface Extractor {
  readonly pattern: RegExp;
  readonly sourceType: SourceType;
  readonly needsHTML: boolean;
  extract(url: string, html: string): Promise<ExtractedMetadata>;
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
