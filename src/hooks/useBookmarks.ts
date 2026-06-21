import { useCallback, useEffect } from 'react';
import { useBookmarkStore } from '../store/bookmarkStore';
import { CreateBookmarkDTO, Bookmark } from '../types';

export function useBookmarks() {
  const store = useBookmarkStore();

  useEffect(() => {
    store.loadBookmarks();
    store.loadSidebarStats();
  }, [store.filters]);

  const addBookmark = useCallback(
    async (dto: CreateBookmarkDTO): Promise<Bookmark> => {
      return store.addBookmark(dto);
    },
    [],
  );

  const refresh = useCallback(() => {
    store.loadBookmarks();
    store.loadSidebarStats();
  }, [store]);

  return {
    bookmarks: store.bookmarks,
    filters: store.filters,
    sidebarStats: store.sidebarStats,
    currentView: store.currentView,
    loading: store.loading,
    addBookmark,
    updateBookmark: store.updateBookmark,
    deleteBookmark: store.deleteBookmark,
    restoreBookmark: store.restoreBookmark,
    archiveBookmark: store.archiveBookmark,
    unarchiveBookmark: store.unarchiveBookmark,
    toggleStar: store.toggleStar,
    toggleStatus: store.toggleStatus,
    setFilters: store.setFilters,
    replaceFilters: store.replaceFilters,
    setView: store.setView,
    getSourceGroups: store.getSourceGroups,
    refresh,
  };
}
