# 项目骨架

## 项目概览

- 项目名：`unified-bookmark-tracker`
- 形态：`Expo + React Native + TypeScript`
- 运行目标：`iOS / Android / Web`
- 当前定位：统一收藏、阅读管理、元数据解析、擦亮复习、统计与成就

## 顶层结构

```text
collectReading/
├── App.tsx
├── app.json
├── babel.config.js
├── metro.config.js
├── package.json
├── package-lock.json
├── tsconfig.json
├── PROJECT_SKELETON.md
└── src/
    ├── assets/
    ├── components/
    ├── db/
    ├── hooks/
    ├── navigation/
    ├── screens/
    ├── services/
    ├── store/
    ├── theme/
    ├── types/
    └── utils/
```

## 启动流程

`App.tsx` 当前已经接入完整启动链路：

1. 执行数据库迁移 `runMigrations()`
2. 写入种子数据 `seedData()`
3. 同步成就状态 `syncAchievements()`
4. 挂载 `RootNavigator`

## 业务分层

```text
Screens
  -> Hooks
  -> Zustand Stores
  -> Services
  -> Database
```

- `screens/`：页面与交互入口
- `components/`：可复用 UI 组件
- `hooks/`：面向页面的轻量封装
- `store/`：Zustand 状态管理
- `services/`：业务逻辑、解析逻辑、数据库访问
- `db/`：SQLite 与 Web 本地数据库适配
- `types/`：业务类型定义

## 目录细分

### `src/assets`

```text
assets/
└── icon.png
```

### `src/components`

```text
components/
├── AddFAB/           # 新增收藏浮动按钮
├── BookmarkCard/     # 收藏卡片
├── EmptyState/       # 空状态
├── NotesList/        # 笔记列表
├── ResurfaceCard/    # 擦亮卡片
├── SourceGrid/       # 来源分组视图
├── StatusToggle/     # 已读/未读切换
├── TagCloud/         # 标签视图
├── URLInput/         # URL 输入与解析入口
└── ViewTabBar/       # 时间线/来源/标签视图切换
```

### `src/db`

```text
db/
├── database.ts       # 数据库入口，native 用 SQLite，web 用 localStorage 适配
├── migrations.ts     # 建表与补字段迁移
├── seed.ts           # 成就与默认设置种子数据
└── webDatabase.ts    # Web 端数据库模拟实现
```

当前表结构包含：

- `bookmarks`
- `tags`
- `bookmark_tags`
- `notes`
- `daily_stats`
- `achievements`
- `user_settings`

`bookmarks` 目前已包含这些关键字段：

- 基础信息：`url`、`title`、`description`
- 来源信息：`source_type`、`source_domain`
- 元数据：`image_url`、`author`、`original_tags`、`published_at`
- 阅读状态：`learning_status`、`read_at`、`read_count`
- 擦亮信息：`last_resurfaced_at`、`resurface_count`

### `src/hooks`

```text
hooks/
├── useAchievements.ts
├── useBookmarks.ts
├── useNotes.ts
├── useReminder.ts
├── useResurface.ts
├── useStats.ts
└── useTags.ts
```

### `src/navigation`

```text
navigation/
├── RootNavigator.tsx
└── types.ts
```

当前导航结构：

```text
RootNavigator
├── HomeTab
│   ├── HomeMain
│   ├── BookmarkDetail
│   ├── AddBookmark
│   ├── TagManage
│   ├── SourceGroup
│   └── StatsDashboard
└── ProfileTab
    ├── ProfileMain
    ├── Settings
    └── Achievements
```

### `src/screens`

```text
screens/
├── AchievementsScreen.tsx
├── AddBookmarkScreen.tsx
├── BookmarkDetailScreen.tsx
├── HomeScreen.tsx
├── ProfileScreen.tsx
├── SettingsScreen.tsx
├── SourceGroupScreen.tsx
├── StatsDashboardScreen.tsx
└── TagManageScreen.tsx
```

页面职责简述：

