"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AddFAB;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_native_1 = require("react-native");
const vector_icons_1 = require("@expo/vector-icons");
const colors_1 = require("../../theme/colors");
const spacing_1 = require("../../theme/spacing");
function AddFAB({ onPress }) {
    return ((0, jsx_runtime_1.jsx)(react_native_1.TouchableOpacity, { style: styles.fab, onPress: onPress, activeOpacity: 0.9, children: (0, jsx_runtime_1.jsx)(vector_icons_1.MaterialCommunityIcons, { name: "book-plus-outline", size: 26, color: colors_1.colors.white }) }));
}
const styles = react_native_1.StyleSheet.create({
    fab: {
        position: 'absolute',
        right: 20,
        bottom: 24,
        width: 60,
        height: 60,
        borderRadius: spacing_1.borderRadius.full,
        backgroundColor: colors_1.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: colors_1.colors.shadow,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 8,
    },
});
