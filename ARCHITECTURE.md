# 架构文档

本文档说明 `collectReading` 的代码结构、核心模块边界、启动流程、数据流和扩展方式。项目是一个基于 Expo / React Native 的个人收藏阅读与知识管理应用，覆盖收藏夹、标签、文件夹、统计、提醒、知识库、资料库、Markdown 笔记和成就等模块。

## 1. 项目概览

`collectReading` 面向移动端与 Web 端，核心目标是把来自网页、文章、视频、社交平台、文档和本地笔记的内容统一收集、整理、检索和复习。

主要能力：

- 收藏条目的新增、编辑、详情查看、归档和状态管理。
- 标签、文件夹、来源分组等组织方式。
- 阅读统计、复习提醒、 resurfacing 策略和成就系统。
- Wiki、资料库、Markdown 笔记等知识管理功能。
- URL 元数据解析，支持多个平台的链接识别和详情提取。
- Native 与 Web 双端运行，Web 端可接入远程数据库服务并保留本地回退能力。

## 2. 技术栈

- 运行框架：Expo、React Native、React。
- 语言：TypeScript。
- 导航：React Navigation Native Stack。
- 状态管理：Zustand。
- 数据持久化：Expo SQLite，Web 端支持远程数据库适配与本地 SQLite 回退。
- 平台能力：Expo FileSystem、DocumentPicker、Clipboard、Notifications 等。
- 可视化：`react-native-chart-kit`、`react-native-svg`。

常用脚本：

```bash
npm run start
npm run android
npm run ios
npm run web
npm run db:server
npm run web:global
npm run ts:check
```

## 3. 顶层目录

```text
.
├── App.tsx                 # 应用入口，负责初始化数据库、迁移、种子数据和根导航
├── app.config.js           # Expo 应用配置
├── babel.config.js         # Babel 配置
├── eas.json                # EAS 构建配置
├── metro.config.js         # Metro 打包配置
├── package.json            # 依赖与脚本
├── tsconfig.json           # TypeScript 配置
├── ARCHITECTURE.md         # 架构文档
└── src
    ├── components          # 可复用 UI 组件
    ├── db                  # 数据库连接、迁移、种子数据、Web 数据库适配
    ├── hooks               # 面向界面层的业务 Hook
    ├── navigation          # 路由注册与导航类型
    ├── screens             # 页面级组件
    ├── services            # 业务服务、平台服务、URL 解析器
    ├── store               # Zustand 状态仓库
    ├── theme               # 主题、颜色、样式常量
    ├── types               # 共享类型定义
    └── utils               # 通用工具函数
```

## 4. 分层架构

项目采用接近单向依赖的前端分层结构：

```text
Screens
  ↓
Hooks
  ↓
Zustand Stores
  ↓
Services
  ↓
SQLite / Remote DB / Expo Platform APIs
```

各层职责：

- `screens`：页面容器，负责布局、用户交互和组合组件。
- `components`：跨页面复用的展示组件和交互组件。
- `hooks`：把页面需要的数据读取、状态变更、加载状态和副作用封装成 React Hook。
- `store`：通过 Zustand 保存模块级状态，承接 Hook 与 Service 之间的数据同步。
- `services`：业务规则、数据库访问、平台 API 调用、网络请求和解析逻辑。
- `db`：数据库连接、迁移、初始化、种子数据和 Web 端数据库兼容层。

推荐保持依赖方向从上到下。页面不应直接拼接 SQL 或绕过 Service 修改持久化数据；数据库层也不应反向依赖页面或 Hook。

## 5. 启动流程

入口文件是 `App.tsx`。启动时的主要流程如下：

```text
App.tsx
  ├── import "react-native-gesture-handler"
  ├── runMigrations()
  ├── seedData()
  ├── render RootNavigator
  └── syncAchievements()
```

具体说明：

1. 加载手势处理依赖，保证导航和交互组件正常工作。
2. 执行数据库迁移，确保本地或 Web 数据库结构处于当前版本。
3. 执行种子数据初始化，用于预置必要的基础数据。
4. 渲染 `RootNavigator` 进入主应用路由。
5. 异步同步成就数据，不阻塞首屏渲染。
6. 初始化期间会展示加载态；初始化失败时会展示错误态。

## 6. 导航结构

根导航位于 `src/navigation/RootNavigator.tsx`，使用：

- `NavigationContainer`
- `createNativeStackNavigator<HomeStackParamList>`

当前注册的主要路由包括：

