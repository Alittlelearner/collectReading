import React, { useState, useEffect } from 'react';
import {
  Platform,
  View,
  Text,
  TouchableOpacity,
  Switch,
  StyleSheet,
  ScrollView,
  Alert,
  Share,
  TextInput,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { getDatabase } from '../db/database';
import {
  collectBackupPayload,
  ImportSummary,
  normalizeBackupPayload,
  restoreBackupPayload,
  summarizeBackup,
} from '../db/backupPayload';
import { clearWebBackup, disableWebBackupSync, enableWebBackupSync } from '../db/webPersistence';
import { useReminder } from '../hooks/useReminder';
import { SettingsService } from '../services/settingsService';
import { colors } from '../theme/colors';
import { spacing, borderRadius } from '../theme/spacing';

const settingsService = new SettingsService();

function createBackupFilename(): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return `collection-read-backup-${stamp}.json`;
}

function formatSummary(summary: ImportSummary): string {
  return [
    `收藏 ${summary.bookmarks} 条`,
    `标签 ${summary.tags} 个`,
    `收藏夹 ${summary.folders} 个`,
    `笔记 ${summary.notes} 条`,
    `标签关系 ${summary.bookmarkTags} 条`,
    `收藏夹关系 ${summary.bookmarkFolders} 条`,
    `Wiki ${summary.wikiSpaces} 个`,
    `统计 ${summary.dailyStats} 条`,
    `设置 ${summary.userSettings} 条`,
    `书架 ${summary.libraryItems} 条`,
    `Markdown 笔记 ${summary.markdownNotes} 篇`,
    `笔记图片 ${summary.noteAssets} 个`,
    summary.skipped ? `跳过 ${summary.skipped} 条无效数据` : null,
  ]
    .filter(Boolean)
    .join('\n');
}

function downloadTextFile(fileName: string, text: string): void {
  if (typeof document === 'undefined' || typeof URL === 'undefined') {
    throw new Error('当前环境不支持浏览器下载。');
  }

  const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function pickJsonFileOnWeb(): Promise<string | null> {
  if (typeof document === 'undefined') {
    throw new Error('当前环境不支持选择文件。');
  }

  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => reject(new Error('读取文件失败'));
      reader.readAsText(file);
    };
    input.click();
  });
}

