import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFolders } from '../hooks/useFolders';
import { useTags } from '../hooks/useTags';
import { useWiki } from '../hooks/useWiki';
import { colors } from '../theme/colors';
import { borderRadius, spacing } from '../theme/spacing';
import type { WikiGrouping, WikiScopeType } from '../types';

const groupingOptions: Array<{ value: WikiGrouping; label: string }> = [
  { value: 'folder', label: '按收藏夹' },
  { value: 'tag', label: '按标签' },
  { value: 'source', label: '按来源' },
  { value: 'timeline', label: '按月份' },
];

const scopeOptions: Array<{ value: WikiScopeType; label: string }> = [
  { value: 'all', label: '全部收藏' },
  { value: 'folder', label: '指定收藏夹' },
  { value: 'tag', label: '指定标签' },
  { value: 'starred', label: '仅星标' },
  { value: 'archived', label: '已归档' },
];

export default function WikiHubScreen() {
  const navigation = useNavigation<any>();
  const wiki = useWiki();
  const folders = useFolders();
  const tags = useTags();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [grouping, setGrouping] = useState<WikiGrouping>('folder');
  const [scopeType, setScopeType] = useState<WikiScopeType>('all');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);

  const selectedFolderName = useMemo(
    () => folders.folders.find((folder) => folder.id === selectedFolderId)?.name || '未选择',
    [folders.folders, selectedFolderId],
  );
  const selectedTagName = useMemo(
    () => tags.tags.find((tag) => tag.id === selectedTagId)?.name || '未选择',
    [tags.tags, selectedTagId],
  );

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('请先填写 Wiki 名称');
      return;
    }

    if (scopeType === 'folder' && !selectedFolderId) {
      Alert.alert('请先选择一个收藏夹');
      return;
    }

    if (scopeType === 'tag' && !selectedTagId) {
      Alert.alert('请先选择一个标签');
      return;
    }

    await wiki.createSpace({
      name: name.trim(),
      description: description.trim(),
      grouping,
      filter: {
        scopeType,
        folderId: scopeType === 'folder' ? selectedFolderId : null,
        tagId: scopeType === 'tag' ? selectedTagId : null,
        includeArchived: scopeType === 'all' || scopeType === 'starred',
      },
    });

    setName('');
    setDescription('');
    setGrouping('folder');
    setScopeType('all');
    setSelectedFolderId(null);
    setSelectedTagId(null);
  };

  const handleDelete = (id: string, wikiName: string) => {
    Alert.alert('删除实验 Wiki', `确定删除“${wikiName}”吗？`, [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => wiki.deleteSpace(id) },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>实验功能</Text>
        <Text style={styles.title}>Wiki</Text>
        <Text style={styles.subtitle}>
          把收藏按收藏夹、标签、来源或时间线整理成知识架，再导出为适合继续加工的本地 Markdown 目录。
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>新建实验 Wiki</Text>
        <TextInput
          style={styles.input}
          placeholder="例如：前端知识架"
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="一句话说明它要整理什么内容"
          placeholderTextColor={colors.textMuted}
          value={description}
          onChangeText={setDescription}
          multiline
          textAlignVertical="top"
        />

        <Text style={styles.fieldLabel}>组织方式</Text>
        <View style={styles.optionRow}>
          {groupingOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[styles.chip, grouping === option.value && styles.chipActive]}
              onPress={() => setGrouping(option.value)}
            >
              <Text style={[styles.chipText, grouping === option.value && styles.chipTextActive]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.fieldLabel}>内容范围</Text>
        <View style={styles.optionRow}>
          {scopeOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[styles.chip, scopeType === option.value && styles.chipActive]}
              onPress={() => setScopeType(option.value)}
            >
              <Text style={[styles.chipText, scopeType === option.value && styles.chipTextActive]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {scopeType === 'folder' ? (
          <>
            <Text style={styles.fieldLabel}>选择收藏夹</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.optionRow}>
              {folders.folders.map((folder) => (
                <TouchableOpacity
                  key={folder.id}
                  style={[styles.chip, selectedFolderId === folder.id && styles.chipActive]}
                  onPress={() => setSelectedFolderId(folder.id)}
                >
                  <Text style={[styles.chipText, selectedFolderId === folder.id && styles.chipTextActive]}>
                    {folder.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.tipText}>当前选择：{selectedFolderName}</Text>
          </>
        ) : null}

        {scopeType === 'tag' ? (
          <>
            <Text style={styles.fieldLabel}>选择标签</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.optionRow}>
              {tags.tags.map((tag) => (
                <TouchableOpacity
                  key={tag.id}
                  style={[styles.chip, selectedTagId === tag.id && styles.chipActive]}
                  onPress={() => setSelectedTagId(tag.id)}
                >
                  <Text style={[styles.chipText, selectedTagId === tag.id && styles.chipTextActive]}>
                    {tag.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.tipText}>当前选择：{selectedTagName}</Text>
          </>
        ) : null}

        <TouchableOpacity style={styles.primaryBtn} onPress={handleCreate}>
          <Text style={styles.primaryBtnText}>创建实验 Wiki</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>已有 Wiki</Text>
        <FlatList
          data={wiki.spaces}
          scrollEnabled={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={styles.cardDesc}>{item.description || '还没有补充说明'}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDelete(item.id, item.name)}>
                  <MaterialCommunityIcons name="delete-outline" size={18} color={colors.error} />
                </TouchableOpacity>
              </View>

              <View style={styles.metaRow}>
                <Text style={styles.metaText}>
                  组织方式：{groupingOptions.find((option) => option.value === item.grouping)?.label}
                </Text>
                <Text style={styles.metaText}>{item.bookmarkCount} 条内容</Text>
              </View>

              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => navigation.navigate('WikiDetail', { wikiId: item.id })}
                >
                  <Text style={styles.secondaryBtnText}>打开</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>还没有实验 Wiki，先创建一个吧。</Text>}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  eyebrow: {
    color: colors.textMuted,
    fontSize: 12,
    letterSpacing: 1,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    marginTop: spacing.sm,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.text,
    fontSize: 14,
    marginBottom: spacing.md,
  },
  textarea: {
    minHeight: 96,
  },
  fieldLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.backgroundMuted,
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.primaryDark,
  },
  tipText: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: -spacing.xs,
    marginBottom: spacing.md,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  list: {
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  cardDesc: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  metaText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  cardActions: {
    marginTop: spacing.md,
    alignItems: 'flex-start',
  },
  secondaryBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryBtnText: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: '700',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
});
