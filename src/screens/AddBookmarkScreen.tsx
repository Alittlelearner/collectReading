import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import URLInput from '../components/URLInput';
import { useBookmarks } from '../hooks/useBookmarks';
import { useFolders } from '../hooks/useFolders';
import { useTags } from '../hooks/useTags';
import { colors } from '../theme/colors';
import { spacing, borderRadius } from '../theme/spacing';
import { BookmarkService } from '../services/bookmarkService';
import { URLParserService } from '../services/urlParserService';
import { ExtractedMetadata } from '../types';
import { getSourceLabel } from '../utils/sourceMeta';
import { formatDateTime } from '../utils/formatters';

const bookmarkService = new BookmarkService();
const urlParser = new URLParserService();

type AddMode = 'single' | 'batch';

function isLikelyParsed(metadata: ExtractedMetadata | null, url: string): boolean {
  if (!metadata) return false;

  return (
    Boolean(metadata.author) ||
    Boolean(metadata.description) ||
    Boolean(metadata.imageUrl) ||
    (metadata.title && metadata.title !== metadata.sourceDomain && metadata.title !== url) ||
    (metadata.originalTags?.length || 0) > 0 ||
    Boolean(metadata.publishedAt)
  );
}

function parseBatchUrls(value: string): string[] {
  const seen = new Set<string>();
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => {
      if (seen.has(line)) {
        return false;
      }
      seen.add(line);
      return true;
    });
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'string' && error) {
    return error;
  }

  return '未知错误';
}

