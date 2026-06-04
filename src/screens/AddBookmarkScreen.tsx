import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import URLInput from '../components/URLInput';
import { useBookmarks } from '../hooks/useBookmarks';
import { useTags } from '../hooks/useTags';
import { colors } from '../theme/colors';
import { spacing, borderRadius } from '../theme/spacing';
import { BookmarkService } from '../services/bookmarkService';

const bookmarkService = new BookmarkService();

export default function AddBookmarkScreen() {
  const navigation = useNavigation();
  const bookmarks = useBookmarks();
  const tags = useTags();

  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [parsedTitle, setParsedTitle] = useState('');
  const [parsedSource, setParsedSource] = useState('');

  // 页面打开时重置状态
  useEffect(() => {
    setUrl('');
    setNotes('');
    setSelectedTags([]);
    setParsedTitle('');
    setParsedSource('');
    setError('');
    setLoading(false);
  }, []);

  const handleUrlChange = async (newUrl: string) => {
    setUrl(newUrl);
    if (!newUrl.trim()) {
      setParsedTitle('');
      setParsedSource('');
      return;
    }
    // URL 变化时重置解析状态
    setParsedTitle('');
    setParsedSource('');
  };

  const handleAdd = async () => {
    if (!url.trim()) {
      setError('请输入链接');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const exists = await bookmarkService.exists(url.trim());
      if (exists) {
        Alert.alert('已收藏', '该链接已存在于收藏库中', [
          { text: '取消', style: 'cancel' },
          { text: '好的', onPress: () => navigation.goBack() },
        ]);
        setLoading(false);
        return;
      }

      const bookmark = await bookmarks.addBookmark({
        url: url.trim(),
        tags: selectedTags,
        notes: notes.trim(),
      });

      setLoading(false);
      navigation.goBack();
    } catch (err: any) {
      if (err.message === 'DUPLICATE_URL') {
        Alert.alert('已收藏', '该链接已存在于收藏库中');
      } else {
        setError('添加失败，请重试');
      }
      setLoading(false);
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId],
    );
  };

  const [newTagName, setNewTagName] = useState('');

  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      Alert.alert('提示', '请输入标签名称');
      return;
    }
    
    // 检查是否已存在
    const exists = tags.tags.some(t => t.name.toLowerCase() === newTagName.trim().toLowerCase());
    if (exists) {
      Alert.alert('提示', '该标签已存在，请直接选择');
      setNewTagName('');
      return;
    }
    
    await tags.createTag(newTagName.trim());
    setNewTagName('');
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.form}>
        <Text style={styles.label}>链接</Text>
        <URLInput value={url} onChangeText={handleUrlChange} loading={loading} error={error} />

        <Text style={styles.label}>标签</Text>
        {!!tags.tags && tags.tags.length === 0 ? (
          <Text style={styles.emptyTagTip}>暂无标签，可输入标签名称创建</Text>
        ) : null}
        <View style={styles.tagRow}>
          {!!tags.tags && tags.tags.map((tag) => (
            <TouchableOpacity
              key={tag.id}
              style={[
                styles.tagChip,
                { backgroundColor: tag.color + '20' },
                selectedTags.includes(tag.id) && { backgroundColor: tag.color, borderColor: tag.color },
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
            placeholder="新建标签..."
            placeholderTextColor={colors.textMuted}
            value={newTagName}
            onChangeText={setNewTagName}
          />
          <TouchableOpacity style={styles.newTagBtn} onPress={handleCreateTag}>
            <Text style={styles.newTagBtnText}>添加</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>备注</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="添加备注..."
          placeholderTextColor={colors.textMuted}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[styles.submitBtn, !url.trim() && styles.submitBtnDisabled]}
          onPress={handleAdd}
          disabled={!url.trim() || loading}
        >
          <Text style={styles.submitText}>{loading ? '添加中...' : '添加收藏'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  emptyTagTip: {
    color: colors.textMuted,
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: spacing.sm,
  },
  tagChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  tagChipText: {
    fontSize: 13,
    fontWeight: '500',
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
    borderRadius: borderRadius.md,
  },
  newTagBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
  },
  newTagBtnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '500',
  },
  notesInput: {
    backgroundColor: colors.surface,
    color: colors.text,
    fontSize: 15,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    minHeight: 80,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.xxxl,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
