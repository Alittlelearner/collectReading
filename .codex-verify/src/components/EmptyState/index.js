"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = EmptyState;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_native_1 = require("react-native");
const vector_icons_1 = require("@expo/vector-icons");
const colors_1 = require("../../theme/colors");
const spacing_1 = require("../../theme/spacing");
function EmptyState({ icon = 'bookshelf', title, subtitle, }) {
    return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.container, children: [(0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.iconWrap, children: (0, jsx_runtime_1.jsx)(vector_icons_1.MaterialCommunityIcons, { name: icon, size: 36, color: colors_1.colors.primary }) }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.title, children: title }), subtitle ? (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.subtitle, children: subtitle }) : null] }));
}
const styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing_1.spacing.xxxl,
    },
    iconWrap: {
        width: 72,
        height: 72,
        borderRadius: spacing_1.borderRadius.full,
        backgroundColor: colors_1.colors.backgroundMuted,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing_1.spacing.lg,
    },
    title: {
        color: colors_1.colors.textSecondary,
        fontSize: 17,
        fontWeight: '600',
        textAlign: 'center',
    },
    subtitle: {
        color: colors_1.colors.textMuted,
        fontSize: 14,
        lineHeight: 21,
        marginTop: spacing_1.spacing.sm,
        textAlign: 'center',
    },
});
