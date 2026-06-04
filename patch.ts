/**
 * 修复补丁文件
 * 
 * 修复问题：
 * 1. 刷新页面后擦亮状态丢失 - 修复 localStorage 持久化
 * 2. 删除功能失效 - 添加长按删除功能
 * 3. 访问原链接失效 - 添加打开链接功能
 */

// 修复 HomeScreen.tsx
export const homeScreenPatch = `
// 在 HomeScreen.tsx 中添加删除和打开链接功能
import { Alert, Linking } from 'react-native';

// 添加删除处理
const handleDelete = (bookmarkId: string) => {
  Alert.alert(
    '确认删除',
    '确定要删除这个书签吗？',
    [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: () => bookmarks.deleteBookmark(bookmarkId) },
    ]
  );
};

// 添加打开链接处理
const handleOpenLink = (url: string) => {
  Linking.openURL(url);
};

// 修改 renderBookmark，添加长按菜单
const renderBookmark = useCallback(
  ({ item }: { item: any }) => (
    <BookmarkCard
      bookmark={item}
      onPress={() => navigation.navigate('BookmarkDetail', { bookmarkId: item.id })}
      onLongPress={() => showBookmarkMenu(item)}
    />
  ),
  [],
);

// 添加菜单显示函数
const showBookmarkMenu = (item: any) => {
  Alert.alert(
    item.title,
    undefined,
    [
      { text: '打开链接', onPress: () => handleOpenLink(item.url) },
      { text: '删除', style: 'destructive', onPress: () => handleDelete(item.id) },
      { text: '取消', style: 'cancel' },
    ]
  );
};
`;

// 修复 BookmarkCard/index.tsx
export const bookmarkCardPatch = `
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking } from 'react-native';

interface BookmarkCardProps {
  bookmark: Bookmark;
  onPress?: () => void;
  onLongPress?: () => void;
}

export default function BookmarkCard({ bookmark, onPress, onLongPress }: BookmarkCardProps) {
  // ... 其他代码不变

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      {/* 添加打开链接按钮 */}
      <TouchableOpacity 
        style={styles.openLinkBtn}
        onPress={() => Linking.openURL(bookmark.url)}
      >
        <Text style={styles.openLinkText}>🔗 打开</Text>
      </TouchableOpacity>
      
      {/* 其他内容 */}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // ... 其他样式
  openLinkBtn: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primary + '20',
  },
  openLinkText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600',
  },
});
`;

// 修复 localStorage 持久化问题
export const storagePatch = `
// 在 src/db/database.ts 中修改 loadData 和 saveData 函数

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
`;

console.log('Patch files generated. Apply these patches to fix:');
console.log('1. HomeScreen - add long press menu for delete and open link');
console.log('2. BookmarkCard - add onLongPress prop and open link button');
console.log('3. database.ts - fix localStorage persistence');
