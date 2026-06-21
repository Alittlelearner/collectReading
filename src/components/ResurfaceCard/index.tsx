import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Bookmark } from '../../types';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { getSourceLabel } from '../../utils/sourceMeta';
import { formatRelativeDate } from '../../utils/formatters';

interface ResurfaceCardProps {
  bookmark: Bookmark;
  onPress: () => void;
  onSkip: () => void;
  onDone: () => void;
}

export default function ResurfaceCard({ bookmark, onPress, onSkip, onDone }: ResurfaceCardProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerBadge}>
          <MaterialCommunityIcons name="candle" size={16} color={colors.accent} />
          <Text style={styles.headerText}>今日擦亮</Text>
        </View>
        <Text style={styles.headerHint}>从旧藏里抽一条再读</Text>
      </View>

      <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
        <Text style={styles.title} numberOfLines={2}>
          {bookmark.title || '未命名内容'}
        </Text>
        <Text style={styles.meta}>
          {getSourceLabel(bookmark.sourceType)} · 收藏于 {formatRelativeDate(bookmark.createdAt)}
        </Text>
        {bookmark.notes ? (
          <Text style={styles.notes} numberOfLines={2}>
            {bookmark.notes}
          </Text>
        ) : (
          <Text style={styles.notesPlaceholder}>没有备注，正适合重新翻一遍。</Text>
        )}
      </TouchableOpacity>

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.actionBtn, styles.skipBtn]} onPress={onSkip}>
          <Text style={styles.skipText}>换一本</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.doneBtn]} onPress={onDone}>
          <Text style={styles.doneText}>完成阅读</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerText: {
    color: colors.primaryDark,
    fontSize: 14,
    fontWeight: '700',
  },
  headerHint: {
    color: colors.textMuted,
    fontSize: 12,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 5,
    borderLeftColor: colors.accent,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 27,
    marginBottom: spacing.sm,
  },
  meta: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: spacing.sm,
  },
  notes: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  notesPlaceholder: {
    color: colors.textMuted,
    fontSize: 13,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  actionBtn: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  skipBtn: {
    backgroundColor: colors.backgroundMuted,
  },
  doneBtn: {
    backgroundColor: colors.success,
  },
  skipText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  doneText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
});
