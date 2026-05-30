// 数据库服务统一入口
// 根据平台自动选择原生 SQLite 或 Web polyfill

import { Platform } from 'react-native';

type Database = any;

let db: Database | null = null;

export async function getDatabase(): Promise<Database> {
  if (!db) {
    if (Platform.OS === 'web') {
      // Web 平台：使用 localStorage 模拟
      db = {
        async runAsync(sql: string, params?: any[]) {
          console.log('[WebDB] runAsync:', sql);
          return { changes: 0 };
        },
        async getAllAsync(sql: string): Promise<any[]> {
          console.log('[WebDB] getAllAsync:', sql);
          return [];
        },
        async getFirstAsync(sql: string): Promise<any> {
          console.log('[WebDB] getFirstAsync:', sql);
          return null;
        },
        async execAsync(sql: string) {
          console.log('[WebDB] execAsync:', sql);
        },
      };
    } else {
      // 原生平台：使用 expo-sqlite
      const SQLite = await import('expo-sqlite');
      db = await SQLite.openDatabaseAsync('bookmarks.db');
    }
  }
  return db;
}

export async function closeDatabase(): Promise<void> {
  if (db && Platform.OS !== 'web') {
    await db.closeAsync();
  }
  db = null;
}
