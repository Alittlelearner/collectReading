import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
} from 'react-native';
import { Note } from '../../types';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';

interface NotesListProps {
  notes: Note[];
  loading: boolean;
  onAdd: (content: string) => Promise<void>;
  onUpdate: (id: string, content: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function NotesList({ notes, loading, onAdd, onUpdate, onDelete }: NotesListProps) {
  const [newNote, setNewNote] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');

  const handleAdd = async () => {
    if (!newNote.trim()) return;
    await onAdd(newNote.trim());
    setNewNote('');
  };

  const handleStartEdit = (note: Note) => {
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

  const handleDelete = (id: string) => {
    Alert.alert('删除笔记', '确定删除这条笔记吗？', [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => onDelete(id) },
    ]);
  };

  const renderNote = ({ item }: { item: Note }) => (
    <View style={styles.noteCard}>
      {editingId === item.id ? (
        <>
          <TextInput
            style={styles.editInput}
            value={editingContent}
            onChangeText={setEditingContent}
            multiline
            autoFocus
          />
          <View style={styles.editActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditingId(null)}>
              <Text style={styles.cancelBtnText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEdit}>
              <Text style={styles.saveBtnText}>保存</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          <Text style={styles.noteContent} selectable>
            {item.content}
          </Text>
          <View style={styles.noteMeta}>
            <Text style={styles.noteDate}>
              {formatDate(item.updatedAt)}
            </Text>
            <View style={styles.noteActions}>
              <TouchableOpacity onPress={() => handleStartEdit(item)}>
                <Text style={styles.editText}>编辑</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(item.id)}>
                <Text style={styles.deleteText}>删除</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.addSection}>
        <TextInput
          style={styles.addInput}
          placeholder="写点笔记..."
          placeholderTextColor={colors.textMuted}
          value={newNote}
          onChangeText={setNewNote}
          multiline
          numberOfLines={2}
        />
        <TouchableOpacity style={styles.addBtn} onPress={handleAdd} disabled={!newNote.trim()}>
          <Text style={[styles.addBtnText, !newNote.trim() && styles.addBtnTextDisabled]}>
            添加
          </Text>
        </TouchableOpacity>
      </View>

      {!!loading && <Text style={styles.loadingText}>加载中...</Text>}

      {!loading && notes.length === 0 && (
        <Text style={styles.emptyText}>暂无笔记</Text>
      )}

      <FlatList
        data={notes}
        keyExtractor={(item) => item.id}
        renderItem={renderNote}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / 86400000);

  if (days === 0) {
    const hours = Math.floor(diff / 3600000);
    if (hours === 0) return '刚刚';
    return `${hours} 小时前`;
  }
  if (days < 7) return `${days} 天前`;
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
  },
  addSection: {
    marginBottom: spacing.lg,
  },
  addInput: {
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 14,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    minHeight: 60,
  },
  addBtn: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  addBtnText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  addBtnTextDisabled: {
    opacity: 0.5,
  },
  loadingText: {
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  list: {
    paddingBottom: spacing.lg,
  },
  noteCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  noteContent: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  noteMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noteDate: {
    color: colors.textMuted,
    fontSize: 12,
  },
  noteActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  editText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '500',
  },
  deleteText: {
    color: colors.error,
    fontSize: 12,
    fontWeight: '500',
  },
  editInput: {
    backgroundColor: colors.surfaceLight,
    color: colors.text,
    fontSize: 14,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    minHeight: 60,
  },
  editActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  cancelBtnText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  saveBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  saveBtnText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
});
