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
exports.default = SettingsScreen;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const react_native_1 = require("react-native");
const DocumentPicker = __importStar(require("expo-document-picker"));
const FileSystem = __importStar(require("expo-file-system/legacy"));
const database_1 = require("../db/database");
const useReminder_1 = require("../hooks/useReminder");
const settingsService_1 = require("../services/settingsService");
const colors_1 = require("../theme/colors");
const spacing_1 = require("../theme/spacing");
const settingsService = new settingsService_1.SettingsService();
function SettingsScreen() {
    const reminder = (0, useReminder_1.useReminder)();
    const [interval, setInterval] = (0, react_1.useState)(reminder.config.intervalDays);
    const [resurfaceDailyLimit, setResurfaceDailyLimit] = (0, react_1.useState)('3');
    const [resurfaceMaxPerItem, setResurfaceMaxPerItem] = (0, react_1.useState)('5');
    const [resurfaceCooldownDays, setResurfaceCooldownDays] = (0, react_1.useState)('7');
    (0, react_1.useEffect)(() => {
        setInterval(reminder.config.intervalDays);
    }, [reminder.config.intervalDays]);
    (0, react_1.useEffect)(() => {
        loadResurfaceSettings();
    }, []);
    const loadResurfaceSettings = async () => {
        const [dailyLimit, maxPerItem, cooldownDays] = await Promise.all([
            settingsService.getValue('resurface_daily_limit', '3'),
            settingsService.getValue('resurface_max_per_item', '5'),
            settingsService.getValue('resurface_cooldown_days', '7'),
        ]);
        setResurfaceDailyLimit(dailyLimit);
        setResurfaceMaxPerItem(maxPerItem);
        setResurfaceCooldownDays(cooldownDays);
    };
    const saveResurfaceSettings = async () => {
        await Promise.all([
            settingsService.setValue('resurface_daily_limit', resurfaceDailyLimit || '3'),
            settingsService.setValue('resurface_max_per_item', resurfaceMaxPerItem || '5'),
            settingsService.setValue('resurface_cooldown_days', resurfaceCooldownDays || '7'),
        ]);
        react_native_1.Alert.alert('已保存', '擦亮配置已经更新。');
    };
    const handleToggle = async (value) => {
        if (value && !reminder.permissionGranted) {
            const granted = await reminder.requestPermission();
            if (!granted) {
                react_native_1.Alert.alert('通知权限', '请在系统设置中开启通知权限。', [
                    { text: '知道了' },
                    { text: '去设置', onPress: () => reminder.updateConfig({ enabled: true }) },
                ]);
                return;
            }
        }
        await reminder.updateConfig({ enabled: value });
    };
    const intervalOptions = [
        { days: 3, label: '3 天' },
        { days: 7, label: '7 天' },
        { days: 14, label: '14 天' },
        { days: 30, label: '30 天' },
    ];
    const handleExport = async () => {
        try {
            const db = await (0, database_1.getDatabase)();
            const [bookmarks, tags, bookmarkTags, notes, dailyStats, achievements, settings] = await Promise.all([
                db.getAllAsync('SELECT * FROM bookmarks'),
                db.getAllAsync('SELECT * FROM tags'),
                db.getAllAsync('SELECT * FROM bookmark_tags'),
                db.getAllAsync('SELECT * FROM notes'),
                db.getAllAsync('SELECT * FROM daily_stats'),
                db.getAllAsync('SELECT * FROM achievements'),
                db.getAllAsync('SELECT * FROM user_settings'),
            ]);
            const data = {
                version: '1.0',
                exportDate: new Date().toISOString(),
                bookmarks,
                tags,
                bookmarkTags,
                notes,
                dailyStats,
                achievements,
                settings,
            };
            const json = JSON.stringify(data, null, 2);
            const filename = `bookmark-backup-${new Date().toISOString().slice(0, 10)}.json`;
            const path = `${FileSystem.documentDirectory}${filename}`;
            await FileSystem.writeAsStringAsync(path, json);
            const shared = await react_native_1.Share.share({
                url: path,
                title: '收藏备份',
                message: '收藏数据备份文件',
            });
            if (shared.action === react_native_1.Share.sharedAction) {
                react_native_1.Alert.alert('导出成功', '文件已经分享给其他应用。');
            }
        }
        catch (err) {
            react_native_1.Alert.alert('导出失败', err.message || '请稍后重试');
        }
    };
    const handleImport = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: 'application/json',
                copyToCacheDirectory: true,
            });
            if (result.canceled || !result.assets || result.assets.length === 0) {
                return;
            }
            const fileUri = result.assets[0].uri;
            const content = await FileSystem.readAsStringAsync(fileUri);
            const data = JSON.parse(content);
            if (!data.bookmarks || !Array.isArray(data.bookmarks)) {
                react_native_1.Alert.alert('导入失败', '文件格式不正确');
                return;
            }
            react_native_1.Alert.alert('导入数据', `将导入：\n• ${data.bookmarks.length || 0} 条收藏\n• ${data.tags?.length || 0} 个标签\n• ${data.notes?.length || 0} 条笔记\n\n这会合并现有数据，不会覆盖。`, [
                { text: '取消', style: 'cancel' },
                {
                    text: '确认导入',
                    onPress: async () => {
                        const db = await (0, database_1.getDatabase)();
                        let imported = 0;
                        for (const tag of data.tags || []) {
                            try {
                                await db.runAsync('INSERT OR IGNORE INTO tags (id, name, color, created_at) VALUES (?, ?, ?, ?)', tag.id, tag.name, tag.color, tag.created_at);
                            }
                            catch { }
                        }
                        for (const bookmark of data.bookmarks || []) {
                            try {
                                await db.runAsync(`INSERT OR REPLACE INTO bookmarks
                     (
                       id, url, title, description, image_url, author, source_type, source_domain,
                       original_tags, published_at, learning_status, read_at, notes, created_at, updated_at
                     )
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, bookmark.id, bookmark.url, bookmark.title, bookmark.description || '', bookmark.image_url || null, bookmark.author || null, bookmark.source_type, bookmark.source_domain, bookmark.original_tags || '[]', bookmark.published_at || null, bookmark.learning_status, bookmark.read_at, bookmark.notes, bookmark.created_at, bookmark.updated_at);
                                imported++;
                            }
                            catch { }
                        }
                        for (const rel of data.bookmarkTags || []) {
                            try {
                                await db.runAsync('INSERT OR IGNORE INTO bookmark_tags (bookmark_id, tag_id) VALUES (?, ?)', rel.bookmark_id, rel.tag_id);
                            }
                            catch { }
                        }
                        for (const note of data.notes || []) {
                            try {
                                await db.runAsync('INSERT OR REPLACE INTO notes (id, bookmark_id, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?)', note.id, note.bookmark_id, note.content, note.created_at, note.updated_at);
                            }
                            catch { }
                        }
                        for (const setting of data.settings || []) {
                            try {
                                await db.runAsync('INSERT OR REPLACE INTO user_settings (key, value) VALUES (?, ?)', setting.key, setting.value);
                            }
                            catch { }
                        }
                        react_native_1.Alert.alert('导入完成', `成功导入 ${imported} 条收藏`);
                    },
                },
            ]);
        }
        catch (err) {
            react_native_1.Alert.alert('导入失败', err.message || '文件格式不正确');
        }
    };
    const handleReset = () => {
        react_native_1.Alert.alert('重置数据', '确定要清空所有数据吗？此操作不可恢复。', [
            { text: '取消', style: 'cancel' },
            {
                text: '重置',
                style: 'destructive',
                onPress: async () => {
                    const db = await (0, database_1.getDatabase)();
                    await db.execAsync('DELETE FROM bookmark_tags');
                    await db.execAsync('DELETE FROM bookmarks');
                    await db.execAsync('DELETE FROM tags');
                    await db.execAsync('DELETE FROM notes');
                    await db.execAsync('DELETE FROM daily_stats');
                    react_native_1.Alert.alert('已重置', '所有数据已经清空。');
                },
            },
        ]);
    };
    return ((0, jsx_runtime_1.jsxs)(react_native_1.ScrollView, { style: styles.container, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.header, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.headerEyebrow, children: "\u9986\u52A1\u8BBE\u7F6E" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.headerTitle, children: "\u8BBE\u7F6E" })] }), (0, jsx_runtime_1.jsxs)(SectionCard, { title: "\u9605\u8BFB\u63D0\u9192", children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.menuItem, children: [(0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.menuItemText, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.menuText, children: "\u5F85\u9605\u8BFB\u63D0\u9192" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.menuSubtext, children: reminder.config.enabled ? '已开启' : '已关闭' })] }), (0, jsx_runtime_1.jsx)(react_native_1.Switch, { value: reminder.config.enabled, onValueChange: handleToggle, trackColor: { false: colors_1.colors.surfaceLight, true: colors_1.colors.primaryLight }, thumbColor: colors_1.colors.white })] }), reminder.config.enabled ? ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.intervalSection, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.intervalLabel, children: "\u63D0\u9192\u95F4\u9694" }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.intervalRow, children: intervalOptions.map((opt) => ((0, jsx_runtime_1.jsx)(react_native_1.TouchableOpacity, { style: [styles.intervalBtn, interval === opt.days && styles.intervalBtnActive], onPress: () => reminder.updateConfig({ intervalDays: opt.days }), children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [
                                            styles.intervalBtnText,
                                            interval === opt.days && styles.intervalBtnTextActive,
                                        ], children: opt.label }) }, opt.days))) })] })) : null, !reminder.permissionGranted ? ((0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.permissionTip, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.permissionTipText, children: "\u9700\u8981\u7CFB\u7EDF\u901A\u77E5\u6743\u9650\u624D\u80FD\u6536\u5230\u63D0\u9192\u3002" }) })) : null] }), (0, jsx_runtime_1.jsxs)(SectionCard, { title: "\u6570\u636E\u7BA1\u7406", children: [(0, jsx_runtime_1.jsxs)(react_native_1.TouchableOpacity, { style: styles.actionItem, onPress: handleExport, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.menuText, children: "\u5BFC\u51FA\u6570\u636E" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.menuRight, children: "JSON" })] }), (0, jsx_runtime_1.jsxs)(react_native_1.TouchableOpacity, { style: styles.actionItem, onPress: handleImport, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.menuText, children: "\u5BFC\u5165\u6570\u636E" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.menuRight, children: "JSON" })] }), (0, jsx_runtime_1.jsx)(react_native_1.TouchableOpacity, { style: styles.actionItem, onPress: handleReset, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: [styles.menuText, { color: colors_1.colors.error }], children: "\u91CD\u7F6E\u6240\u6709\u6570\u636E" }) })] }), (0, jsx_runtime_1.jsxs)(SectionCard, { title: "\u64E6\u4EAE\u914D\u7F6E", children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.configLabel, children: "\u6BCF\u65E5\u5019\u9009\u4E0A\u9650" }), (0, jsx_runtime_1.jsx)(react_native_1.TextInput, { style: styles.configInput, value: resurfaceDailyLimit, onChangeText: setResurfaceDailyLimit, keyboardType: "number-pad" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.configLabel, children: "\u6BCF\u6761\u6700\u591A\u64E6\u4EAE\u6B21\u6570" }), (0, jsx_runtime_1.jsx)(react_native_1.TextInput, { style: styles.configInput, value: resurfaceMaxPerItem, onChangeText: setResurfaceMaxPerItem, keyboardType: "number-pad" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.configLabel, children: "\u51B7\u5374\u5929\u6570" }), (0, jsx_runtime_1.jsx)(react_native_1.TextInput, { style: styles.configInput, value: resurfaceCooldownDays, onChangeText: setResurfaceCooldownDays, keyboardType: "number-pad" }), (0, jsx_runtime_1.jsx)(react_native_1.TouchableOpacity, { style: styles.saveConfigBtn, onPress: saveResurfaceSettings, children: (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.saveConfigText, children: "\u4FDD\u5B58\u64E6\u4EAE\u914D\u7F6E" }) })] }), (0, jsx_runtime_1.jsx)(SectionCard, { title: "\u5173\u4E8E", children: (0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.actionItem, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.menuText, children: "\u7248\u672C" }), (0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.menuRight, children: "1.0.0" })] }) }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: { height: 36 } })] }));
}
function SectionCard({ title, children, }) {
    return ((0, jsx_runtime_1.jsxs)(react_native_1.View, { style: styles.section, children: [(0, jsx_runtime_1.jsx)(react_native_1.Text, { style: styles.sectionTitle, children: title }), (0, jsx_runtime_1.jsx)(react_native_1.View, { style: styles.sectionCard, children: children })] }));
}
const styles = react_native_1.StyleSheet.create({
    container: { flex: 1, backgroundColor: colors_1.colors.background },
    header: {
        paddingHorizontal: spacing_1.spacing.lg,
        paddingTop: spacing_1.spacing.md,
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
    section: { marginTop: spacing_1.spacing.xl },
    sectionTitle: {
        color: colors_1.colors.textMuted,
        fontSize: 12,
        fontWeight: '700',
        paddingHorizontal: spacing_1.spacing.lg,
        marginBottom: spacing_1.spacing.sm,
        letterSpacing: 1,
    },
    sectionCard: {
        backgroundColor: colors_1.colors.surface,
        marginHorizontal: spacing_1.spacing.lg,
        padding: spacing_1.spacing.lg,
        borderRadius: spacing_1.borderRadius.xl,
        borderWidth: 1,
        borderColor: colors_1.colors.border,
        gap: spacing_1.spacing.sm,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    menuItemText: {
        flex: 1,
    },
    menuText: { color: colors_1.colors.text, fontSize: 15, fontWeight: '700' },
    menuSubtext: { color: colors_1.colors.textMuted, fontSize: 12, marginTop: 2 },
    menuRight: { color: colors_1.colors.textMuted, fontSize: 14 },
    intervalSection: {
        marginTop: spacing_1.spacing.sm,
    },
    intervalLabel: {
        color: colors_1.colors.textSecondary,
        fontSize: 13,
        marginBottom: spacing_1.spacing.md,
    },
    intervalRow: {
        flexDirection: 'row',
        gap: spacing_1.spacing.sm,
        flexWrap: 'wrap',
    },
    intervalBtn: {
        minWidth: 72,
        paddingVertical: spacing_1.spacing.sm,
        paddingHorizontal: spacing_1.spacing.md,
        borderRadius: spacing_1.borderRadius.md,
        backgroundColor: colors_1.colors.backgroundMuted,
        alignItems: 'center',
    },
    intervalBtnActive: {
        backgroundColor: colors_1.colors.primary,
    },
    intervalBtnText: {
        color: colors_1.colors.textSecondary,
        fontSize: 13,
        fontWeight: '600',
    },
    intervalBtnTextActive: {
        color: colors_1.colors.white,
    },
    permissionTip: {
        backgroundColor: colors_1.colors.warning + '18',
        padding: spacing_1.spacing.md,
        borderRadius: spacing_1.borderRadius.md,
        marginTop: spacing_1.spacing.sm,
    },
    permissionTipText: {
        color: colors_1.colors.warning,
        fontSize: 12,
        lineHeight: 18,
    },
    actionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: spacing_1.spacing.sm,
    },
    configLabel: {
        color: colors_1.colors.textSecondary,
        fontSize: 13,
        marginTop: spacing_1.spacing.sm,
        marginBottom: spacing_1.spacing.xs,
    },
    configInput: {
        backgroundColor: colors_1.colors.backgroundMuted,
        color: colors_1.colors.text,
        borderRadius: spacing_1.borderRadius.md,
        paddingHorizontal: spacing_1.spacing.md,
        paddingVertical: spacing_1.spacing.sm,
        fontSize: 14,
    },
    saveConfigBtn: {
        backgroundColor: colors_1.colors.primary,
        borderRadius: spacing_1.borderRadius.md,
        paddingVertical: spacing_1.spacing.md,
        alignItems: 'center',
        marginTop: spacing_1.spacing.lg,
    },
    saveConfigText: {
        color: colors_1.colors.white,
        fontSize: 14,
        fontWeight: '700',
    },
});
