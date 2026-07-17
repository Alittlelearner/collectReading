import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Bookmark } from '../../types';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { getSourceIcon, getSourceLabel } from '../../utils/sourceMeta';
import { formatRelativeDate } from '../../utils/formatters';
import { normalizeImageUrl } from '../../utils/media';

interface BookmarkCardProps {
  bookmark: Bookmark;
  onPress?: () => void;
  onToggleStar?: () => void;
}

const isWeb = Platform.OS === 'web';

export default function BookmarkCard({ bookmark, onPress, onToggleStar }: BookmarkCardProps) {
  const sourceColor = colors.sourceColors[bookmark.sourceType] || colors.sourceColors.other;
  const isRead = bookmark.learningStatus === 'read';
  const cover = normalizeImageUrl(bookmark.imageUrl);

  return (
    <TouchableOpacity style={[styles.card, isWeb && styles.cardWeb]} onPress={onPress} activeOpacity={0.9}>
      {cover ? <Image source={{ uri: cover }} style={styles.cover} resizeMode="cover" /> : null}
      <View style={styles.content}>
        <View style={styles.topRow}>
          <View
            style={[
              styles.sourceBadge,
              { borderColor: `${sourceColor}55`, backgroundColor: `${sourceColor}12` },
            ]}
          >
            <MaterialCommunityIcons name={getSourceIcon(bookmark.sourceType)} size={14} color={sourceColor} />
            <Text style={[styles.sourceText, { color: sourceColor }]}>{getSourceLabel(bookmark.sourceType)}</Text>
          </View>
          <View style={styles.topActions}>
            {onToggleStar ? (
              <TouchableOpacity style={styles.iconBtn} onPress={onToggleStar}>
                <MaterialCommunityIcons
                  name={bookmark.isStarred ? 'star' : 'star-outline'}
                  size={18}
                  color={bookmark.isStarred ? '#b6925e' : colors.textMuted}
                />
              </TouchableOpacity>
            ) : null}
            <View style={[styles.statusPill, isRead ? styles.statusRead : styles.statusUnread]}>
              <View
                style={[styles.statusDot, { backgroundColor: isRead ? colors.success : colors.textMuted }]}
              />
              <Text style={[styles.statusText, { color: isRead ? colors.success : colors.textSecondary }]}>
                {isRead ? '已读' : '未读'}
              </Text>
            </View>
          </View>
        </View>

        <Text style={styles.title} numberOfLines={2}>
          {bookmark.title || '未命名内容'}
        </Text>

        {(bookmark.author || bookmark.description) && (
          <View style={styles.body}>
            {bookmark.author ? (
              <Text style={styles.author} numberOfLines={1}>
                {bookmark.author}
              </Text>
            ) : null}
            {bookmark.description ? (
              <Text style={styles.description} numberOfLines={isWeb ? 3 : 2}>
                {bookmark.description}
              </Text>
            ) : null}
          </View>
        )}

        {bookmark.notes ? (
          <View style={styles.noteRibbon}>
            <MaterialCommunityIcons name="pencil-box-outline" size={14} color={colors.primaryDark} />
            <Text style={styles.noteText} numberOfLines={1}>
              {bookmark.notes}
            </Text>
          </View>
        ) : null}

        <View style={styles.footer}>
          <View style={styles.tags}>
            {bookmark.tags.slice(0, 3).map((tag) => (
              <View
                key={tag.id}
                style={[
                  styles.tag,
                  { backgroundColor: `${tag.color}18`, borderColor: `${tag.color}35` },
                ]}
              >
                <Text style={[styles.tagText, { color: tag.color }]}>{tag.name}</Text>
              </View>
            ))}
            {bookmark.tags.length > 3 ? <Text style={styles.moreTag}>+{bookmark.tags.length - 3}</Text> : null}
          </View>

          <View style={styles.metaGroup}>
            <Text style={styles.metaText}>{formatRelativeDate(bookmark.createdAt)}</Text>
            <View style={styles.metaDivider} />
            <Text style={styles.metaText}>{bookmark.readCount} 次阅读</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
    overflow: 'hidden',
  },
  cardWeb: {
    flexDirection: 'row',
    minHeight: 176,
  },
  cover: {
    width: isWeb ? 220 : '100%',
    height: isWeb ? '100%' : 158,
    backgroundColor: colors.backgroundMuted,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconBtn: {
    width: 30,
    height: 30,
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  sourceText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  statusRead: {
    backgroundColor: `${colors.success}18`,
  },
  statusUnread: {
    backgroundColor: colors.backgroundMuted,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 27,
  },
  body: {
    marginTop: spacing.sm,
  },
  author: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  description: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
  noteRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.backgroundMuted,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.md,
  },
  noteText: {
    flex: 1,
    color: colors.primaryDark,
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    flex: 1,
  },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  moreTag: {
    color: colors.textMuted,
    fontSize: 12,
    alignSelf: 'center',
  },
  metaGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  metaText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  metaDivider: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.textMuted,
  },
});
