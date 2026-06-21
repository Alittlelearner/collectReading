"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = URLInput;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_native_1 = require("react-native");
const Clipboard = __importStar(require("expo-clipboard"));
const colors_1 = require("../../theme/colors");
const spacing_1 = require("../../theme/spacing");
function URLInput({ value, onChangeText, loading, error, autoFocus = true, }) {
    const [checked, setChecked] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        if (!checked && !value) {
            Clipboard.getStringAsync()
                .then((text) => {
                if (text && /^https?:\/\//.test(text.trim())) {
                    onChangeText(text.trim());
                }
            })
                .catch(() => {
                // Web browsers can deny clipboard reads unless the user explicitly grants access.
            })
                .finally(() => setChecked(true));
        }
    }, []);
    const isValid = !value || /^https?:\/\/.+/.test(value);
    return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.container, children: [(0, jsx_runtime_1.jsx)(react_native_1.TextInput, { style: [styles.input, !isValid && styles.inputError], placeholder: "\u7C98\u8D34\u94FE\u63A5\uFF0C\u81EA\u52A8\u8BC6\u522B\u6807\u9898\u3001\u4F5C\u8005\u548C\u7B80\u4ECB...", placeholderTextColor: colors_1.colors.textMuted, value: value, onChangeText: onChangeText, autoFocus: autoFocus, autoCapitalize: "none", autoCorrect: false, keyboardType: "url", returnKeyType: "done", editable: !loading }), loading && (0, jsx_runtime_1.jsx)(react_native_1.ActivityIndicator, { style: styles.loader, color: colors_1.colors.primary, size: "small" }), error ? (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.error, children: error }) : null, !isValid && value.length > 0 ? (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.error, children: "\u8BF7\u8F93\u5165\u6709\u6548\u94FE\u63A5" }) : null] }));
}
const styles = react_native_1.StyleSheet.create({
    container: {
        marginBottom: spacing_1.spacing.lg,
    },
    input: {
        backgroundColor: colors_1.colors.surface,
        color: colors_1.colors.text,
        fontSize: 16,
        padding: spacing_1.spacing.lg,
        borderRadius: spacing_1.borderRadius.lg,
        borderWidth: 1,
        borderColor: colors_1.colors.border,
        paddingRight: 44,
    },
    inputError: {
        borderColor: colors_1.colors.error,
    },
    loader: {
        position: 'absolute',
        right: 16,
        top: 18,
    },
    error: {
        color: colors_1.colors.error,
        fontSize: 12,
        marginTop: spacing_1.spacing.xs,
        marginLeft: spacing_1.spacing.xs,
    },
});
