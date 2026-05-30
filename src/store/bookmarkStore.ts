import { create } from 'zustand';
import { Bookmark, BookmarkFilter, CreateBookmarkDTO, SourceType, ViewMode, SourceGroup } from '../types';
import { BookmarkService } from '../services/bookmarkService';

const bookmarkService = new BookmarkService();

interface BookmarkState {
  bookmarks: Bookmark[];
  filters: BookmarkFilter;
  currentView: ViewMode;
  loading: boolean;

  loadBookmarks: () => Promise<void>;
  addBookmark: (dto: CreateBookmarkDTO) => Promise<Bookmark>;
  updateBookmark: (id: string, data: Partial<Pick<Bookmark, 'title' | 'notes'>>) => Promise<void>;
  deleteBookmark: (id: string) => Promise<void>;
  toggleStatus: (id: string) => Promise<void>;
  setFilters: (filters: Partial<BookmarkFilter>) => void;
  setView: (view: ViewMode) => void;
  getSourceGroups: () => SourceGroup[];
}

export const useBookmarkStore = create<BookmarkState>((set, get) => ({
  bookmarks: [],
  filters: {},
  currentView: 'timeline',
  loading: false,

  loadBookmarks: async () => {
    set({ loading: true });
    const bookmarks = await bookmarkService.getAll(get().filters);
    set({ bookmarks, loading: false });
  },

  addBookmark: async (dto) => {
    const bookmark = await bookmarkService.create(dto);
    await get().loadBookmarks();
    return bookmark;
  },

  updateBookmark: async (id, data) => {
    await bookmarkService.update(id, data);
    await get().loadBookmarks();
  },

  deleteBookmark: async (id) => {
    await bookmarkService.delete(id);
    await get().loadBookmarks();
  },

  toggleStatus: async (id) => {
    await bookmarkService.toggleStatus(id);
    await get().loadBookmarks();
  },

  setFilters: (filters) => {
    set((state) => ({ filters: { ...state.filters, ...filters } }));
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
