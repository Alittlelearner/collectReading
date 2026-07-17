import { create } from 'zustand';
import {
  Bookmark,
  BookmarkFilter,
  CreateBookmarkDTO,
  SidebarStats,
  SourceType,
  ViewMode,
  SourceGroup,
} from '../types';
import { BookmarkService } from '../services/bookmarkService';
import { useStatsStore } from './statsStore';
import { useTagStore } from './tagStore';
import { useFolderStore } from './folderStore';

const bookmarkService = new BookmarkService();

interface BookmarkState {
  bookmarks: Bookmark[];
  filters: BookmarkFilter;
  sidebarStats: SidebarStats;
  currentView: ViewMode;
  loading: boolean;

  loadBookmarks: () => Promise<void>;
  loadSidebarStats: () => Promise<void>;
  addBookmark: (dto: CreateBookmarkDTO) => Promise<Bookmark>;
  updateBookmark: (
    id: string,
    data: Partial<Pick<Bookmark, 'title' | 'notes'>> & { tagIds?: string[]; folderIds?: string[] },
  ) => Promise<void>;
  deleteBookmark: (id: string) => Promise<void>;
  restoreBookmark: (id: string) => Promise<void>;
  archiveBookmark: (id: string) => Promise<void>;
  unarchiveBookmark: (id: string) => Promise<void>;
  toggleStar: (id: string) => Promise<void>;
  toggleStatus: (id: string) => Promise<void>;
  setFilters: (filters: Partial<BookmarkFilter>) => void;
  replaceFilters: (filters: BookmarkFilter) => void;
  setView: (view: ViewMode) => void;
  getSourceGroups: () => SourceGroup[];
}

export const useBookmarkStore = create<BookmarkState>((set, get) => ({
  bookmarks: [],
  filters: {},
  sidebarStats: {
    allCount: 0,
    unreadCount: 0,
    starredCount: 0,
    todayCount: 0,
    noteCount: 0,
    untaggedCount: 0,
    archivedCount: 0,
    deletedCount: 0,
  },
  currentView: 'timeline',
  loading: false,

  loadBookmarks: async () => {
    set({ loading: true });
    const bookmarks = await bookmarkService.getAll(get().filters);
    set({ bookmarks, loading: false });
  },

  loadSidebarStats: async () => {
    const sidebarStats = await bookmarkService.getSidebarStats();
    set({ sidebarStats });
  },

  addBookmark: async (dto) => {
    const bookmark = await bookmarkService.createPlaceholder(dto);
    await Promise.all([
      get().loadBookmarks(),
      get().loadSidebarStats(),
      useStatsStore.getState().refresh(),
      useTagStore.getState().loadTags(),
      useFolderStore.getState().loadFolders(),
    ]);
    bookmarkService.enqueueMetadataHydration(bookmark.id);
    return bookmark;
  },

  updateBookmark: async (id, data) => {
    await bookmarkService.update(id, data);
    await Promise.all([
      get().loadBookmarks(),
      get().loadSidebarStats(),
      useTagStore.getState().loadTags(),
      useFolderStore.getState().loadFolders(),
    ]);
  },

  deleteBookmark: async (id) => {
    await bookmarkService.delete(id);
    await Promise.all([
      get().loadBookmarks(),
      get().loadSidebarStats(),
      useTagStore.getState().loadTags(),
      useFolderStore.getState().loadFolders(),
    ]);
  },

  restoreBookmark: async (id) => {
    await bookmarkService.restore(id);
    await Promise.all([
      get().loadBookmarks(),
      get().loadSidebarStats(),
      useTagStore.getState().loadTags(),
      useFolderStore.getState().loadFolders(),
    ]);
  },

  archiveBookmark: async (id) => {
    await bookmarkService.archive(id);
    await Promise.all([
      get().loadBookmarks(),
      get().loadSidebarStats(),
      useTagStore.getState().loadTags(),
      useFolderStore.getState().loadFolders(),
    ]);
  },

  unarchiveBookmark: async (id) => {
    await bookmarkService.unarchive(id);
    await Promise.all([
      get().loadBookmarks(),
      get().loadSidebarStats(),
      useTagStore.getState().loadTags(),
      useFolderStore.getState().loadFolders(),
    ]);
  },

  toggleStar: async (id) => {
    await bookmarkService.toggleStar(id);
    await Promise.all([get().loadBookmarks(), get().loadSidebarStats()]);
  },

  toggleStatus: async (id) => {
    await bookmarkService.toggleStatus(id);
    await Promise.all([
      get().loadBookmarks(),
      get().loadSidebarStats(),
      useStatsStore.getState().refresh(),
      useTagStore.getState().loadTags(),
      useFolderStore.getState().loadFolders(),
    ]);
  },

  setFilters: (filters) => {
    set((state) => ({ filters: { ...state.filters, ...filters } }));
  },

  replaceFilters: (filters) => {
    set({ filters });
  },

  setView: (view) => set({ currentView: view }),

  getSourceGroups: () => {
    const { bookmarks } = get();
    const sources: Record<string, number> = {};
    for (const b of bookmarks) {
      sources[b.sourceType] = (sources[b.sourceType] || 0) + 1;
    }
    return Object.entries(sources).map(([sourceType, count]) => ({
      sourceType: sourceType as SourceType,
      count,
    }));
  },
}));
