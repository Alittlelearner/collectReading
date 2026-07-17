import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMarkdownNotes } from '../hooks/useMarkdownNotes';
import type { MarkdownNote } from '../types';
import { colors } from '../theme/colors';
import { borderRadius, spacing } from '../theme/spacing';
import { formatRelativeTime } from '../utils/formatters';

export default function MarkdownNotesScreen() {
  const navigation = useNavigation<any>();
  const notes = useMarkdownNotes();
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);

  const filteredNotes = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return notes.notes;
    return notes.notes.filter((note) =>
      [note.title, note.excerpt, note.content].join(' ').toLowerCase().includes(keyword),
    );
  }, [notes.notes, query]);

  useFocusEffect(
    useCallback(() => {
      notes.refresh();
    }, [notes.refresh]),
  );

  const createNote = async () => {
    setCreating(true);
    try {
      const note = await notes.createNote({ title: 'Untitled Note' });
      navigation.navigate('MarkdownNoteEditor', { noteId: note.id });
    } catch (err: any) {
      Alert.alert('Create failed', err.message || 'Please try again later.');
    } finally {
      setCreating(false);
    }
  };

  const renderItem = ({ item }: { item: MarkdownNote }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('MarkdownNoteDetail', { noteId: item.id })}
      activeOpacity={0.86}
    >
      <View style={styles.cardTop}>
        <View style={styles.noteIcon}>
          <MaterialCommunityIcons name="language-markdown-outline" size={22} color={colors.primaryDark} />
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.excerpt} numberOfLines={2}>
            {item.excerpt || 'No body text yet.'}
          </Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.meta}>{item.wordCount} words</Text>
        <Text style={styles.meta}>{formatRelativeTime(item.updatedAt)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Markdown</Text>
          <Text style={styles.headerTitle}>Notes</Text>
        </View>
        <TouchableOpacity style={styles.headerButton} onPress={createNote} disabled={creating}>
          <MaterialCommunityIcons name="plus" size={20} color={colors.white} />
          <Text style={styles.headerButtonText}>{creating ? 'Creating' : 'New'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchBox}>
        <MaterialCommunityIcons name="magnify" size={18} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search notes..."
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
        />
      </View>

      {notes.loading ? (
        <ActivityIndicator color={colors.primary} style={styles.loading} />
      ) : (
        <FlatList
          data={filteredNotes}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="notebook-outline" size={44} color={colors.primaryLight} />
              <Text style={styles.emptyTitle}>No Markdown notes yet</Text>
              <Text style={styles.emptyText}>Each note becomes its own folder with index.md and an assets directory.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  eyebrow: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  headerTitle: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
  searchBox: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    paddingVertical: spacing.md,
  },
  list: {
    padding: spacing.lg,
    paddingBottom: 96,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  noteIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.backgroundMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  excerpt: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  iconButton: {
    padding: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  loading: {
    marginTop: spacing.xxl,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 72,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginTop: spacing.md,
  },
  emptyText: {
    color: colors.textMuted,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 22,
    marginTop: spacing.sm,
  },
});
