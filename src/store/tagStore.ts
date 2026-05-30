import { create } from 'zustand';
import { Tag } from '../types';
import { TagService } from '../services/tagService';

const tagService = new TagService();

interface TagState {
  tags: Tag[];
  loading: boolean;

  loadTags: () => Promise<void>;
  createTag: (name: string, color?: string) => Promise<Tag>;
  updateTag: (id: string, data: { name?: string; color?: string }) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;
  attachTag: (bookmarkId: string, tagId: string) => Promise<void>;
  detachTag: (bookmarkId: string, tagId: string) => Promise<void>;
}

export const useTagStore = create<TagState>((set) => ({
  tags: [],
  loading: false,

  loadTags: async () => {
    set({ loading: true });
    const tags = await tagService.getAll();
    set({ tags, loading: false });
  },

  createTag: async (name, color) => {
    const tag = await tagService.create(name, color);
    await useTagStore.getState().loadTags();
    return tag;
  },

  updateTag: async (id, data) => {
    await tagService.update(id, data);
    await useTagStore.getState().loadTags();
  },

  deleteTag: async (id) => {
    await tagService.delete(id);
    await useTagStore.getState().loadTags();
  },

  attachTag: async (bookmarkId, tagId) => {
    await tagService.attachTag(bookmarkId, tagId);
  },

  detachTag: async (bookmarkId, tagId) => {
    await tagService.detachTag(bookmarkId, tagId);
  },
}));
