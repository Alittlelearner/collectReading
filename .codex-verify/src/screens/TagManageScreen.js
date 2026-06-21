"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TagManageScreen;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_native_1 = require("react-native");
const useTags_1 = require("../hooks/useTags");
const colors_1 = require("../theme/colors");
const spacing_1 = require("../theme/spacing");
function TagManageScreen() {
    const tags = (0, useTags_1.useTags)();
    const [newName, setNewName] = (0, react_1.useState)('');
    const [editId, setEditId] = (0, react_1.useState)(null);
    const [editName, setEditName] = (0, react_1.useState)('');
    const handleCreate = async () => {
        if (!newName.trim())
            return;
        await tags.createTag(newName.trim());
        setNewName('');
    };
    const handleDelete = (id, name) => {
        react_native_1.Alert.alert('删除标签', `确定删除“${name}”吗？`, [
            { text: '取消', style: 'cancel' },
            { text: '删除', style: 'destructive', onPress: () => tags.deleteTag(id) },
        ]);
    };
    const handleStartEdit = (id, name) => {
        setEditId(id);
        setEditName(name);
    };
    const handleSaveEdit = async () => {
        if (editId && editName.trim()) {
            await tags.updateTag(editId, { name: editName.trim() });
        }
        setEditId(null);
        setEditName('');
    };
    const renderTag = ({ item }) => ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.tagRow, children: [(0, jsx_runtime_1.jsx)(react_native_1.View, { style: [styles.tagDot, { backgroundColor: item.color }] }), editId === item.id ? ((0, jsx_runtime_1.jsx)(react_native_1.TextInput, { style: styles.editInput, value: editName, onChangeText: setEditName, onBlur: handleSaveEdit, autoFocus: true, onSubmitEditing: handleSaveEdit })) : ((0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.tagName, onPress: () => handleStartEdit(item.id, item.name), children: item.name })), (0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.tagCount, children: [item.bookmarkCount, " \u6761"] }), (0, jsx_runtime_1.jsx)(react_native_1.TouchableOpacity, { onPress: () => handleDelete(item.id, item.name), children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.deleteText, children: "\u5220\u9664" }) })] }));
    return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.container, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.createRow, children: [(0, jsx_runtime_1.jsx)(react_native_1.TextInput, { style: styles.createInput, placeholder: "\u65B0\u6807\u7B7E\u540D\u79F0", placeholderTextColor: colors_1.colors.textMuted, value: newName, onChangeText: setNewName, onSubmitEditing: handleCreate }), (0, jsx_runtime_1.jsx)(react_native_1.TouchableOpacity, { style: styles.createBtn, onPress: handleCreate, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.createBtnText, children: "\u521B\u5EFA" }) })] }), (0, jsx_runtime_1.jsx)(react_native_1.FlatList, { data: tags.tags, keyExtractor: (item) => item.id, renderItem: renderTag, contentContainerStyle: styles.list, ListEmptyComponent: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.emptyText, children: "\u8FD8\u6CA1\u6709\u6807\u7B7E\uFF0C\u5148\u521B\u5EFA\u4E00\u4E2A\u5427\u3002" }) })] }));
}
const styles = react_native_1.StyleSheet.create({
    container: { flex: 1, backgroundColor: colors_1.colors.background },
    createRow: {
        flexDirection: 'row',
        padding: spacing_1.spacing.lg,
        gap: spacing_1.spacing.sm,
    },
    createInput: {
        flex: 1,
        backgroundColor: colors_1.colors.surface,
        color: colors_1.colors.text,
        fontSize: 15,
        paddingHorizontal: spacing_1.spacing.lg,
        paddingVertical: spacing_1.spacing.md,
        borderRadius: spacing_1.borderRadius.lg,
        borderWidth: 1,
        borderColor: colors_1.colors.border,
    },
    createBtn: {
        backgroundColor: colors_1.colors.primary,
        paddingHorizontal: spacing_1.spacing.xl,
        paddingVertical: spacing_1.spacing.md,
        borderRadius: spacing_1.borderRadius.lg,
        justifyContent: 'center',
    },
    createBtnText: { color: colors_1.colors.white, fontSize: 14, fontWeight: '700' },
    list: { paddingHorizontal: spacing_1.spacing.lg },
    tagRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors_1.colors.surface,
        padding: spacing_1.spacing.lg,
        borderRadius: spacing_1.borderRadius.lg,
        marginBottom: spacing_1.spacing.sm,
        gap: spacing_1.spacing.md,
        borderWidth: 1,
        borderColor: colors_1.colors.border,
    },
    tagDot: { width: 10, height: 10, borderRadius: 5 },
    tagName: { flex: 1, color: colors_1.colors.text, fontSize: 15, fontWeight: '600' },
    editInput: {
        flex: 1,
        backgroundColor: colors_1.colors.backgroundMuted,
        color: colors_1.colors.text,
        fontSize: 15,
        paddingHorizontal: spacing_1.spacing.sm,
        paddingVertical: spacing_1.spacing.xs,
        borderRadius: spacing_1.borderRadius.sm,
    },
    tagCount: { color: colors_1.colors.textMuted, fontSize: 13 },
    deleteText: { color: colors_1.colors.error, fontSize: 13, fontWeight: '700' },
    emptyText: { color: colors_1.colors.textMuted, textAlign: 'center', marginTop: 40, fontSize: 14 },
});
