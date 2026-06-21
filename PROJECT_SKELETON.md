# 项目骨架

## 项目概览

- 项目名：`unified-bookmark-tracker`
- 产品名：学习收藏夹
- 形态：`Expo + React Native + TypeScript`
- 运行目标：`Web / iOS / Android`
- 当前定位：统一收藏、阅读管理、元数据解析、标签与收藏夹整理、擦亮复习、统计成就、Wiki 导出、本地数据备份

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
├── README.md
├── PROJECT_SKELETON.md
├── PROJECT_TODO.md
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

`App.tsx` 负责应用启动初始化：

1. 执行数据库迁移 `runMigrations()`
2. 从 Web 本地备份尝试自动恢复空库数据
3. 写入成就与默认设置种子数据 `seedData()`
4. 同步成就状态 `syncAchievements()`
5. 挂载 `RootNavigator`

## 业务分层

```text
Screens
  -> Hooks
  -> Zustand Stores
  -> Services
  -> Database / Native APIs / Web APIs
```

- `screens/`：页面、布局、用户交互
- `components/`：可复用 UI 组件
- `hooks/`：面向页面的业务 Hook
- `store/`：Zustand 状态管理
- `services/`：收藏、标签、收藏夹、笔记、解析、统计、提醒、Wiki 等业务逻辑
- `db/`：SQLite 入口、迁移、备份导入导出、Web 防丢恢复
- `types/`：业务类型定义
- `utils/`：通用工具函数

## 目录细分

### `src/components`

```text
components/
├── AddFAB/           # 移动端新增收藏浮动按钮
├── BookmarkCard/     # 收藏卡片
├── EmptyState/       # 空状态
├── NotesList/        # 笔记列表
├── ResurfaceCard/    # 擦亮候选卡片
├── SourceGrid/       # 来源分组
├── StatusToggle/     # 已读/未读切换
├── TagCloud/         # 标签云
├── URLInput/         # URL 输入框
└── ViewTabBar/       # 视图切换组件
```

### `src/db`

```text
db/
├── backupPayload.ts  # 全量备份格式、导出收集、导入恢复、导入汇总
├── database.ts       # SQLite 数据库入口与 Web 写入备份调度
├── migrations.ts     # 建表、补字段、Web 空库恢复
├── seed.ts           # 成就与默认设置种子数据
└── webPersistence.ts # Web localStorage 防丢备份与自动恢复
```

当前核心表：

- `bookmarks`
- `tags`
- `bookmark_tags`
- `folders`
- `bookmark_folders`
- `wiki_spaces`
- `notes`
- `daily_stats`
- `achievements`
- `user_settings`

`bookmarks` 关键字段：

- 基础：`id`、`url`、`title`、`notes`
- 来源：`source_type`、`source_domain`
- 元数据：`description`、`image_url`、`author`、`original_tags`、`published_at`
- 状态：`learning_status`、`is_starred`、`is_archived`、`deleted_at`
- 阅读：`read_at`、`read_count`
- 擦亮：`last_resurfaced_at`、`resurface_count`
- 时间：`created_at`、`updated_at`

### `src/hooks`

```text
hooks/
├── useAchievements.ts
├── useBookmarks.ts
├── useFolders.ts
├── useNotes.ts
├── useReminder.ts
├── useResurface.ts
├── useStats.ts
├── useTags.ts
└── useWiki.ts
```

### `src/navigation`

```text
navigation/
├── RootNavigator.tsx
└── types.ts
```

当前导航结构为单栈导航，默认首页是收藏主页：

```text
HomeStack
├── HomeMain
├── BookmarkDetail
├── AddBookmark
├── TagManage
├── FolderManage
├── SourceGroup
├── StatsDashboard
├── WikiHub
├── WikiDetail
├── ProfileMain
├── Settings
└── Achievements
```

Web 端首页左侧为图标栏 + 可折叠侧边栏。折叠后只保留图标入口，不完全隐藏侧栏能力。

### `src/screens`

```text
screens/
├── AchievementsScreen.tsx
├── AddBookmarkScreen.tsx
├── BookmarkDetailScreen.tsx
├── FolderManageScreen.tsx
├── HomeScreen.tsx
├── ProfileScreen.tsx
├── SettingsScreen.tsx
├── SourceGroupScreen.tsx
├── StatsDashboardScreen.tsx
├── TagManageScreen.tsx
├── WikiDetailScreen.tsx
└── WikiHubScreen.tsx
```

页面职责：

