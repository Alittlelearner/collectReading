"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = App;
const jsx_runtime_1 = require("react/jsx-runtime");
require("react-native-gesture-handler");
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
const expo_status_bar_1 = require("expo-status-bar");
const RootNavigator_1 = __importDefault(require("./src/navigation/RootNavigator"));
const migrations_1 = require("./src/db/migrations");
const seed_1 = require("./src/db/seed");
const achievementSyncService_1 = require("./src/services/achievementSyncService");
const colors_1 = require("./src/theme/colors");
function App() {
    const [ready, setReady] = react_1.default.useState(false);
    const [error, setError] = react_1.default.useState(null);
    react_1.default.useEffect(() => {
        let mounted = true;
        async function initialize() {
            try {
                await (0, migrations_1.runMigrations)();
                await (0, seed_1.seedData)();
                await (0, achievementSyncService_1.syncAchievements)();
                if (mounted) {
                    setReady(true);
                }
            }
            catch (err) {
                console.error('[App] Failed to initialize', err);
                if (mounted) {
                    setError(err instanceof Error ? err.message : '应用初始化失败');
                }
            }
        }
        initialize();
        return () => {
            mounted = false;
        };
    }, []);
    if (error) {
        return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.container, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.title, children: "\u542F\u52A8\u5931\u8D25" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.info, children: error })] }));
    }
    if (!ready) {
        return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.container, children: [(0, jsx_runtime_1.jsx)(react_native_1.ActivityIndicator, { color: colors_1.colors.primary, size: "large" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.info, children: "\u6B63\u5728\u6574\u7406\u4F60\u7684\u9605\u8BFB\u9986\u85CF..." })] }));
    }
    return ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsx)(RootNavigator_1.default, {}), (0, jsx_runtime_1.jsx)(expo_status_bar_1.StatusBar, { style: "dark" })] }));
}
const styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors_1.colors.background,
        padding: 40,
    },
    title: {
        color: colors_1.colors.text,
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 15,
        textAlign: 'center',
    },
    info: {
        color: colors_1.colors.textMuted,
        fontSize: 15,
        lineHeight: 24,
        textAlign: 'center',
        marginTop: 16,
    },
});
