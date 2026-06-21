"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useResurfaceStore = void 0;
const zustand_1 = require("zustand");
const resurfaceService_1 = require("../services/resurfaceService");
const bookmarkService_1 = require("../services/bookmarkService");
const bookmarkStore_1 = require("./bookmarkStore");
const statsStore_1 = require("./statsStore");
const resurfaceService = new resurfaceService_1.ResurfaceService();
const bookmarkService = new bookmarkService_1.BookmarkService();
exports.useResurfaceStore = (0, zustand_1.create)((set, get) => ({
    candidates: [],
    currentIndex: 0,
    loading: false,
    loadCandidates: async () => {
        set({ loading: true });
        const candidates = await resurfaceService.getResurfaceCandidates();
        set({ candidates, currentIndex: 0, loading: false });
    },
    skip: async () => {
        const { candidates, currentIndex } = get();
        if (currentIndex < candidates.length) {
            await resurfaceService.markResurfaceSkipped(candidates[currentIndex].id);
            await get().refreshAfterAction();
        }
    },
    done: async () => {
        const { candidates, currentIndex } = get();
        if (currentIndex < candidates.length) {
            await resurfaceService.markResurfaceDone(candidates[currentIndex].id);
            await get().refreshAfterAction();
        }
    },
    nextCandidate: () => {
        set((state) => ({ currentIndex: state.currentIndex + 1 }));
    },
    refreshAfterAction: async () => {
        await bookmarkStore_1.useBookmarkStore.getState().loadBookmarks();
        await statsStore_1.useStatsStore.getState().refresh();
        const candidates = await resurfaceService.getResurfaceCandidates();
        set({ candidates, currentIndex: 0 });
    },
}));
