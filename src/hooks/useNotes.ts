import { useState, useCallback, useEffect } from 'react';
import { NoteService } from '../services/noteService';
import { Note } from '../types';

const noteService = new NoteService();

export function useNotes(bookmarkId: string) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (bookmarkId) {
      loadNotes();
    }
  }, [bookmarkId]);

  const loadNotes = async () => {
    setLoading(true);
    const fetched = await noteService.getByBookmark(bookmarkId);
    setNotes(fetched);
    setLoading(false);
  };

  const addNote = useCallback(async (content: string) => {
    await noteService.create(bookmarkId, content);
    await loadNotes();
  }, [bookmarkId]);

  const updateNote = useCallback(async (id: string, content: string) => {
    await noteService.update(id, content);
    await loadNotes();
  }, []);

  const deleteNote = useCallback(async (id: string) => {
    await noteService.delete(id);
    await loadNotes();
  }, []);

  return {
    notes,
    loading,
    addNote,
    updateNote,
    deleteNote,
  };
}
