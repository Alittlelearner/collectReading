import { create } from 'zustand';
import { Bookmark } from '../types';
import { ResurfaceService } from '../services/resurfaceService';
import { BookmarkService } from '../services/bookmarkService';

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
      set({ currentIndex: currentIndex + 1 });
    }
  },

  done: async () => {
    const { candidates, currentIndex } = get();
    if (currentIndex < candidates.length) {
      await resurfaceService.markResurfaceDone(candidates[currentIndex].id);
      set({ currentIndex: currentIndex + 1 });
    }
  },

  nextCandidate: () => {
    set((state) => ({ currentIndex: state.currentIndex + 1 }));
  },
}));