export default function SettingsScreen() {
  const reminder = useReminder();
  const [interval, setInterval] = useState(reminder.config.intervalDays);
  const [resurfaceDailyLimit, setResurfaceDailyLimit] = useState('3');
  const [resurfaceMaxPerItem, setResurfaceMaxPerItem] = useState('5');
  const [resurfaceCooldownDays, setResurfaceCooldownDays] = useState('7');

  useEffect(() => {
    setInterval(reminder.config.intervalDays);
  }, [reminder.config.intervalDays]);

  useEffect(() => {
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
    Alert.alert('已保存', '擦亮配置已经更新。');
  };

  const handleToggle = async (value: boolean) => {
    if (value && !reminder.permissionGranted) {
      const granted = await reminder.requestPermission();
      if (!granted) {
        Alert.alert('通知权限', '请在系统设置中开启通知权限。', [
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
      const db = await getDatabase();
      const data = await collectBackupPayload(db);
      const summary = summarizeBackup(data);
      const json = JSON.stringify(data, null, 2);
      const filename = createBackupFilename();

      if (Platform.OS === 'web') {
        downloadTextFile(filename, json);
        window.alert(`导出成功\n${formatSummary(summary)}`);
        return;
      }

      const path = `${FileSystem.documentDirectory}${filename}`;

      await FileSystem.writeAsStringAsync(path, json);

      const shared = await Share.share({
        url: path,
        title: '收藏备份',
        message: '收藏数据备份文件',
      });

      if (shared.action === Share.sharedAction) {
        Alert.alert('导出成功', formatSummary(summary));
      }
    } catch (err: any) {
      Alert.alert('导出失败', err.message || '请稍后重试');
    }
  };

  const handleImport = async () => {
    try {
      let content: string | null = null;

      if (Platform.OS === 'web') {
        content = await pickJsonFileOnWeb();
      } else {
        const result = await DocumentPicker.getDocumentAsync({
          type: 'application/json',
          copyToCacheDirectory: true,
        });

        if (result.canceled || !result.assets || result.assets.length === 0) {
          return;
        }

        content = await FileSystem.readAsStringAsync(result.assets[0].uri);
      }

      if (!content) {
        return;
      }

      const data = normalizeBackupPayload(JSON.parse(content));

      if (!data) {
        Alert.alert('导入失败', '文件格式不正确');
        return;
      }

      const preview = summarizeBackup(data);
      const confirmMessage = `将导入并合并以下数据，不会清空现有数据：\n\n${formatSummary(preview)}`;

      const importData = async () => {
        const db = await getDatabase();
        const summary = await restoreBackupPayload(db, data);
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.alert(`导入完成\n${formatSummary(summary)}`);
          return;
        }
        Alert.alert('导入完成', formatSummary(summary));
      };

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        if (window.confirm(confirmMessage)) {
          await importData();
        }
        return;
      }

      Alert.alert(
        '导入数据',
        confirmMessage,
        [
          { text: '取消', style: 'cancel' },
          {
            text: '确认导入',
            onPress: importData,
          },
        ],
      );
    } catch (err: any) {
      Alert.alert('导入失败', err.message || '文件格式不正确');
    }
  };

  const handleReset = () => {
    Alert.alert('重置数据', '确定要清空所有数据吗？此操作不可恢复。', [
      { text: '取消', style: 'cancel' },
      {
        text: '重置',
        style: 'destructive',
        onPress: async () => {
          disableWebBackupSync();
          const db = await getDatabase();
          await db.execAsync('DELETE FROM bookmark_tags');
          await db.execAsync('DELETE FROM bookmark_folders');
          await db.execAsync('DELETE FROM bookmarks');
          await db.execAsync('DELETE FROM tags');
          await db.execAsync('DELETE FROM folders');
          await db.execAsync('DELETE FROM notes');
          await db.execAsync('DELETE FROM note_assets');
          await db.execAsync('DELETE FROM markdown_notes');
          await db.execAsync('DELETE FROM library_items');
          await db.execAsync('DELETE FROM daily_stats');
          clearWebBackup();
          enableWebBackupSync();
          Alert.alert('已重置', '所有数据已经清空。');
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerEyebrow}>馆务设置</Text>
        <Text style={styles.headerTitle}>设置</Text>
      </View>

      <SectionCard title="阅读提醒">
        <View style={styles.menuItem}>
          <View style={styles.menuItemText}>
            <Text style={styles.menuText}>待阅读提醒</Text>
            <Text style={styles.menuSubtext}>{reminder.config.enabled ? '已开启' : '已关闭'}</Text>
          </View>
          <Switch
            value={reminder.config.enabled}
            onValueChange={handleToggle}
            trackColor={{ false: colors.surfaceLight, true: colors.primaryLight }}
            thumbColor={colors.white}
          />
        </View>

        {reminder.config.enabled ? (
          <View style={styles.intervalSection}>
            <Text style={styles.intervalLabel}>提醒间隔</Text>
            <View style={styles.intervalRow}>
              {intervalOptions.map((opt) => (
                <TouchableOpacity
                  key={opt.days}
                  style={[styles.intervalBtn, interval === opt.days && styles.intervalBtnActive]}
                  onPress={() => reminder.updateConfig({ intervalDays: opt.days })}
                >
                  <Text
                    style={[
                      styles.intervalBtnText,
                      interval === opt.days && styles.intervalBtnTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}

        {!reminder.permissionGranted ? (
          <View style={styles.permissionTip}>
            <Text style={styles.permissionTipText}>需要系统通知权限才能收到提醒。</Text>
          </View>
        ) : null}
      </SectionCard>

      <SectionCard title="数据管理">
        <TouchableOpacity style={styles.actionItem} onPress={handleExport}>
          <Text style={styles.menuText}>导出数据</Text>
          <Text style={styles.menuRight}>JSON</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionItem} onPress={handleImport}>
          <Text style={styles.menuText}>导入数据</Text>
          <Text style={styles.menuRight}>JSON</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionItem} onPress={handleReset}>
          <Text style={[styles.menuText, { color: colors.error }]}>重置所有数据</Text>
        </TouchableOpacity>
      </SectionCard>

      <SectionCard title="擦亮配置">
        <Text style={styles.configLabel}>每日候选上限</Text>
        <TextInput
          style={styles.configInput}
          value={resurfaceDailyLimit}
          onChangeText={setResurfaceDailyLimit}
          keyboardType="number-pad"
        />
        <Text style={styles.configLabel}>每条最多擦亮次数</Text>
        <TextInput
          style={styles.configInput}
          value={resurfaceMaxPerItem}
          onChangeText={setResurfaceMaxPerItem}
          keyboardType="number-pad"
        />
        <Text style={styles.configLabel}>冷却天数</Text>
        <TextInput
          style={styles.configInput}
          value={resurfaceCooldownDays}
          onChangeText={setResurfaceCooldownDays}
          keyboardType="number-pad"
        />
        <TouchableOpacity style={styles.saveConfigBtn} onPress={saveResurfaceSettings}>
          <Text style={styles.saveConfigText}>保存擦亮配置</Text>
        </TouchableOpacity>
      </SectionCard>

      <SectionCard title="关于">
        <View style={styles.actionItem}>
          <Text style={styles.menuText}>版本</Text>
          <Text style={styles.menuRight}>1.0.0</Text>
        </View>
      </SectionCard>

      <View style={{ height: 36 }} />
    </ScrollView>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  headerEyebrow: {
    color: colors.textMuted,
    fontSize: 12,
    letterSpacing: 1,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 30,
    fontWeight: '800',
    marginTop: 2,
  },
  section: { marginTop: spacing.xl },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    letterSpacing: 1,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuItemText: {
    flex: 1,
  },
  menuText: { color: colors.text, fontSize: 15, fontWeight: '700' },
  menuSubtext: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  menuRight: { color: colors.textMuted, fontSize: 14 },
  intervalSection: {
    marginTop: spacing.sm,
  },
  intervalLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: spacing.md,
  },
  intervalRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  intervalBtn: {
    minWidth: 72,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundMuted,
    alignItems: 'center',
  },
  intervalBtnActive: {
    backgroundColor: colors.primary,
  },
  intervalBtnText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  intervalBtnTextActive: {
    color: colors.white,
  },
  permissionTip: {
    backgroundColor: colors.warning + '18',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.sm,
  },
  permissionTipText: {
    color: colors.warning,
    fontSize: 12,
    lineHeight: 18,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  configLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  configInput: {
    backgroundColor: colors.backgroundMuted,
    color: colors.text,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
  },
  saveConfigBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  saveConfigText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
});
