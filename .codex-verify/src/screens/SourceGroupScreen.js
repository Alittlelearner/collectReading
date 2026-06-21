"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = SourceGroupScreen;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_native_1 = require("react-native");
const native_1 = require("@react-navigation/native");
const useBookmarks_1 = require("../hooks/useBookmarks");
const BookmarkCard_1 = __importDefault(require("../components/BookmarkCard"));
const EmptyState_1 = __importDefault(require("../components/EmptyState"));
const colors_1 = require("../theme/colors");
const spacing_1 = require("../theme/spacing");
const sourceMeta_1 = require("../utils/sourceMeta");
function SourceGroupScreen() {
    const route = (0, native_1.useRoute)();
    const navigation = (0, native_1.useNavigation)();
    const bookmarks = (0, useBookmarks_1.useBookmarks)();
    const sourceType = route.params?.sourceType;
    const filtered = (0, react_1.useMemo)(() => bookmarks.bookmarks.filter((b) => b.sourceType === sourceType), [bookmarks.bookmarks, sourceType]);
    return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.container, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.header, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.headerTitle, children: (0, sourceMeta_1.getSourceLabel)(sourceType || 'other') }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.headerSubtitle, children: "\u8FD9\u91CC\u6536\u7740\u540C\u4E00\u6765\u6E90\u7684\u6240\u6709\u5185\u5BB9" })] }), (0, jsx_runtime_1.jsx)(react_native_1.FlatList, { data: filtered, keyExtractor: (item) => item.id, renderItem: ({ item }) => ((0, jsx_runtime_1.jsx)(BookmarkCard_1.default, { bookmark: item, onPress: () => navigation.navigate('BookmarkDetail', { bookmarkId: item.id }) })), contentContainerStyle: styles.list, ListEmptyComponent: (0, jsx_runtime_1.jsx)(EmptyState_1.default, { icon: "bookshelf", title: "\u8BE5\u6765\u6E90\u4E0B\u8FD8\u6CA1\u6709\u6536\u85CF", subtitle: "\u8FD4\u56DE\u9986\u85CF\u9875\uFF0C\u518D\u6536\u4E00\u70B9\u8FDB\u6765\u3002" }) })] }));
}
const styles = react_native_1.StyleSheet.create({
    container: { flex: 1, backgroundColor: colors_1.colors.background },
    header: {
        paddingHorizontal: spacing_1.spacing.lg,
        paddingTop: spacing_1.spacing.lg,
        paddingBottom: spacing_1.spacing.sm,
    },
    headerTitle: {
        color: colors_1.colors.text,
        fontSize: 26,
        fontWeight: '800',
    },
    headerSubtitle: {
        color: colors_1.colors.textMuted,
        fontSize: 13,
        marginTop: 4,
    },
    list: { paddingVertical: spacing_1.spacing.sm, paddingBottom: spacing_1.spacing.xl },
});
