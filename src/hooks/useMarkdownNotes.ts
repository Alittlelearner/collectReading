import { useCallback, useEffect, useState } from 'react';
import type { DocumentPickerAsset } from 'expo-document-picker';
import { MarkdownNote, NoteAsset } from '../types';
import { MarkdownNoteService } from '../services/markdownNoteService';

const markdownNoteService = new MarkdownNoteService();

export function useMarkdownNotes() {
  const [notes, setNotes] = useState<MarkdownNote[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setNotes(await markdownNoteService.getAll());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createNote = useCallback(
    async (input?: { title?: string; linkedBookId?: string | null; linkedBookmarkId?: string | null }) => {
      const note = await markdownNoteService.create(input);
      await refresh();
      return note;
    },
    [refresh],
  );

  const deleteNote = useCallback(
    async (id: string) => {
      await markdownNoteService.delete(id);
      await refresh();
    },
    [refresh],
  );

  return {
    notes,
    loading,
    refresh,
    createNote,
    deleteNote,
  };
}

export function useMarkdownNote(noteId: string) {
  const [note, setNote] = useState<MarkdownNote | null>(null);
  const [assets, setAssets] = useState<NoteAsset[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!noteId) {
      return;
    }

    setLoading(true);
    try {
      const [nextNote, nextAssets] = await Promise.all([
        markdownNoteService.getById(noteId),
        markdownNoteService.getAssets(noteId),
      ]);
      setNote(nextNote);
      setAssets(nextAssets);
    } finally {
      setLoading(false);
    }
  }, [noteId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const saveContent = useCallback(
    async (content: string) => {
      const updated = await markdownNoteService.updateContent(noteId, content);
      setNote(updated);
      return updated;
    },
    [noteId],
  );

  const addAsset = useCallback(
    async (asset: DocumentPickerAsset) => {
      const stored = await markdownNoteService.addAsset(noteId, asset);
      await refresh();
      return stored;
    },
    [noteId, refresh],
  );

  return {
    note,
    assets,
    loading,
    refresh,
    saveContent,
    addAsset,
  };
}
