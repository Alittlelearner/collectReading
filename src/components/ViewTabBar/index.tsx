import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ViewMode } from '../../types';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';

interface ViewTabBarProps {
  current: ViewMode;
  onChange: (view: ViewMode) => void;
}

const TABS: { key: ViewMode; label: string }[] = [
  { key: 'timeline', label: '时间线' },
  { key: 'source', label: '按来源' },
  { key: 'tag', label: '按标签' },
];

export default function ViewTabBar({ current, onChange }: ViewTabBarProps) {
  return (
    <View style={styles.container}>
      {TABS.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[styles.tab, current === tab.key && styles.tabActive]}
          onPress={() => onChange(tab.key)}
          activeOpacity={0.7}
        >
          <Text style={[styles.label, current === tab.key && styles.labelActive]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: 3,
    marginHorizontal: spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  labelActive: {
    color: colors.white,
  },
});
