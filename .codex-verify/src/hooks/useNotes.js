"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useNotes = useNotes;
const react_1 = require("react");
const noteService_1 = require("../services/noteService");
const noteService = new noteService_1.NoteService();
function useNotes(bookmarkId) {
    const [notes, setNotes] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
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
    const addNote = (0, react_1.useCallback)(async (content) => {
        await noteService.create(bookmarkId, content);
        await loadNotes();
    }, [bookmarkId]);
    const updateNote = (0, react_1.useCallback)(async (id, content) => {
        await noteService.update(id, content);
        await loadNotes();
    }, []);
    const deleteNote = (0, react_1.useCallback)(async (id) => {
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
