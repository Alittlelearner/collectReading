import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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

  const unlockedCount = achievements.achievements.filter((item) => item.unlockedAt).length;
  const totalAchievements = achievements.achievements.length;
  const summary = stats.summary;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerEyebrow}>阅读画像</Text>
          <Text style={styles.headerTitle}>我的书房</Text>
        </View>
        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => navigation.navigate('HomeMain')}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="bookshelf" size={18} color={colors.primaryDark} />
          <Text style={styles.homeBtnText}>收藏主页</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.heroCard}>
        <View style={styles.heroIcon}>
          <MaterialCommunityIcons name="fire-circle" size={30} color={colors.accent} />
        </View>
        <Text style={styles.streakNumber}>{summary?.currentStreak ?? 0}</Text>
        <Text style={styles.streakLabel}>连续阅读天数</Text>
      </View>

      <View style={styles.statsRow}>
        <StatBox label="总收藏" value={`${summary?.totalBookmarks ?? 0}`} />
        <StatBox label="已读" value={`${summary?.totalRead ?? 0}`} />
        <StatBox label="完成率" value={`${Math.round((summary?.readRate ?? 0) * 100)}%`} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>成长记录</Text>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Achievements')}
          activeOpacity={0.85}
        >
          <View style={styles.menuLeft}>
            <View style={styles.menuIconWrap}>
              <MaterialCommunityIcons name="trophy-outline" size={18} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.menuText}>成就</Text>
              <Text style={styles.menuSubtext}>看看哪些阅读里程碑已经点亮了</Text>
            </View>
          </View>
          <Text style={styles.menuRight}>
            {unlockedCount}/{totalAchievements}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>实验功能</Text>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('WikiHub')}
          activeOpacity={0.85}
        >
          <View style={styles.menuLeft}>
            <View style={styles.menuIconWrap}>
              <MaterialCommunityIcons name="book-multiple-outline" size={18} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.menuText}>Wiki</Text>
              <Text style={styles.menuSubtext}>把收藏组织成知识架，并导出本地 Markdown</Text>
            </View>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>管理</Text>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Settings')} activeOpacity={0.85}>
          <View style={styles.menuLeft}>
            <View style={styles.menuIconWrap}>
              <MaterialCommunityIcons name="cog-outline" size={18} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.menuText}>设置</Text>
              <Text style={styles.menuSubtext}>提醒、导入导出和擦亮策略</Text>
            </View>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statNumber}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  homeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  homeBtnText: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: '700',
  },
  heroCard: {
    backgroundColor: colors.surface,
    margin: spacing.lg,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  heroIcon: {
    width: 62,
    height: 62,
    borderRadius: borderRadius.full,
    backgroundColor: colors.backgroundMuted,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  streakNumber: {
    color: colors.text,
    fontSize: 44,
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
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statNumber: { color: colors.text, fontSize: 22, fontWeight: '800' },
  statLabel: { color: colors.textMuted, fontSize: 12, marginTop: spacing.xs },
  section: { marginBottom: spacing.xl },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    letterSpacing: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  menuIconWrap: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.backgroundMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuText: { color: colors.text, fontSize: 15, fontWeight: '700' },
  menuSubtext: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  menuRight: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
});
