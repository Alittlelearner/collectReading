"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = HomeScreen;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_native_1 = require("react-native");
const native_1 = require("@react-navigation/native");
const vector_icons_1 = require("@expo/vector-icons");
const useBookmarks_1 = require("../hooks/useBookmarks");
const useResurface_1 = require("../hooks/useResurface");
const useTags_1 = require("../hooks/useTags");
const BookmarkCard_1 = __importDefault(require("../components/BookmarkCard"));
const ResurfaceCard_1 = __importDefault(require("../components/ResurfaceCard"));
const ViewTabBar_1 = __importDefault(require("../components/ViewTabBar"));
const SourceGrid_1 = __importDefault(require("../components/SourceGrid"));
const TagCloud_1 = __importDefault(require("../components/TagCloud"));
const AddFAB_1 = __importDefault(require("../components/AddFAB"));
const EmptyState_1 = __importDefault(require("../components/EmptyState"));
const colors_1 = require("../theme/colors");
const spacing_1 = require("../theme/spacing");
function HomeScreen() {
    const navigation = (0, native_1.useNavigation)();
    const bookmarks = (0, useBookmarks_1.useBookmarks)();
    const resurface = (0, useResurface_1.useResurface)();
    const tags = (0, useTags_1.useTags)();
    const [searchQuery, setSearchQuery] = (0, react_1.useState)('');
    const handleSearch = (0, react_1.useCallback)((text) => {
        setSearchQuery(text);
        bookmarks.setFilters({ searchQuery: text || undefined });
    }, []);
    const currentCandidate = resurface.candidates[resurface.currentIndex];
    const hasResurface = currentCandidate && !searchQuery;
    const sourceGroups = bookmarks.getSourceGroups();
    const timelineGroups = (0, react_1.useMemo)(() => {
        const groups = {};
        const today = new Date(new Date().setHours(0, 0, 0, 0)).getTime();
        const yesterday = today - 86400000;
        const weekAgo = today - 7 * 86400000;
        for (const bookmark of bookmarks.bookmarks) {
            const createdDay = new Date(new Date(bookmark.createdAt).setHours(0, 0, 0, 0)).getTime();
            let key = '更早';
            if (createdDay === today)
                key = '今天';
            else if (createdDay === yesterday)
                key = '昨天';
            else if (createdDay >= weekAgo)
                key = '本周';
            if (!groups[key])
                groups[key] = [];
            groups[key].push(bookmark);
        }
        const order = ['今天', '昨天', '本周', '更早'];
        return order.filter((key) => groups[key]?.length).map((key) => ({ title: key, data: groups[key] }));
    }, [bookmarks.bookmarks]);
    const renderBookmark = (0, react_1.useCallback)(({ item }) => ((0, jsx_runtime_1.jsx)(BookmarkCard_1.default, { bookmark: item, onPress: () => navigation.navigate('BookmarkDetail', { bookmarkId: item.id }) })), [navigation]);
    const renderHeader = () => ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.header, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.headerEyebrow, children: "\u4E2A\u4EBA\u56FE\u4E66\u9986" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.headerTitle, children: "\u9986\u85CF" })] }), (0, jsx_runtime_1.jsx)(react_native_1.TouchableOpacity, { style: styles.headerAction, onPress: () => navigation.navigate('StatsDashboard'), children: (0, jsx_runtime_1.jsx)(vector_icons_1.MaterialCommunityIcons, { name: "chart-line", size: 20, color: colors_1.colors.primaryDark }) })] }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.heroCard, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.heroTextWrap, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.heroTitle, children: "\u628A\u788E\u7247\u5185\u5BB9\u6536\u8FDB\u4E00\u95F4\u50CF\u6837\u7684\u4E66\u623F" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.heroSubtitle, children: "\u8FD9\u91CC\u4F1A\u6309\u65F6\u95F4\u3001\u6765\u6E90\u548C\u6807\u7B7E\u6574\u7406\u4F60\u7684\u6536\u85CF\uFF0C\u4E5F\u4F1A\u63D0\u9192\u4F60\u628A\u65E7\u5185\u5BB9\u91CD\u65B0\u7FFB\u51FA\u6765\u3002" })] }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.heroStamp, children: (0, jsx_runtime_1.jsx)(vector_icons_1.MaterialCommunityIcons, { name: "library-shelves", size: 28, color: colors_1.colors.primary }) })] }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.searchContainer, children: [(0, jsx_runtime_1.jsx)(vector_icons_1.MaterialCommunityIcons, { name: "magnify", size: 18, color: colors_1.colors.textMuted }), (0, jsx_runtime_1.jsx)(react_native_1.TextInput, { style: styles.searchInput, placeholder: "\u641C\u7D22\u6807\u9898\u3001\u4F5C\u8005\u3001\u5907\u6CE8...", placeholderTextColor: colors_1.colors.textMuted, value: searchQuery, onChangeText: handleSearch })] }), hasResurface ? ((0, jsx_runtime_1.jsx)(ResurfaceCard_1.default, { bookmark: currentCandidate, onPress: () => navigation.navigate('BookmarkDetail', { bookmarkId: currentCandidate.id }), onSkip: () => resurface.skip(), onDone: () => resurface.done() })) : null, (0, jsx_runtime_1.jsx)(ViewTabBar_1.default, { current: bookmarks.currentView, onChange: bookmarks.setView })] }));
    const renderTimeline = () => {
        if (bookmarks.bookmarks.length === 0) {
            return ((0, jsx_runtime_1.jsxs)(react_native_1.ScrollView, { contentContainerStyle: styles.scrollContent, showsVerticalScrollIndicator: false, children: [renderHeader(), (0, jsx_runtime_1.jsx)(EmptyState_1.default, { icon: "bookshelf", title: "\u8FD8\u6CA1\u6709\u5185\u5BB9", subtitle: "\u70B9\u53F3\u4E0B\u89D2\u628A\u7B2C\u4E00\u6761\u60F3\u8BFB\u7684\u5185\u5BB9\u6536\u8FDB\u4F60\u7684\u9605\u8BFB\u9986\u85CF\u3002" })] }));
        }
        return ((0, jsx_runtime_1.jsx)(react_native_1.SectionList, { sections: timelineGroups, keyExtractor: (item) => item.id, renderItem: renderBookmark, renderSectionHeader: ({ section }) => (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.sectionHeader, children: section.title }), stickySectionHeadersEnabled: false, showsVerticalScrollIndicator: false, contentContainerStyle: styles.listContent, ListHeaderComponent: renderHeader }));
    };
    const renderSourceView = () => ((0, jsx_runtime_1.jsxs)(react_native_1.ScrollView, { contentContainerStyle: styles.scrollContent, showsVerticalScrollIndicator: false, children: [renderHeader(), bookmarks.bookmarks.length === 0 ? ((0, jsx_runtime_1.jsx)(EmptyState_1.default, { icon: "bookshelf", title: "\u8FD8\u6CA1\u6709\u5185\u5BB9", subtitle: "\u70B9\u53F3\u4E0B\u89D2\u628A\u7B2C\u4E00\u6761\u60F3\u8BFB\u7684\u5185\u5BB9\u6536\u8FDB\u4F60\u7684\u9605\u8BFB\u9986\u85CF\u3002" })) : ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.panelBody, children: (0, jsx_runtime_1.jsx)(SourceGrid_1.default, { groups: sourceGroups, onPress: (sourceType) => navigation.navigate('SourceGroup', { sourceType }) }) }))] }));
    const renderTagView = () => ((0, jsx_runtime_1.jsxs)(react_native_1.ScrollView, { contentContainerStyle: styles.scrollContent, showsVerticalScrollIndicator: false, children: [renderHeader(), bookmarks.bookmarks.length === 0 ? ((0, jsx_runtime_1.jsx)(EmptyState_1.default, { icon: "bookshelf", title: "\u8FD8\u6CA1\u6709\u5185\u5BB9", subtitle: "\u70B9\u53F3\u4E0B\u89D2\u628A\u7B2C\u4E00\u6761\u60F3\u8BFB\u7684\u5185\u5BB9\u6536\u8FDB\u4F60\u7684\u9605\u8BFB\u9986\u85CF\u3002" })) : ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.panelBody, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.tagPanelHeader, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.tagPanelTitle, children: "\u6309\u6807\u7B7E\u7FFB\u627E" }), (0, jsx_runtime_1.jsx)(react_native_1.TouchableOpacity, { onPress: () => navigation.navigate('TagManage'), children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.tagPanelAction, children: "\u7BA1\u7406\u6807\u7B7E" }) })] }), (0, jsx_runtime_1.jsx)(TagCloud_1.default, { tags: tags.tags, onPress: (tagId) => {
                            bookmarks.setFilters({ tagId });
                            bookmarks.setView('timeline');
                        } })] }))] }));
    const renderContent = () => {
        if (bookmarks.currentView === 'source')
            return renderSourceView();
        if (bookmarks.currentView === 'tag')
            return renderTagView();
        return renderTimeline();
    };
    return ((0, jsx_runtime_1.jsxs)(react_native_1.SafeAreaView, { style: styles.container, children: [renderContent(), (0, jsx_runtime_1.jsx)(AddFAB_1.default, { onPress: () => navigation.navigate('AddBookmark') })] }));
}
const styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors_1.colors.background,
    },
    scrollContent: {
        paddingBottom: 96,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing_1.spacing.lg,
        paddingTop: spacing_1.spacing.md,
        paddingBottom: spacing_1.spacing.sm,
    },
    headerEyebrow: {
        color: colors_1.colors.textMuted,
        fontSize: 12,
        letterSpacing: 1,
    },
    headerTitle: {
        color: colors_1.colors.text,
        fontSize: 30,
        fontWeight: '800',
        marginTop: 2,
    },
    headerAction: {
        width: 42,
        height: 42,
        borderRadius: spacing_1.borderRadius.full,
        backgroundColor: colors_1.colors.surface,
        borderWidth: 1,
        borderColor: colors_1.colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroCard: {
        marginHorizontal: spacing_1.spacing.lg,
        marginTop: spacing_1.spacing.sm,
        backgroundColor: colors_1.colors.surface,
        borderWidth: 1,
        borderColor: colors_1.colors.border,
        borderRadius: spacing_1.borderRadius.xl,
        padding: spacing_1.spacing.xl,
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: spacing_1.spacing.md,
    },
    heroTextWrap: {
        flex: 1,
    },
    heroTitle: {
        color: colors_1.colors.text,
        fontSize: 21,
        fontWeight: '800',
        lineHeight: 30,
        marginBottom: spacing_1.spacing.sm,
    },
    heroSubtitle: {
        color: colors_1.colors.textSecondary,
        fontSize: 14,
        lineHeight: 21,
    },
    heroStamp: {
        width: 56,
        height: 56,
        borderRadius: spacing_1.borderRadius.full,
        backgroundColor: colors_1.colors.backgroundMuted,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'flex-start',
    },
    searchContainer: {
        marginHorizontal: spacing_1.spacing.lg,
        marginTop: spacing_1.spacing.lg,
        marginBottom: spacing_1.spacing.md,
        backgroundColor: colors_1.colors.surface,
        borderWidth: 1,
        borderColor: colors_1.colors.border,
        borderRadius: spacing_1.borderRadius.lg,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing_1.spacing.lg,
        gap: spacing_1.spacing.sm,
    },
    searchInput: {
        flex: 1,
        color: colors_1.colors.text,
        fontSize: 15,
        paddingVertical: spacing_1.spacing.md,
    },
    sectionHeader: {
        color: colors_1.colors.textMuted,
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
        paddingHorizontal: spacing_1.spacing.lg,
        paddingTop: spacing_1.spacing.lg,
        paddingBottom: spacing_1.spacing.xs,
    },
    listContent: {
        paddingBottom: 96,
    },
    panelBody: {
        paddingTop: spacing_1.spacing.lg,
        paddingBottom: spacing_1.spacing.lg,
    },
    tagPanelHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing_1.spacing.lg,
        marginBottom: spacing_1.spacing.md,
    },
    tagPanelTitle: {
        color: colors_1.colors.textSecondary,
        fontSize: 14,
        fontWeight: '700',
    },
    tagPanelAction: {
        color: colors_1.colors.primary,
        fontSize: 13,
        fontWeight: '700',
    },
});
