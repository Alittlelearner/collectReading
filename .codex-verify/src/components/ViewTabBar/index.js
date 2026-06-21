"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ViewTabBar;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_native_1 = require("react-native");
const vector_icons_1 = require("@expo/vector-icons");
const colors_1 = require("../../theme/colors");
const spacing_1 = require("../../theme/spacing");
const TABS = [
    { key: 'timeline', label: '时间轴', icon: 'clock-time-four-outline' },
    { key: 'source', label: '来源', icon: 'bookshelf' },
    { key: 'tag', label: '标签', icon: 'tag-outline' },
];
function ViewTabBar({ current, onChange }) {
    return ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.container, children: TABS.map((tab) => {
            const active = current === tab.key;
            return ((0, jsx_runtime_1.jsxs)(react_native_1.TouchableOpacity, { style: [styles.tab, active && styles.tabActive], onPress: () => onChange(tab.key), activeOpacity: 0.85, children: [(0, jsx_runtime_1.jsx)(vector_icons_1.MaterialCommunityIcons, { name: tab.icon, size: 16, color: active ? colors_1.colors.surface : colors_1.colors.textMuted }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [styles.label, active && styles.labelActive], children: tab.label })] }, tab.key));
        }) }));
}
const styles = react_native_1.StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: colors_1.colors.surface,
        borderRadius: spacing_1.borderRadius.lg,
        padding: 4,
        marginHorizontal: spacing_1.spacing.lg,
        borderWidth: 1,
        borderColor: colors_1.colors.border,
    },
    tab: {
        flex: 1,
        paddingVertical: spacing_1.spacing.sm,
        borderRadius: spacing_1.borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: spacing_1.spacing.xs,
    },
    tabActive: {
        backgroundColor: colors_1.colors.primary,
    },
    label: {
        color: colors_1.colors.textMuted,
        fontSize: 13,
        fontWeight: '600',
    },
    labelActive: {
        color: colors_1.colors.surface,
    },
});
