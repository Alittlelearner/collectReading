"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AchievementsScreen;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_native_1 = require("react-native");
const vector_icons_1 = require("@expo/vector-icons");
const useAchievements_1 = require("../hooks/useAchievements");
const colors_1 = require("../theme/colors");
const spacing_1 = require("../theme/spacing");
function AchievementCard({ achievement }) {
    const isUnlocked = !!achievement.unlockedAt;
    return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: [styles.card, !isUnlocked && styles.cardLocked], children: [(0, jsx_runtime_1.jsx)(react_native_1.View, { style: [styles.iconBox, !isUnlocked && styles.iconBoxLocked], children: (0, jsx_runtime_1.jsx)(vector_icons_1.MaterialCommunityIcons, { name: isUnlocked ? 'trophy-variant-outline' : 'lock-outline', size: 26, color: isUnlocked ? colors_1.colors.primary : colors_1.colors.textMuted }) }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.content, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [styles.title, !isUnlocked && styles.titleLocked], children: achievement.title }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [styles.description, !isUnlocked && styles.descriptionLocked], children: achievement.description }), isUnlocked && achievement.unlockedAt ? ((0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.unlockedDate, children: formatDate(achievement.unlockedAt) })) : ((0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.lockedHint, children: "\u7EE7\u7EED\u9605\u8BFB\u89E3\u9501\u8FD9\u679A\u6210\u5C31" }))] })] }));
}
function AchievementsScreen() {
    const achievements = (0, useAchievements_1.useAchievements)();
    const [sorted, setSorted] = (0, react_1.useState)([]);
    (0, react_1.useEffect)(() => {
        const all = achievements.achievements;
        const unlocked = all.filter((a) => a.unlockedAt);
        const locked = all.filter((a) => !a.unlockedAt);
        unlocked.sort((a, b) => (b.unlockedAt || 0) - (a.unlockedAt || 0));
        setSorted([...unlocked, ...locked]);
    }, [achievements.achievements]);
    (0, react_1.useEffect)(() => {
        achievements.refresh();
    }, []);
    return ((0, jsx_runtime_1.jsxs)(react_native_1.SafeAreaView, { style: styles.container, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.header, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.headerEyebrow, children: "\u91CC\u7A0B\u7891" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.headerTitle, children: "\u6210\u5C31" })] }), (0, jsx_runtime_1.jsx)(react_native_1.FlatList, { data: sorted, keyExtractor: (item) => item.id.toString(), renderItem: ({ item }) => (0, jsx_runtime_1.jsx)(AchievementCard, { achievement: item }), contentContainerStyle: styles.list, showsVerticalScrollIndicator: false })] }));
}
function formatDate(timestamp) {
    const date = new Date(timestamp);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}
const styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors_1.colors.background,
    },
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
    list: {
        padding: spacing_1.spacing.lg,
        gap: spacing_1.spacing.md,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: colors_1.colors.surface,
        borderRadius: spacing_1.borderRadius.lg,
        padding: spacing_1.spacing.lg,
        gap: spacing_1.spacing.md,
        borderWidth: 1,
        borderColor: colors_1.colors.border,
    },
    cardLocked: {
        opacity: 0.7,
    },
    iconBox: {
        width: 56,
        height: 56,
        borderRadius: spacing_1.borderRadius.full,
        backgroundColor: colors_1.colors.backgroundMuted,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconBoxLocked: {
        backgroundColor: colors_1.colors.surfaceLight,
    },
    content: {
        flex: 1,
    },
    title: {
        color: colors_1.colors.text,
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    titleLocked: {
        color: colors_1.colors.textSecondary,
    },
    description: {
        color: colors_1.colors.textSecondary,
        fontSize: 13,
        lineHeight: 20,
        marginBottom: 6,
    },
    descriptionLocked: {
        color: colors_1.colors.textMuted,
    },
    unlockedDate: {
        color: colors_1.colors.primary,
        fontSize: 12,
        fontWeight: '700',
    },
    lockedHint: {
        color: colors_1.colors.textMuted,
        fontSize: 12,
    },
});
