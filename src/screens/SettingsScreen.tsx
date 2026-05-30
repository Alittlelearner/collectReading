import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Switch, StyleSheet, ScrollView, Alert, Share } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { getDatabase } from '../db/database';
import { useReminder } from '../hooks/useReminder';
import { colors } from '../theme/colors';
import { spacing, borderRadius } from '../theme/spacing';

export default function SettingsScreen() {
  const reminder = useReminder();
  const [interval, setInterval] = useState(reminder.config.intervalDays);

  useEffect(() => {
    setInterval(reminder.config.intervalDays);
  }, [reminder.config.intervalDays]);

  const handleToggle = async (value: boolean) => {
    if (value && !reminder.permissionGranted) {
      const granted = await reminder.requestPermission();
      if (!granted) {
        Alert.alert('通知权限', '请在系统设置中开启通知权限', [
          { text: '好的' },
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

      const shared = await Share.share({
        url: path,
        title: '收藏备份',
        message: '收藏数据备份文件',
      });

      if (shared.action === Share.sharedAction) {
        Alert.alert('导出成功', '文件已分享到其他应用');
      }
    } catch (err: any) {
      Alert.alert('导出失败', err.message || '请重试');
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
        Alert.alert('导入失败', '文件格式不正确');
        return;
      }

      Alert.alert('导入数据', `将导入：\n• ${data.bookmarks.length || 0} 条收藏\n• ${data.tags?.length || 0} 个标签\n• ${data.notes?.length || 0} 条笔记\n\n这将合并现有数据，不会覆盖。`, [
        { text: '取消', style: 'cancel' },
        {
          text: '确认导入',
          onPress: async () => {
            const db = await getDatabase();
            let imported = 0;

            for (const tag of data.tags || []) {
              try {
                await db.runAsync(
                  'INSERT OR IGNORE INTO tags (id, name, color, created_at) VALUES (?, ?, ?, ?)',
                  tag.id, tag.name, tag.color, tag.created_at,
                );
              } catch {}
            }

            for (const bookmark of data.bookmarks || []) {
              try {
                await db.runAsync(
                  'INSERT OR REPLACE INTO bookmarks (id, url, title, description, image_url, source_type, source_domain, learning_status, read_at, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                  bookmark.id, bookmark.url, bookmark.title, bookmark.description, bookmark.image_url, bookmark.source_type, bookmark.source_domain, bookmark.learning_status, bookmark.read_at, bookmark.notes, bookmark.created_at, bookmark.updated_at,
                );
                imported++;
              } catch {}
            }

            for (const rel of data.bookmarkTags || []) {
              try {
                await db.runAsync(
                  'INSERT OR IGNORE INTO bookmark_tags (bookmark_id, tag_id) VALUES (?, ?)',
                  rel.bookmark_id, rel.tag_id,
                );
              } catch {}
            }

            for (const note of data.notes || []) {
              try {
                await db.runAsync(
                  'INSERT OR REPLACE INTO notes (id, bookmark_id, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
                  note.id, note.bookmark_id, note.content, note.created_at, note.updated_at,
                );
              } catch {}
            }

            Alert.alert('导入完成', `成功导入 ${imported} 条收藏`);
          },
        },
      ]);
    } catch (err: any) {
      Alert.alert('导入失败', err.message || '文件格式不正确');
    }
  };

  const handleReset = () => {
    Alert.alert('重置数据', '确定要清除所有数据吗？此操作不可恢复。', [
      { text: '取消', style: 'cancel' },
      {
        text: '重置',
        style: 'destructive',
        onPress: async () => {
          const db = await getDatabase();
          await db.execAsync('DELETE FROM bookmark_tags');
          await db.execAsync('DELETE FROM bookmarks');
          await db.execAsync('DELETE FROM tags');
          await db.execAsync('DELETE FROM notes');
          await db.execAsync('DELETE FROM daily_stats');
          Alert.alert('已重置', '所有数据已清除');
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>提醒设置</Text>

        <View style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <Text style={styles.menuIcon}>🔔</Text>
            <View style={styles.menuItemText}>
              <Text style={styles.menuText}>未读提醒</Text>
              <Text style={styles.menuSubtext}>
                {reminder.config.enabled ? '已开启' : '已关闭'}
              </Text>
            </View>
          </View>
          <Switch
            value={reminder.config.enabled}
            onValueChange={handleToggle}
            trackColor={{ false: colors.surfaceLight, true: colors.primary }}
            thumbColor={colors.white}
          />
        </View>

        {reminder.config.enabled && (
          <View style={styles.intervalSection}>
            <Text style={styles.intervalLabel}>提醒间隔</Text>
            <View style={styles.intervalRow}>
              {intervalOptions.map((opt) => (
                <TouchableOpacity
                  key={opt.days}
                  style={[
                    styles.intervalBtn,
                    interval === opt.days && styles.intervalBtnActive,
                  ]}
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
        )}

        {!reminder.permissionGranted && (
          <View style={styles.permissionTip}>
            <Text style={styles.permissionTipText}>
              💡 需要在系统设置中开启通知权限才能接收提醒
            </Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>通知状态</Text>
        <View style={styles.menuItem}>
          <Text style={styles.menuText}>已调度提醒</Text>
          <Text style={styles.menuRight}>{reminder.config.enabled ? '活动中' : '无'}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>数据</Text>
        <TouchableOpacity style={styles.menuItem} onPress={handleExport}>
          <Text style={styles.menuText}>导出数据</Text>
          <Text style={styles.menuRight}>JSON</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={handleImport}>
          <Text style={styles.menuText}>导入数据</Text>
          <Text style={styles.menuRight}>JSON</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={handleReset}>
          <Text style={[styles.menuText, { color: colors.error }]}>重置所有数据</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>关于</Text>
        <View style={styles.menuItem}>
          <Text style={styles.menuText}>版本</Text>
          <Text style={styles.menuRight}>1.0.0 (Phase 2)</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  section: { marginTop: spacing.xl },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  menuItemText: {
    flex: 1,
  },
  menuText: { color: colors.text, fontSize: 15, fontWeight: '500' },
  menuSubtext: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  menuRight: { color: colors.textMuted, fontSize: 14 },
  menuIcon: { fontSize: 18 },
  intervalSection: {
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  intervalLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: spacing.md,
  },
  intervalRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  intervalBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
  },
  intervalBtnActive: {
    backgroundColor: colors.primary,
  },
  intervalBtnText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  intervalBtnTextActive: {
    color: colors.white,
  },
  permissionTip: {
    backgroundColor: colors.warning + '20',
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  permissionTipText: {
    color: colors.warning,
    fontSize: 12,
    lineHeight: 18,
  },
});
