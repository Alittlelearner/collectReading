import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { BookmarkService } from '../services/bookmarkService';

const bookmarkService = new BookmarkService();

export default function MultiUrlTestScreen() {
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const testUrls = [
    'https://example1.com',
    'https://example2.com',
    'https://example3.com',
    'https://bilibili.com/video/BV123456',
    'https://github.com/test/repo'
  ];

  const testAddMultiple = async () => {
    console.log('[MultiUrlTest] 开始测试添加多个不同的URL...');
    setLoading(true);
    setResults([]);

    for (let i = 0; i < testUrls.length; i++) {
      const url = testUrls[i];
      console.log(`[MultiUrlTest] 测试 ${i + 1}/${testUrls.length}: ${url}`);

      try {
        const exists = await bookmarkService.exists(url);
        console.log(`[MultiUrlTest] URL 是否存在: ${exists}`);

        if (exists) {
          const result = `❌ ${url} - 已存在（跳过）`;
          console.log(`[MultiUrlTest]`, result);
          setResults(prev => [...prev, result]);
          continue;
        }

        const bookmark = await bookmarkService.create({
          url,
          tags: [],
          notes: `测试备注 ${i + 1}`
        });

        const result = `✅ ${url} - 添加成功 (ID: ${bookmark.id})`;
        console.log(`[MultiUrlTest]`, result);
        setResults(prev => [...prev, result]);

      } catch (err: any) {
        const result = `❌ ${url} - 添加失败: ${err.message}`;
        console.error(`[MultiUrlTest]`, result);
        setResults(prev => [...prev, result]);
      }

      // 添加小延迟，避免过快操作
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setLoading(false);

    // 查询最终结果
    try {
      const allBookmarks = await bookmarkService.getAll();
      const finalResult = `\n📊 最终结果: 共 ${allBookmarks.length} 条记录`;
      console.log(`[MultiUrlTest]`, finalResult);
      setResults(prev => [...prev, finalResult]);
    } catch (err) {
      console.error('[MultiUrlTest] 查询结果失败:', err);
    }

    Alert.alert('测试完成', '请查看结果');
  };

  const testClearAndRetry = async () => {
    console.log('[MultiUrlTest] 清空数据库并重新测试...');
    setLoading(true);
    setResults([]);

    try {
      const { getDatabase } = await import('../db/database');
      const db = await getDatabase();

      await db.execAsync('DELETE FROM bookmark_tags');
      await db.execAsync('DELETE FROM bookmarks');
      await db.execAsync('DELETE FROM tags');
      await db.execAsync('DELETE FROM notes');
      await db.execAsync('DELETE FROM daily_stats');

      setResults(['✅ 数据库已清空']);
      console.log('[MultiUrlTest] ✅ 数据库已清空');

    } catch (err: any) {
      const errorMsg = `❌ 清空失败: ${err.message}`;
      setResults([errorMsg]);
      console.error('[MultiUrlTest]', errorMsg);
    }

    setLoading(false);
    Alert.alert('数据库已清空', '现在可以重新测试');
  };

  const testCheckCurrentState = async () => {
    console.log('[MultiUrlTest] 检查当前状态...');
    setLoading(true);
    setResults([]);

    try {
      const bookmarks = await bookmarkService.getAll();
      console.log('[MultiUrlTest] 当前所有收藏:', bookmarks);

      const summary = `📊 当前状态: ${bookmarks.length} 条记录`;
      setResults([summary]);

      bookmarks.forEach((b, i) => {
        const item = `  ${i + 1}. ${b.url}`;
        setResults(prev => [...prev, item]);
      });

    } catch (err: any) {
      const errorMsg = `❌ 查询失败: ${err.message}`;
      setResults([errorMsg]);
      console.error('[MultiUrlTest]', errorMsg);
    }

    setLoading(false);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔬 多URL测试</Text>
        <Text style={styles.subtitle}>自动测试添加多个不同的URL</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>测试操作</Text>

        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={testAddMultiple}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? '测试中...' : '🚀 自动测试5个URL'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={testCheckCurrentState}
          disabled={loading}
        >
          <Text style={styles.buttonText}>📊 检查当前状态</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.dangerButton]}
          onPress={testClearAndRetry}
          disabled={loading}
        >
          <Text style={styles.buttonText}>🗑️ 清空并重测</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>测试URL列表</Text>
        {testUrls.map((url, i) => (
          <Text key={i} style={styles.urlText}>
            {i + 1}. {url}
          </Text>
        ))}
      </View>

      {results.length > 0 && (
        <View style={styles.resultsBox}>
          <Text style={styles.resultsTitle}>📋 测试结果</Text>
          {results.map((result, i) => (
            <Text key={i} style={[
              styles.resultText,
              result.startsWith('✅') && styles.successText,
              result.startsWith('❌') && styles.errorText,
              result.startsWith('📊') && styles.infoText
            ]}>
              {result}
            </Text>
          ))}
        </View>
      )}

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>💡 测试说明</Text>
        <Text style={styles.infoText}>
          此页面会自动测试添加5个不同的URL到数据库。
        </Text>
        <Text style={styles.infoText}>
          如果所有URL都能成功添加，说明数据库功能正常。
        </Text>
        <Text style={styles.infoText}>
          如果某些URL添加失败，请查看控制台错误信息。
        </Text>
        <Text style={styles.infoText}>
          控制台会显示详细的调试信息。
        </Text>
      </View>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
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
  dangerButton: {
    backgroundColor: '#dc2626',
    borderColor: '#dc2626',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  urlText: {
    fontSize: 14,
    color: '#cbd5e1',
    fontFamily: 'monospace',
    marginBottom: 8,
    lineHeight: 20,
  },
  resultsBox: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 20,
  },
  resultsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#93c5fd',
    marginBottom: 12,
  },
  resultText: {
    fontSize: 14,
    color: '#cbd5e1',
    marginBottom: 6,
    fontFamily: 'monospace',
  },
  successText: {
    color: '#10b981',
  },
  errorText: {
    color: '#ef4444',
  },
  infoText: {
    color: '#f59e0b',
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
});