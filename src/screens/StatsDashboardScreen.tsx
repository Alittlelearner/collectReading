import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { useStats } from '../hooks/useStats';
import { useBookmarks } from '../hooks/useBookmarks';
import { colors } from '../theme/colors';
import { spacing, borderRadius } from '../theme/spacing';

const screenWidth = Dimensions.get('window').width;

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
}

function StatCard({ title, value, subtitle, icon = '📊' }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statIcon}>{icon}</Text>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
        {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
      </View>
    </View>
  );
}

export default function StatsDashboardScreen() {
  const stats = useStats();
  const bookmarks = useBookmarks();
  const summary = stats.summary;

  useEffect(() => {
    stats.refresh();
  }, []);

  // 计算来源分布数据
  const sourceData = useMemo(() => {
    const groups = bookmarks.getSourceGroups();
    const dataMap: Record<string, number> = {};
    
    for (const g of groups) {
      dataMap[g.sourceType] = g.count;
    }

    const colorKeys = Object.keys(dataMap);
    const total = Object.values(dataMap).reduce((a, b) => a + b, 0);

    return colorKeys.map((key, index) => ({
      name: getSourceLabel(key),
      count: dataMap[key],
      percentage: total > 0 ? Math.round((dataMap[key] / total) * 100) : 0,
      color: colors.sourceColors[key as keyof typeof colors.sourceColors] || colors.sourceColors.other,
      legendFontColor: colors.text,
      legendFontSize: 12,
    }));
  }, [bookmarks.bookmarks]);

  // 计算趋势数据
  const trendData = useMemo(() => {
    const dailyStats = stats.dailyStats;
    if (dailyStats.length === 0) {
      return { labels: [], data: [0] };
    }

    const sorted = [...dailyStats].sort((a, b) => a.date.localeCompare(b.date));
    const last7Days = sorted.slice(-7);

    return {
      labels: last7Days.map((d) => {
        const date = new Date(d.date);
        return `${date.getMonth() + 1}/${date.getDate()}`;
      }),
      data: last7Days.map((d) => d.readCount || 0),
    };
  }, [stats.dailyStats]);

  if (!summary) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>学习统计</Text>
        </View>

        {/* 概览统计 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>概览</Text>
          <View style={styles.statGrid}>
            <StatCard
              title="总收藏"
              value={summary.totalBookmarks}
              icon="📚"
            />
            <StatCard
              title="已读完"
              value={summary.totalRead}
              icon="✅"
            />
            <StatCard
              title="完成率"
              value={`${Math.round(summary.readRate * 100)}%`}
              subtitle={`${summary.totalBookmarks - summary.totalRead} 条未读`}
              icon="📈"
            />
            <StatCard
              title="连续天数"
              value={summary.currentStreak}
              subtitle={`最长：${summary.longestStreak} 天`}
              icon="🔥"
            />
          </View>
        </View>

        {/* 时间段统计 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>近期表现</Text>
          <View style={styles.periodRow}>
            <View style={styles.periodCard}>
              <Text style={styles.periodValue}>{summary.todayRead}</Text>
              <Text style={styles.periodLabel}>今日完成</Text>
            </View>
            <View style={styles.periodCard}>
              <Text style={styles.periodValue}>{summary.weeklyRead}</Text>
              <Text style={styles.periodLabel}>本周完成</Text>
            </View>
            <View style={styles.periodCard}>
              <Text style={styles.periodValue}>{summary.monthlyRead}</Text>
              <Text style={styles.periodLabel}>本月完成</Text>
            </View>
          </View>
        </View>

        {/* 趋势图 */}
        {trendData.data.length > 1 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>完成趋势</Text>
            <View style={styles.chartContainer}>
              <LineChart
                data={{
                  labels: trendData.labels,
                  datasets: [{ data: trendData.data }],
                }}
                width={screenWidth - spacing.xxl * 2}
                height={200}
                chartConfig={{
                  backgroundColor: colors.surface,
                  backgroundGradientFrom: colors.surface,
                  backgroundGradientTo: colors.surface,
                  decimalPlaces: 0,
                  color: () => colors.primary,
                  labelColor: () => colors.textSecondary,
                  style: { borderRadius: 16 },
                  propsForDots: { r: '6', strokeWidth: '2', stroke: colors.primary },
                }}
                bezier
                style={styles.chart}
              />
            </View>
          </View>
        )}

        {/* 来源分布 */}
        {sourceData.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>来源分布</Text>
            <View style={styles.chartContainer}>
              <PieChart
                data={sourceData}
                width={screenWidth - spacing.xxl * 2}
                height={220}
                chartConfig={{
                  color: () => colors.primary,
                }}
                accessor="count"
                backgroundColor="transparent"
                paddingLeft="15"
                center={[0, 0]}
                absolute
              />
              <View style={styles.legend}>
                {sourceData.map((item) => (
                  <View key={item.name} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: item.color }]} />
                    <Text style={styles.legendText}>
                      {item.name} · {item.percentage}%
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function getSourceLabel(type: string): string {
  const labels: Record<string, string> = {
    bilibili: 'B 站', zhihu: '知乎', wechat: '公众号',
    ebook: '电子书', website: '网站', metasearch: '秘塔', other: '其他',
  };
  return labels[type] || '其他';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  loadingText: { color: colors.textMuted, fontSize: 15 },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
  },
  section: { marginTop: spacing.xl },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  statCard: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  statIcon: { fontSize: 24 },
  statContent: { flex: 1 },
  statValue: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
  },
  statTitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  statSubtitle: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  periodRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  periodCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
  },
  periodValue: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: '800',
  },
  periodLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: spacing.sm,
  },
  chartContainer: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  chart: {
    marginVertical: spacing.sm,
    borderRadius: 16,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceLight,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
});