- `HomeScreen`：收藏主页、搜索、筛选、Web 侧边栏、擦亮候选、来源/标签视图
- `AddBookmarkScreen`：单条添加、批量添加、标签/收藏夹选择、备注、解析预览、清空表单
- `BookmarkDetailScreen`：详情、打开原链接、阅读状态、星标、归档、删除、标签编辑、收藏夹移动/复制、笔记
- `FolderManageScreen`：收藏夹创建、重命名、删除
- `TagManageScreen`：标签创建、重命名、删除
- `SourceGroupScreen`：按来源查看收藏
- `StatsDashboardScreen`：阅读统计看板
- `WikiHubScreen`：Wiki 空间列表、创建和管理
- `WikiDetailScreen`：Wiki 章节展示和 Markdown 导出
- `ProfileScreen`：我的书房、阅读画像、成就入口、设置入口
- `SettingsScreen`：提醒、擦亮配置、导入导出、重置数据
- `AchievementsScreen`：成就展示

### `src/services`

```text
services/
├── achievementService.ts
├── achievementSyncService.ts
├── bookmarkService.ts
├── folderService.ts
├── network.ts
├── noteService.ts
├── reminderService.ts
├── resurfaceConfigService.ts
├── resurfacePolicy.ts
├── resurfaceService.ts
├── settingsService.ts
├── statsService.ts
├── tagService.ts
├── urlParserService.ts
├── wikiService.ts
└── extractors/
```

核心服务职责：

- `bookmarkService.ts`：收藏 CRUD、筛选、搜索、软删除、恢复、归档、星标、阅读状态、批量占位创建、后台元数据补全
- `tagService.ts`：标签 CRUD、收藏标签关系维护
- `folderService.ts`：收藏夹 CRUD、收藏夹关系维护
- `noteService.ts`：笔记 CRUD
- `urlParserService.ts`：解析入口，调用站点解析器和通用兜底
- `resurfaceService.ts`：擦亮候选、跳过、完成、计数
- `resurfacePolicy.ts`：擦亮筛选排序策略
- `statsService.ts`：统计汇总、日统计、连续阅读天数
- `achievementService.ts`：成就规则和解锁逻辑
- `reminderService.ts`：通知权限和提醒调度
- `settingsService.ts`：用户设置读写
- `wikiService.ts`：Wiki 空间、分组、章节构建、Markdown 导出
- `network.ts`：带超时的请求工具

### `src/services/extractors`

解析器采用“统一接口 + 注册表 + 站点实现 + 通用兜底”结构：

```text
extractors/
├── articleMetadata.ts
├── bilibiliExtractor.ts
├── blogExtractor.ts
├── cnblogsExtractor.ts
├── csdnExtractor.ts
├── doubanExtractor.ts
├── genericExtractor.ts
├── githubExtractor.ts
├── huxiuExtractor.ts
├── infoqExtractor.ts
├── jianshuExtractor.ts
├── jikeExtractor.ts
├── juejinExtractor.ts
├── kr36Extractor.ts
├── mediumExtractor.ts
├── registry.ts
├── segmentFaultExtractor.ts
├── sspaiExtractor.ts
├── telegramExtractor.ts
├── twitterExtractor.ts
├── types.ts
├── wechatExtractor.ts
├── woshipmExtractor.ts
├── xiaohongshuExtractor.ts
├── xueqiuExtractor.ts
├── youtubeExtractor.ts
└── zhihuExtractor.ts
```

统一输出：

- `title`
- `description`
- `imageUrl`
- `author`
- `sourceType`
- `sourceDomain`
- `originalTags`
- `publishedAt`

### `src/store`

```text
store/
├── achievementStore.ts
├── bookmarkStore.ts
├── folderStore.ts
├── resurfaceStore.ts
├── statsStore.ts
├── tagStore.ts
└── wikiStore.ts
```

状态联动重点：

- 新增收藏后刷新收藏列表、侧边栏统计、统计看板、标签和收藏夹计数
- 编辑收藏标签/收藏夹后刷新详情和侧边栏计数
- 标记已读后刷新统计和成就
- 写笔记后刷新成就
- 擦亮完成后刷新候选、统计、成就
- Wiki 空间变更后刷新 Wiki 列表

## 已落地能力清单

- 单条收藏添加
- 批量收藏添加
- 后台排队补全元数据
- 收藏搜索和多维筛选
- 收藏详情编辑标签
- 收藏详情移动/复制到收藏夹
- 标签管理
- 收藏夹管理
- 笔记管理
- 星标、归档、最近删除、恢复
- 阅读状态切换
- 阅读统计
- 成就系统
- 阅读提醒
- 擦亮复习
- Wiki 空间和 Markdown 导出
- 完整 JSON 导入导出
- Web SQLite localStorage 防丢备份
- Web 左侧图标栏和可折叠侧边栏

## 当前检查状态

最近一次确认：

```bash
npm run ts:check
```

通过。
