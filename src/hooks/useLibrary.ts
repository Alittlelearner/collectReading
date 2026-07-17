import { useCallback, useEffect, useState } from 'react';
import type { DocumentPickerAsset } from 'expo-document-picker';
import { LibraryItem, LibraryItemStatus } from '../types';
import { LibraryService } from '../services/libraryService';

const libraryService = new LibraryService();

export function useLibrary() {
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await libraryService.getAll());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const importAssets = useCallback(
    async (assets: DocumentPickerAsset[]) => {
      const imported = await libraryService.importAssets(assets);
      await refresh();
      return imported;
    },
    [refresh],
  );

  const updateStatus = useCallback(
    async (id: string, status: LibraryItemStatus) => {
      await libraryService.updateStatus(id, status);
      await refresh();
    },
    [refresh],
  );

  const deleteItem = useCallback(
    async (id: string) => {
      await libraryService.delete(id);
      await refresh();
    },
    [refresh],
  );

  return {
    items,
    loading,
    refresh,
    importAssets,
    updateStatus,
    deleteItem,
  };
}