```text
HomeMain
BookmarkDetail
AddBookmark
TagManage
FolderManage
SourceGroup
StatsDashboard
WikiHub
WikiDetail
Library
LibraryItemDetail
MarkdownNotes
MarkdownNoteDetail
MarkdownNoteEditor
ProfileMain
Settings
Achievements
```

路由命名按业务页面划分。新增页面时，应同步维护：

- 页面组件：`src/screens/**`
- 路由注册：`src/navigation/RootNavigator.tsx`
- 参数类型：`src/navigation/types.ts`
- 入口跳转逻辑：相关页面、组件或 Hook

## 7. 核心数据流

以收藏列表为例，典型数据链路如下：

```text
Screen
  -> useBookmarks()
  -> bookmarkStore
  -> bookmarkService
  -> database.runAsync / getAllAsync / getFirstAsync
  -> SQLite 或 Web 远程数据库
```

新增或更新数据时，一般由页面触发 Hook 方法，Hook 调用 Store action，Store 再委托 Service 完成业务校验与持久化。Service 完成写入后，Store 更新内存状态，页面自动重新渲染。

这种结构的好处是：

- 页面代码只关注交互和展示。
- 业务规则集中在 Service，便于测试和复用。
- Store 负责缓存和同步状态，减少跨页面重复请求。
- 数据库访问集中在底层，便于处理 Web / Native 差异。

## 8. 数据持久化与迁移

数据库入口位于 `src/db/database.ts`。

数据库名：

```text
collection-read.global.db
```

数据库接口抽象为 `AppDatabase` 子集，主要方法包括：

- `runAsync`
- `getAllAsync`
- `getFirstAsync`
- `execAsync`
- `closeAsync`

Native 端使用 `expo-sqlite`。Web 端会优先尝试：

```text
getRemoteDatabaseUrl()
  -> createRemoteDatabase()
```

如果远程数据库不可用，则回退到浏览器侧 SQLite 实现。Web 写入后会触发 `scheduleWebBackup(db!)`，用于安排备份。

迁移逻辑位于 `src/db/migrations.ts`，由 `App.tsx` 启动阶段调用。涉及 schema 变更时，应优先通过迁移追加变更，避免直接依赖运行时自动修复。

## 9. 主要业务模块

### 收藏与组织

相关模块：

- `src/hooks/useBookmarks.ts`
- `src/store/bookmarkStore.ts`
- `src/services/bookmarkService.ts`
- `src/services/folderService.ts`
- `src/services/tagService.ts`

职责：

- 管理收藏条目的创建、更新、删除、状态切换和详情读取。
- 管理标签与文件夹。
- 支持来源分组和条目组织。

### 统计与回顾

相关模块：

- `src/hooks/useStats.ts`
- `src/store/statsStore.ts`
- `src/services/statsService.ts`
- `src/services/resurfaceService.ts`
- `src/services/resurfaceConfigService.ts`
- `src/services/resurfacePolicy.ts`

职责：

- 汇总阅读与收藏行为。
- 支持统计看板。
- 根据策略重新浮现需要回顾的内容。

### 提醒与通知

相关模块：

- `src/hooks/useReminder.ts`
- `src/services/reminderService.ts`

职责：

- 管理提醒配置。
- 调用 Expo Notifications 等平台能力。
- 将提醒行为与收藏、回顾模块关联。

### Wiki 与知识库

相关模块：

- `src/hooks/useWiki.ts`
- `src/store/wikiStore.ts`
- `src/services/wikiService.ts`

职责：

- 管理 Wiki 条目。
- 支持 Wiki 首页、详情页和相关知识组织。

### 资料库与文件

相关模块：

- `src/hooks/useLibrary.ts`
- `src/services/libraryService.ts`
- `src/services/libraryFileService.ts`

职责：

- 管理资料库条目。
- 接入文件选择、文件系统和文档元数据。
- 支持资料详情查看。

### Markdown 笔记

相关模块：

- `src/hooks/useMarkdownNotes.ts`
- `src/hooks/useNotes.ts`
- `src/services/markdownNoteService.ts`

职责：

- 管理 Markdown 笔记列表、详情与编辑。
- 支持笔记内容持久化。

### 成就系统

相关模块：

- `src/hooks/useAchievements.ts`
- `src/store/achievementStore.ts`
- `src/services/achievementService.ts`
- `src/services/achievementSyncService.ts`

职责：

- 计算和同步用户成就。
- 在应用启动后异步执行同步，避免阻塞主流程。

## 10. URL 元数据解析器机制

