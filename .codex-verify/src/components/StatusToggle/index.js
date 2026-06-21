"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = StatusToggle;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_native_1 = require("react-native");
const colors_1 = require("../../theme/colors");
const spacing_1 = require("../../theme/spacing");
function StatusToggle({ status, onToggle, size = 'normal' }) {
    const isRead = status === 'read';
    const isSmall = size === 'small';
    return ((0, jsx_runtime_1.jsxs)(react_native_1.TouchableOpacity, { style: [
            styles.container,
            isSmall && styles.containerSmall,
            { backgroundColor: isRead ? colors_1.colors.success + '18' : colors_1.colors.backgroundMuted },
        ], onPress: onToggle, activeOpacity: 0.85, children: [(0, jsx_runtime_1.jsx)(react_native_1.View, { style: [
                    styles.dot,
                    isSmall && styles.dotSmall,
                    { backgroundColor: isRead ? colors_1.colors.success : colors_1.colors.textMuted },
                ] }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [
                    styles.label,
                    isSmall && styles.labelSmall,
                    { color: isRead ? colors_1.colors.success : colors_1.colors.textSecondary },
                ], children: isRead ? '已读' : '未读' })] }));
}
const styles = react_native_1.StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing_1.spacing.md,
        paddingVertical: spacing_1.spacing.sm,
        borderRadius: spacing_1.borderRadius.full,
        gap: spacing_1.spacing.xs,
    },
    containerSmall: {
        paddingHorizontal: spacing_1.spacing.sm,
        paddingVertical: spacing_1.spacing.xs,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    dotSmall: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
    },
    labelSmall: {
        fontSize: 12,
    },
});
