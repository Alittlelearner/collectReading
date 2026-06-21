import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BookmarkService } from '../services/bookmarkService';
import { useBookmarks } from '../hooks/useBookmarks';
import { useFolders } from '../hooks/useFolders';
import { useNotes } from '../hooks/useNotes';
import { useTags } from '../hooks/useTags';
import StatusToggle from '../components/StatusToggle';
import NotesList from '../components/NotesList';
import { Bookmark } from '../types';
import { colors } from '../theme/colors';
import { borderRadius, spacing } from '../theme/spacing';
import type { BookmarkDetailScreenProps } from '../navigation/types';
import { getSourceLabel } from '../utils/sourceMeta';
import { formatDateTime } from '../utils/formatters';
import { normalizeImageUrl } from '../utils/media';

const bookmarkService = new BookmarkService();

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function BookmarkDetailScreen() {
  const route = useRoute<BookmarkDetailScreenProps['route']>();
  const navigation = useNavigation();
  const bookmarks = useBookmarks();
  const folders = useFolders();
  const tags = useTags();
  const notes = useNotes(route.params.bookmarkId);
  const [bookmark, setBookmark] = useState<Bookmark | null>(null);
  const [folderPickerVisible, setFolderPickerVisible] = useState(false);
  const [selectedFolderIds, setSelectedFolderIds] = useState<string[]>([]);
  const [savingFolders, setSavingFolders] = useState(false);
  const [tagPickerVisible, setTagPickerVisible] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [savingTags, setSavingTags] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const initial = await bookmarkService.getById(route.params.bookmarkId);
      if (!cancelled) {
        setBookmark(initial);
      }

      const hydrated = await bookmarkService.hydrateMetadataIfNeeded(route.params.bookmarkId);
      if (!cancelled && hydrated) {
        setBookmark(hydrated);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [route.params.bookmarkId]);

  if (!bookmark) {
    return (
      <View style={styles.loadingWrap}>
        <Text style={styles.loading}>正在打开这条收藏...</Text>
      </View>
    );
  }

  const coverUrl = normalizeImageUrl(bookmark.imageUrl);
  const sourceColor =
    (colors.sourceColors as Record<string, string>)[bookmark.sourceType] || colors.sourceColors.other;

  const refreshBookmark = async () => {
    const updated = await bookmarkService.getById(bookmark.id);
    if (updated) {
      setBookmark(updated);
    }
    bookmarks.refresh();
  };

  const handleToggleStatus = async () => {
    await bookmarks.toggleStatus(bookmark.id);
    await refreshBookmark();
  };

  const navigateHome = () => {
    if ('popToTop' in navigation && typeof navigation.popToTop === 'function') {
      navigation.popToTop();
      return;
    }

    navigation.navigate('HomeMain' as never);
  };

  const deleteAndReturnHome = async () => {
    await bookmarks.deleteBookmark(bookmark.id);
    navigateHome();
  };

  const handleDelete = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const confirmed = window.confirm('确定要把这条内容移到最近删除吗？');
      if (confirmed) {
        deleteAndReturnHome();
      }
      return;
    }

    Alert.alert('删除收藏', '确定要把这条内容移到最近删除吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '移入最近删除',
        style: 'destructive',
        onPress: deleteAndReturnHome,
      },
    ]);
  };

  const handleOpenLink = () => {
    bookmarkService
      .incrementReadCount(bookmark.id)
      .then(async (updated) => {
        setBookmark(updated);
        await bookmarks.refresh();
        return Linking.openURL(bookmark.url);
      })
      .catch(() => {
        Alert.alert('无法打开链接');
      });
  };

  const handleToggleStar = async () => {
    await bookmarks.toggleStar(bookmark.id);
    await refreshBookmark();
  };

  const handleArchive = async () => {
    await bookmarks.archiveBookmark(bookmark.id);
    navigation.goBack();
  };

  const handleRestore = async () => {
    await bookmarks.restoreBookmark(bookmark.id);
    await refreshBookmark();
  };

  const openFolderPicker = () => {
    setSelectedFolderIds(bookmark.folders.map((folder) => folder.id));
    setFolderPickerVisible(true);
  };

  const openTagPicker = () => {
    setSelectedTagIds(bookmark.tags.map((tag) => tag.id));
    setTagPickerVisible(true);
  };

  const toggleFolderSelection = (folderId: string) => {
    setSelectedFolderIds((current) =>
      current.includes(folderId)
        ? current.filter((id) => id !== folderId)
        : [...current, folderId],
    );
  };

  const toggleTagSelection = (tagId: string) => {
    setSelectedTagIds((current) =>
      current.includes(tagId)
        ? current.filter((id) => id !== tagId)
        : [...current, tagId],
    );
  };

  const saveFolderSelection = async () => {
    setSavingFolders(true);
    try {
      await bookmarks.updateBookmark(bookmark.id, { folderIds: selectedFolderIds });
      await refreshBookmark();
      setFolderPickerVisible(false);
    } finally {
      setSavingFolders(false);
    }
  };

  const saveTagSelection = async () => {
    setSavingTags(true);
    try {
      await bookmarks.updateBookmark(bookmark.id, { tagIds: selectedTagIds });
      await refreshBookmark();
      setTagPickerVisible(false);
    } finally {
      setSavingTags(false);
    }
  };

  return (
    <>
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        {coverUrl ? (
          <Image source={{ uri: coverUrl }} style={styles.cover} resizeMode="cover" />
        ) : (
          <View style={styles.coverFallback}>
            <MaterialCommunityIcons
              name="book-open-page-variant-outline"
              size={44}
              color={colors.primary}
            />
          </View>
        )}

        <View style={styles.sourceRow}>
          <View
            style={[
              styles.sourceBadge,
              { backgroundColor: `${sourceColor}16`, borderColor: `${sourceColor}40` },
            ]}
          >
            <Text style={[styles.sourceText, { color: sourceColor }]}>
              {getSourceLabel(bookmark.sourceType)}
            </Text>
          </View>
          <StatusToggle status={bookmark.learningStatus} onToggle={handleToggleStatus} size="small" />
        </View>

        <View style={styles.inlineActions}>
          <TouchableOpacity style={styles.inlineActionBtn} onPress={handleToggleStar}>
            <MaterialCommunityIcons
              name={bookmark.isStarred ? 'star' : 'star-outline'}
              size={16}
              color={bookmark.isStarred ? colors.warning : colors.textSecondary}
            />
            <Text style={styles.inlineActionText}>{bookmark.isStarred ? '取消星标' : '加入星标'}</Text>
          </TouchableOpacity>
          {!bookmark.deletedAt ? (
            <TouchableOpacity style={styles.inlineActionBtn} onPress={handleArchive}>
              <MaterialCommunityIcons name="archive-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.inlineActionText}>归档</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.inlineActionBtn} onPress={handleRestore}>
              <MaterialCommunityIcons name="restore" size={16} color={colors.textSecondary} />
              <Text style={styles.inlineActionText}>恢复</Text>
            </TouchableOpacity>
          )}
          {!bookmark.deletedAt ? (
            <TouchableOpacity style={styles.inlineActionBtn} onPress={openFolderPicker}>
              <MaterialCommunityIcons name="folder-move-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.inlineActionText}>整理收藏夹</Text>
            </TouchableOpacity>
          ) : null}
          {!bookmark.deletedAt ? (
            <TouchableOpacity style={styles.inlineActionBtn} onPress={openTagPicker}>
              <MaterialCommunityIcons name="tag-edit-outline" size={16} color={colors.textSecondary} />
              <Text style={styles.inlineActionText}>编辑标签</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <Text style={styles.title}>{bookmark.title || '未命名内容'}</Text>

        <Text style={styles.url} numberOfLines={2}>
          {bookmark.url}
        </Text>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[
              styles.readActionBtn,
              bookmark.learningStatus === 'read' ? styles.markUnreadBtn : styles.markReadBtn,
            ]}
            onPress={handleToggleStatus}
          >
            <Text
              style={[
                styles.readActionText,
                bookmark.learningStatus === 'read' ? styles.markUnreadText : styles.markReadText,
              ]}
            >
              {bookmark.learningStatus === 'read' ? '标记未读' : '完成阅读'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.openBtn} onPress={handleOpenLink}>
            <MaterialCommunityIcons name="open-in-new" size={16} color={colors.white} />
            <Text style={styles.openBtnText}>打开原链接</Text>
          </TouchableOpacity>
        </View>
      </View>

      {(bookmark.author || bookmark.description || bookmark.originalTags.length > 0 || bookmark.publishedAt) ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>摘录信息</Text>
          {bookmark.author ? <InfoRow label="作者" value={bookmark.author} /> : null}
          {bookmark.publishedAt ? (
            <InfoRow label="创作时间" value={formatDateTime(bookmark.publishedAt)} />
          ) : null}
          {bookmark.description ? <Text style={styles.description}>{bookmark.description}</Text> : null}
          {bookmark.originalTags.length > 0 ? (
            <View style={styles.tagRow}>
              {bookmark.originalTags.map((tag) => (
                <View key={tag} style={styles.originalTag}>
                  <Text style={styles.originalTagText}>{tag}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      {bookmark.notes ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>备注</Text>
          <Text style={styles.notesText}>{bookmark.notes}</Text>
        </View>
      ) : null}

      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitleInline}>收藏夹</Text>
          {!bookmark.deletedAt ? (
            <TouchableOpacity style={styles.sectionActionBtn} onPress={openFolderPicker}>
              <MaterialCommunityIcons name="folder-edit-outline" size={15} color={colors.primaryDark} />
              <Text style={styles.sectionActionText}>移动/复制</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        {bookmark.folders.length > 0 ? (
          <View style={styles.tagRow}>
            {bookmark.folders.map((folder) => (
              <View key={folder.id} style={styles.originalTag}>
                <Text style={styles.originalTagText}>{folder.name}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptySectionText}>还没有放进任何收藏夹</Text>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitleInline}>标签</Text>
          {!bookmark.deletedAt ? (
            <TouchableOpacity style={styles.sectionActionBtn} onPress={openTagPicker}>
              <MaterialCommunityIcons name="tag-edit-outline" size={15} color={colors.primaryDark} />
              <Text style={styles.sectionActionText}>编辑</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        {bookmark.tags.length > 0 ? (
          <View style={styles.tagRow}>
            {bookmark.tags.map((tag) => (
              <View
                key={tag.id}
                style={[
                  styles.tag,
                  { backgroundColor: `${tag.color}16`, borderColor: `${tag.color}35` },
                ]}
              >
                <Text style={[styles.tagText, { color: tag.color }]}>{tag.name}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptySectionText}>还没有添加标签</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>阅读轨迹</Text>
        <InfoRow label="域名" value={bookmark.sourceDomain} />
        <InfoRow label="添加时间" value={formatDateTime(bookmark.createdAt)} />
        <InfoRow label="上次阅读" value={formatDateTime(bookmark.readAt)} />
        <InfoRow label="阅读次数" value={`${bookmark.readCount}`} />
        <InfoRow label="擦亮次数" value={`${bookmark.resurfaceCount}`} />
        <InfoRow label="上次擦亮" value={formatDateTime(bookmark.lastResurfacedAt)} />
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

      {!bookmark.deletedAt ? (
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteBtnText}>移入最近删除</Text>
        </TouchableOpacity>
      ) : null}
    </ScrollView>

    <Modal transparent visible={tagPickerVisible} animationType="fade">
      <Pressable style={styles.modalBackdrop} onPress={() => setTagPickerVisible(false)}>
        <Pressable style={styles.folderPicker} onPress={(event) => event.stopPropagation()}>
          <View style={styles.folderPickerHeader}>
            <View>
              <Text style={styles.folderPickerTitle}>编辑标签</Text>
              <Text style={styles.folderPickerSubtitle}>勾选后保存，会同步到这条收藏</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setTagPickerVisible(false)}>
              <MaterialCommunityIcons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.folderPickerList} showsVerticalScrollIndicator={false}>
            {tags.tags.length > 0 ? (
              tags.tags.map((tag) => {
                const checked = selectedTagIds.includes(tag.id);
                return (
                  <TouchableOpacity
                    key={tag.id}
                    style={[styles.folderOption, checked && styles.folderOptionSelected]}
                    onPress={() => toggleTagSelection(tag.id)}
                  >
                    <View style={styles.folderOptionLeft}>
                      <View style={[styles.tagDot, { backgroundColor: tag.color }]} />
                      <Text style={[styles.folderOptionText, checked && styles.folderOptionTextSelected]}>
                        {tag.name}
                      </Text>
                    </View>
                    <MaterialCommunityIcons
                      name={checked ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                      size={20}
                      color={checked ? colors.primary : colors.textMuted}
                    />
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.folderPickerEmpty}>
                <Text style={styles.emptySectionText}>还没有标签，先去创建一个标签</Text>
                <TouchableOpacity
                  style={styles.manageFolderBtn}
                  onPress={() => {
                    setTagPickerVisible(false);
                    navigation.navigate('TagManage' as never);
                  }}
                >
                  <Text style={styles.manageFolderBtnText}>创建标签</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          <View style={styles.folderPickerActions}>
            <TouchableOpacity
              style={styles.clearFolderBtn}
              onPress={() => setSelectedTagIds([])}
              disabled={savingTags}
            >
              <Text style={styles.clearFolderText}>清空标签</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveFolderBtn, savingTags && styles.saveFolderBtnDisabled]}
              onPress={saveTagSelection}
              disabled={savingTags}
            >
              <Text style={styles.saveFolderText}>{savingTags ? '正在保存...' : '保存'}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>

    <Modal transparent visible={folderPickerVisible} animationType="fade">
      <Pressable style={styles.modalBackdrop} onPress={() => setFolderPickerVisible(false)}>
        <Pressable style={styles.folderPicker} onPress={(event) => event.stopPropagation()}>
          <View style={styles.folderPickerHeader}>
            <View>
              <Text style={styles.folderPickerTitle}>移动/复制到收藏夹</Text>
              <Text style={styles.folderPickerSubtitle}>保留多个勾选就是复制到多个收藏夹</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setFolderPickerVisible(false)}>
              <MaterialCommunityIcons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.folderPickerList} showsVerticalScrollIndicator={false}>
            {folders.folders.length > 0 ? (
              folders.folders.map((folder) => {
                const checked = selectedFolderIds.includes(folder.id);
                return (
                  <TouchableOpacity
                    key={folder.id}
                    style={[styles.folderOption, checked && styles.folderOptionSelected]}
                    onPress={() => toggleFolderSelection(folder.id)}
                  >
                    <View style={styles.folderOptionLeft}>
                      <MaterialCommunityIcons
                        name={checked ? 'folder-check-outline' : 'folder-outline'}
                        size={20}
                        color={checked ? colors.primaryDark : colors.textSecondary}
                      />
                      <Text style={[styles.folderOptionText, checked && styles.folderOptionTextSelected]}>
                        {folder.name}
                      </Text>
                    </View>
                    <MaterialCommunityIcons
                      name={checked ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                      size={20}
                      color={checked ? colors.primary : colors.textMuted}
                    />
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.folderPickerEmpty}>
                <Text style={styles.emptySectionText}>还没有收藏夹，先去创建一个收藏夹</Text>
                <TouchableOpacity
                  style={styles.manageFolderBtn}
                  onPress={() => {
                    setFolderPickerVisible(false);
                    navigation.navigate('FolderManage' as never);
                  }}
                >
                  <Text style={styles.manageFolderBtnText}>创建收藏夹</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          <View style={styles.folderPickerActions}>
            <TouchableOpacity
              style={styles.clearFolderBtn}
              onPress={() => setSelectedFolderIds([])}
              disabled={savingFolders}
            >
              <Text style={styles.clearFolderText}>移出全部</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveFolderBtn, savingFolders && styles.saveFolderBtnDisabled]}
              onPress={saveFolderSelection}
              disabled={savingFolders}
            >
              <Text style={styles.saveFolderText}>{savingFolders ? '正在保存...' : '保存'}</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
    </>
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
  loadingWrap: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loading: {
    color: colors.textMuted,
    fontSize: 15,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },
  cover: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.backgroundMuted,
  },
  coverFallback: {
    width: '100%',
    height: 160,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.backgroundMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  sourceBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  sourceText: {
    fontSize: 12,
    fontWeight: '700',
  },
  inlineActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  inlineActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.backgroundMuted,
  },
  inlineActionText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 34,
    marginBottom: spacing.sm,
  },
  url: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notesSection: {
    marginTop: spacing.lg,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  sectionTitleInline: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  sectionActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.backgroundMuted,
  },
  sectionActionText: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '700',
  },
  emptySectionText: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  notesText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 24,
  },
  description: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  tag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
  },
  tagDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  originalTag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.backgroundMuted,
  },
  originalTagText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  infoLabel: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  infoValue: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    textAlign: 'right',
  },
  readActionBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markReadBtn: {
    backgroundColor: colors.success,
  },
  markUnreadBtn: {
    backgroundColor: colors.backgroundMuted,
  },
  readActionText: {
    fontSize: 15,
    fontWeight: '700',
  },
  markReadText: {
    color: colors.white,
  },
  markUnreadText: {
    color: colors.text,
  },
  openBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  openBtnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  deleteBtn: {
    marginTop: spacing.lg,
    backgroundColor: `${colors.error}16`,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  deleteBtnText: {
    color: colors.error,
    fontSize: 15,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(36,24,14,0.28)',
    justifyContent: 'flex-end',
  },
  folderPicker: {
    maxHeight: '78%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  folderPickerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  folderPickerTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  folderPickerSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  closeBtn: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.full,
    backgroundColor: colors.backgroundMuted,
  },
  folderPickerList: {
    maxHeight: 360,
  },
  folderOption: {
    minHeight: 48,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  folderOptionSelected: {
    backgroundColor: colors.backgroundMuted,
    borderColor: colors.primaryLight,
  },
  folderOptionLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  folderOptionText: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  folderOptionTextSelected: {
    color: colors.primaryDark,
  },
  folderPickerEmpty: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    gap: spacing.md,
  },
  manageFolderBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  manageFolderBtnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  folderPickerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  clearFolderBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    backgroundColor: colors.card,
  },
  clearFolderText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  saveFolderBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
  },
  saveFolderBtnDisabled: {
    opacity: 0.6,
  },
  saveFolderText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
});
