import { useCallback, useEffect } from 'react';
import { useResurfaceStore } from '../store/resurfaceStore';

export function useResurface() {
  const store = useResurfaceStore();

  useEffect(() => {
    store.loadCandidates();
  }, []);

  const refresh = useCallback(() => {
    store.loadCandidates();
  }, []);

  return {
    candidates: store.candidates,
    currentIndex: store.currentIndex,
    loading: store.loading,
    skip: store.skip,
    done: store.done,
    refresh,
  };
}
