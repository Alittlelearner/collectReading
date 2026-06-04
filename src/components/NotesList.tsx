import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Note } from '../types';
import { colors } from '../theme/colors';
import { spacing, borderRadius } from '../theme/spacing';

interface NotesListProps {
  notes: Note[];
  onAdd: (content: string) => Promise<void>;
  onUpdate?: (id: string, content: string) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export default function NotesList({ notes, onAdd, onUpdate, onDelete }: NotesListProps) {
  const [newNote, setNewNote] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');

  const handleAdd = async () => {
    if (!newNote.trim()) return;
    await onAdd(newNote.trim());
    setNewNote('');
  };

  const handleUpdate = async (id: string) => {
    if (!editingContent.trim() || !onUpdate) return;
    await onUpdate(id, editingContent.trim());
    setEditingId(null);
    setEditingContent('');
  };

  const handleDelete = (id: string, note: Note) => {
    if (!onDelete) return;
    Alert.alert('删除笔记', '确定要删除这条笔记吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => onDelete(id),
      },
    ]);
  };

  const startEditing = (note: Note) => {
    setEditingId(note.id);
    setEditingContent(note.content);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingContent('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>笔记</Text>

      {notes.map((note) => (
        <View key={note.id} style={styles.noteCard}>
          {editingId === note.id ? (
            <View>
              <TextInput
                style={styles.editInput}
                value={editingContent}
                onChangeText={setEditingContent}
                multiline
                autoFocus
              />
              <View style={styles.editActions}>
                <TouchableOpacity style={styles.editBtn} onPress={() => handleUpdate(note.id)}>
                  <Text style={styles.editBtnText}>✅ 保存</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.editBtn, styles.cancelBtn]} onPress={cancelEditing}>
                  <Text style={[styles.editBtnText, styles.cancelBtnText]}>❌ 取消</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View>
              <Text style={styles.noteContent}>{note.content}</Text>
              <Text style={styles.noteDate}>{formatDate(note.updatedAt)}</Text>
              <View style={styles.noteActions}>
                <TouchableOpacity onPress={() => startEditing(note)}>
                  <Text style={styles.actionText}>✏️ 编辑</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(note.id, note)}>
                  <Text style={[styles.actionText, styles.deleteText]}>🗑️ 删除</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      ))}

      <View style={styles.addSection}>
        <TextInput
          style={styles.input}
          placeholder="添加笔记..."
          placeholderTextColor={colors.textMuted}
          value={newNote}
          onChangeText={setNewNote}
          multiline
        />
        <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
          <Text style={styles.addBtnText}>➕ 添加</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString('zh-CN');
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    margin: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  noteCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  noteContent: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.xs,
  },
  noteDate: {
    color: colors.textMuted,
    fontSize: 12,
  },
  noteActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  deleteText: {
    color: colors.error,
  },
  addSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceLight,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    color: colors.text,
    fontSize: 14,
    minHeight: 60,
    textAlignVertical: 'top',
    marginBottom: spacing.sm,
  },
  addBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  addBtnText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  editInput: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    color: colors.text,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: spacing.sm,
  },
  editActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  editBtn: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  cancelBtn: {
    backgroundColor: colors.textMuted,
  },
  editBtnText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  cancelBtnText: {
    color: colors.white,
  },
});