解析器注册中心位于 `src/services/extractors/registry.ts`。

核心行为：

- `ExtractorRegistry.register()` 注册解析器，并按 `priority` 从高到低排序。
- `resolve(url)` 返回第一个可处理该 URL 的解析器。
- 匹配时优先调用解析器的 `canHandle(url)`。
- 如果没有 `canHandle`，则使用解析器的 `pattern.test(url)`。
- 未匹配时抛出错误。

注册中心还提供：

- `listRoutes()`
- `listApiBackedRoutes()`
- `listPublicDetailRoutes()`

当前 API-backed 平台包括：

```text
bilibili
juejin
github
sspai
```

公开详情路由覆盖的平台包括：

```text
bilibili
csdn
36kr
huxiu
jianshu
cnblogs
segmentfault
infoq
woshipm
zhihu
juejin
github
sspai
medium
jike
xueqiu
telegram
youtube
twitter
blog
```

新增平台解析器时，推荐步骤：

1. 在 `src/services/extractors/` 下新增解析器实现。
2. 明确 `id`、`priority`、`pattern`，必要时实现 `canHandle(url)`。
3. 在注册入口中注册该解析器。
4. 如果该平台需要 API 代理或公开详情页，补充对应路由列表。
5. 为关键 URL 样例补充测试或最小验证脚本。

## 11. Web / Native 差异

项目通过 Service 和 DB 层隔离平台差异。

Native 端：

- 主要使用 `expo-sqlite` 存储数据。
- 可直接调用 Expo 提供的文件、剪贴板、通知等能力。
- 数据库通常保存在设备本地。

Web 端：

- 启动时优先尝试远程数据库。
- 远程数据库不可用时回退到浏览器 SQLite。
- 写入后会调度 Web 备份。
- 部分 Native 平台能力需要通过适配层、降级逻辑或 Web API 实现。

新增跨平台功能时，应把差异封装在 Service 或 DB 适配层中，避免在页面中散落大量平台判断。

## 12. 扩展开发指南

### 新增页面

1. 在 `src/screens/` 下新增页面组件。
2. 在 `src/navigation/types.ts` 中补充路由参数类型。
3. 在 `src/navigation/RootNavigator.tsx` 注册路由。
4. 如需入口，在对应页面、Tab、设置项或按钮中添加跳转。

### 新增业务模块

推荐目录组合：

```text
src/screens/NewFeatureScreen.tsx
src/hooks/useNewFeature.ts
src/store/newFeatureStore.ts
src/services/newFeatureService.ts
```

如果需要持久化：

1. 在 `src/db/migrations.ts` 中追加 schema 迁移。
2. 在 Service 中封装数据库读写。
3. 在 Store 中管理加载态、错误态和缓存状态。
4. 在 Hook 中提供页面可直接使用的方法。

### 新增数据库字段或表

1. 通过迁移新增字段或表。
2. 更新对应 Service 的读写逻辑。
3. 更新 TypeScript 类型。
4. 检查 Web 远程数据库和本地数据库是否都支持该变更。
5. 使用 `npm run ts:check` 做类型验证。

### 新增 URL 平台支持

1. 新增 extractor。
2. 配置匹配规则与优先级。
3. 注册到解析器列表。
4. 如果需要服务端或公开详情能力，补充 route 列表。
5. 用真实 URL 样例验证解析结果。

## 13. 运行与验证

开发启动：

```bash
npm run start
```

按平台启动：

```bash
npm run android
npm run ios
npm run web
```

Web 数据库服务：

```bash
npm run db:server
npm run web:global
```

类型检查：

```bash
npm run ts:check
```

文档类改动通常不需要运行完整构建；涉及 TypeScript、路由、数据库 schema 或跨平台适配时，至少应执行类型检查，并按影响面补充平台验证。

## 14. 架构注意事项

- 保持页面层轻量，避免在 `screens` 中直接实现复杂业务规则。
- 数据库读写优先走 `services`，不要在组件内直接访问 SQL。
- 新增状态时先确认是否需要全局 Store，局部 UI 状态优先留在组件内部。
- 涉及平台差异时，优先封装成适配服务，不要让页面关心过多 Web / Native 分支。
- 数据库 schema 变更必须通过迁移表达，避免隐式依赖种子数据或运行时修补。
- URL 解析器应设置清晰优先级，避免通用匹配规则抢占具体平台规则。
- 启动阶段应避免新增长耗时同步任务；非首屏必要任务应像成就同步一样异步执行。
