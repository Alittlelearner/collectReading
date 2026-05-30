import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useStats } from '../hooks/useStats';
import { useAchievements } from '../hooks/useAchievements';
import { useBookmarks } from '../hooks/useBookmarks';
import { colors } from '../theme/colors';
import { spacing, borderRadius } from '../theme/spacing';
import type { ProfileScreenProps } from '../navigation/types';

export default function ProfileScreen() {
  const navigation = useNavigation<ProfileScreenProps['navigation']>();
  const stats = useStats();
  const achievements = useAchievements();
  const bookmarks = useBookmarks();

  useEffect(() => {
    bookmarks.refresh();
    stats.refresh();
  }, []);

  const unlockedCount = achievements.achievements.filter((a) => a.unlockedAt).length;
  const totalAchievements = achievements.achievements.length;
  const summary = stats.summary;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>我的</Text>
      </View>

      <View style={styles.streakCard}>
        <Text style={styles.streakIcon}>🔥</Text>
        <Text style={styles.streakNumber}>{summary?.currentStreak ?? 0}</Text>
        <Text style={styles.streakLabel}>连续学习天数</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{summary?.totalBookmarks ?? 0}</Text>
          <Text style={styles.statLabel}>总收藏</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{summary?.totalRead ?? 0}</Text>
          <Text style={styles.statLabel}>已读完</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{Math.round((summary?.readRate ?? 0) * 100)}%</Text>
          <Text style={styles.statLabel}>完成率</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>成就</Text>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Achievements')}
          activeOpacity={0.7}
        >
          <Text style={styles.menuIcon}>🏆</Text>
          <Text style={styles.menuText}>成就徽章</Text>
          <Text style={styles.menuRight}>{unlockedCount}/{totalAchievements}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>管理</Text>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Settings')}
          activeOpacity={0.7}
        >
          <Text style={styles.menuIcon}>⚙️</Text>
          <Text style={styles.menuText}>设置</Text>
          <Text style={styles.menuRight}>›</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
  },
  streakCard: {
    backgroundColor: colors.surface,
    margin: spacing.lg,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
  },
  streakIcon: { fontSize: 36, marginBottom: spacing.sm },
  streakNumber: {
    color: colors.text,
    fontSize: 40,
    fontWeight: '800',
  },
  streakLabel: { color: colors.textSecondary, fontSize: 14, marginTop: spacing.xs },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statItem: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
  },
  statNumber: { color: colors.text, fontSize: 22, fontWeight: '700' },
  statLabel: { color: colors.textMuted, fontSize: 12, marginTop: spacing.xs },
  section: { marginBottom: spacing.xl },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
  },
  menuIcon: { fontSize: 18, marginRight: spacing.md },
  menuText: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '500' },
  menuRight: { color: colors.textMuted, fontSize: 14 },
});
