import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, SafeAreaView } from 'react-native';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { useStats } from '../hooks/useStats';
import { useBookmarks } from '../hooks/useBookmarks';
import { colors } from '../theme/colors';
import { spacing, borderRadius } from '../theme/spacing';
import { getSourceLabel } from '../utils/sourceMeta';

const screenWidth = Dimensions.get('window').width;

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
}

function StatCard({ title, value, subtitle }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
      {subtitle ? <Text style={styles.statSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

function PeriodCard({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.periodCard}>
      <Text style={styles.periodValue}>{value}</Text>
      <Text style={styles.periodLabel}>{label}</Text>
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

  const sourceData = useMemo(() => {
    const groups = bookmarks.getSourceGroups();
    const dataMap: Record<string, number> = {};

    for (const group of groups) {
      dataMap[group.sourceType] = group.count;
    }

    const keys = Object.keys(dataMap);
    const total = Object.values(dataMap).reduce((a, b) => a + b, 0);

    return keys.map((key) => ({
      name: getSourceLabel(key as any),
      count: dataMap[key],
      percentage: total > 0 ? Math.round((dataMap[key] / total) * 100) : 0,
      color:
        colors.sourceColors[key as keyof typeof colors.sourceColors] || colors.sourceColors.other,
      legendFontColor: colors.text,
      legendFontSize: 12,
    }));
  }, [bookmarks.bookmarks]);

  const trendData = useMemo(() => {
    const dailyStats = stats.dailyStats;
    if (dailyStats.length === 0) {
      return { labels: [], data: [0] };
    }

    const sorted = [...dailyStats].sort((a, b) => a.date.localeCompare(b.date));
    const last7Days = sorted.slice(-7);

    return {
      labels: last7Days.map((day) => {
        const date = new Date(day.date);
        return `${date.getMonth() + 1}/${date.getDate()}`;
      }),
      data: last7Days.map((day) => day.readCount || 0),
    };
  }, [stats.dailyStats]);

  if (!summary) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>正在统计你的阅读轨迹...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerEyebrow}>阅读面板</Text>
          <Text style={styles.headerTitle}>阅读统计</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>概览</Text>
          <View style={styles.statGrid}>
            <StatCard title="总收藏" value={summary.totalBookmarks} />
            <StatCard title="已读" value={summary.totalRead} />
            <StatCard
              title="完成率"
              value={`${Math.round(summary.readRate * 100)}%`}
              subtitle={`${summary.totalBookmarks - summary.totalRead} 条未读`}
            />
            <StatCard
              title="连续天数"
              value={summary.currentStreak}
              subtitle={`最长 ${summary.longestStreak} 天`}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>近期表现</Text>
          <View style={styles.periodRow}>
            <PeriodCard label="今日完成" value={summary.todayRead} />
            <PeriodCard label="本周完成" value={summary.weeklyRead} />
            <PeriodCard label="本月完成" value={summary.monthlyRead} />
          </View>
        </View>

        {trendData.data.length > 1 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>完成趋势</Text>
            <View style={styles.chartContainer}>
              <LineChart
                data={{
                  labels: trendData.labels,
                  datasets: [{ data: trendData.data }],
                }}
                width={screenWidth - spacing.xxl * 2}
                height={210}
                chartConfig={{
                  backgroundColor: colors.surface,
                  backgroundGradientFrom: colors.surface,
                  backgroundGradientTo: colors.surface,
                  decimalPlaces: 0,
                  color: () => colors.primary,
                  labelColor: () => colors.textSecondary,
                  propsForDots: { r: '5', strokeWidth: '2', stroke: colors.primaryDark },
                }}
                bezier
                style={styles.chart}
              />
            </View>
          </View>
        ) : null}

        {sourceData.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>来源分布</Text>
            <View style={styles.chartContainer}>
              <PieChart
                data={sourceData}
                width={screenWidth - spacing.xxl * 2}
                height={220}
                chartConfig={{ color: () => colors.primary }}
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
        ) : null}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: { color: colors.textMuted, fontSize: 15 },
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
  section: { marginTop: spacing.xl },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    letterSpacing: 1,
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
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
  },
  statTitle: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 6,
  },
  statSubtitle: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 3,
  },
  periodRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  periodCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  periodValue: {
    color: colors.primary,
    fontSize: 30,
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
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
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
    borderTopColor: colors.border,
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
