"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AddBookmarkScreen;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_native_1 = require("react-native");
const native_1 = require("@react-navigation/native");
const vector_icons_1 = require("@expo/vector-icons");
const URLInput_1 = __importDefault(require("../components/URLInput"));
const useBookmarks_1 = require("../hooks/useBookmarks");
const useTags_1 = require("../hooks/useTags");
const colors_1 = require("../theme/colors");
const spacing_1 = require("../theme/spacing");
const bookmarkService_1 = require("../services/bookmarkService");
const urlParserService_1 = require("../services/urlParserService");
const sourceMeta_1 = require("../utils/sourceMeta");
const formatters_1 = require("../utils/formatters");
const bookmarkService = new bookmarkService_1.BookmarkService();
const urlParser = new urlParserService_1.URLParserService();
function isLikelyParsed(metadata, url) {
    if (!metadata)
        return false;
    return (Boolean(metadata.author) ||
        Boolean(metadata.description) ||
        Boolean(metadata.imageUrl) ||
        (metadata.title && metadata.title !== metadata.sourceDomain && metadata.title !== url) ||
        (metadata.originalTags?.length || 0) > 0 ||
        Boolean(metadata.publishedAt));
}
function AddBookmarkScreen() {
    const navigation = (0, native_1.useNavigation)();
    const bookmarks = (0, useBookmarks_1.useBookmarks)();
    const tags = (0, useTags_1.useTags)();
    const [url, setUrl] = (0, react_1.useState)('');
    const [notes, setNotes] = (0, react_1.useState)('');
    const [selectedTags, setSelectedTags] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(false);
    const [parsing, setParsing] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)('');
    const [newTagName, setNewTagName] = (0, react_1.useState)('');
    const [preview, setPreview] = (0, react_1.useState)(null);
    const [previewUrl, setPreviewUrl] = (0, react_1.useState)('');
    (0, react_1.useEffect)(() => {
        const trimmed = url.trim();
        if (!trimmed || trimmed === previewUrl) {
            return;
        }
        if (!/^https?:\/\/.+/.test(trimmed)) {
            setPreview(null);
            setPreviewUrl('');
            return;
        }
        let cancelled = false;
        setParsing(true);
        const timer = setTimeout(async () => {
            try {
                const metadata = await urlParser.parse(trimmed);
                if (!cancelled) {
                    setPreview(metadata);
                    setPreviewUrl(trimmed);
                }
            }
            catch {
                if (!cancelled) {
                    setPreview(null);
                    setPreviewUrl(trimmed);
                }
            }
            finally {
                if (!cancelled) {
                    setParsing(false);
                }
            }
        }, 450);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [url, previewUrl]);
    const previewReady = (0, react_1.useMemo)(() => isLikelyParsed(preview, url.trim()), [preview, url]);
    const handleAdd = async () => {
        if (!url.trim()) {
            setError('请输入链接');
            return;
        }
        setError('');
        setLoading(true);
        try {
            const trimmedUrl = url.trim();
            const exists = await bookmarkService.exists(trimmedUrl);
            if (exists) {
                react_native_1.Alert.alert('已经收藏过了', '这条链接已经在你的馆藏里。', [
                    { text: '取消', style: 'cancel' },
                    { text: '返回', onPress: () => navigation.goBack() },
                ]);
                setLoading(false);
                return;
            }
            await bookmarks.addBookmark({
                url: trimmedUrl,
                tags: selectedTags,
                notes: notes.trim(),
            });
            navigation.goBack();
        }
        catch (err) {
            if (err.message === 'DUPLICATE_URL') {
                react_native_1.Alert.alert('已经收藏过了', '这条链接已经在你的馆藏里。');
            }
            else {
                setError('添加失败，请稍后重试');
            }
            setLoading(false);
        }
    };
    const toggleTag = (tagId) => {
        setSelectedTags((prev) => prev.includes(tagId) ? prev.filter((item) => item !== tagId) : [...prev, tagId]);
    };
    const handleCreateTag = async () => {
        if (!newTagName.trim())
            return;
        await tags.createTag(newTagName.trim());
        setNewTagName('');
    };
    return ((0, jsx_runtime_1.jsx)(react_native_1.ScrollView, { style: styles.container, keyboardShouldPersistTaps: "handled", children: (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.form, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.heroCard, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.heroTitle, children: "\u6536\u8FDB\u4E66\u623F" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.heroSubtitle, children: "\u7C98\u8D34\u94FE\u63A5\u540E\uFF0C\u5E94\u7528\u4F1A\u5C3D\u91CF\u81EA\u52A8\u63D0\u53D6\u6807\u9898\u3001\u4F5C\u8005\u3001\u7B80\u4ECB\u3001\u5C01\u9762\u548C\u539F\u59CB\u6807\u7B7E\u3002" })] }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.label, children: "\u94FE\u63A5" }), (0, jsx_runtime_1.jsx)(URLInput_1.default, { value: url, onChangeText: setUrl, loading: loading || parsing, error: error }), url.trim() ? ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.previewCard, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.previewHeader, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.previewTitle, children: "\u89E3\u6790\u7ED3\u679C" }), parsing ? (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.previewStatus, children: "\u6B63\u5728\u8BC6\u522B..." }) : null] }), previewReady && preview ? ((0, jsx_runtime_1.jsxs)(jsx_runtime_1.Fragment, { children: [preview.imageUrl ? ((0, jsx_runtime_1.jsx)(react_native_1.Image, { source: { uri: preview.imageUrl }, style: styles.previewCover, resizeMode: "cover" })) : null, (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.previewMetaRow, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.previewSourceBadge, children: [(0, jsx_runtime_1.jsx)(vector_icons_1.MaterialCommunityIcons, { name: "bookmark-outline", size: 14, color: colors_1.colors.primary }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.previewSourceText, children: (0, sourceMeta_1.getSourceLabel)(preview.sourceType) })] }), preview.author ? (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.previewAuthor, children: preview.author }) : null] }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.previewHeadline, children: preview.title }), preview.description ? ((0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.previewDescription, numberOfLines: 4, children: preview.description })) : null, (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.previewInfoList, children: [(0, jsx_runtime_1.jsx)(InfoLine, { label: "\u57DF\u540D", value: preview.sourceDomain || '未识别' }), (0, jsx_runtime_1.jsx)(InfoLine, { label: "\u53D1\u5E03\u65F6\u95F4", value: preview.publishedAt ? (0, formatters_1.formatDateTime)(preview.publishedAt) : '未识别' })] }), preview.originalTags && preview.originalTags.length > 0 ? ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.previewTagSection, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.previewTagSectionTitle, children: "\u539F\u59CB\u6807\u7B7E" }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.previewTags, children: preview.originalTags.slice(0, 8).map((tag) => ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.previewTag, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.previewTagText, children: tag }) }, tag))) })] })) : null] })) : ((0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.previewFallback, children: parsing
                                ? '正在尝试获取标题、作者、简介和封面...'
                                : '这条链接暂时没有拿到完整详情，不过依然可以先保存。' }))] })) : null, (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.label, children: "\u6807\u7B7E" }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.tagRow, children: tags.tags.map((tag) => ((0, jsx_runtime_1.jsx)(react_native_1.TouchableOpacity, { style: [
                            styles.tagChip,
                            { backgroundColor: `${tag.color}16`, borderColor: `${tag.color}35` },
                            selectedTags.includes(tag.id) && {
                                backgroundColor: tag.color,
                                borderColor: tag.color,
                            },
                        ], onPress: () => toggleTag(tag.id), children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [
                                styles.tagChipText,
                                { color: tag.color },
                                selectedTags.includes(tag.id) && { color: colors_1.colors.white },
                            ], children: tag.name }) }, tag.id))) }), (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.newTagRow, children: [(0, jsx_runtime_1.jsx)(react_native_1.TextInput, { style: styles.newTagInput, placeholder: "\u987A\u624B\u65B0\u5EFA\u4E00\u4E2A\u6807\u7B7E", placeholderTextColor: colors_1.colors.textMuted, value: newTagName, onChangeText: setNewTagName }), (0, jsx_runtime_1.jsx)(react_native_1.TouchableOpacity, { style: styles.newTagBtn, onPress: handleCreateTag, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.newTagBtnText, children: "\u6DFB\u52A0" }) })] }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.label, children: "\u5907\u6CE8" }), (0, jsx_runtime_1.jsx)(react_native_1.TextInput, { style: styles.notesInput, placeholder: "\u5199\u4E0B\u60F3\u770B\u7684\u539F\u56E0\u3001\u91CD\u70B9\u6216\u9605\u8BFB\u8BA1\u5212...", placeholderTextColor: colors_1.colors.textMuted, value: notes, onChangeText: setNotes, multiline: true, numberOfLines: 4, textAlignVertical: "top" }), (0, jsx_runtime_1.jsx)(react_native_1.TouchableOpacity, { style: [styles.submitBtn, !url.trim() && styles.submitBtnDisabled], onPress: handleAdd, disabled: !url.trim() || loading, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.submitText, children: loading ? '正在入馆...' : '添加收藏' }) })] }) }));
}
function InfoLine({ label, value }) {
    return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.previewInfoRow, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.previewInfoLabel, children: label }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.previewInfoValue, children: value })] }));
}
const styles = react_native_1.StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors_1.colors.background,
    },
    form: {
        padding: spacing_1.spacing.lg,
    },
    heroCard: {
        backgroundColor: colors_1.colors.surface,
        borderRadius: spacing_1.borderRadius.xl,
        padding: spacing_1.spacing.xl,
        borderWidth: 1,
        borderColor: colors_1.colors.border,
        marginBottom: spacing_1.spacing.lg,
    },
    heroTitle: {
        color: colors_1.colors.text,
        fontSize: 24,
        fontWeight: '800',
        marginBottom: spacing_1.spacing.xs,
    },
    heroSubtitle: {
        color: colors_1.colors.textSecondary,
        fontSize: 14,
        lineHeight: 21,
    },
    label: {
        color: colors_1.colors.textSecondary,
        fontSize: 13,
        fontWeight: '700',
        marginBottom: spacing_1.spacing.sm,
        marginTop: spacing_1.spacing.lg,
    },
    previewCard: {
        backgroundColor: colors_1.colors.surface,
        borderRadius: spacing_1.borderRadius.lg,
        borderWidth: 1,
        borderColor: colors_1.colors.border,
        padding: spacing_1.spacing.lg,
        marginTop: spacing_1.spacing.sm,
    },
    previewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing_1.spacing.md,
    },
    previewTitle: {
        color: colors_1.colors.text,
        fontSize: 15,
        fontWeight: '700',
    },
    previewStatus: {
        color: colors_1.colors.textMuted,
        fontSize: 12,
    },
    previewCover: {
        width: '100%',
        height: 180,
        borderRadius: spacing_1.borderRadius.lg,
        marginBottom: spacing_1.spacing.md,
        backgroundColor: colors_1.colors.backgroundMuted,
    },
    previewMetaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: spacing_1.spacing.sm,
        marginBottom: spacing_1.spacing.sm,
    },
    previewSourceBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing_1.spacing.xs,
        backgroundColor: colors_1.colors.backgroundMuted,
        borderRadius: spacing_1.borderRadius.full,
        paddingHorizontal: spacing_1.spacing.sm,
        paddingVertical: spacing_1.spacing.xs,
    },
    previewSourceText: {
        color: colors_1.colors.primary,
        fontSize: 12,
        fontWeight: '700',
    },
    previewAuthor: {
        color: colors_1.colors.textSecondary,
        fontSize: 12,
        flexShrink: 1,
        textAlign: 'right',
    },
    previewHeadline: {
        color: colors_1.colors.text,
        fontSize: 18,
        fontWeight: '700',
        lineHeight: 26,
    },
    previewDescription: {
        color: colors_1.colors.textSecondary,
        fontSize: 14,
        lineHeight: 21,
        marginTop: spacing_1.spacing.sm,
    },
    previewInfoList: {
        marginTop: spacing_1.spacing.md,
        gap: spacing_1.spacing.xs,
    },
    previewInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: spacing_1.spacing.md,
    },
    previewInfoLabel: {
        color: colors_1.colors.textMuted,
        fontSize: 12,
    },
    previewInfoValue: {
        color: colors_1.colors.textSecondary,
        fontSize: 12,
        flex: 1,
        textAlign: 'right',
    },
    previewTags: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing_1.spacing.sm,
        marginTop: spacing_1.spacing.sm,
    },
    previewTagSection: {
        marginTop: spacing_1.spacing.md,
    },
    previewTagSectionTitle: {
        color: colors_1.colors.textSecondary,
        fontSize: 12,
        fontWeight: '700',
    },
    previewTag: {
        backgroundColor: colors_1.colors.backgroundMuted,
        borderRadius: spacing_1.borderRadius.full,
        paddingHorizontal: spacing_1.spacing.sm,
        paddingVertical: spacing_1.spacing.xs,
    },
    previewTagText: {
        color: colors_1.colors.primaryDark,
        fontSize: 11,
        fontWeight: '600',
    },
    previewFallback: {
        color: colors_1.colors.textMuted,
        fontSize: 13,
        lineHeight: 20,
    },
    tagRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing_1.spacing.sm,
    },
    tagChip: {
        paddingHorizontal: spacing_1.spacing.md,
        paddingVertical: spacing_1.spacing.sm,
        borderRadius: spacing_1.borderRadius.full,
        borderWidth: 1,
    },
    tagChipText: {
        fontSize: 13,
        fontWeight: '600',
    },
    newTagRow: {
        flexDirection: 'row',
        marginTop: spacing_1.spacing.sm,
        gap: spacing_1.spacing.sm,
    },
    newTagInput: {
        flex: 1,
        backgroundColor: colors_1.colors.surface,
        color: colors_1.colors.text,
        fontSize: 14,
        paddingHorizontal: spacing_1.spacing.md,
        paddingVertical: spacing_1.spacing.sm,
        borderRadius: spacing_1.borderRadius.lg,
        borderWidth: 1,
        borderColor: colors_1.colors.border,
    },
    newTagBtn: {
        backgroundColor: colors_1.colors.primary,
        paddingHorizontal: spacing_1.spacing.lg,
        paddingVertical: spacing_1.spacing.sm,
        borderRadius: spacing_1.borderRadius.lg,
        justifyContent: 'center',
    },
    newTagBtnText: {
        color: colors_1.colors.white,
        fontSize: 14,
        fontWeight: '700',
    },
    notesInput: {
        backgroundColor: colors_1.colors.surface,
        color: colors_1.colors.text,
        fontSize: 15,
        padding: spacing_1.spacing.lg,
        borderRadius: spacing_1.borderRadius.lg,
        minHeight: 110,
        borderWidth: 1,
        borderColor: colors_1.colors.border,
    },
    submitBtn: {
        backgroundColor: colors_1.colors.primary,
        paddingVertical: spacing_1.spacing.lg,
        borderRadius: spacing_1.borderRadius.lg,
        alignItems: 'center',
        marginTop: spacing_1.spacing.xxxl,
    },
    submitBtnDisabled: {
        opacity: 0.5,
    },
    submitText: {
        color: colors_1.colors.white,
        fontSize: 16,
        fontWeight: '700',
    },
});
