import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { BookmarkService } from '../services/bookmarkService';
import { getDatabase } from '../db/database';

const bookmarkService = new BookmarkService();

export default function TestAddBookmarkScreen() {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [dbStats, setDbStats] = useState<{ count: number; urls: string[] }>({ count: 0, urls: [] });

  const updateDbStats = async () => {
    try {
      const bookmarks = await bookmarkService.getAll();
      setDbStats({
        count: bookmarks.length,
        urls: bookmarks.map(b => b.url)
      });
    } catch (err) {
      console.error('[TestAddBookmark] 更新统计失败:', err);
    }
  };

  useEffect(() => {
    updateDbStats();
  }, []);

  const handleTestAdd = async () => {
    console.log('[TestAddBookmark] 开始测试添加收藏...');
    console.log('[TestAddBookmark] URL:', url);
    console.log('[TestAddBookmark] 标题:', title);
    console.log('[TestAddBookmark] 备注:', notes);

    if (!url.trim()) {
      console.error('[TestAddBookmark] 错误：URL 不能为空');
      setError('URL 不能为空');
      return;
    }

    setError('');
    setLoading(true);
    setResult(null);

    try {
      console.log('[TestAddBookmark] 步骤1：检查 URL 是否已存在...');
      console.log('[TestAddBookmark] 检查的 URL:', url.trim());
      console.log('[TestAddBookmark] URL 长度:', url.trim().length);

      const db = await getDatabase();
      // 直接查询数据库
      const existsRow = await db.getFirstAsync('SELECT id FROM bookmarks WHERE url = ?', url.trim());
      console.log('[TestAddBookmark] 数据库查询结果:', existsRow);
      console.log('[TestAddBookmark] 数据库查询结果是否存在:', !!existsRow);

      // 使用 bookmarkService.exists 方法
      const exists = await bookmarkService.exists(url.trim());
      console.log('[TestAddBookmark] bookmarkService.exists 返回:', exists);

      if (exists) {
        const errorMsg = '该 URL 已存在于收藏库中';
        console.error('[TestAddBookmark]', errorMsg);
        console.log('[TestAddBookmark] 正在查询所有现有收藏...');
        const allBookmarks = await bookmarkService.getAll();
        console.log('[TestAddBookmark] 所有收藏列表:');
        allBookmarks.forEach((b, i) => {
          console.log(`[TestAddBookmark] 收藏 ${i + 1}:`, {
            id: b.id,
            url: b.url,
            title: b.title
          });
        });

        // 检查是否有完全相同的 URL
        const exactMatch = allBookmarks.find(b => b.url === url.trim());
        if (exactMatch) {
          console.log('[TestAddBookmark] 找到完全匹配的记录:', exactMatch.id);
          setError(`该 URL 已存在于收藏库中（ID: ${exactMatch.id}）`);
        } else {
          console.log('[TestAddBookmark] 奇怪，exists=true 但没有找到完全匹配的记录');
          setError('该 URL 已存在于收藏库中（但未找到匹配记录）');
        }

        setLoading(false);
        Alert.alert('URL 已存在', `该 URL 已存在于收藏库中。\n\n提示：请使用不同的 URL 进行测试，或者先点击"清空数据库"清空所有数据。`);
        return;
      }

      console.log('[TestAddBookmark] 步骤2：创建收藏...');
      const bookmark = await bookmarkService.create({
        url: url.trim(),
        tags: [],
        notes: notes.trim(),
      });

      console.log('[TestAddBookmark] 收藏创建成功:', bookmark);
      setResult(bookmark);

      // 验证收藏是否真的存储到了数据库
      console.log('[TestAddBookmark] 步骤3：验证数据库存储...');
      const retrieved = await bookmarkService.getById(bookmark.id);
      console.log('[TestAddBookmark] 从数据库检索到的收藏:', retrieved);

      if (retrieved) {
        console.log('[TestAddBookmark] ✅ 数据库存储验证成功！');
        Alert.alert('成功', '收藏已成功添加到数据库！');
        // 清空表单
        setUrl('');
        setTitle('');
        setNotes('');
        await updateDbStats();
      } else {
        console.error('[TestAddBookmark] ❌ 数据库存储验证失败！');
        setError('数据库存储验证失败');
      }
    } catch (err: any) {
      console.error('[TestAddBookmark] 添加收藏失败:', err);
      setError(err.message || '未知错误');
      Alert.alert('错误', err.message || '添加收藏失败');
    } finally {
      setLoading(false);
      console.log('[TestAddBookmark] 操作完成');
    }
  };

  const handleViewAll = async () => {
    console.log('[TestAddBookmark] 查看所有收藏...');
    try {
      const db = await getDatabase();
      const bookmarks = await bookmarkService.getAll();

      console.log('[TestAddBookmark] 数据库中的所有收藏:');
      console.log('[TestAddBookmark] 收藏数量:', bookmarks.length);
      bookmarks.forEach((bookmark, index) => {
        console.log(`[TestAddBookmark] 收藏 ${index + 1}:`, {
          id: bookmark.id,
          url: bookmark.url,
          title: bookmark.title,
        });
      });

      // 直接查询数据库
      const rawRows = await db.getAllAsync('SELECT * FROM bookmarks');
      console.log('[TestAddBookmark] 原始数据库记录:');
      console.log('[TestAddBookmark] 原始记录数量:', rawRows.length);
      rawRows.forEach((row: any, index: number) => {
        console.log(`[TestAddBookmark] 原始记录 ${index + 1}:`, {
          id: row.id,
          url: row.url,
          url_length: row.url?.length,
          title: row.title,
        });
      });

      // 测试 URL 查询
      if (url.trim()) {
        console.log('[TestAddBookmark] 测试 URL 查询:', url.trim());
        const testRow = await db.getFirstAsync('SELECT * FROM bookmarks WHERE url = ?', url.trim());
        console.log('[TestAddBookmark] 查询结果:', testRow);
        console.log('[TestAddBookmark] 查询结果是否存在:', !!testRow);
      }

      setResult({ type: 'all_bookmarks', count: bookmarks.length, data: bookmarks, raw: rawRows });
      Alert.alert('成功', `当前共有 ${bookmarks.length} 条收藏`);
    } catch (err: any) {
      console.error('[TestAddBookmark] 查看收藏失败:', err);
      setError(err.message);
    }
  };

  const handleClearResult = () => {
    setResult(null);
    setError('');
  };

  const handleClearDatabase = async () => {
    console.log('[TestAddBookmark] 清空数据库...');
    try {
      const db = await getDatabase();
      await db.execAsync('DELETE FROM bookmark_tags');
      await db.execAsync('DELETE FROM bookmarks');
      await db.execAsync('DELETE FROM tags');
      await db.execAsync('DELETE FROM notes');
      await db.execAsync('DELETE FROM daily_stats');
      console.log('[TestAddBookmark] ✅ 数据库已清空');
      Alert.alert('成功', '数据库已清空');
      setResult({ type: 'database_cleared', message: '数据库已清空' });
      await updateDbStats();
    } catch (err: any) {
      console.error('[TestAddBookmark] 清空数据库失败:', err);
      setError(err.message);
      Alert.alert('错误', err.message);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🧪 测试添加收藏</Text>
        <Text style={styles.subtitle}>独立测试页面 - 专注于数据库存储</Text>
        <View style={styles.statsBadge}>
          <Text style={styles.statsText}>
            当前数据库: {dbStats.count} 条记录
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>基本信息</Text>

        <Text style={styles.label}>URL *</Text>
        <TextInput
          style={styles.input}
          placeholder="输入测试 URL..."
          placeholderTextColor="#888"
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.label}>标题（可选）</Text>
        <TextInput
          style={styles.input}
          placeholder="输入标题..."
          placeholderTextColor="#888"
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>备注（可选）</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="输入备注..."
          placeholderTextColor="#888"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>操作</Text>

        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleTestAdd}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? '添加中...' : '🚀 测试添加收藏'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleViewAll}
          disabled={loading}
        >
          <Text style={styles.buttonText}>📋 查看所有收藏</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.clearButton]}
          onPress={handleClearResult}
        >
          <Text style={styles.buttonText}>🗑️ 清空结果</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.dangerButton]}
          onPress={handleClearDatabase}
        >
          <Text style={styles.buttonText}>⚠️ 清空数据库</Text>
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>❌ 错误</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {result && (
        <View style={styles.resultBox}>
          <Text style={styles.resultTitle}>✅ 结果</Text>
          <Text style={styles.resultText}>
            {JSON.stringify(result, null, 2)}
          </Text>
        </View>
      )}

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>💡 使用说明</Text>
        <Text style={styles.infoText}>
          1. 输入一个 URL（必填）
        </Text>
        <Text style={styles.infoText}>
          2. 点击"测试添加收藏"按钮
        </Text>
        <Text style={styles.infoText}>
          3. 查看浏览器控制台（F12）获取详细日志
        </Text>
        <Text style={styles.infoText}>
          4. 检查结果区域显示的数据库返回数据
        </Text>
        <Text style={styles.infoText}>
          5. 测试不同的 URL 来添加多条记录
        </Text>
      </View>

      {dbStats.count > 0 && (
        <View style={styles.existingBox}>
          <Text style={styles.existingTitle}>📋 当前数据库中的URL</Text>
          {dbStats.urls.map((u, i) => (
            <Text key={i} style={styles.existingUrl}>
              {i + 1}. {u}
            </Text>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 20,
  },
  header: {
    marginBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
  },
  statsBadge: {
    marginTop: 12,
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statsText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#cbd5e1',
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: '#1e293b',
    color: '#fff',
    fontSize: 16,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  textArea: {
    minHeight: 80,
    paddingTop: 14,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  secondaryButton: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  clearButton: {
    backgroundColor: '#64748b',
    borderColor: '#64748b',
  },
  dangerButton: {
    backgroundColor: '#dc2626',
    borderColor: '#dc2626',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: '#7f1d1d',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#991b1b',
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fecaca',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#fecaca',
  },
  resultBox: {
    backgroundColor: '#064e3b',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#065f46',
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#a7f3d0',
    marginBottom: 8,
  },
  resultText: {
    fontSize: 12,
    color: '#a7f3d0',
    fontFamily: 'monospace',
  },
  infoBox: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 40,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#93c5fd',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#cbd5e1',
    lineHeight: 22,
  },
  existingBox: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    marginTop: 20,
    marginBottom: 40,
  },
  existingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#93c5fd',
    marginBottom: 8,
  },
  existingUrl: {
    fontSize: 12,
    color: '#cbd5e1',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
});