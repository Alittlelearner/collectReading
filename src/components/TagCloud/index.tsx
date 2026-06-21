import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Tag } from '../../types';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';

interface TagCloudProps {
  tags: Tag[];
  onPress: (tagId: string) => void;
}

export default function TagCloud({ tags, onPress }: TagCloudProps) {
  if (tags.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>还没有标签</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {tags.map((tag) => (
        <TouchableOpacity
          key={tag.id}
          style={[styles.tag, { backgroundColor: tag.color + '16', borderColor: tag.color + '35' }]}
          onPress={() => onPress(tag.id)}
          activeOpacity={0.8}
        >
          <View style={[styles.dot, { backgroundColor: tag.color }]} />
          <Text style={[styles.name, { color: tag.color }]}>{tag.name}</Text>
          <Text style={[styles.count, { color: tag.color }]}>{tag.bookmarkCount}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
    borderWidth: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
  },
  count: {
    fontSize: 12,
    fontWeight: '700',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
  },
});
