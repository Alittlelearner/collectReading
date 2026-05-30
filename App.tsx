import React from 'react';
import { Platform, View, Text, StyleSheet } from 'react-native';

export default function App() {
  if (Platform.OS === 'web') {
    return (
      <View style={styles.container}>
        <Text style={styles.icon}>🚧</Text>
        <Text style={styles.title}>Web 版本尚未支持</Text>
        <Text style={styles.info}>本应用使用 SQLite 数据库，目前仅支持 iOS 和 Android 平台</Text>
        <Text style={styles.subinfo}>请在手机上使用 Expo Go 打开</Text>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 40,
  },
  icon: { fontSize: 64, marginBottom: 20 },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 15,
    textAlign: 'center',
  },
  info: {
    color: '#94a3b8',
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 10,
  },
  subinfo: {
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center',
  },
});
