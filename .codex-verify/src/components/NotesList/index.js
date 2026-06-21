"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = NotesList;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_native_1 = require("react-native");
const colors_1 = require("../../theme/colors");
const spacing_1 = require("../../theme/spacing");
const formatters_1 = require("../../utils/formatters");
function NotesList({ notes, loading, onAdd, onUpdate, onDelete }) {
    const [newNote, setNewNote] = (0, react_1.useState)('');
    const [editingId, setEditingId] = (0, react_1.useState)(null);
    const [editingContent, setEditingContent] = (0, react_1.useState)('');
    const handleAdd = async () => {
        if (!newNote.trim())
            return;
        await onAdd(newNote.trim());
        setNewNote('');
    };
    const handleStartEdit = (note) => {
        setEditingId(note.id);
        setEditingContent(note.content);
    };
    const handleSaveEdit = async () => {
        if (editingId && editingContent.trim()) {
            await onUpdate(editingId, editingContent.trim());
        }
        setEditingId(null);
        setEditingContent('');
    };
    const handleDelete = (id) => {
        react_native_1.Alert.alert('删除笔记', '确定删除这条笔记吗？', [
            { text: '取消', style: 'cancel' },
            { text: '删除', style: 'destructive', onPress: () => onDelete(id) },
        ]);
    };
    const renderNote = ({ item }) => ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.noteCard, children: editingId === item.id ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(react_native_1.TextInput, { style: styles.editInput, value: editingContent, onChangeText: setEditingContent, multiline: true, autoFocus: true }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.editActions, children: [(0, jsx_runtime_1.jsx)(react_native_1.TouchableOpacity, { style: styles.cancelBtn, onPress: () => setEditingId(null), children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.cancelBtnText, children: "\u53D6\u6D88" }) }), (0, jsx_runtime_1.jsx)(react_native_1.TouchableOpacity, { style: styles.saveBtn, onPress: handleSaveEdit, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.saveBtnText, children: "\u4FDD\u5B58" }) })] })] })) : ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.noteContent, selectable: true, children: item.content }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.noteMeta, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.noteDate, children: (0, formatters_1.formatRelativeTime)(item.updatedAt) }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.noteActions, children: [(0, jsx_runtime_1.jsx)(react_native_1.TouchableOpacity, { onPress: () => handleStartEdit(item), children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.editText, children: "\u7F16\u8F91" }) }), (0, jsx_runtime_1.jsx)(react_native_1.TouchableOpacity, { onPress: () => handleDelete(item.id), children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.deleteText, children: "\u5220\u9664" }) })] })] })] })) }));
    return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.container, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.addSection, children: [(0, jsx_runtime_1.jsx)(react_native_1.TextInput, { style: styles.addInput, placeholder: "\u5199\u4E0B\u4F60\u7684\u7B14\u8BB0\u3001\u6458\u5F55\u6216\u60F3\u6CD5...", placeholderTextColor: colors_1.colors.textMuted, value: newNote, onChangeText: setNewNote, multiline: true, numberOfLines: 3 }), (0, jsx_runtime_1.jsx)(react_native_1.TouchableOpacity, { style: styles.addBtn, onPress: handleAdd, disabled: !newNote.trim(), children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [styles.addBtnText, !newNote.trim() && styles.addBtnTextDisabled], children: "\u6DFB\u52A0\u7B14\u8BB0" }) })] }), loading ? (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.loadingText, children: "\u7B14\u8BB0\u52A0\u8F7D\u4E2D..." }) : null, !loading && notes.length === 0 ? (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.emptyText, children: "\u8FD8\u6CA1\u6709\u7B14\u8BB0" }) : null, (0, jsx_runtime_1.jsx)(react_native_1.FlatList, { data: notes, keyExtractor: (item) => item.id, renderItem: renderNote, contentContainerStyle: styles.list, showsVerticalScrollIndicator: false })] }));
}
const styles = react_native_1.StyleSheet.create({
    container: {
        paddingHorizontal: spacing_1.spacing.lg,
    },
    addSection: {
        marginBottom: spacing_1.spacing.lg,
    },
    addInput: {
        backgroundColor: colors_1.colors.surface,
        color: colors_1.colors.text,
        fontSize: 14,
        padding: spacing_1.spacing.md,
        borderRadius: spacing_1.borderRadius.lg,
        marginBottom: spacing_1.spacing.sm,
        minHeight: 88,
        borderWidth: 1,
        borderColor: colors_1.colors.border,
    },
    addBtn: {
        alignSelf: 'flex-end',
        backgroundColor: colors_1.colors.primary,
        paddingHorizontal: spacing_1.spacing.lg,
        paddingVertical: spacing_1.spacing.sm,
        borderRadius: spacing_1.borderRadius.md,
    },
    addBtnText: {
        color: colors_1.colors.white,
        fontSize: 13,
        fontWeight: '700',
    },
    addBtnTextDisabled: {
        opacity: 0.5,
    },
    loadingText: {
        color: colors_1.colors.textMuted,
        textAlign: 'center',
        paddingVertical: spacing_1.spacing.lg,
    },
    emptyText: {
        color: colors_1.colors.textMuted,
        textAlign: 'center',
        paddingVertical: spacing_1.spacing.xl,
    },
    list: {
        paddingBottom: spacing_1.spacing.lg,
    },
    noteCard: {
        backgroundColor: colors_1.colors.surface,
        borderRadius: spacing_1.borderRadius.lg,
        padding: spacing_1.spacing.lg,
        marginBottom: spacing_1.spacing.sm,
        borderWidth: 1,
        borderColor: colors_1.colors.border,
    },
    noteContent: {
        color: colors_1.colors.text,
        fontSize: 14,
        lineHeight: 22,
        marginBottom: spacing_1.spacing.sm,
    },
    noteMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    noteDate: {
        color: colors_1.colors.textMuted,
        fontSize: 12,
    },
    noteActions: {
        flexDirection: 'row',
        gap: spacing_1.spacing.md,
    },
    editText: {
        color: colors_1.colors.primary,
        fontSize: 12,
        fontWeight: '700',
    },
    deleteText: {
        color: colors_1.colors.error,
        fontSize: 12,
        fontWeight: '700',
    },
    editInput: {
        backgroundColor: colors_1.colors.backgroundMuted,
        color: colors_1.colors.text,
        fontSize: 14,
        padding: spacing_1.spacing.md,
        borderRadius: spacing_1.borderRadius.md,
        marginBottom: spacing_1.spacing.sm,
        minHeight: 72,
    },
    editActions: {
        flexDirection: 'row',
        gap: spacing_1.spacing.sm,
        justifyContent: 'flex-end',
    },
    cancelBtn: {
        backgroundColor: colors_1.colors.backgroundMuted,
        paddingHorizontal: spacing_1.spacing.md,
        paddingVertical: spacing_1.spacing.xs,
        borderRadius: spacing_1.borderRadius.sm,
    },
    cancelBtnText: {
        color: colors_1.colors.textSecondary,
        fontSize: 12,
        fontWeight: '600',
    },
    saveBtn: {
        backgroundColor: colors_1.colors.primary,
        paddingHorizontal: spacing_1.spacing.md,
        paddingVertical: spacing_1.spacing.xs,
        borderRadius: spacing_1.borderRadius.sm,
    },
    saveBtnText: {
        color: colors_1.colors.white,
        fontSize: 12,
        fontWeight: '700',
    },
});