export default function AddBookmarkScreen() {
  const navigation = useNavigation();
  const bookmarks = useBookmarks();
  const tags = useTags();
  const folders = useFolders();

  const [mode, setMode] = useState<AddMode>('single');
  const [url, setUrl] = useState('');
  const [batchText, setBatchText] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [preview, setPreview] = useState<ExtractedMetadata | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    if (mode !== 'single') {
      return;
    }

    const trimmed = url.trim();
    if (!trimmed || trimmed === previewUrl) {
      return;
    }

    if (!/^https?:\/\/.+/.test(trimmed)) {
      setPreview(null);
      setPreviewUrl('');
      return;
    }

    let cancelled = false;
    setParsing(true);

    const timer = setTimeout(async () => {
      try {
        const metadata = await urlParser.parse(trimmed);
        if (!cancelled) {
          setPreview(metadata);
          setPreviewUrl(trimmed);
        }
      } catch {
        if (!cancelled) {
          setPreview(null);
          setPreviewUrl(trimmed);
        }
      } finally {
        if (!cancelled) {
          setParsing(false);
        }
      }
    }, 450);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [mode, url, previewUrl]);

  const previewReady = useMemo(() => isLikelyParsed(preview, url.trim()), [preview, url]);
  const batchUrls = useMemo(() => parseBatchUrls(batchText), [batchText]);

  const resetForm = () => {
    setUrl('');
    setBatchText('');
    setNotes('');
    setSelectedTags([]);
    setSelectedFolders([]);
    setError('');
    setPreview(null);
    setPreviewUrl('');
    setNewTagName('');
  };

  const handleAdd = async () => {
    if (!url.trim()) {
      setError('请输入链接');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const trimmedUrl = url.trim();
      const exists = await bookmarkService.exists(trimmedUrl);

      if (exists) {
        Alert.alert('已经收藏过了', '这条链接已经在你的收藏里。', [
          { text: '取消', style: 'cancel' },
          { text: '返回', onPress: () => navigation.goBack() },
        ]);
        setLoading(false);
        return;
      }

      await bookmarks.addBookmark({
        url: trimmedUrl,
        tags: selectedTags,
        folders: selectedFolders,
        notes: notes.trim(),
      });

      resetForm();
      navigation.goBack();
    } catch (err: any) {
      const message = getErrorMessage(err);
      console.error('[AddBookmark] Failed to add bookmark', err);

      if (message === 'DUPLICATE_URL') {
        Alert.alert('已经收藏过了', '这条链接已经在你的收藏里。');
      } else {
        setError(`添加失败：${message}`);
      }
      setLoading(false);
    }
  };

  const handleBatchAdd = async () => {
    const urlsToAdd = [...batchUrls];
    const tagIdsToApply = [...selectedTags];
    const folderIdsToApply = [...selectedFolders];
    const notesToApply = notes.trim();

    if (urlsToAdd.length === 0) {
      setError('请按一行一个链接粘贴');
      return;
    }

    const invalidUrls = urlsToAdd.filter((item) => !/^https?:\/\/.+/.test(item));
    if (invalidUrls.length > 0) {
      setError(`有 ${invalidUrls.length} 行不是有效链接，请检查后再添加`);
      return;
    }

    setError('');
    setLoading(true);

    let added = 0;
    let duplicated = 0;
    let failed = 0;

    for (const item of urlsToAdd) {
      try {
        const bookmark = await bookmarkService.createPlaceholder({
          url: item,
          tags: tagIdsToApply,
          folders: folderIdsToApply,
          notes: notesToApply,
        });

        if (tagIdsToApply.length > 0 || folderIdsToApply.length > 0) {
          await bookmarkService.update(bookmark.id, {
            tagIds: tagIdsToApply,
            folderIds: folderIdsToApply,
          });
        }

        bookmarkService.enqueueMetadataHydration(bookmark.id);
        added += 1;
      } catch (err: any) {
        const message = getErrorMessage(err);
        console.error('[AddBookmark] Failed to add batch item', item, err);

        if (message === 'DUPLICATE_URL') {
          duplicated += 1;
        } else {
          failed += 1;
        }
      }
    }

    await bookmarks.refresh();
    await Promise.all([tags.refresh(), folders.refresh()]);
    setLoading(false);
    resetForm();

    const message = `已添加 ${added} 条，重复 ${duplicated} 条，失败 ${failed} 条。详情会在后台继续补全。`;

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.alert(`批量添加完成\n${message}`);
      navigation.goBack();
      return;
    }

    Alert.alert('批量添加完成', message, [{ text: '知道了', onPress: () => navigation.goBack() }]);
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((item) => item !== tagId) : [...prev, tagId],
    );
  };

  const toggleFolder = (folderId: string) => {
    setSelectedFolders((prev) =>
      prev.includes(folderId) ? prev.filter((item) => item !== folderId) : [...prev, folderId],
    );
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    await tags.createTag(newTagName.trim());
    setNewTagName('');
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.form}>
        <View style={styles.heroCard}>
          <View style={styles.heroHeaderRow}>
            <Text style={styles.heroTitle}>收进书房</Text>
            <TouchableOpacity style={styles.clearBtn} onPress={resetForm} disabled={loading}>
              <MaterialCommunityIcons name="broom" size={15} color={colors.primaryDark} />
              <Text style={styles.clearBtnText}>清空</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.heroSubtitle}>
            粘贴链接后，应用会尽量自动提取标题、作者、简介、封面和原始标签。
          </Text>
        </View>

        <View style={styles.modeTabs}>
          <TouchableOpacity
            style={[styles.modeTab, mode === 'single' && styles.modeTabActive]}
            onPress={() => {
              setMode('single');
              setError('');
            }}
          >
            <Text style={[styles.modeTabText, mode === 'single' && styles.modeTabTextActive]}>单条</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeTab, mode === 'batch' && styles.modeTabActive]}
            onPress={() => {
              setMode('batch');
              setError('');
            }}
          >
            <Text style={[styles.modeTabText, mode === 'batch' && styles.modeTabTextActive]}>批量</Text>
          </TouchableOpacity>
        </View>

        {mode === 'single' ? (
          <>
        <Text style={styles.label}>链接</Text>
        <URLInput value={url} onChangeText={setUrl} loading={loading || parsing} error={error} />

        {url.trim() ? (
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle}>解析结果</Text>
              {parsing ? <Text style={styles.previewStatus}>正在识别...</Text> : null}
            </View>

            {previewReady && preview ? (
              <>
                {preview.imageUrl ? (
                  <Image source={{ uri: preview.imageUrl }} style={styles.previewCover} resizeMode="cover" />
                ) : null}

                <View style={styles.previewMetaRow}>
                  <View style={styles.previewSourceBadge}>
                    <MaterialCommunityIcons name="bookmark-outline" size={14} color={colors.primary} />
                    <Text style={styles.previewSourceText}>{getSourceLabel(preview.sourceType)}</Text>
                  </View>
                  {preview.author ? <Text style={styles.previewAuthor}>{preview.author}</Text> : null}
                </View>

                <Text style={styles.previewHeadline}>{preview.title}</Text>

                {preview.description ? (
                  <Text style={styles.previewDescription} numberOfLines={4}>
                    {preview.description}
                  </Text>
                ) : null}

                <View style={styles.previewInfoList}>
                  <InfoLine label="域名" value={preview.sourceDomain || '未识别'} />
                  <InfoLine
                    label="发布时间"
                    value={preview.publishedAt ? formatDateTime(preview.publishedAt) : '未识别'}
                  />
                </View>

                {preview.originalTags && preview.originalTags.length > 0 ? (
                  <View style={styles.previewTagSection}>
                    <Text style={styles.previewTagSectionTitle}>原始标签</Text>
                    <View style={styles.previewTags}>
                      {preview.originalTags.slice(0, 8).map((tag) => (
                        <View key={tag} style={styles.previewTag}>
                          <Text style={styles.previewTagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}
              </>
            ) : (
              <Text style={styles.previewFallback}>
                {parsing
                  ? '正在尝试获取标题、作者、简介和封面...'
                  : '这条链接暂时没有拿到完整详情，不过依然可以先保存。'}
              </Text>
            )}
          </View>
        ) : null}
          </>
        ) : (
          <>
            <Text style={styles.label}>批量链接</Text>
            <TextInput
              style={[styles.batchInput, error && styles.batchInputError]}
              placeholder="一行一个链接，例如：
https://example.com/article-1
https://example.com/article-2"
              placeholderTextColor={colors.textMuted}
              value={batchText}
              onChangeText={setBatchText}
              multiline
              autoCapitalize="none"
              autoCorrect={false}
              textAlignVertical="top"
              editable={!loading}
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <View style={styles.batchHintRow}>
              <MaterialCommunityIcons name="playlist-plus" size={16} color={colors.textMuted} />
              <Text style={styles.batchHintText}>
                已识别 {batchUrls.length} 条链接，保存后详情会在后台排队补全
              </Text>
            </View>
          </>
        )}

        <View style={styles.inlineSectionHeader}>
          <Text style={styles.labelCompact}>标签</Text>
          <TouchableOpacity onPress={() => navigation.navigate('TagManage' as never)}>
            <Text style={styles.inlineActionLink}>管理标签</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.tagRow}>
          {tags.tags.map((tag) => (
            <TouchableOpacity
              key={tag.id}
              style={[
                styles.tagChip,
                { backgroundColor: `${tag.color}16`, borderColor: `${tag.color}35` },
                selectedTags.includes(tag.id) && {
                  backgroundColor: tag.color,
                  borderColor: tag.color,
                },
              ]}
              onPress={() => toggleTag(tag.id)}
            >
              <Text
                style={[
                  styles.tagChipText,
                  { color: tag.color },
                  selectedTags.includes(tag.id) && { color: colors.white },
                ]}
              >
                {tag.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.newTagRow}>
          <TextInput
            style={styles.newTagInput}
            placeholder="顺手新建一个标签"
            placeholderTextColor={colors.textMuted}
            value={newTagName}
            onChangeText={setNewTagName}
          />
          <TouchableOpacity style={styles.newTagBtn} onPress={handleCreateTag}>
            <Text style={styles.newTagBtnText}>添加</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inlineSectionHeader}>
          <Text style={styles.labelCompact}>收藏夹</Text>
          <TouchableOpacity onPress={() => navigation.navigate('FolderManage' as never)}>
            <Text style={styles.inlineActionLink}>管理收藏夹</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.tagRow}>
          {folders.folders.map((folder) => (
            <TouchableOpacity
              key={folder.id}
              style={[
                styles.folderChip,
                selectedFolders.includes(folder.id) && styles.folderChipSelected,
              ]}
              onPress={() => toggleFolder(folder.id)}
            >
              <Text
                style={[
                  styles.folderChipText,
                  selectedFolders.includes(folder.id) && styles.folderChipTextSelected,
                ]}
              >
                {folder.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>备注</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="写下想看的原因、重点或阅读计划..."
          placeholderTextColor={colors.textMuted}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[
            styles.submitBtn,
            (mode === 'single' ? !url.trim() : batchUrls.length === 0) && styles.submitBtnDisabled,
          ]}
          onPress={mode === 'single' ? handleAdd : handleBatchAdd}
          disabled={(mode === 'single' ? !url.trim() : batchUrls.length === 0) || loading}
        >
          <Text style={styles.submitText}>
            {loading ? '正在入藏...' : mode === 'single' ? '添加收藏' : `批量添加 ${batchUrls.length} 条`}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.previewInfoRow}>
      <Text style={styles.previewInfoLabel}>{label}</Text>
      <Text style={styles.previewInfoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  form: {
    padding: spacing.lg,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  heroTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
    flex: 1,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.backgroundMuted,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  clearBtnText: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '700',
  },
  heroSubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  labelCompact: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  inlineSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  inlineActionLink: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundMuted,
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  modeTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  modeTabActive: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modeTabText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  modeTabTextActive: {
    color: colors.primaryDark,
  },
  previewCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginTop: spacing.sm,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  previewTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  previewStatus: {
    color: colors.textMuted,
    fontSize: 12,
  },
  previewCover: {
    width: '100%',
    height: 180,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    backgroundColor: colors.backgroundMuted,
  },
  previewMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  previewSourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.backgroundMuted,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  previewSourceText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  previewAuthor: {
    color: colors.textSecondary,
    fontSize: 12,
    flexShrink: 1,
    textAlign: 'right',
  },
  previewHeadline: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 26,
  },
  previewDescription: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing.sm,
  },
  previewInfoList: {
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  previewInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  previewInfoLabel: {
    color: colors.textMuted,
    fontSize: 12,
  },
  previewInfoValue: {
    color: colors.textSecondary,
    fontSize: 12,
    flex: 1,
    textAlign: 'right',
  },
  previewTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  previewTagSection: {
    marginTop: spacing.md,
  },
  previewTagSectionTitle: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  previewTag: {
    backgroundColor: colors.backgroundMuted,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  previewTagText: {
    color: colors.primaryDark,
    fontSize: 11,
    fontWeight: '600',
  },
  previewFallback: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  batchInput: {
    minHeight: 180,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  batchInputError: {
    borderColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
  batchHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  batchHintText: {
    color: colors.textMuted,
    fontSize: 12,
    flex: 1,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tagChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  tagChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  folderChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  folderChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  folderChipText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  folderChipTextSelected: {
    color: colors.white,
  },
  newTagRow: {
    flexDirection: 'row',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  newTagInput: {
    flex: 1,
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  newTagBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.lg,
    justifyContent: 'center',
  },
  newTagBtnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  notesInput: {
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 15,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    minHeight: 110,
    borderWidth: 1,
    borderColor: colors.border,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginTop: spacing.xxxl,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
