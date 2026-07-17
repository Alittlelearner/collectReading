import React from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { MarkdownNoteDetailScreenProps } from '../navigation/types';
import { useMarkdownNote } from '../hooks/useMarkdownNotes';
import { MarkdownNoteService } from '../services/markdownNoteService';
import { colors } from '../theme/colors';
import { borderRadius, spacing } from '../theme/spacing';
import { formatDateTime } from '../utils/formatters';

const markdownNoteService = new MarkdownNoteService();

export default function MarkdownNoteDetailScreen() {
  const route = useRoute<MarkdownNoteDetailScreenProps['route']>();
  const navigation = useNavigation<any>();
  const noteState = useMarkdownNote(route.params.noteId);

  const editNote = () => {
    navigation.navigate('MarkdownNoteEditor', { noteId: route.params.noteId });
  };

  const deleteNote = () => {
    const title = noteState.note?.title || 'this note';
    Alert.alert('Delete note', `Delete "${title}" and its folder?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await markdownNoteService.delete(route.params.noteId);
          navigation.goBack();
        },
      },
    ]);
  };

  if (noteState.loading || !noteState.note) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const note = noteState.note;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons name="language-markdown-outline" size={36} color={colors.primaryDark} />
          </View>
          <Text style={styles.title}>{note.title}</Text>
          <Text style={styles.path} numberOfLines={2}>{note.markdownPath}</Text>
        </View>

        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.primaryAction} onPress={editNote}>
            <MaterialCommunityIcons name="pencil-outline" size={18} color={colors.white} />
            <Text style={styles.primaryActionText}>Edit Note</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryAction} onPress={deleteNote}>
            <MaterialCommunityIcons name="trash-can-outline" size={18} color={colors.error} />
            <Text style={styles.deleteActionText}>Delete</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Note info</Text>
          <Text style={styles.info}>Created: {formatDateTime(note.createdAt)}</Text>
          <Text style={styles.info}>Updated: {formatDateTime(note.updatedAt)}</Text>
          <Text style={styles.info}>Words: {note.wordCount}</Text>
          <Text style={styles.info}>Images: {noteState.assets.length}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preview</Text>
          <Text style={styles.preview}>{note.content.trim() || 'No content yet.'}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  center: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xxl,
  },
  iconWrap: {
    width: 82,
    height: 82,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.backgroundMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 32,
    textAlign: 'center',
  },
  path: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  actionGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  primaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
  },
  primaryActionText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
  secondaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
  },
  deleteActionText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '800',
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginTop: spacing.md,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: spacing.md,
  },
  info: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  preview: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 24,
  },
});
