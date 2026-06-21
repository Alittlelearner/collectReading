import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTags } from '../hooks/useTags';
import { colors } from '../theme/colors';
import { spacing, borderRadius } from '../theme/spacing';

export default function TagManageScreen() {
  const tags = useTags();
  const [newName, setNewName] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await tags.createTag(newName.trim());
    setNewName('');
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert('删除标签', `确定删除“${name}”吗？`, [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => tags.deleteTag(id) },
    ]);
  };

  const handleStartEdit = (id: string, name: string) => {
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

  const renderTag = ({ item }: { item: (typeof tags.tags)[0] }) => (
    <View style={styles.tagRow}>
      <View style={[styles.tagDot, { backgroundColor: item.color }]} />
      {editId === item.id ? (
        <TextInput
          style={styles.editInput}
          value={editName}
          onChangeText={setEditName}
          onBlur={handleSaveEdit}
          autoFocus
          onSubmitEditing={handleSaveEdit}
        />
      ) : (
        <Text style={styles.tagName} onPress={() => handleStartEdit(item.id, item.name)}>
          {item.name}
        </Text>
      )}
      <Text style={styles.tagCount}>{item.bookmarkCount} 条</Text>
      <TouchableOpacity onPress={() => handleDelete(item.id, item.name)}>
        <Text style={styles.deleteText}>删除</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.createRow}>
        <TextInput
          style={styles.createInput}
          placeholder="新标签名称"
          placeholderTextColor={colors.textMuted}
          value={newName}
          onChangeText={setNewName}
          onSubmitEditing={handleCreate}
        />
        <TouchableOpacity style={styles.createBtn} onPress={handleCreate}>
          <Text style={styles.createBtnText}>创建</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={tags.tags}
        keyExtractor={(item) => item.id}
        renderItem={renderTag}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>还没有标签，先创建一个吧。</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  createRow: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  createInput: {
    flex: 1,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 15,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  createBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
  },
  createBtnText: { color: colors.white, fontSize: 14, fontWeight: '700' },
  list: { paddingHorizontal: spacing.lg },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tagDot: { width: 10, height: 10, borderRadius: 5 },
  tagName: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '600' },
  editInput: {
    flex: 1,
    backgroundColor: colors.backgroundMuted,
    color: colors.text,
    fontSize: 15,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  tagCount: { color: colors.textMuted, fontSize: 13 },
  deleteText: { color: colors.error, fontSize: 13, fontWeight: '700' },
  emptyText: { color: colors.textMuted, textAlign: 'center', marginTop: 40, fontSize: 14 },
});
