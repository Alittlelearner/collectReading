import { useCallback, useEffect } from 'react';
import { useFolderStore } from '../store/folderStore';

export function useFolders() {
  const store = useFolderStore();

  useEffect(() => {
    store.loadFolders();
  }, []);

  const refresh = useCallback(() => {
    store.loadFolders();
  }, [store]);

  return {
    folders: store.folders,
    loading: store.loading,
    createFolder: store.createFolder,
    updateFolder: store.updateFolder,
    deleteFolder: store.deleteFolder,
    attachFolder: store.attachFolder,
    detachFolder: store.detachFolder,
    refresh,
  };
}
