"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ResurfaceCard;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_native_1 = require("react-native");
const vector_icons_1 = require("@expo/vector-icons");
const colors_1 = require("../../theme/colors");
const spacing_1 = require("../../theme/spacing");
const sourceMeta_1 = require("../../utils/sourceMeta");
const formatters_1 = require("../../utils/formatters");
function ResurfaceCard({ bookmark, onPress, onSkip, onDone }) {
    return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.container, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.header, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.headerBadge, children: [(0, jsx_runtime_1.jsx)(vector_icons_1.MaterialCommunityIcons, { name: "candle", size: 16, color: colors_1.colors.accent }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.headerText, children: "\u4ECA\u65E5\u64E6\u4EAE" })] }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.headerHint, children: "\u4ECE\u65E7\u85CF\u91CC\u62BD\u4E00\u6761\u518D\u8BFB" })] }), (0, jsx_runtime_1.jsxs)(react_native_1.TouchableOpacity, { style: styles.card, onPress: onPress, activeOpacity: 0.85, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.title, numberOfLines: 2, children: bookmark.title || '未命名内容' }), (0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.meta, children: [(0, sourceMeta_1.getSourceLabel)(bookmark.sourceType), " \u00B7 \u6536\u85CF\u4E8E ", (0, formatters_1.formatRelativeDate)(bookmark.createdAt)] }), bookmark.notes ? ((0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.notes, numberOfLines: 2, children: bookmark.notes })) : ((0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.notesPlaceholder, children: "\u6CA1\u6709\u5907\u6CE8\uFF0C\u6B63\u9002\u5408\u91CD\u65B0\u7FFB\u4E00\u904D\u3002" }))] }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.actions, children: [(0, jsx_runtime_1.jsx)(react_native_1.TouchableOpacity, { style: [styles.actionBtn, styles.skipBtn], onPress: onSkip, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.skipText, children: "\u6362\u4E00\u672C" }) }), (0, jsx_runtime_1.jsx)(react_native_1.TouchableOpacity, { style: [styles.actionBtn, styles.doneBtn], onPress: onDone, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.doneText, children: "\u5B8C\u6210\u9605\u8BFB" }) })] })] }));
}
const styles = react_native_1.StyleSheet.create({
    container: {
        paddingHorizontal: spacing_1.spacing.lg,
        paddingVertical: spacing_1.spacing.md,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing_1.spacing.md,
    },
    headerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing_1.spacing.xs,
    },
    headerText: {
        color: colors_1.colors.primaryDark,
        fontSize: 14,
        fontWeight: '700',
    },
    headerHint: {
        color: colors_1.colors.textMuted,
        fontSize: 12,
    },
    card: {
        backgroundColor: colors_1.colors.card,
        borderRadius: spacing_1.borderRadius.lg,
        padding: spacing_1.spacing.xl,
        borderWidth: 1,
        borderColor: colors_1.colors.border,
        borderLeftWidth: 5,
        borderLeftColor: colors_1.colors.accent,
    },
    title: {
        color: colors_1.colors.text,
        fontSize: 18,
        fontWeight: '700',
        lineHeight: 27,
        marginBottom: spacing_1.spacing.sm,
    },
    meta: {
        color: colors_1.colors.textSecondary,
        fontSize: 13,
        marginBottom: spacing_1.spacing.sm,
    },
    notes: {
        color: colors_1.colors.textSecondary,
        fontSize: 14,
        lineHeight: 20,
    },
    notesPlaceholder: {
        color: colors_1.colors.textMuted,
        fontSize: 13,
        fontStyle: 'italic',
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: spacing_1.spacing.md,
        gap: spacing_1.spacing.sm,
    },
    actionBtn: {
        paddingHorizontal: spacing_1.spacing.xl,
        paddingVertical: spacing_1.spacing.sm,
        borderRadius: spacing_1.borderRadius.full,
    },
    skipBtn: {
        backgroundColor: colors_1.colors.backgroundMuted,
    },
    doneBtn: {
        backgroundColor: colors_1.colors.success,
    },
    skipText: {
        color: colors_1.colors.textSecondary,
        fontSize: 13,
        fontWeight: '600',
    },
    doneText: {
        color: colors_1.colors.white,
        fontSize: 13,
        fontWeight: '700',
    },
});
