import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  SafeAreaView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LibraryItem, LibraryItemStatus } from '../types';
import { LibraryService } from '../services/libraryService';
import { MarkdownNoteService } from '../services/markdownNoteService';
import type { LibraryItemDetailScreenProps } from '../navigation/types';
import { colors } from '../theme/colors';
import { borderRadius, spacing } from '../theme/spacing';
import { formatDateTime } from '../utils/formatters';

const libraryService = new LibraryService();
const markdownNoteService = new MarkdownNoteService();

function statusLabel(status: LibraryItemStatus): string {
  if (status === 'finished') return 'Finished';
  if (status === 'reading') return 'Reading';
  return 'Unread';
}

export default function LibraryItemDetailScreen() {
  const route = useRoute<LibraryItemDetailScreenProps['route']>();
  const navigation = useNavigation<any>();
  const [item, setItem] = useState<LibraryItem | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const nextItem = await libraryService.getById(route.params.libraryItemId);
      if (nextItem?.status === 'unread') {
        setItem(await libraryService.updateStatus(nextItem.id, 'reading'));
        return;
      }
      setItem(nextItem);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [route.params.libraryItemId]);

  const updateStatus = async (status: LibraryItemStatus) => {
    if (!item) return;
    setItem(await libraryService.updateStatus(item.id, status));
  };

  const openFile = async () => {
    if (!item) return;

    try {
      let nextItem = item;
      if (item.status === 'unread') {
        nextItem = await libraryService.updateStatus(item.id, 'reading');
        setItem(nextItem);
      }

      const canOpen = await Linking.canOpenURL(nextItem.filePath);
      if (canOpen) {
        await Linking.openURL(nextItem.filePath);
        return;
      }

      await Share.share({
        url: nextItem.filePath,
        title: nextItem.title,
        message: nextItem.title,
      });
    } catch (err: any) {
      Alert.alert('Cannot open file', err.message || 'Please try sharing it to another reader app.');
    }
  };

  const createLinkedNote = async () => {
    if (!item) return;
    const note = await markdownNoteService.create({
      title: `${item.title} Notes`,
      linkedBookId: item.id,
    });
    navigation.navigate('MarkdownNoteEditor', { noteId: note.id });
  };

  const deleteItem = () => {
    if (!item) return;
    Alert.alert('Remove from bookshelf', 'The library record will be hidden. The first version keeps this as a soft delete.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await libraryService.delete(item.id);
          navigation.goBack();
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>This book no longer exists.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.cover}>
          <MaterialCommunityIcons name="book-open-page-variant-outline" size={42} color={colors.primaryDark} />
          <Text style={styles.ext}>{item.fileExt.toUpperCase()}</Text>
        </View>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.fileName}>{item.fileName}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>{statusLabel(item.status)}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reading status</Text>
        <View style={styles.statusSummary}>
          <Text style={styles.statusSummaryTitle}>Current: {statusLabel(item.status)}</Text>
          <Text style={styles.statusSummaryText}>
            Opening this book marks it as Reading automatically. Only finishing needs a manual action.
          </Text>
        </View>
        {item.status === 'finished' ? (
          <TouchableOpacity style={styles.statusButton} onPress={() => updateStatus('reading')}>
            <Text style={styles.statusButtonText}>Move back to Reading</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.statusButtonActive} onPress={() => updateStatus('finished')}>
            <Text style={styles.statusButtonTextActive}>Mark Finished</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>File info</Text>
        <Text style={styles.info}>Imported: {formatDateTime(item.importedAt)}</Text>
        <Text style={styles.info}>Path: {item.filePath}</Text>
      </View>

      <View style={styles.actionGrid}>
        <TouchableOpacity style={styles.primaryAction} onPress={openFile}>
          <MaterialCommunityIcons name="open-in-new" size={18} color={colors.white} />
          <Text style={styles.primaryActionText}>Open / Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryAction} onPress={createLinkedNote}>
          <MaterialCommunityIcons name="notebook-plus-outline" size={18} color={colors.primaryDark} />
          <Text style={styles.secondaryActionText}>Write Note</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.deleteButton} onPress={deleteItem}>
        <Text style={styles.deleteText}>Remove from bookshelf</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  center: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  muted: {
    color: colors.textMuted,
    fontSize: 15,
  },
  hero: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.xxl,
  },
  cover: {
    width: 116,
    height: 144,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.backgroundMuted,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  ext: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: '900',
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 32,
    textAlign: 'center',
  },
  fileName: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  statusBadge: {
    marginTop: spacing.md,
    borderRadius: borderRadius.full,
    backgroundColor: colors.backgroundMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  statusText: {
    color: colors.primaryDark,
    fontSize: 12,
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
  statusSummary: {
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundMuted,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  statusSummaryTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  statusSummaryText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginTop: spacing.xs,
  },
  statusButton: {
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundMuted,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  statusButtonActive: {
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  statusButtonText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '800',
  },
  statusButtonTextActive: {
    color: colors.white,
  },
  info: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 22,
    marginBottom: spacing.sm,
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
  secondaryActionText: {
    color: colors.primaryDark,
    fontSize: 14,
    fontWeight: '800',
  },
  deleteButton: {
    marginTop: 'auto',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  deleteText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '800',
  },
});
