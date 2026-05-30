import { useCallback, useEffect } from 'react';
import { useTagStore } from '../store/tagStore';

export function useTags() {
  const store = useTagStore();

  useEffect(() => {
    store.loadTags();
  }, []);

  const refresh = useCallback(() => {
    store.loadTags();
  }, []);

  return {
    tags: store.tags,
    loading: store.loading,
    createTag: store.createTag,
    updateTag: store.updateTag,
    deleteTag: store.deleteTag,
    attachTag: store.attachTag,
    detachTag: store.detachTag,
    refresh,
  };
}
