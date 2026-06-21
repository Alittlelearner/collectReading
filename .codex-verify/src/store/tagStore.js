"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useTagStore = void 0;
const zustand_1 = require("zustand");
const tagService_1 = require("../services/tagService");
const tagService = new tagService_1.TagService();
exports.useTagStore = (0, zustand_1.create)((set) => ({
    tags: [],
    loading: false,
    loadTags: async () => {
        set({ loading: true });
        const tags = await tagService.getAll();
        set({ tags, loading: false });
    },
    createTag: async (name, color) => {
        const tag = await tagService.create(name, color);
        await exports.useTagStore.getState().loadTags();
        return tag;
    },
    updateTag: async (id, data) => {
        await tagService.update(id, data);
        await exports.useTagStore.getState().loadTags();
    },
    deleteTag: async (id) => {
        await tagService.delete(id);
        await exports.useTagStore.getState().loadTags();
    },
    attachTag: async (bookmarkId, tagId) => {
        await tagService.attachTag(bookmarkId, tagId);
    },
    detachTag: async (bookmarkId, tagId) => {
        await tagService.detachTag(bookmarkId, tagId);
    },
}));
