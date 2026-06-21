import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAchievements } from '../hooks/useAchievements';
import { Achievement } from '../types';
import { colors } from '../theme/colors';
import { spacing, borderRadius } from '../theme/spacing';

interface AchievementCardProps {
  achievement: Achievement;
}

function AchievementCard({ achievement }: AchievementCardProps) {
  const isUnlocked = !!achievement.unlockedAt;

  return (
    <View style={[styles.card, !isUnlocked && styles.cardLocked]}>
      <View style={[styles.iconBox, !isUnlocked && styles.iconBoxLocked]}>
        <MaterialCommunityIcons
          name={isUnlocked ? 'trophy-variant-outline' : 'lock-outline'}
          size={26}
          color={isUnlocked ? colors.primary : colors.textMuted}
        />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, !isUnlocked && styles.titleLocked]}>{achievement.title}</Text>
        <Text style={[styles.description, !isUnlocked && styles.descriptionLocked]}>
          {achievement.description}
        </Text>
        {isUnlocked && achievement.unlockedAt ? (
          <Text style={styles.unlockedDate}>{formatDate(achievement.unlockedAt)}</Text>
        ) : (
          <Text style={styles.lockedHint}>继续阅读解锁这枚成就</Text>
        )}
      </View>
    </View>
  );
}

export default function AchievementsScreen() {
  const achievements = useAchievements();
  const [sorted, setSorted] = useState<Achievement[]>([]);

  useEffect(() => {
    const all = achievements.achievements;
    const unlocked = all.filter((a) => a.unlockedAt);
    const locked = all.filter((a) => !a.unlockedAt);

    unlocked.sort((a, b) => (b.unlockedAt || 0) - (a.unlockedAt || 0));
    setSorted([...unlocked, ...locked]);
  }, [achievements.achievements]);

  useEffect(() => {
    achievements.refresh();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerEyebrow}>里程碑</Text>
        <Text style={styles.headerTitle}>成就</Text>
      </View>

      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <AchievementCard achievement={item} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(
    date.getDate(),
  ).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerEyebrow: {
    color: colors.textMuted,
    fontSize: 12,
    letterSpacing: 1,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '800',
    marginTop: 2,
  },
  list: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardLocked: {
    opacity: 0.7,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.full,
    backgroundColor: colors.backgroundMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxLocked: {
    backgroundColor: colors.surfaceLight,
  },
  content: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  titleLocked: {
    color: colors.textSecondary,
  },
  description: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 6,
  },
  descriptionLocked: {
    color: colors.textMuted,
  },
  unlockedDate: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  lockedHint: {
    color: colors.textMuted,
    fontSize: 12,
  },
});
