/**
 * 快速修复补丁
 * 修复问题：
 * 1. 刷新页面后状态丢失
 * 2. 删除功能
 * 3. 访问原链接
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const DB_KEY = 'bookmark-tracker-db-v1';

// 1. 修复 localStorage 持久化
export async function loadFromStorage(): Promise<any> {
  try {
    // 优先尝试从 localStorage 读取
    const stored = localStorage.getItem(DB_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('[Storage] Load error:', e);
  }
  
  // 回退到 AsyncStorage
  try {
    const stored = await AsyncStorage.getItem(DB_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('[Storage] AsyncStorage load error:', e);
  }
  
  return null;
}

export async function saveToStorage(data: any): Promise<void> {
  try {
    // 同时保存到 localStorage 和 AsyncStorage
    const serialized = JSON.stringify(data);
    localStorage.setItem(DB_KEY, serialized);
    await AsyncStorage.setItem(DB_KEY, serialized);
  } catch (e) {
    console.error('[Storage] Save error:', e);
  }
}

// 2. 打开原链接
export function openOriginalLink(url: string): void {
  if (typeof window !== 'undefined' && window.open) {
    window.open(url, '_blank', 'noopener,noreferrer');
  } else {
    console.warn('Cannot open link:', url);
  }
}

// 3. 验证删除操作
export function verifyDeletion(bookmarkId: string, data: any): boolean {
  if (!data || !data.bookmarks) return false;
  return data.bookmarks.hasOwnProperty(bookmarkId);
}
