import { create } from 'zustand';
import { Bookmark } from '../types';
import { ResurfaceService } from '../services/resurfaceService';

const resurfaceService = new ResurfaceService();

interface ResurfaceState {
  candidates: Bookmark[];
  currentIndex: number;
  loading: boolean;

  loadCandidates: () => Promise<void>;
  skip: () => Promise<void>;
  done: () => Promise<void>;
}

export const useResurfaceStore = create<ResurfaceState>((set, get) => ({
  candidates: [],
  currentIndex: 0,
  loading: false,

  loadCandidates: async () => {
    set({ loading: true });
    try {
      const candidates = await resurfaceService.getResurfaceCandidates();
      set({ candidates, currentIndex: 0, loading: false });
    } catch (error) {
      console.error('[ResurfaceStore] loadCandidates error:', error);
      set({ loading: false });
    }
  },

  skip: async () => {
    const { candidates, currentIndex } = get();
    console.log('[ResurfaceStore.skip] candidates:', candidates.length, 'currentIndex:', currentIndex);
    
    if (candidates.length === 0 || currentIndex >= candidates.length) {
      console.warn('[ResurfaceStore.skip] No candidate to skip');
      return;
    }

    const candidateId = candidates[currentIndex].id;
    console.log('[ResurfaceStore.skip] Marking as skipped:', candidateId);
    
    try {
      await resurfaceService.markResurfaceSkipped(candidateId);
      console.log('[ResurfaceStore.skip] Reload candidates...');
      const newCandidates = await resurfaceService.getResurfaceCandidates();
      console.log('[ResurfaceStore.skip] New candidates count:', newCandidates.length);
      set({ candidates: newCandidates, currentIndex: 0 });
    } catch (error) {
      console.error('[ResurfaceStore.skip] Error:', error);
    }
  },

  done: async () => {
    const { candidates, currentIndex } = get();
    console.log('[ResurfaceStore.done] candidates:', candidates.length, 'currentIndex:', currentIndex);
    
    if (candidates.length === 0 || currentIndex >= candidates.length) {
      console.warn('[ResurfaceStore.done] No candidate to mark done');
      return;
    }

    const candidateId = candidates[currentIndex].id;
    console.log('[ResurfaceStore.done] Marking as done:', candidateId);
    
    try {
      await resurfaceService.markResurfaceDone(candidateId);
      console.log('[ResurfaceStore.done] Reload candidates...');
      const newCandidates = await resurfaceService.getResurfaceCandidates();
      console.log('[ResurfaceStore.done] New candidates count:', newCandidates.length);
      set({ candidates: newCandidates, currentIndex: 0 });
    } catch (error) {
      console.error('[ResurfaceStore.done] Error:', error);
    }
  },
}));
