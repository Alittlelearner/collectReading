"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useBookmarks = useBookmarks;
const react_1 = require("react");
const bookmarkStore_1 = require("../store/bookmarkStore");
function useBookmarks() {
    const store = (0, bookmarkStore_1.useBookmarkStore)();
    (0, react_1.useEffect)(() => {
        store.loadBookmarks();
    }, [store.filters]);
    const addBookmark = (0, react_1.useCallback)(async (dto) => {
        return store.addBookmark(dto);
    }, []);
    const refresh = (0, react_1.useCallback)(() => {
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
