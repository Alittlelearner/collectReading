import { create } from 'zustand';
import { Folder } from '../types';
import { FolderService } from '../services/folderService';

const folderService = new FolderService();

interface FolderState {
  folders: Folder[];
  loading: boolean;
  loadFolders: () => Promise<void>;
  createFolder: (name: string) => Promise<Folder>;
  updateFolder: (id: string, data: { name?: string }) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  attachFolder: (bookmarkId: string, folderId: string) => Promise<void>;
  detachFolder: (bookmarkId: string, folderId: string) => Promise<void>;
}

export const useFolderStore = create<FolderState>((set) => ({
  folders: [],
  loading: false,

  loadFolders: async () => {
    set({ loading: true });
    const folders = await folderService.getAll();
    set({ folders, loading: false });
  },

  createFolder: async (name) => {
    const folder = await folderService.create(name);
    await useFolderStore.getState().loadFolders();
    return folder;
  },

  updateFolder: async (id, data) => {
    await folderService.update(id, data);
    await useFolderStore.getState().loadFolders();
  },

  deleteFolder: async (id) => {
    await folderService.delete(id);
    await useFolderStore.getState().loadFolders();
  },

  attachFolder: async (bookmarkId, folderId) => {
    await folderService.attachFolder(bookmarkId, folderId);
    await useFolderStore.getState().loadFolders();
  },

  detachFolder: async (bookmarkId, folderId) => {
    await folderService.detachFolder(bookmarkId, folderId);
    await useFolderStore.getState().loadFolders();
  },
}));
