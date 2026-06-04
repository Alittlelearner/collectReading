import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LearningStatus } from '../../types';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';

interface StatusToggleProps {
  status: LearningStatus;
  onToggle: () => void;
  size?: 'small' | 'normal';
}

export default function StatusToggle({ status, onToggle, size = 'normal' }: StatusToggleProps) {
  const isSmall = size === 'small';
  
  // 根据不用的状态显示不同的文案和样式
  const config = {
    unread: { label: '未读', color: colors.textMuted, bg: colors.surfaceLight },
    read: { label: '已读', color: colors.success, bg: colors.success + '20' },
    archived: { label: '已归档', color: colors.primary, bg: colors.primary + '20' },
  }[status || 'unread'] || { label: '未读', color: colors.textMuted, bg: colors.surfaceLight };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isSmall && styles.containerSmall,
        { backgroundColor: config.bg },
      ]}
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.dot,
          isSmall && styles.dotSmall,
          { backgroundColor: config.color },
        ]}
      />
      <Text
        style={[
          styles.label,
          isSmall && styles.labelSmall,
          { color: config.color },
        ]}
      >
        {config.label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  containerSmall: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
  },
  labelSmall: {
    fontSize: 12,
  },
});