- `HomeScreen`：收藏列表、搜索、视图切换、擦亮卡片
- `AddBookmarkScreen`：新增收藏、选择标签、填写备注
- `BookmarkDetailScreen`：详情、元数据、笔记、完成阅读、阅读次数与擦亮次数
- `StatsDashboardScreen`：统计看板
- `ProfileScreen`：个人页、统计摘要、成就入口
- `SettingsScreen`：提醒、数据导入导出、擦亮配置
- `AchievementsScreen`：成就展示
- `TagManageScreen`：标签维护
- `SourceGroupScreen`：来源分组展示

### `src/services`

```text
services/
├── achievementService.ts
├── achievementSyncService.ts
├── bookmarkService.ts
├── noteService.ts
├── reminderService.ts
├── resurfaceConfigService.ts
├── resurfacePolicy.ts
├── resurfaceService.ts
├── settingsService.ts
├── statsService.ts
├── tagService.ts
├── urlParserService.ts
└── extractors/
    ├── bilibiliExtractor.ts
    ├── doubanExtractor.ts
    ├── genericExtractor.ts
    ├── githubExtractor.ts
    ├── juejinExtractor.ts
    ├── mediumExtractor.ts
    ├── registry.ts
    ├── sspaiExtractor.ts
    ├── types.ts
    ├── wechatExtractor.ts
    ├── xiaohongshuExtractor.ts
    └── zhihuExtractor.ts
```

核心服务职责：

- `bookmarkService.ts`：收藏 CRUD、搜索、已读切换、阅读次数更新
- `urlParserService.ts`：解析入口，路由到不同站点解析器
- `achievementService.ts`：成就规则与上下文计算
- `achievementSyncService.ts`：统一成就同步入口
- `resurfaceService.ts`：擦亮候选、跳过、完成
- `resurfaceConfigService.ts`：读取擦亮配置
- `resurfacePolicy.ts`：擦亮筛选与排序规则
- `statsService.ts`：统计与连续阅读天数
- `settingsService.ts`：读取与保存用户设置
- `noteService.ts` / `tagService.ts`：笔记与标签管理

## 解析器架构

当前解析器已经抽象成“统一接口 + 多实现 + 注册表路由”：

```text
URLParserService
  -> ExtractorRegistry
      -> BilibiliExtractor
      -> JuejinExtractor
      -> ZhihuExtractor
      -> WechatExtractor
      -> DoubanExtractor
      -> SspaiExtractor
      -> MediumExtractor
      -> GitHubExtractor
      -> XiaohongshuExtractor
      -> GenericExtractor
```

统一输出字段：

- `title`
- `description`
- `imageUrl`
- `author`
- `sourceType`
- `sourceDomain`
- `originalTags`
- `publishedAt`

当前可明确列为公开接口优先的站点：

- `Bilibili`
- `Juejin`
- `GitHub`

其余站点目前仍走各自实现或通用兜底逻辑。

## 状态管理

```text
store/
├── achievementStore.ts
├── bookmarkStore.ts
├── resurfaceStore.ts
├── statsStore.ts
└── tagStore.ts
```

当前状态联动重点：

- 收藏新增后刷新收藏列表与统计
- 标记已读后刷新收藏列表、统计、成就
- 擦亮完成后刷新收藏列表、统计、候选卡片、成就
- 新建标签和新建笔记后刷新成就

## 当前已落地能力

- 收藏新增、删除、搜索
- 标签创建与管理
- 笔记新增、编辑、删除
- 已读/未读切换
- 收藏详情页元数据显示
- 单条收藏阅读次数统计
- 擦亮候选、擦亮跳过、擦亮完成
- 擦亮配置可通过设置页调整
- 统计看板
- 成就系统
- Web 端本地存储适配
- 多站点 URL 元数据解析

## 当前检查状态

最近一次确认结果：

- `npm run ts:check` 通过
- `npx expo-doctor` 通过

## 备注

- 代码中仍有一部分中文文案存在编码异常，尤其是旧页面与配置文案
- 文档以当前仓库真实结构为准，不再保留历史未接入状态描述
