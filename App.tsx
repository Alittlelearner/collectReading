import 'react-native-gesture-handler';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import RootNavigator from './src/navigation/RootNavigator';
import { runMigrations } from './src/db/migrations';
import { seedData } from './src/db/seed';
import { syncAchievements } from './src/services/achievementSyncService';
import { colors } from './src/theme/colors';

export default function App() {
  const [ready, setReady] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;

    async function initialize() {
      try {
        await runMigrations();
        await seedData();
        await syncAchievements();

        if (mounted) {
          setReady(true);
        }
      } catch (err) {
        console.error('[App] Failed to initialize', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : '应用初始化失败');
        }
      }
    }

    initialize();

    return () => {
      mounted = false;
    };
  }, []);

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>启动失败</Text>
        <Text style={styles.info}>{error}</Text>
      </View>
    );
  }

  if (!ready) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.info}>正在整理你的阅读馆藏...</Text>
      </View>
    );
  }

  return (
    <>
      <RootNavigator />
      <StatusBar style="dark" />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 40,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 15,
    textAlign: 'center',
  },
  info: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 24,
    textAlign: 'center',
    marginTop: 16,
  },
});
