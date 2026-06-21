"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SourceGrid;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_native_1 = require("react-native");
const vector_icons_1 = require("@expo/vector-icons");
const colors_1 = require("../../theme/colors");
const spacing_1 = require("../../theme/spacing");
const sourceMeta_1 = require("../../utils/sourceMeta");
function SourceGrid({ groups, onPress }) {
    return ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.grid, children: groups.map((group) => {
            const color = colors_1.colors.sourceColors[group.sourceType] || colors_1.colors.sourceColors.other;
            return ((0, jsx_runtime_1.jsxs)(react_native_1.TouchableOpacity, { style: styles.item, onPress: () => onPress(group.sourceType), activeOpacity: 0.85, children: [(0, jsx_runtime_1.jsx)(react_native_1.View, { style: [styles.iconBox, { backgroundColor: color + '16' }], children: (0, jsx_runtime_1.jsx)(vector_icons_1.MaterialCommunityIcons, { name: (0, sourceMeta_1.getSourceIcon)(group.sourceType), size: 22, color: color }) }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.label, numberOfLines: 1, children: (0, sourceMeta_1.getSourceLabel)(group.sourceType) }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.count, children: group.count }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.caption, children: "\u6761\u6536\u85CF" })] }, group.sourceType));
        }) }));
}
const styles = react_native_1.StyleSheet.create({
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: spacing_1.spacing.lg,
        gap: spacing_1.spacing.sm,
    },
    item: {
        width: '31%',
        flexGrow: 1,
        backgroundColor: colors_1.colors.card,
        borderRadius: spacing_1.borderRadius.lg,
        padding: spacing_1.spacing.lg,
        alignItems: 'center',
        gap: spacing_1.spacing.xs,
        borderWidth: 1,
        borderColor: colors_1.colors.border,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: spacing_1.borderRadius.full,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing_1.spacing.xs,
    },
    label: {
        color: colors_1.colors.text,
        fontSize: 13,
        fontWeight: '600',
    },
    count: {
        color: colors_1.colors.primaryDark,
        fontSize: 22,
        fontWeight: '800',
    },
    caption: {
        color: colors_1.colors.textMuted,
        fontSize: 11,
    },
});
