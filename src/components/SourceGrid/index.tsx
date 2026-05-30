import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SourceGroup as SourceGroupType } from '../../types';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';

interface SourceGridProps {
  groups: SourceGroupType[];
  onPress: (sourceType: string) => void;
}

export default function SourceGrid({ groups, onPress }: SourceGridProps) {
  return (
    <View style={styles.grid}>
      {groups.map((group) => {
        const color = colors.sourceColors[group.sourceType] || colors.sourceColors.other;
        const label = getSourceLabel(group.sourceType);
        return (
          <TouchableOpacity
            key={group.sourceType}
            style={styles.item}
            onPress={() => onPress(group.sourceType)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBox, { backgroundColor: color + '20' }]}>
              <Text style={styles.icon}>{getSourceIcon(group.sourceType)}</Text>
            </View>
            <Text style={styles.label} numberOfLines={1}>{label}</Text>
            <Text style={styles.count}>{group.count}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function getSourceLabel(type: string): string {
  const labels: Record<string, string> = {
    bilibili: 'B站', zhihu: '知乎', wechat: '公众号',
    ebook: '电子书', website: '网站', metasearch: '秘塔', other: '其他',
  };
  return labels[type] || '其他';
}

function getSourceIcon(type: string): string {
  const icons: Record<string, string> = {
    bilibili: '▶', zhihu: '知', wechat: '微',
    ebook: '📖', website: '🌐', metasearch: '🔍', other: '📌',
  };
  return icons[type] || '📌';
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  item: {
    width: '30%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 18,
    color: colors.text,
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '500',
  },
  count: {
    color: colors.textMuted,
    fontSize: 20,
    fontWeight: '700',
  },
});
