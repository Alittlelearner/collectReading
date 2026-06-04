import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Bookmark } from '../../types';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ResurfaceCardProps {
  bookmark: Bookmark;
  onPress: () => void;
  onSkip: () => void;
  onDone: () => void;
}

export default function ResurfaceCard({ bookmark, onPress, onSkip, onDone }: ResurfaceCardProps) {
  const daysAgo = Math.floor((Date.now() - bookmark.createdAt) / 86400000);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerIcon}>✨</Text>
        <Text style={styles.headerText}>今日擦亮</Text>
      </View>

      <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
        <Text style={styles.title} numberOfLines={2}>
          {bookmark.title || '(无标题)'}
        </Text>
        <Text style={styles.meta}>
          {getSourceLabel(bookmark.sourceType)} · 收藏于 {daysAgo} 天前
        </Text>
        {bookmark.notes ? (
          <Text style={styles.notes} numberOfLines={1}>
            {bookmark.notes}
          </Text>
        ) : null}
      </TouchableOpacity>

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.actionBtn, styles.skipBtn]} onPress={onSkip}>
          <Text style={styles.skipText}>跳过</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.doneBtn]} onPress={onDone}>
          <Text style={styles.doneText}>已读</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function getSourceLabel(type: string): string {
  const labels: Record<string, string> = {
    bilibili: 'B 站', zhihu: '知乎', wechat: '公众号',
    ebook: '电子书', website: '网站', metasearch: '秘塔', other: '其他',
  };
  return labels[type] || '其他';
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  headerIcon: {
    fontSize: 14,
  },
  headerText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: spacing.xs,
  },
  notes: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  actionBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  skipBtn: {
    backgroundColor: colors.surfaceLight,
  },
  doneBtn: {
    backgroundColor: colors.success + '20',
  },
  skipText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  doneText: {
    color: colors.success,
    fontSize: 13,
    fontWeight: '600',
  },
});
