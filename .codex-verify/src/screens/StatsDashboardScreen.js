"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = StatsDashboardScreen;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_native_1 = require("react-native");
const react_native_chart_kit_1 = require("react-native-chart-kit");
const useStats_1 = require("../hooks/useStats");
const useBookmarks_1 = require("../hooks/useBookmarks");
const colors_1 = require("../theme/colors");
const spacing_1 = require("../theme/spacing");
const sourceMeta_1 = require("../utils/sourceMeta");
const screenWidth = react_native_1.Dimensions.get('window').width;
function StatCard({ title, value, subtitle }) {
    return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.statCard, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.statValue, children: value }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.statTitle, children: title }), subtitle ? (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.statSubtitle, children: subtitle }) : null] }));
}
function StatsDashboardScreen() {
    const stats = (0, useStats_1.useStats)();
    const bookmarks = (0, useBookmarks_1.useBookmarks)();
    const summary = stats.summary;
    (0, react_1.useEffect)(() => {
        stats.refresh();
    }, []);
    const sourceData = (0, react_1.useMemo)(() => {
        const groups = bookmarks.getSourceGroups();
        const dataMap = {};
        for (const group of groups) {
            dataMap[group.sourceType] = group.count;
        }
        const keys = Object.keys(dataMap);
        const total = Object.values(dataMap).reduce((a, b) => a + b, 0);
        return keys.map((key) => ({
            name: (0, sourceMeta_1.getSourceLabel)(key),
            count: dataMap[key],
            percentage: total > 0 ? Math.round((dataMap[key] / total) * 100) : 0,
            color: colors_1.colors.sourceColors[key] || colors_1.colors.sourceColors.other,
            legendFontColor: colors_1.colors.text,
            legendFontSize: 12,
        }));
    }, [bookmarks.bookmarks]);
    const trendData = (0, react_1.useMemo)(() => {
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
        return ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.center, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.loadingText, children: "\u6B63\u5728\u7EDF\u8BA1\u4F60\u7684\u9605\u8BFB\u8F68\u8FF9..." }) }));
    }
    return ((0, jsx_runtime_1.jsx)(react_native_1.SafeAreaView, { style: styles.container, children: (0, jsx_runtime_1.jsxs)(react_native_1.ScrollView, { showsVerticalScrollIndicator: false, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.header, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.headerEyebrow, children: "\u9605\u8BFB\u9762\u677F" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.headerTitle, children: "\u9605\u8BFB\u7EDF\u8BA1" })] }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.section, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.sectionTitle, children: "\u6982\u89C8" }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.statGrid, children: [(0, jsx_runtime_1.jsx)(StatCard, { title: "\u603B\u6536\u85CF", value: summary.totalBookmarks }), (0, jsx_runtime_1.jsx)(StatCard, { title: "\u5DF2\u8BFB", value: summary.totalRead }), (0, jsx_runtime_1.jsx)(StatCard, { title: "\u5B8C\u6210\u7387", value: `${Math.round(summary.readRate * 100)}%`, subtitle: `${summary.totalBookmarks - summary.totalRead} 条未读` }), (0, jsx_runtime_1.jsx)(StatCard, { title: "\u8FDE\u7EED\u5929\u6570", value: summary.currentStreak, subtitle: `最长 ${summary.longestStreak} 天` })] })] }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.section, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.sectionTitle, children: "\u8FD1\u671F\u8868\u73B0" }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.periodRow, children: [(0, jsx_runtime_1.jsx)(PeriodCard, { label: "\u4ECA\u65E5\u5B8C\u6210", value: summary.todayRead }), (0, jsx_runtime_1.jsx)(PeriodCard, { label: "\u672C\u5468\u5B8C\u6210", value: summary.weeklyRead }), (0, jsx_runtime_1.jsx)(PeriodCard, { label: "\u672C\u6708\u5B8C\u6210", value: summary.monthlyRead })] })] }), trendData.data.length > 1 && ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.section, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.sectionTitle, children: "\u5B8C\u6210\u8D8B\u52BF" }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.chartContainer, children: (0, jsx_runtime_1.jsx)(react_native_chart_kit_1.LineChart, { data: {
                                    labels: trendData.labels,
                                    datasets: [{ data: trendData.data }],
                                }, width: screenWidth - spacing_1.spacing.xxl * 2, height: 210, chartConfig: {
                                    backgroundColor: colors_1.colors.surface,
                                    backgroundGradientFrom: colors_1.colors.surface,
                                    backgroundGradientTo: colors_1.colors.surface,
                                    decimalPlaces: 0,
                                    color: () => colors_1.colors.primary,
                                    labelColor: () => colors_1.colors.textSecondary,
                                    propsForDots: { r: '5', strokeWidth: '2', stroke: colors_1.colors.primaryDark },
                                }, bezier: true, style: styles.chart }) })] })), sourceData.length > 0 && ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.section, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.sectionTitle, children: "\u6765\u6E90\u5206\u5E03" }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.chartContainer, children: [(0, jsx_runtime_1.jsx)(react_native_chart_kit_1.PieChart, { data: sourceData, width: screenWidth - spacing_1.spacing.xxl * 2, height: 220, chartConfig: {
                                        color: () => colors_1.colors.primary,
                                    }, accessor: "count", backgroundColor: "transparent", paddingLeft: "15", center: [0, 0], absolute: true }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.legend, children: sourceData.map((item) => ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.legendItem, children: [(0, jsx_runtime_1.jsx)(react_native_1.View, { style: [styles.legendDot, { backgroundColor: item.color }] }), (0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.legendText, children: [item.name, " \u00B7 ", item.percentage, "%"] })] }, item.name))) })] })] })), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: { height: 40 } })] }) }));
}
function PeriodCard({ label, value }) {
    return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.periodCard, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.periodValue, children: value }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.periodLabel, children: label })] }));
}
const styles = react_native_1.StyleSheet.create({
    container: { flex: 1, backgroundColor: colors_1.colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors_1.colors.background },
    loadingText: { color: colors_1.colors.textMuted, fontSize: 15 },
    header: {
        paddingHorizontal: spacing_1.spacing.lg,
        paddingVertical: spacing_1.spacing.md,
    },
    headerEyebrow: {
        color: colors_1.colors.textMuted,
        fontSize: 12,
        letterSpacing: 1,
    },
    headerTitle: {
        color: colors_1.colors.text,
        fontSize: 30,
        fontWeight: '800',
        marginTop: 2,
    },
    section: { marginTop: spacing_1.spacing.xl },
    sectionTitle: {
        color: colors_1.colors.textMuted,
        fontSize: 12,
        fontWeight: '700',
        paddingHorizontal: spacing_1.spacing.lg,
        marginBottom: spacing_1.spacing.md,
        letterSpacing: 1,
    },
    statGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: spacing_1.spacing.lg,
        gap: spacing_1.spacing.md,
    },
    statCard: {
        width: '47%',
        backgroundColor: colors_1.colors.surface,
        borderRadius: spacing_1.borderRadius.lg,
        padding: spacing_1.spacing.lg,
        borderWidth: 1,
        borderColor: colors_1.colors.border,
    },
    statValue: {
        color: colors_1.colors.text,
        fontSize: 26,
        fontWeight: '800',
    },
    statTitle: {
        color: colors_1.colors.textSecondary,
        fontSize: 13,
        marginTop: 6,
    },
    statSubtitle: {
        color: colors_1.colors.textMuted,
        fontSize: 11,
        marginTop: 3,
    },
    periodRow: {
        flexDirection: 'row',
        paddingHorizontal: spacing_1.spacing.lg,
        gap: spacing_1.spacing.md,
    },
    periodCard: {
        flex: 1,
        backgroundColor: colors_1.colors.surface,
        borderRadius: spacing_1.borderRadius.lg,
        padding: spacing_1.spacing.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors_1.colors.border,
    },
    periodValue: {
        color: colors_1.colors.primary,
        fontSize: 30,
        fontWeight: '800',
    },
    periodLabel: {
        color: colors_1.colors.textSecondary,
        fontSize: 12,
        marginTop: spacing_1.spacing.sm,
    },
    chartContainer: {
        backgroundColor: colors_1.colors.surface,
        marginHorizontal: spacing_1.spacing.lg,
        borderRadius: spacing_1.borderRadius.xl,
        padding: spacing_1.spacing.lg,
        borderWidth: 1,
        borderColor: colors_1.colors.border,
    },
    chart: {
        marginVertical: spacing_1.spacing.sm,
        borderRadius: 16,
    },
    legend: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing_1.spacing.md,
        marginTop: spacing_1.spacing.lg,
        paddingTop: spacing_1.spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors_1.colors.border,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing_1.spacing.xs,
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    legendText: {
        color: colors_1.colors.textSecondary,
        fontSize: 12,
    },
});
