import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { BookmarkService } from '../services/bookmarkService';
import { useBookmarks } from '../hooks/useBookmarks';
import { useNotes } from '../hooks/useNotes';
import StatusToggle from '../components/StatusToggle';
import NotesList from '../components/NotesList';
import { Bookmark } from '../types';
import { colors } from '../theme/colors';
import { spacing, borderRadius } from '../theme/spacing';
import type { BookmarkDetailScreenProps } from '../navigation/types';

const bookmarkService = new BookmarkService();

export default function BookmarkDetailScreen() {
  const route = useRoute<BookmarkDetailScreenProps['route']>();
  const navigation = useNavigation();
  const bookmarks = useBookmarks();
  const notes = useNotes(route.params.bookmarkId);
  const [bookmark, setBookmark] = useState<Bookmark | null>(null);

  useEffect(() => {
    bookmarkService.getById(route.params.bookmarkId).then(setBookmark);
  }, [route.params.bookmarkId]);

  if (!bookmark) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>加载中...</Text>
      </View>
    );
  }

  const handleToggleStatus = async () => {
    await bookmarks.toggleStatus(bookmark.id);
    const updated = await bookmarkService.getById(bookmark.id);
    if (updated) setBookmark(updated);
  };

  const handleDelete = () => {
    Alert.alert('删除收藏', '确定要删除这条收藏吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          await bookmarks.deleteBookmark(bookmark.id);
          navigation.goBack();
        },
      },
    ]);
  };

  const handleOpenLink = () => {
    Linking.openURL(bookmark.url).catch(() => {
      Alert.alert('无法打开链接');
    });
  };

  const formatDate = (ts: number | null) => {
    if (!ts) return '-';
    return new Date(ts).toLocaleString('zh-CN');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.sourceRow}>
          <View style={[styles.sourceBadge, { backgroundColor: (colors.sourceColors as any)[bookmark.sourceType] + '20' || colors.sourceColors.other + '20' }]}>
            <Text style={[styles.sourceText, { color: (colors.sourceColors as any)[bookmark.sourceType] || colors.sourceColors.other }]}>
              {getSourceLabel(bookmark.sourceType)}
            </Text>
          </View>
          <StatusToggle status={bookmark.learningStatus} onToggle={handleToggleStatus} size="small" />
        </View>

        <Text style={styles.title}>{bookmark.title || '(无标题)'}</Text>

        <Text style={styles.url} numberOfLines={2}>
          {bookmark.url}
        </Text>
      </View>

      {bookmark.notes ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>备注</Text>
          <Text style={styles.notesText}>{bookmark.notes}</Text>
        </View>
      ) : null}

      {bookmark.tags.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>标签</Text>
          <View style={styles.tagRow}>
            {bookmark.tags.map((tag) => (
              <View key={tag.id} style={[styles.tag, { backgroundColor: tag.color + '20' }]}>
                <Text style={[styles.tagText, { color: tag.color }]}>{tag.name}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>信息</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>域名</Text>
          <Text style={styles.infoValue}>{bookmark.sourceDomain}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>添加时间</Text>
          <Text style={styles.infoValue}>{formatDate(bookmark.createdAt)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>阅读时间</Text>
          <Text style={styles.infoValue}>{formatDate(bookmark.readAt)}</Text>
        </View>
      </View>

      <View style={styles.notesSection}>
        <Text style={styles.sectionTitle}>笔记</Text>
        <NotesList
          notes={notes.notes}
          loading={notes.loading}
          onAdd={notes.addNote}
          onUpdate={notes.updateNote}
          onDelete={notes.deleteNote}
        />
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.openBtn} onPress={handleOpenLink}>
          <Text style={styles.openBtnText}>打开原链接</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteBtnText}>删除收藏</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function getSourceLabel(type: string): string {
  const labels: Record<string, string> = {
    bilibili: 'B站', zhihu: '知乎', wechat: '公众号',
    ebook: '电子书', website: '网站', metasearch: '秘塔', other: '其他',
  };
  return labels[type] || '其他';
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
  loading: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 40,
  },
  header: {
    marginBottom: spacing.xl,
  },
  sourceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sourceBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  sourceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
    marginBottom: spacing.sm,
  },
  url: {
    color: colors.textMuted,
    fontSize: 13,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  notesSection: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  notesText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  infoLabel: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  infoValue: {
    color: colors.text,
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  openBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  openBtnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  deleteBtn: {
    flex: 1,
    backgroundColor: colors.error + '20',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  deleteBtnText: {
    color: colors.error,
    fontSize: 15,
    fontWeight: '600',
  },
});
