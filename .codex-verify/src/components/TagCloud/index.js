"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = TagCloud;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_native_1 = require("react-native");
const colors_1 = require("../../theme/colors");
const spacing_1 = require("../../theme/spacing");
function TagCloud({ tags, onPress }) {
    if (tags.length === 0) {
        return ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.empty, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.emptyText, children: "\u8FD8\u6CA1\u6709\u6807\u7B7E" }) }));
    }
    return ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.container, children: tags.map((tag) => ((0, jsx_runtime_1.jsxs)(react_native_1.TouchableOpacity, { style: [styles.tag, { backgroundColor: tag.color + '16', borderColor: tag.color + '35' }], onPress: () => onPress(tag.id), activeOpacity: 0.8, children: [(0, jsx_runtime_1.jsx)(react_native_1.View, { style: [styles.dot, { backgroundColor: tag.color }] }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [styles.name, { color: tag.color }], children: tag.name }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [styles.count, { color: tag.color }], children: tag.bookmarkCount })] }, tag.id))) }));
}
const styles = react_native_1.StyleSheet.create({
    container: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: spacing_1.spacing.lg,
        gap: spacing_1.spacing.sm,
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing_1.spacing.md,
        paddingVertical: spacing_1.spacing.sm,
        borderRadius: spacing_1.borderRadius.full,
        gap: spacing_1.spacing.xs,
        borderWidth: 1,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    name: {
        fontSize: 13,
        fontWeight: '600',
    },
    count: {
        fontSize: 12,
        fontWeight: '700',
    },
    empty: {
        alignItems: 'center',
        paddingVertical: spacing_1.spacing.xxxl,
    },
    emptyText: {
        color: colors_1.colors.textMuted,
        fontSize: 14,
    },
});
