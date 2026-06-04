# 技术方案总结

## 项目概述

这是一个 React Native (Expo) 开发的书签收藏应用，支持从多个平台（B站、知乎、微信公众号等）收藏链接，并提供标签管理、学习状态跟踪等功能。

## 技术架构

### 前端框架
- **React Native** + **Expo** (Web 平台)
- **Zustand** - 状态管理
- **React Navigation** - 路由导航

### 数据存储
- **AsyncStorage** + 自定义 SQL 解析器
- 不使用真实 SQLite，而是用 AsyncStorage 模拟数据库操作

### 核心模块

#### 1. 数据库层 (`src/db/database.ts`)
- 自定义 `StorageDatabase` 类，模拟 SQLite 操作
- 支持 `getAllAsync`, `getFirstAsync`, `runAsync`, `execAsync`
- 实现 WHERE 子句过滤、ORDER BY 排序

**关键实现**：
```typescript
// WHERE 子句处理
private _applyWhere(rows: any[], whereClause: string, params?: any[]): any[]

// DELETE 操作支持任意字段
private _handleDelete(sql: string, params?: any[]): { changes: number }
```

#### 2. 书签服务 (`src/services/bookmarkService.ts`)
- `create()` - 创建书签
- `getAll()` - 获取书签列表
- `getById()` - 获取单个书签
- `update()` - 更新书签
- `delete()` - 删除书签
- `exists()` - 检查 URL 是否已存在

#### 3. URL 解析服务 (`src/services/urlParserService.ts`)
- 使用 CORS 代理解决跨域问题
- 当前使用 **Jina AI** (`https://r.jina.ai/http://`) 作为抓取服务

#### 4. 平台提取器 (`src/services/extractors/`)
- `BilibiliExtractor` - B站视频
- `ZhihuExtractor` - 知乎
- `WechatExtractor` - 微信公众号
- `JuejinExtractor` - 掘金
- `DoubanExtractor` - 豆瓣
- `SspaiExtractor` - 少数派
- `MediumExtractor` - Medium
- `GitHubExtractor` - GitHub
- `XiaohongshuExtractor` - 小红书
- `GenericExtractor` - 通用网站

### 状态管理 (`src/store/bookmarkStore.ts`)
- 使用 Zustand 管理全局状态
- 包含书签列表、筛选条件、视图模式等

## 已修复的问题

### 1. 数据库 WHERE 子句过滤
**问题**：`WHERE url = ?` 查询时参数没有正确传递，导致返回所有记录
**修复**：在 `_applyWhere` 中正确解析和传递参数

### 2. getFirstAsync 参数传递
**问题**：`getFirstAsync` 没有将参数传递给 `getAllAsync`
**修复**：
```typescript
async getFirstAsync(sql: string, ...params: any[]): Promise<any> {
  const results = await this.getAllAsync(sql, ...params);
  return results[0] || null;
}
```

### 3. DELETE 操作字段支持
**问题**：只能删除 `WHERE id = ?`，无法处理 `WHERE bookmark_id = ?`
**修复**：动态提取 WHERE 子句中的字段名，支持任意字段

### 4. Alert 弹窗在 Web 端不显示
**问题**：React Native Alert 在 Web 端可能有兼容性问题
**修复**：Web 端使用原生 `window.confirm()`

### 5. B站 URL 解析 CORS 问题
**问题**：浏览器直接请求 B站 API 被 CORS 阻止
**解决方案**：使用 Jina AI 抓取服务作为代理

## 关键代码片段

### Jina AI 抓取
```typescript
private async fetchHTML(url: string): Promise<string> {
  const jinaUrl = `https://r.jina.ai/http://${url.replace(/^https?:\/\//, '')}`;
  const response = await fetch(jinaUrl, {
    signal: AbortSignal.timeout(15000),
  });
  return await response.text();
}
```

### Web 端删除确认
```typescript
const handleDelete = () => {
  if (Platform.OS === 'web') {
    const confirmed = window.confirm('确定要删除这条收藏吗？');
    if (confirmed) executeDelete();
  } else {
    Alert.alert('删除收藏', '确定要删除这条收藏吗？', [...]);
  }
};
```

## 待优化项

1. **Jina AI 服务限制** - 免费服务可能有 QPS 限制，考虑自建后端
2. **错误处理** - 添加更友好的错误提示
3. **离线支持** - Service Worker 缓存
4. **性能优化** - 大数据量分页加载
