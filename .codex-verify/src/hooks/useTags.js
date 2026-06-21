"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useTags = useTags;
const react_1 = require("react");
const tagStore_1 = require("../store/tagStore");
function useTags() {
    const store = (0, tagStore_1.useTagStore)();
    (0, react_1.useEffect)(() => {
        store.loadTags();
    }, []);
    const refresh = (0, react_1.useCallback)(() => {
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
