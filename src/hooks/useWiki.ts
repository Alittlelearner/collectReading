import { useCallback, useEffect } from 'react';
import { useWikiStore } from '../store/wikiStore';

export function useWiki() {
  const store = useWikiStore();

  useEffect(() => {
    store.loadSpaces();
  }, []);

  const refresh = useCallback(() => {
    store.loadSpaces();
  }, [store]);

  return {
    spaces: store.spaces,
    loading: store.loading,
    createSpace: store.createSpace,
    updateSpace: store.updateSpace,
    deleteSpace: store.deleteSpace,
    refresh,
  };
}
