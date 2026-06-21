import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ViewMode } from '../../types';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';

interface ViewTabBarProps {
  current: ViewMode;
  onChange: (view: ViewMode) => void;
}

const TABS: { key: ViewMode; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
  { key: 'timeline', label: '时间轴', icon: 'clock-time-four-outline' },
  { key: 'source', label: '来源', icon: 'bookshelf' },
  { key: 'tag', label: '标签', icon: 'tag-outline' },
];

export default function ViewTabBar({ current, onChange }: ViewTabBarProps) {
  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const active = current === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, active && styles.tabActive]}
            onPress={() => onChange(tab.key)}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons
              name={tab.icon}
              size={16}
              color={active ? colors.surface : colors.textMuted}
            />
            <Text style={[styles.label, active && styles.labelActive]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 4,
    marginHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  labelActive: {
    color: colors.surface,
  },
});
