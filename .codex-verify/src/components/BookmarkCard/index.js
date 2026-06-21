"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = BookmarkCard;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_native_1 = require("react-native");
const vector_icons_1 = require("@expo/vector-icons");
const colors_1 = require("../../theme/colors");
const spacing_1 = require("../../theme/spacing");
const sourceMeta_1 = require("../../utils/sourceMeta");
const formatters_1 = require("../../utils/formatters");
function BookmarkCard({ bookmark, onPress }) {
    const sourceColor = colors_1.colors.sourceColors[bookmark.sourceType] || colors_1.colors.sourceColors.other;
    const isRead = bookmark.learningStatus === 'read';
    return ((0, jsx_runtime_1.jsxs)(react_native_1.TouchableOpacity, { style: styles.card, onPress: onPress, activeOpacity: 0.85, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.topRow, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: [styles.sourceBadge, { borderColor: sourceColor + '55', backgroundColor: sourceColor + '12' }], children: [(0, jsx_runtime_1.jsx)(vector_icons_1.MaterialCommunityIcons, { name: (0, sourceMeta_1.getSourceIcon)(bookmark.sourceType), size: 14, color: sourceColor }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [styles.sourceText, { color: sourceColor }], children: (0, sourceMeta_1.getSourceLabel)(bookmark.sourceType) })] }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: [styles.statusPill, isRead ? styles.statusRead : styles.statusUnread], children: [(0, jsx_runtime_1.jsx)(react_native_1.View, { style: [styles.statusDot, { backgroundColor: isRead ? colors_1.colors.success : colors_1.colors.textMuted }] }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [styles.statusText, { color: isRead ? colors_1.colors.success : colors_1.colors.textSecondary }], children: isRead ? '已读' : '未读' })] })] }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.title, numberOfLines: 2, children: bookmark.title || '未命名内容' }), (bookmark.author || bookmark.description) && ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.body, children: [bookmark.author ? ((0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.author, numberOfLines: 1, children: bookmark.author })) : null, bookmark.description ? ((0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.description, numberOfLines: 2, children: bookmark.description })) : null] })), bookmark.notes ? ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.noteRibbon, children: [(0, jsx_runtime_1.jsx)(vector_icons_1.MaterialCommunityIcons, { name: "pencil-box-outline", size: 14, color: colors_1.colors.primaryDark }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.noteText, numberOfLines: 1, children: bookmark.notes })] })) : null, (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.footer, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.tags, children: [bookmark.tags.slice(0, 3).map((tag) => ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: [styles.tag, { backgroundColor: tag.color + '18', borderColor: tag.color + '35' }], children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [styles.tagText, { color: tag.color }], children: tag.name }) }, tag.id))), bookmark.tags.length > 3 && (0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.moreTag, children: ["+", bookmark.tags.length - 3] })] }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.metaGroup, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.metaText, children: (0, formatters_1.formatRelativeDate)(bookmark.createdAt) }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.metaDivider, children: "\u00B7" }), (0, jsx_runtime_1.jsxs)(react_native_1.Text, { style: styles.metaText, children: [bookmark.readCount, " \u6B21\u9605\u8BFB"] })] })] })] }));
}
const styles = react_native_1.StyleSheet.create({
    card: {
        backgroundColor: colors_1.colors.card,
        borderRadius: spacing_1.borderRadius.lg,
        padding: spacing_1.spacing.lg,
        marginHorizontal: spacing_1.spacing.lg,
        marginVertical: spacing_1.spacing.sm,
        borderWidth: 1,
        borderColor: colors_1.colors.border,
        shadowColor: colors_1.colors.shadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 14,
        elevation: 3,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing_1.spacing.md,
        gap: spacing_1.spacing.sm,
    },
    sourceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing_1.spacing.xs,
        paddingHorizontal: spacing_1.spacing.sm,
        paddingVertical: spacing_1.spacing.xs,
        borderRadius: spacing_1.borderRadius.full,
        borderWidth: 1,
    },
    sourceText: {
        fontSize: 12,
        fontWeight: '700',
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing_1.spacing.xs,
        paddingHorizontal: spacing_1.spacing.sm,
        paddingVertical: spacing_1.spacing.xs,
        borderRadius: spacing_1.borderRadius.full,
    },
    statusRead: {
        backgroundColor: colors_1.colors.success + '18',
    },
    statusUnread: {
        backgroundColor: colors_1.colors.backgroundMuted,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    title: {
        color: colors_1.colors.text,
        fontSize: 18,
        fontWeight: '700',
        lineHeight: 27,
    },
    body: {
        marginTop: spacing_1.spacing.sm,
    },
    author: {
        color: colors_1.colors.primaryDark,
        fontSize: 13,
        fontWeight: '600',
        marginBottom: spacing_1.spacing.xs,
    },
    description: {
        color: colors_1.colors.textSecondary,
        fontSize: 14,
        lineHeight: 21,
    },
    noteRibbon: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing_1.spacing.xs,
        backgroundColor: colors_1.colors.backgroundMuted,
        borderRadius: spacing_1.borderRadius.md,
        paddingHorizontal: spacing_1.spacing.md,
        paddingVertical: spacing_1.spacing.sm,
        marginTop: spacing_1.spacing.md,
    },
    noteText: {
        flex: 1,
        color: colors_1.colors.primaryDark,
        fontSize: 13,
        lineHeight: 18,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        gap: spacing_1.spacing.sm,
        marginTop: spacing_1.spacing.md,
    },
    tags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing_1.spacing.xs,
        flex: 1,
    },
    tag: {
        paddingHorizontal: spacing_1.spacing.sm,
        paddingVertical: 4,
        borderRadius: spacing_1.borderRadius.full,
        borderWidth: 1,
    },
    tagText: {
        fontSize: 11,
        fontWeight: '600',
    },
    moreTag: {
        color: colors_1.colors.textMuted,
        fontSize: 12,
        alignSelf: 'center',
    },
    metaGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing_1.spacing.xs,
    },
    metaText: {
        color: colors_1.colors.textMuted,
        fontSize: 12,
    },
    metaDivider: {
        color: colors_1.colors.textMuted,
        fontSize: 12,
    },
});
