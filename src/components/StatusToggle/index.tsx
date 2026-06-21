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
  const isRead = status === 'read';
  const isSmall = size === 'small';

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isSmall && styles.containerSmall,
        { backgroundColor: isRead ? colors.success + '18' : colors.backgroundMuted },
      ]}
      onPress={onToggle}
      activeOpacity={0.85}
    >
      <View
        style={[
          styles.dot,
          isSmall && styles.dotSmall,
          { backgroundColor: isRead ? colors.success : colors.textMuted },
        ]}
      />
      <Text
        style={[
          styles.label,
          isSmall && styles.labelSmall,
          { color: isRead ? colors.success : colors.textSecondary },
        ]}
      >
        {isRead ? '已读' : '未读'}
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
    fontWeight: '600',
  },
  labelSmall: {
    fontSize: 12,
  },
});
