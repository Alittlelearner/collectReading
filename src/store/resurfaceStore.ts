import { create } from 'zustand';
import { Bookmark } from '../types';
import { ResurfaceService } from '../services/resurfaceService';
import { BookmarkService } from '../services/bookmarkService';
import { useBookmarkStore } from './bookmarkStore';
import { useStatsStore } from './statsStore';

const resurfaceService = new ResurfaceService();
const bookmarkService = new BookmarkService();

interface ResurfaceState {
  candidates: Bookmark[];
  currentIndex: number;
  loading: boolean;

  loadCandidates: () => Promise<void>;
  skip: () => Promise<void>;
  done: () => Promise<void>;
  nextCandidate: () => void;
  refreshAfterAction: () => Promise<void>;
}

export const useResurfaceStore = create<ResurfaceState>((set, get) => ({
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
    await useBookmarkStore.getState().loadBookmarks();
    await useStatsStore.getState().refresh();
    const candidates = await resurfaceService.getResurfaceCandidates();
    set({ candidates, currentIndex: 0 });
  },
}));
