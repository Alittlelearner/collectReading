// 跨平台存储引擎
// Web: localStorage, Native: AsyncStorage

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DB_KEY = 'bookmark-tracker-db-v1';

interface StorageData {
  bookmarks: Record<string, any>;
  tags: Record<string, any>;
  bookmarkTags: Record<string, any>;
  notes: Record<string, any>;
  dailyStats: Record<string, any>;
  achievements: Record<string, any>;
  userSettings: Record<string, any>;
}

let cachedData: StorageData | null = null;

async function loadData(): Promise<StorageData> {
  if (cachedData !== null) {
    return cachedData;
  }

  try {
    let stored: string | null = null;
    
    // Web 平台优先使用 localStorage
    if (Platform.OS === 'web') {
      try {
        stored = localStorage.getItem(DB_KEY);
        if (stored) {
          cachedData = JSON.parse(stored) as StorageData;
          return cachedData;
        }
      } catch (e) {
        console.error('[Storage] localStorage load error:', e);
      }
    }
    
    // 回退到 AsyncStorage
    try {
      stored = await AsyncStorage.getItem(DB_KEY);
      if (stored) {
        cachedData = JSON.parse(stored) as StorageData;
        return cachedData;
      }
    } catch (e) {
      console.error('[Storage] AsyncStorage load error:', e);
    }
  } catch (e) {
    console.error('[Storage] Load error:', e);
  }

  cachedData = {
    bookmarks: {},
    tags: {},
    bookmarkTags: {},
    notes: {},
    dailyStats: {},
    achievements: {},
    userSettings: {},
  } as StorageData;
  return cachedData;
}

