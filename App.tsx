import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Platform, View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import RootNavigator from './src/navigation/RootNavigator';
import { runMigrations } from './src/db/migrations';
import { seedData } from './src/db/seed';
import { colors } from './src/theme/colors';
import { spacing } from './src/theme/spacing';

export default function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        console.log('[App] Starting migrations...');
        await runMigrations();
        console.log('[App] Migrations complete');
        await seedData();
        console.log('[App] Seed data complete');
        setReady(true);
      } catch (e: any) {
        console.error('[App] Init error:', e);
        setError(e.message || '初始化失败');
      }
    }
    init();
  }, []);

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorIcon}>❌</Text>
        <Text style={styles.errorText}>初始化失败</Text>
        <Text style={styles.errorDetail}>{error}</Text>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingIcon}>📚</Text>
        <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: spacing.lg }} />
        <Text style={styles.loadingText}>正在准备学习空间...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <RootNavigator />
      <StatusBar style="light" />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.xxxl,
  },
  loadingIcon: { fontSize: 48 },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 15,
    marginTop: spacing.md,
  },
  errorIcon: { fontSize: 48 },
  errorText: {
    color: colors.error,
    fontSize: 18,
    fontWeight: '600',
    marginTop: spacing.lg,
  },
  errorDetail: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: spacing.xs,
  },
});
