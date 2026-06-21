"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useBookmarkStore = void 0;
const zustand_1 = require("zustand");
const bookmarkService_1 = require("../services/bookmarkService");
const statsStore_1 = require("./statsStore");
const bookmarkService = new bookmarkService_1.BookmarkService();
exports.useBookmarkStore = (0, zustand_1.create)((set, get) => ({
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
        await statsStore_1.useStatsStore.getState().refresh();
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
        await statsStore_1.useStatsStore.getState().refresh();
    },
    setFilters: (filters) => {
        set((state) => ({ filters: { ...state.filters, ...filters } }));
    },
    setView: (view) => set({ currentView: view }),
    getSourceGroups: () => {
        const { bookmarks } = get();
        const sources = {};
        for (const b of bookmarks) {
            sources[b.sourceType] = (sources[b.sourceType] || 0) + 1;
        }
        return Object.entries(sources).map(([sourceType, count]) => ({
            sourceType: sourceType,
            count,
        }));
    },
}));
