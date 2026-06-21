"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ProfileScreen;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_native_1 = require("react-native");
const native_1 = require("@react-navigation/native");
const vector_icons_1 = require("@expo/vector-icons");
const useStats_1 = require("../hooks/useStats");
const useAchievements_1 = require("../hooks/useAchievements");
const useBookmarks_1 = require("../hooks/useBookmarks");
const colors_1 = require("../theme/colors");
const spacing_1 = require("../theme/spacing");
function ProfileScreen() {
    const navigation = (0, native_1.useNavigation)();
    const stats = (0, useStats_1.useStats)();
    const achievements = (0, useAchievements_1.useAchievements)();
    const bookmarks = (0, useBookmarks_1.useBookmarks)();
    (0, react_1.useEffect)(() => {
        bookmarks.refresh();
        stats.refresh();
    }, []);
    const unlockedCount = achievements.achievements.filter((a) => a.unlockedAt).length;
    const totalAchievements = achievements.achievements.length;
    const summary = stats.summary;
    return ((0, jsx_runtime_1.jsxs)(react_native_1.SafeAreaView, { style: styles.container, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.header, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.headerEyebrow, children: "\u9605\u8BFB\u753B\u50CF" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.headerTitle, children: "\u6211\u7684\u4E66\u623F" })] }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.heroCard, children: [(0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.heroIcon, children: (0, jsx_runtime_1.jsx)(vector_icons_1.MaterialCommunityIcons, { name: "fire-circle", size: 30, color: colors_1.colors.accent }) }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.streakNumber, children: summary?.currentStreak ?? 0 }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.streakLabel, children: "\u8FDE\u7EED\u9605\u8BFB\u5929\u6570" })] }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.statsRow, children: [(0, jsx_runtime_1.jsx)(StatBox, { label: "\u603B\u6536\u85CF", value: `${summary?.totalBookmarks ?? 0}` }), (0, jsx_runtime_1.jsx)(StatBox, { label: "\u5DF2\u8BFB", value: `${summary?.totalRead ?? 0}` }), (0, jsx_runtime_1.jsx)(StatBox, { label: "\u5B8C\u6210\u7387", value: `${Math.round((summary?.readRate ?? 0) * 100)}%` })] }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.section, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.sectionTitle, children: "\u6210\u957F\u8BB0\u5F55" }), (0, jsx_runtime_1.jsxs)(react_native_1.TouchableOpacity, { style: styles.menuItem, onPress: () => navigation.navigate('Achievements'), activeOpacity: 0.85, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.menuLeft, children: [(0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.menuIconWrap, children: (0, jsx_runtime_1.jsx)(vector_icons_1.MaterialCommunityIcons, { name: "trophy-outline", size: 18, color: colors_1.colors.primary }) }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.menuText, children: "\u6210\u5C31" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.menuSubtext, children: "\u770B\u770B\u54EA\u4E9B\u9605\u8BFB\u91CC\u7A0B\u7891\u5DF2\u7ECF\u70B9\u4EAE" })] })] }), (0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.menuRight, children: [unlockedCount, "/", totalAchievements] })] })] }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.section, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.sectionTitle, children: "\u7BA1\u7406" }), (0, jsx_runtime_1.jsxs)(react_native_1.TouchableOpacity, { style: styles.menuItem, onPress: () => navigation.navigate('Settings'), activeOpacity: 0.85, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.menuLeft, children: [(0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.menuIconWrap, children: (0, jsx_runtime_1.jsx)(vector_icons_1.MaterialCommunityIcons, { name: "cog-outline", size: 18, color: colors_1.colors.primary }) }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.menuText, children: "\u8BBE\u7F6E" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.menuSubtext, children: "\u63D0\u9192\u3001\u5BFC\u5165\u5BFC\u51FA\u548C\u64E6\u4EAE\u7B56\u7565" })] })] }), (0, jsx_runtime_1.jsx)(vector_icons_1.MaterialCommunityIcons, { name: "chevron-right", size: 20, color: colors_1.colors.textMuted })] })] })] }));
}
function StatBox({ label, value }) {
    return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.statItem, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.statNumber, children: value }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.statLabel, children: label })] }));
}
const styles = react_native_1.StyleSheet.create({
    container: { flex: 1, backgroundColor: colors_1.colors.background },
    header: {
        paddingHorizontal: spacing_1.spacing.lg,
        paddingTop: spacing_1.spacing.md,
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
    heroCard: {
        backgroundColor: colors_1.colors.surface,
        margin: spacing_1.spacing.lg,
        borderRadius: spacing_1.borderRadius.xl,
        padding: spacing_1.spacing.xl,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors_1.colors.border,
    },
    heroIcon: {
        width: 62,
        height: 62,
        borderRadius: spacing_1.borderRadius.full,
        backgroundColor: colors_1.colors.backgroundMuted,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing_1.spacing.sm,
    },
    streakNumber: {
        color: colors_1.colors.text,
        fontSize: 44,
        fontWeight: '800',
    },
    streakLabel: { color: colors_1.colors.textSecondary, fontSize: 14, marginTop: spacing_1.spacing.xs },
    statsRow: {
        flexDirection: 'row',
        paddingHorizontal: spacing_1.spacing.lg,
        gap: spacing_1.spacing.md,
        marginBottom: spacing_1.spacing.xl,
    },
    statItem: {
        flex: 1,
        backgroundColor: colors_1.colors.surface,
        borderRadius: spacing_1.borderRadius.lg,
        padding: spacing_1.spacing.lg,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors_1.colors.border,
    },
    statNumber: { color: colors_1.colors.text, fontSize: 22, fontWeight: '800' },
    statLabel: { color: colors_1.colors.textMuted, fontSize: 12, marginTop: spacing_1.spacing.xs },
    section: { marginBottom: spacing_1.spacing.xl },
    sectionTitle: {
        color: colors_1.colors.textMuted,
        fontSize: 12,
        fontWeight: '700',
        paddingHorizontal: spacing_1.spacing.lg,
        marginBottom: spacing_1.spacing.sm,
        letterSpacing: 1,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors_1.colors.surface,
        marginHorizontal: spacing_1.spacing.lg,
        padding: spacing_1.spacing.lg,
        borderRadius: spacing_1.borderRadius.lg,
        borderWidth: 1,
        borderColor: colors_1.colors.border,
    },
    menuLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing_1.spacing.md,
        flex: 1,
    },
    menuIconWrap: {
        width: 40,
        height: 40,
        borderRadius: spacing_1.borderRadius.full,
        backgroundColor: colors_1.colors.backgroundMuted,
        justifyContent: 'center',
        alignItems: 'center',
    },
    menuText: { color: colors_1.colors.text, fontSize: 15, fontWeight: '700' },
    menuSubtext: { color: colors_1.colors.textMuted, fontSize: 12, marginTop: 2 },
    menuRight: { color: colors_1.colors.textMuted, fontSize: 14, fontWeight: '600' },
});
