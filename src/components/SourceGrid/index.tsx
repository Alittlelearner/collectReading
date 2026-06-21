import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SourceGroup as SourceGroupType } from '../../types';
import { colors } from '../../theme/colors';
import { spacing, borderRadius } from '../../theme/spacing';
import { getSourceIcon, getSourceLabel } from '../../utils/sourceMeta';

interface SourceGridProps {
  groups: SourceGroupType[];
  onPress: (sourceType: string) => void;
}

export default function SourceGrid({ groups, onPress }: SourceGridProps) {
  return (
    <View style={styles.grid}>
      {groups.map((group) => {
        const color = colors.sourceColors[group.sourceType] || colors.sourceColors.other;
        return (
          <TouchableOpacity
            key={group.sourceType}
            style={styles.item}
            onPress={() => onPress(group.sourceType)}
            activeOpacity={0.85}
          >
            <View style={[styles.iconBox, { backgroundColor: color + '16' }]}>
              <MaterialCommunityIcons name={getSourceIcon(group.sourceType)} size={22} color={color} />
            </View>
            <Text style={styles.label} numberOfLines={1}>
              {getSourceLabel(group.sourceType)}
            </Text>
            <Text style={styles.count}>{group.count}</Text>
            <Text style={styles.caption}>条收藏</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  item: {
    width: '31%',
    flexGrow: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  count: {
    color: colors.primaryDark,
    fontSize: 22,
    fontWeight: '800',
  },
  caption: {
    color: colors.textMuted,
    fontSize: 11,
  },
});
