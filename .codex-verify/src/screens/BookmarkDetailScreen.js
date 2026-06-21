"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = BookmarkDetailScreen;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_native_1 = require("react-native");
const native_1 = require("@react-navigation/native");
const vector_icons_1 = require("@expo/vector-icons");
const bookmarkService_1 = require("../services/bookmarkService");
const useBookmarks_1 = require("../hooks/useBookmarks");
const useNotes_1 = require("../hooks/useNotes");
const StatusToggle_1 = __importDefault(require("../components/StatusToggle"));
const NotesList_1 = __importDefault(require("../components/NotesList"));
const colors_1 = require("../theme/colors");
const spacing_1 = require("../theme/spacing");
const sourceMeta_1 = require("../utils/sourceMeta");
const formatters_1 = require("../utils/formatters");
const media_1 = require("../utils/media");
const bookmarkService = new bookmarkService_1.BookmarkService();
function BookmarkDetailScreen() {
    const route = (0, native_1.useRoute)();
    const navigation = (0, native_1.useNavigation)();
    const bookmarks = (0, useBookmarks_1.useBookmarks)();
    const notes = (0, useNotes_1.useNotes)(route.params.bookmarkId);
    const [bookmark, setBookmark] = (0, react_1.useState)(null);
    (0, react_1.useEffect)(() => {
        let cancelled = false;
        async function load() {
            const initial = await bookmarkService.getById(route.params.bookmarkId);
            if (!cancelled) {
                setBookmark(initial);
            }
            const hydrated = await bookmarkService.hydrateMetadataIfNeeded(route.params.bookmarkId);
            if (!cancelled && hydrated) {
                setBookmark(hydrated);
            }
        }
        load();
        return () => {
            cancelled = true;
        };
    }, [route.params.bookmarkId]);
    if (!bookmark) {
        return ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.loadingWrap, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.loading, children: "\u6B63\u5728\u6253\u5F00\u8FD9\u6761\u9986\u85CF..." }) }));
    }
    const coverUrl = (0, media_1.normalizeImageUrl)(bookmark.imageUrl);
    const sourceColor = colors_1.colors.sourceColors[bookmark.sourceType] || colors_1.colors.sourceColors.other;
    const refreshBookmark = async () => {
        const updated = await bookmarkService.getById(bookmark.id);
        if (updated) {
            setBookmark(updated);
        }
    };
    const handleToggleStatus = async () => {
        await bookmarks.toggleStatus(bookmark.id);
        await refreshBookmark();
    };
    const handleDelete = () => {
        react_native_1.Alert.alert('删除收藏', '确定要删除这条收藏吗？', [
            { text: '取消', style: 'cancel' },
            {
                text: '删除',
                style: 'destructive',
                onPress: async () => {
                    await bookmarks.deleteBookmark(bookmark.id);
                    navigation.goBack();
                },
            },
        ]);
    };
    const handleOpenLink = () => {
        bookmarkService
            .incrementReadCount(bookmark.id)
            .then((updated) => {
            setBookmark(updated);
            return react_native_1.Linking.openURL(bookmark.url);
        })
            .catch(() => {
            react_native_1.Alert.alert('无法打开链接');
        });
    };
    return ((0, jsx_runtime_1.jsxs)(react_native_1.ScrollView, { style: styles.container, contentContainerStyle: styles.content, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.heroCard, children: [coverUrl ? ((0, jsx_runtime_1.jsx)(react_native_1.Image, { source: { uri: coverUrl }, style: styles.cover, resizeMode: "cover" })) : ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.coverFallback, children: (0, jsx_runtime_1.jsx)(vector_icons_1.MaterialCommunityIcons, { name: "book-open-page-variant-outline", size: 44, color: colors_1.colors.primary }) })), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.sourceRow, children: [(0, jsx_runtime_1.jsx)(react_native_1.View, { style: [
                                    styles.sourceBadge,
                                    { backgroundColor: `${sourceColor}16`, borderColor: `${sourceColor}40` },
                                ], children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [styles.sourceText, { color: sourceColor }], children: (0, sourceMeta_1.getSourceLabel)(bookmark.sourceType) }) }), (0, jsx_runtime_1.jsx)(StatusToggle_1.default, { status: bookmark.learningStatus, onToggle: handleToggleStatus, size: "small" })] }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.title, children: bookmark.title || '未命名内容' }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.url, numberOfLines: 2, children: bookmark.url }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.actionRow, children: [(0, jsx_runtime_1.jsx)(react_native_1.TouchableOpacity, { style: [
                                    styles.readActionBtn,
                                    bookmark.learningStatus === 'read' ? styles.markUnreadBtn : styles.markReadBtn,
                                ], onPress: handleToggleStatus, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [
                                        styles.readActionText,
                                        bookmark.learningStatus === 'read' ? styles.markUnreadText : styles.markReadText,
                                    ], children: bookmark.learningStatus === 'read' ? '标记未读' : '完成阅读' }) }), (0, jsx_runtime_1.jsxs)(react_native_1.TouchableOpacity, { style: styles.openBtn, onPress: handleOpenLink, children: [(0, jsx_runtime_1.jsx)(vector_icons_1.MaterialCommunityIcons, { name: "open-in-new", size: 16, color: colors_1.colors.white }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.openBtnText, children: "\u6253\u5F00\u539F\u94FE\u63A5" })] })] })] }), (bookmark.author ||
                bookmark.description ||
                bookmark.originalTags.length > 0 ||
                bookmark.publishedAt) && ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.section, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.sectionTitle, children: "\u6458\u5F55\u4FE1\u606F" }), bookmark.author ? (0, jsx_runtime_1.jsx)(InfoRow, { label: "\u4F5C\u8005", value: bookmark.author }) : null, bookmark.publishedAt ? ((0, jsx_runtime_1.jsx)(InfoRow, { label: "\u521B\u4F5C\u65F6\u95F4", value: (0, formatters_1.formatDateTime)(bookmark.publishedAt) })) : null, bookmark.description ? (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.description, children: bookmark.description }) : null, bookmark.originalTags.length > 0 ? ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.tagRow, children: bookmark.originalTags.map((tag) => ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.originalTag, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.originalTagText, children: tag }) }, tag))) })) : null] })), bookmark.notes ? ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.section, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.sectionTitle, children: "\u5907\u6CE8" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.notesText, children: bookmark.notes })] })) : null, bookmark.tags.length > 0 && ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.section, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.sectionTitle, children: "\u6807\u7B7E" }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.tagRow, children: bookmark.tags.map((tag) => ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: [
                                styles.tag,
                                { backgroundColor: `${tag.color}16`, borderColor: `${tag.color}35` },
                            ], children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [styles.tagText, { color: tag.color }], children: tag.name }) }, tag.id))) })] })), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.section, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.sectionTitle, children: "\u9605\u8BFB\u8F68\u8FF9" }), (0, jsx_runtime_1.jsx)(InfoRow, { label: "\u57DF\u540D", value: bookmark.sourceDomain }), (0, jsx_runtime_1.jsx)(InfoRow, { label: "\u6DFB\u52A0\u65F6\u95F4", value: (0, formatters_1.formatDateTime)(bookmark.createdAt) }), (0, jsx_runtime_1.jsx)(InfoRow, { label: "\u4E0A\u6B21\u9605\u8BFB", value: (0, formatters_1.formatDateTime)(bookmark.readAt) }), (0, jsx_runtime_1.jsx)(InfoRow, { label: "\u9605\u8BFB\u6B21\u6570", value: `${bookmark.readCount}` }), (0, jsx_runtime_1.jsx)(InfoRow, { label: "\u64E6\u4EAE\u6B21\u6570", value: `${bookmark.resurfaceCount}` }), (0, jsx_runtime_1.jsx)(InfoRow, { label: "\u4E0A\u6B21\u64E6\u4EAE", value: (0, formatters_1.formatDateTime)(bookmark.lastResurfacedAt) })] }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.notesSection, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.sectionTitle, children: "\u7B14\u8BB0" }), (0, jsx_runtime_1.jsx)(NotesList_1.default, { notes: notes.notes, loading: notes.loading, onAdd: notes.addNote, onUpdate: notes.updateNote, onDelete: notes.deleteNote })] }), (0, jsx_runtime_1.jsx)(react_native_1.TouchableOpacity, { style: styles.deleteBtn, onPress: handleDelete, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.deleteBtnText, children: "\u5220\u9664\u6536\u85CF" }) })] }));
}
function InfoRow({ label, value }) {
    return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.infoRow, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.infoLabel, children: label }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.infoValue, children: value })] }));
}
const styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors_1.colors.background,
    },
    content: {
        padding: spacing_1.spacing.lg,
        paddingBottom: spacing_1.spacing.xxxl,
    },
    loadingWrap: {
        flex: 1,
        backgroundColor: colors_1.colors.background,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loading: {
        color: colors_1.colors.textMuted,
        fontSize: 15,
    },
    heroCard: {
        backgroundColor: colors_1.colors.surface,
        borderRadius: spacing_1.borderRadius.xl,
        padding: spacing_1.spacing.lg,
        borderWidth: 1,
        borderColor: colors_1.colors.border,
        marginBottom: spacing_1.spacing.xl,
    },
    cover: {
        width: '100%',
        height: 200,
        borderRadius: spacing_1.borderRadius.lg,
        marginBottom: spacing_1.spacing.lg,
        backgroundColor: colors_1.colors.backgroundMuted,
    },
    coverFallback: {
        width: '100%',
        height: 160,
        borderRadius: spacing_1.borderRadius.lg,
        marginBottom: spacing_1.spacing.lg,
        backgroundColor: colors_1.colors.backgroundMuted,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sourceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing_1.spacing.md,
        gap: spacing_1.spacing.sm,
    },
    sourceBadge: {
        paddingHorizontal: spacing_1.spacing.sm,
        paddingVertical: spacing_1.spacing.xs,
        borderRadius: spacing_1.borderRadius.full,
        borderWidth: 1,
    },
    sourceText: {
        fontSize: 12,
        fontWeight: '700',
    },
    title: {
        color: colors_1.colors.text,
        fontSize: 24,
        fontWeight: '800',
        lineHeight: 34,
        marginBottom: spacing_1.spacing.sm,
    },
    url: {
        color: colors_1.colors.textMuted,
        fontSize: 13,
        lineHeight: 20,
    },
    actionRow: {
        flexDirection: 'row',
        gap: spacing_1.spacing.sm,
        marginTop: spacing_1.spacing.lg,
    },
    section: {
        backgroundColor: colors_1.colors.surface,
        borderRadius: spacing_1.borderRadius.lg,
        padding: spacing_1.spacing.lg,
        marginBottom: spacing_1.spacing.md,
        borderWidth: 1,
        borderColor: colors_1.colors.border,
    },
    notesSection: {
        marginTop: spacing_1.spacing.lg,
    },
    sectionTitle: {
        color: colors_1.colors.textSecondary,
        fontSize: 13,
        fontWeight: '700',
        marginBottom: spacing_1.spacing.md,
    },
    notesText: {
        color: colors_1.colors.text,
        fontSize: 15,
        lineHeight: 24,
    },
    description: {
        color: colors_1.colors.textSecondary,
        fontSize: 14,
        lineHeight: 22,
        marginTop: spacing_1.spacing.sm,
        marginBottom: spacing_1.spacing.sm,
    },
    tagRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing_1.spacing.sm,
        marginTop: spacing_1.spacing.sm,
    },
    tag: {
        paddingHorizontal: spacing_1.spacing.md,
        paddingVertical: spacing_1.spacing.xs,
        borderRadius: spacing_1.borderRadius.full,
        borderWidth: 1,
    },
    tagText: {
        fontSize: 13,
        fontWeight: '600',
    },
    originalTag: {
        paddingHorizontal: spacing_1.spacing.md,
        paddingVertical: spacing_1.spacing.xs,
        borderRadius: spacing_1.borderRadius.full,
        backgroundColor: colors_1.colors.backgroundMuted,
    },
    originalTagText: {
        color: colors_1.colors.textSecondary,
        fontSize: 12,
        fontWeight: '600',
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: spacing_1.spacing.sm,
        gap: spacing_1.spacing.md,
    },
    infoLabel: {
        color: colors_1.colors.textSecondary,
        fontSize: 14,
    },
    infoValue: {
        flex: 1,
        color: colors_1.colors.text,
        fontSize: 14,
        textAlign: 'right',
    },
    readActionBtn: {
        flex: 1,
        paddingVertical: spacing_1.spacing.md,
        borderRadius: spacing_1.borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    markReadBtn: {
        backgroundColor: colors_1.colors.success,
    },
    markUnreadBtn: {
        backgroundColor: colors_1.colors.backgroundMuted,
    },
    readActionText: {
        fontSize: 15,
        fontWeight: '700',
    },
    markReadText: {
        color: colors_1.colors.white,
    },
    markUnreadText: {
        color: colors_1.colors.text,
    },
    openBtn: {
        flex: 1,
        backgroundColor: colors_1.colors.primary,
        paddingVertical: spacing_1.spacing.md,
        borderRadius: spacing_1.borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: spacing_1.spacing.xs,
    },
    openBtnText: {
        color: colors_1.colors.white,
        fontSize: 15,
        fontWeight: '700',
    },
    deleteBtn: {
        marginTop: spacing_1.spacing.lg,
        backgroundColor: `${colors_1.colors.error}16`,
        paddingVertical: spacing_1.spacing.md,
        borderRadius: spacing_1.borderRadius.md,
        alignItems: 'center',
    },
    deleteBtnText: {
        color: colors_1.colors.error,
        fontSize: 15,
        fontWeight: '700',
    },
});
