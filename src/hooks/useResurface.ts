import { useResurfaceStore } from '../store/resurfaceStore';

export function useResurface() {
  const { 
    candidates, 
    currentIndex, 
    loading, 
    loadCandidates, 
    skip, 
    done 
  } = useResurfaceStore();

  return {
    candidates,
    currentIndex,
    loading,
    skip,
    done,
    refresh: loadCandidates,
  };
}
