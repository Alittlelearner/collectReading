import React, { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WikiSection, WikiSpace } from '../types';
import { WikiService } from '../services/wikiService';
import { colors } from '../theme/colors';
import { borderRadius, spacing } from '../theme/spacing';
import { formatDateTime } from '../utils/formatters';

const wikiService = new WikiService();

export default function WikiDetailScreen() {
  const route = useRoute<any>();
  const [space, setSpace] = useState<WikiSpace | null>(null);
  const [sections, setSections] = useState<WikiSection[]>([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      const currentSpace = await wikiService.getSpaceById(route.params.wikiId);
      const currentSections = await wikiService.buildSections(route.params.wikiId);
      if (!active) return;
      setSpace(currentSpace);
      setSections(currentSections);
    }

    load();
    return () => {
      active = false;
    };
  }, [route.params.wikiId]);

  const handleExport = async () => {
    try {
      setExporting(true);
      const result = await wikiService.exportSpaceToMarkdown(route.params.wikiId);

      if (Platform.OS !== 'web') {
        await Share.share({
          url: result.markdownPath,
          title: `${space?.name || 'Wiki'} Markdown 导出`,
          message: `已生成本地 Markdown 目录：${result.directory}`,
        });
      }

      Alert.alert(
        '导出完成',
        Platform.OS === 'web'
          ? `Markdown 内容已导出完成。\n图片成功写入：${result.downloadedImageCount} 张\n位置：${result.directory}`
          : `Markdown 已整理到本地。\n图片成功下载：${result.downloadedImageCount} 张\n目录：${result.directory}`,
      );
    } catch (error: any) {
      Alert.alert('导出失败', error?.message || '请稍后重试');
    } finally {
      setExporting(false);
    }
  };

  if (!space) {
    return (
      <View style={styles.center}>
        <Text style={styles.loading}>正在整理 Wiki...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View style={styles.heroInfo}>
            <Text style={styles.title}>{space.name}</Text>
            <Text style={styles.subtitle}>{space.description || '这个 Wiki 还没有补充说明。'}</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>实验性</Text>
          </View>
        </View>

        <View style={styles.metaWrap}>
          <Text style={styles.metaText}>条目数：{space.bookmarkCount}</Text>
          <Text style={styles.metaText}>更新时间：{formatDateTime(space.updatedAt)}</Text>
          <Text style={styles.metaText}>章节数：{sections.length}</Text>
        </View>

        <TouchableOpacity style={styles.exportBtn} onPress={handleExport} disabled={exporting}>
          <MaterialCommunityIcons name="download-box-outline" size={18} color={colors.white} />
          <Text style={styles.exportBtnText}>
            {exporting ? '正在导出...' : Platform.OS === 'web' ? '导出到本地文件夹' : '导出为本地 Markdown 目录'}
          </Text>
        </TouchableOpacity>
      </View>

      {sections.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>这个 Wiki 里还没有内容</Text>
          <Text style={styles.emptyText}>可以先往对应的收藏范围里添加条目，再回来生成结构化内容。</Text>
        </View>
      ) : null}

      {sections.map((section) => (
        <View key={section.id} style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Text style={styles.sectionSummary}>{section.summary}</Text>

          {section.items.map((item, index) => (
            <View key={item.id} style={styles.itemCard}>
              <Text style={styles.itemTitle}>
                {index + 1}. {item.title || '未命名内容'}
              </Text>
              <Text style={styles.itemMeta}>
                {item.author ? `${item.author} · ` : ''}
                {item.sourceDomain}
              </Text>
              {item.description ? (
                <Text style={styles.itemDesc} numberOfLines={4}>
                  {item.description}
                </Text>
              ) : null}
              <View style={styles.itemFooter}>
                <Text style={styles.itemFooterText}>
                  {item.tags.map((tag) => tag.name).join(' / ') || '无标签'}
                </Text>
                <Text style={styles.itemFooterText}>{item.readCount} 次阅读</Text>
              </View>
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
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
  loading: {
    color: colors.textMuted,
    fontSize: 15,
  },
  heroCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  heroInfo: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    marginTop: spacing.sm,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.backgroundMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '700',
  },
  metaWrap: {
    marginTop: spacing.lg,
    gap: spacing.xs,
  },
  metaText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  exportBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  exportBtnText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginTop: spacing.sm,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  sectionSummary: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  itemCard: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  itemTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  itemMeta: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  itemDesc: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginTop: spacing.sm,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  itemFooterText: {
    color: colors.textMuted,
    fontSize: 12,
    flex: 1,
  },
});