async function saveData(data: StorageData): Promise<void> {
  cachedData = data;
  try {
    const serialized = JSON.stringify(data);
    
    // Web 平台同时保存到 localStorage 和 AsyncStorage
    if (Platform.OS === 'web') {
      try {
        localStorage.setItem(DB_KEY, serialized);
      } catch (e) {
        console.error('[Storage] localStorage save error:', e);
      }
    }
    
    // 总是保存到 AsyncStorage
    await AsyncStorage.setItem(DB_KEY, serialized);
  } catch (e) {
    console.error('[Storage] Save error:', e);
  }
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// SQL-like 接口
export class StorageDatabase {
  private data: StorageData;

  constructor() {
    this.data = {
      bookmarks: {},
      tags: {},
      bookmarkTags: {},
      notes: {},
      dailyStats: {},
      achievements: {},
      userSettings: {},
    };
  }

  async init(): Promise<void> {
    this.data = await loadData();
  }

  async runAsync(sql: string, ...params: any[]): Promise<{ changes: number; lastInsertRowId?: string }> {
    const [operation, rest] = sql.trim().split(/\s+/);
    const op = operation.toUpperCase();
    const args = params.length > 0 && Array.isArray(params[0]) ? params[0] : params;

    if (op === 'INSERT') {
      return this._handleInsert(sql, args);
    } else if (op === 'UPDATE') {
      return await this._handleUpdate(sql, args);
    } else if (op === 'DELETE') {
      return this._handleDelete(sql, args);
    }

    return { changes: 0 };
  }

  async getAllAsync(sql: string, ...params: any[]): Promise<any[]> {
    const tableName = this._extractTableName(sql);
    if (!tableName || !this.data[tableName as keyof StorageData]) {
      return [];
    }

    const collection = this.data[tableName as keyof StorageData] as Record<string, any>;
    let results = Object.values(collection);

    // 处理 WHERE 子句
    const whereMatch = sql.match(/WHERE\s+(.+)/i);
    if (whereMatch) {
      const whereClause = whereMatch[1].trim();
      const args = params.length > 0 && Array.isArray(params[0]) ? params[0] : params;
      results = this._applyWhere(results, whereClause, args);
    }

    // 处理 ORDER BY
    const orderMatch = sql.match(/ORDER\s+BY\s+(\w+)(\s+(ASC|DESC))?/i);
    if (orderMatch) {
      const field = orderMatch[1];
      const dir = orderMatch[3]?.toUpperCase() || 'ASC';
      results.sort((a, b) => {
        if (a[field] < b[field]) return dir === 'ASC' ? -1 : 1;
        if (a[field] > b[field]) return dir === 'ASC' ? 1 : -1;
        return 0;
      });
    }

    return results;
  }

  async getFirstAsync(sql: string, ...params: any[]): Promise<any> {
    const results = await this.getAllAsync(sql, ...params);
    return results[0] || null;
  }

  async execAsync(sql: string): Promise<void> {
    if (/CREATE TABLE/i.test(sql)) {
      const tableName = sql.match(/CREATE TABLE\s+(?:IF NOT EXISTS\s+)?(\w+)/i)?.[1];
      if (tableName && !(tableName in this.data)) {
        (this.data as any)[tableName] = {};
        await saveData(this.data);
      }
      return;
    }

    if (/DROP TABLE/i.test(sql)) {
      const tableName = sql.match(/DROP TABLE\s+(?:IF EXISTS\s+)?(\w+)/i)?.[1];
      if (tableName && this.data[tableName as keyof StorageData]) {
        (this.data as any)[tableName] = {};
        await saveData(this.data);
      }
      return;
    }

    if (/^DELETE\s+FROM\s+\w+\s*$/i.test(sql.trim())) {
      const tableName = sql.match(/DELETE FROM\s+(\w+)/i)?.[1];
      if (tableName && this.data[tableName as keyof StorageData]) {
        const collection = this.data[tableName as keyof StorageData] as Record<string, any>;
        const keys = Object.keys(collection);
        keys.forEach(key => delete collection[key]);
        await saveData(this.data);
      }
      return;
    }

    if (/DELETE FROM/i.test(sql)) {
      await this.runAsync(sql);
      return;
    }
  }

  // 私有方法
  private _extractTableName(sql: string): string | null {
    const match = sql.match(/FROM\s+(\w+)/i) || sql.match(/INTO\s+(\w+)/i) || sql.match(/UPDATE\s+(\w+)/i);
    return match ? match[1] : null;
  }

  private _handleInsert(sql: string, params?: any[]): { changes: number; lastInsertRowId?: string } {
    const tableName = this._extractTableName(sql);
    if (!tableName) return { changes: 0 };

    const collection = this.data[tableName as keyof StorageData] as Record<string, any>;

    const valuesMatch = sql.match(/VALUES\s*\(([^)]+)\)/i);
    if (!valuesMatch || !params) return { changes: 0 };

    const columns = sql.match(/\(([^)]+)\)\s*VALUES/i)?.[1].split(',').map(c => c.trim()) || [];

    const id = params[0] || generateId();
    const row: any = { id };

    columns.forEach((col, idx) => {
      if (idx > 0 && params[idx] !== undefined) {
        row[col] = params[idx];
      }
    });

    if (sql.includes('OR REPLACE') && collection[id]) {
      collection[id] = { ...collection[id], ...row };
    } else if (!collection[id]) {
      collection[id] = row;
    }

    saveData(this.data);
    return { changes: 1, lastInsertRowId: id };
  }

  private async _handleUpdate(sql: string, params?: any[]): Promise<{ changes: number }> {
    const tableName = this._extractTableName(sql);
    if (!tableName || !params) return { changes: 0 };

    const collection = this.data[tableName as keyof StorageData] as Record<string, any>;
    
    // 提取 SET 子句
    const setMatch = sql.match(/SET\s+(.+?)\s+WHERE/i);
    if (!setMatch) return { changes: 0 };

    const setClause = setMatch[1];
    
    // 提取 WHERE id
    const whereMatch = sql.match(/WHERE\s+(\w+)\s*=\s*\?/i);
    if (!whereMatch) return { changes: 0 };
    const id = params[params.length - 1];
    
    const existing = collection[id];
    if (!existing) return { changes: 0 };

    // 解析 SET 子句中的字段名 (例如：learning_status = ?, read_at = ?)
    const setFields: string[] = [];
    const fieldMatches = setClause.matchAll(/(\w+)\s*=\s*\?/g);
    for (const match of fieldMatches) {
      setFields.push(match[1]);
    }

    // 更新字段
    let changes = 0;
    setFields.forEach((field, idx) => {
      const value = params[idx];
      if (existing.hasOwnProperty(field)) {
        existing[field] = value;
        changes++;
      }
    });

    await saveData(this.data);
    return { changes };
  }

  private _handleDelete(sql: string, params?: any[]): { changes: number } {
    const tableName = this._extractTableName(sql);
    if (!tableName) return { changes: 0 };

    const collection = this.data[tableName as keyof StorageData] as Record<string, any>;

    const whereMatch = sql.match(/WHERE\s+(\w+)\s*=\s*\?/i);
    if (whereMatch && params?.[0]) {
      const fieldName = whereMatch[1];
      const value = params[0];

      let changes = 0;
      for (const [id, record] of Object.entries(collection)) {
        if (record[fieldName] === value) {
          delete collection[id];
          changes++;
        }
      }

      if (changes > 0) {
        saveData(this.data);
        return { changes };
      }

      return { changes: 0 };
    }

    return { changes: 0 };
  }

  private _applyWhere(rows: any[], whereClause: string, params?: any[]): any[] {
    // 简单的 WHERE 处理
    if ((whereClause.includes('=?') || whereClause.includes('= ?')) && params && params.length > 0) {
      const [field] = whereClause.split('=');
      const cleanField = field.trim();
      const value = params[0];

      console.log('[DB] Applying WHERE clause:', { cleanField, value, rowCount: rows.length });

      const filtered = rows.filter(row => {
        const rowValue = row[cleanField];
        const match = rowValue === value;
        if (rows.length <= 10) {
          console.log('[DB] Row comparison:', { rowValue, value, match });
        }
        return match;
      });

      console.log('[DB] Filtered rows:', { before: rows.length, after: filtered.length });
      return filtered;
    }
    return rows;
  }
}

// 单例
let dbInstance: StorageDatabase | null = null;

export async function getDatabase(): Promise<StorageDatabase> {
  if (!dbInstance) {
    dbInstance = new StorageDatabase();
    await dbInstance.init();
  }
  return dbInstance;
}

export async function closeDatabase(): Promise<void> {
  dbInstance = null;
  cachedData = null;
}
