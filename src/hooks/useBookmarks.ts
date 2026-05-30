import { useCallback, useEffect } from 'react';
import { useBookmarkStore } from '../store/bookmarkStore';
import { CreateBookmarkDTO, Bookmark } from '../types';

export function useBookmarks() {
  const store = useBookmarkStore();

  useEffect(() => {
    store.loadBookmarks();
  }, [store.filters]);

  const addBookmark = useCallback(
    async (dto: CreateBookmarkDTO): Promise<Bookmark> => {
      return store.addBookmark(dto);
    },
    [],
  );

  const refresh = useCallback(() => {
    store.loadBookmarks();
  }, []);

  return {
    bookmarks: store.bookmarks,
    filters: store.filters,
    currentView: store.currentView,
    loading: store.loading,
    addBookmark,
    updateBookmark: store.updateBookmark,
    deleteBookmark: store.deleteBookmark,
    toggleStatus: store.toggleStatus,
    setFilters: store.setFilters,
    setView: store.setView,
    getSourceGroups: store.getSourceGroups,
    refresh,
  };
}
