import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DB_KEY = 'bookmark-tracker-db-v1';

export default function SimpleTestScreen() {
  const [testData, setTestData] = useState('');
  const [result, setResult] = useState<any>(null);
  const [storageData, setStorageData] = useState<any>(null);

  console.log('[SimpleTest] 组件已渲染');
  console.log('[SimpleTest] 当前平台:', Platform.OS);

  const handleTestWrite = async () => {
    console.log('[SimpleTest] 开始测试写入...');
    console.log('[SimpleTest] 测试数据:', testData);

    if (!testData.trim()) {
      Alert.alert('错误', '请输入测试数据');
      return;
    }

    try {
      console.log('[SimpleTest] 步骤1：读取当前数据...');
      const existingData = await AsyncStorage.getItem(DB_KEY);
      console.log('[SimpleTest] 当前数据:', existingData);

      const parsedData = existingData ? JSON.parse(existingData) : {};
      console.log('[SimpleTest] 解析后的数据:', parsedData);

      console.log('[SimpleTest] 步骤2：添加新数据...');
      // 确保 test 数组存在
      if (!parsedData.test || !Array.isArray(parsedData.test)) {
        parsedData.test = [];
      }

      // 添加新的测试条目
      parsedData.test.push({
        id: Date.now().toString(),
        content: testData,
        timestamp: new Date().toISOString()
      });

      console.log('[SimpleTest] 准备写入的数据:', parsedData);
      const serialized = JSON.stringify(parsedData);
      console.log('[SimpleTest] 序列化后的数据长度:', serialized.length);

      console.log('[SimpleTest] 步骤3：写入 AsyncStorage...');
      await AsyncStorage.setItem(DB_KEY, serialized);
      console.log('[SimpleTest] ✅ AsyncStorage 写入成功');

      console.log('[SimpleTest] 步骤4：验证写入...');
      const verified = await AsyncStorage.getItem(DB_KEY);
      console.log('[SimpleTest] 验证数据:', verified);

      if (Platform.OS === 'web') {
        console.log('[SimpleTest] 步骤5：尝试写入 localStorage...');
        try {
          localStorage.setItem(DB_KEY, serialized);
          console.log('[SimpleTest] ✅ localStorage 写入成功');
        } catch (e) {
          console.error('[SimpleTest] localStorage 写入失败:', e);
        }
      }

      setResult({
        type: 'write_success',
        message: '写入成功',
        data: parsedData,
        original: existingData,
        newItem: {
          id: Date.now().toString(),
          content: testData,
          timestamp: new Date().toISOString()
        }
      });
      Alert.alert('成功', '数据已成功写入存储！');
      setTestData('');
    } catch (err: any) {
      console.error('[SimpleTest] 写入失败:', err);
      setResult({
        type: 'write_error',
        error: err.message,
        stack: err.stack
      });
      Alert.alert('错误', err.message);
    }
  };

  const handleTestRead = async () => {
    console.log('[SimpleTest] 开始测试读取...');
    try {
      console.log('[SimpleTest] 从 AsyncStorage 读取...');
      const asyncData = await AsyncStorage.getItem(DB_KEY);
      console.log('[SimpleTest] AsyncStorage 数据:', asyncData);

      let localData = null;
      if (Platform.OS === 'web') {
        console.log('[SimpleTest] 从 localStorage 读取...');
        try {
          localData = localStorage.getItem(DB_KEY);
          console.log('[SimpleTest] localStorage 数据:', localData);
        } catch (e) {
          console.error('[SimpleTest] localStorage 读取失败:', e);
        }
      }

      setResult({
        type: 'read_result',
        asyncData: asyncData ? JSON.parse(asyncData) : null,
        localData: localData ? JSON.parse(localData) : null,
        match: asyncData === localData
      });
    } catch (err: any) {
      console.error('[SimpleTest] 读取失败:', err);
      setResult({
        type: 'read_error',
        error: err.message
      });
    }
  };

  const handleClearStorage = async () => {
    console.log('[SimpleTest] 清空存储...');
    try {
      await AsyncStorage.removeItem(DB_KEY);
      console.log('[SimpleTest] ✅ AsyncStorage 已清空');

      if (Platform.OS === 'web') {
        try {
          localStorage.removeItem(DB_KEY);
          console.log('[SimpleTest] ✅ localStorage 已清空');
        } catch (e) {
          console.error('[SimpleTest] localStorage 清空失败:', e);
        }
      }

      setResult({
        type: 'clear_success',
        message: '存储已清空'
      });
      Alert.alert('成功', '存储已清空');
    } catch (err: any) {
      console.error('[SimpleTest] 清空失败:', err);
      setResult({
        type: 'clear_error',
        error: err.message
      });
      Alert.alert('错误', err.message);
    }
  };

  const handleCheckQuota = async () => {
    console.log('[SimpleTest] 检查存储配额...');
    try {
      if (Platform.OS === 'web' && 'storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        console.log('[SimpleTest] 存储配额:', estimate);

        setResult({
          type: 'quota_info',
          usage: estimate.usage,
          quota: estimate.quota,
          percentage: ((estimate.usage / estimate.quota) * 100).toFixed(2)
        });
      } else {
        setResult({
          type: 'quota_info',
          message: '当前平台不支持存储配额检查'
        });
      }
    } catch (err: any) {
      console.error('[SimpleTest] 配额检查失败:', err);
      setResult({
        type: 'quota_error',
        error: err.message
      });
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🔧 简单存储测试</Text>
        <Text style={styles.subtitle}>直接测试 AsyncStorage 和 localStorage</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>写入测试</Text>

        <Text style={styles.label}>测试数据</Text>
        <TextInput
          style={styles.input}
          placeholder="输入测试数据..."
          placeholderTextColor="#888"
          value={testData}
          onChangeText={setTestData}
        />

        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleTestWrite}
        >
          <Text style={styles.buttonText}>💾 写入存储</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>读取测试</Text>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleTestRead}
        >
          <Text style={styles.buttonText}>📖 读取存储</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>管理操作</Text>

        <TouchableOpacity
          style={[styles.button, styles.clearButton]}
          onPress={handleClearStorage}
        >
          <Text style={styles.buttonText}>🗑️ 清空存储</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.infoButton]}
          onPress={handleCheckQuota}
        >
          <Text style={styles.buttonText}>📊 检查存储配额</Text>
        </TouchableOpacity>
      </View>

      {result && (
        <View style={styles.resultBox}>
          <Text style={styles.resultTitle}>📋 结果</Text>
          <Text style={styles.resultText}>
            {JSON.stringify(result, null, 2)}
          </Text>
        </View>
      )}

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>💡 使用说明</Text>
        <Text style={styles.infoText}>
          1. 输入测试数据并点击"写入存储"{'\n'}
          2. 查看浏览器控制台（F12）获取详细日志{'\n'}
          3. 点击"读取存储"验证数据是否正确保存{'\n'}
          4. 点击"检查存储配额"查看存储使用情况{'\n'}
          5. 如果有问题，点击"清空存储"重置
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
  label: {
    fontSize: 14,
    color: '#cbd5e1',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#1e293b',
    color: '#fff',
    fontSize: 16,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
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
  clearButton: {
    backgroundColor: '#dc2626',
    borderColor: '#dc2626',
  },
  infoButton: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultBox: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#93c5fd',
    marginBottom: 8,
  },
  resultText: {
    fontSize: 12,
    color: '#cbd5e1',
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
});