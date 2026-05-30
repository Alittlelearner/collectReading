import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Bookmark } from '../../types';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';

interface BookmarkCardProps {
  bookmark: Bookmark;
  onPress?: () => void;
}

export default function BookmarkCard({ bookmark, onPress }: BookmarkCardProps) {
  const sourceLabel = getSourceLabel(bookmark.sourceType);
  const sourceColor = colors.sourceColors[bookmark.sourceType] || colors.sourceColors.other;
  const isRead = bookmark.learningStatus === 'read';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={[styles.sourceBadge, { backgroundColor: sourceColor + '20' }]}>
          <Text style={[styles.sourceText, { color: sourceColor }]}>{sourceLabel}</Text>
        </View>
        <View style={[styles.statusDot, { backgroundColor: isRead ? colors.success : colors.textMuted }]} />
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {bookmark.title || '(无标题)'}
      </Text>

      {bookmark.notes ? (
        <Text style={styles.notes} numberOfLines={1}>
          {bookmark.notes}
        </Text>
      ) : null}

      <View style={styles.footer}>
        <View style={styles.tags}>
          {bookmark.tags.slice(0, 3).map((tag) => (
            <View key={tag.id} style={[styles.tag, { backgroundColor: tag.color + '20' }]}>
              <Text style={[styles.tagText, { color: tag.color }]}>{tag.name}</Text>
            </View>
          ))}
          {bookmark.tags.length > 3 && (
            <Text style={styles.moreTag}>+{bookmark.tags.length - 3}</Text>
          )}
        </View>
        <Text style={styles.date}>{formatDate(bookmark.createdAt)}</Text>
      </View>
    </TouchableOpacity>
  );
}

function getSourceLabel(type: string): string {
  const labels: Record<string, string> = {
    bilibili: 'B站',
    zhihu: '知乎',
    wechat: '公众号',
    ebook: '电子书',
    website: '网站',
    metasearch: '秘塔',
    other: '其他',
  };
  return labels[type] || '其他';
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / 86400000);

  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  if (days < 7) return `${days} 天前`;
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sourceBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  sourceText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  notes: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    flex: 1,
  },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 1,
    borderRadius: borderRadius.sm,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '500',
  },
  moreTag: {
    color: colors.textMuted,
    fontSize: 11,
  },
  date: {
    color: colors.textMuted,
    fontSize: 12,
    marginLeft: spacing.sm,
  },
});
