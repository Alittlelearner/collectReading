# 学习收藏夹

一个面向个人知识整理的跨端收藏阅读工具。项目基于 Expo、React Native 和 TypeScript 构建，支持 Web、iOS、Android。它可以把网页、视频、文章、社区内容统一保存到本地收藏库中，并围绕标签、收藏夹、笔记、阅读状态、擦亮复习、统计和导出形成一套轻量知识管理流程。

## 核心能力

### 收藏管理

- 单条添加收藏，粘贴 URL 后自动识别标题、作者、简介、封面、来源、原始标签和发布时间。
- 批量添加收藏，一行一个链接，先快速入库，详情解析在后台排队补全。
- 收藏去重，同一 URL 不会重复保存。
- 收藏支持未读、已读、星标、归档、最近删除。
- 详情页支持打开原链接、完成阅读、恢复、归档、移入最近删除。
- 最近删除使用软删除字段保存，便于后续恢复。

### 标签与收藏夹

- 支持创建、重命名、删除标签。
- 支持创建、重命名、删除收藏夹。
- 新增收藏时可直接选择标签和收藏夹。
- 现有收藏可在详情页编辑标签。
- 现有收藏可在详情页移动或复制到多个收藏夹。
- 首页侧边栏支持按标签、收藏夹、星标、归档、最近删除、未分类等维度筛选。

### 阅读与笔记

- 收藏详情页支持备注和独立笔记列表。
- 打开原链接会记录阅读行为次数。
- 完成阅读会更新阅读状态、归档状态、阅读时间和统计数据。
- 首页提供擦亮候选卡片，把旧收藏重新推回视野。

### 元数据解析

项目内置多站点解析器，统一输出标题、描述、封面、作者、来源类型、域名、原始标签和发布时间。

当前包含的解析器覆盖：

- Bilibili
- 知乎
- 微信公众号
- 豆瓣
- 少数派
- CSDN
- 36Kr
- 虎嗅
- 简书
- 博客园
- SegmentFault
- InfoQ
- 人人都是产品经理
- Medium
- GitHub
- 小红书
- 即刻
- 雪球
- Telegram
- YouTube
- Twitter / X
- 通用网页兜底

### 统计、成就与提醒

- 阅读统计看板展示总收藏、已读数、完成率、连续阅读天数、日/周/月阅读等数据。
- 成就系统会根据收藏、阅读、标签、笔记、擦亮等行为自动解锁。
- 支持阅读提醒配置。
- 支持擦亮策略配置，包括每日候选上限、单条最多擦亮次数和冷却天数。

### Wiki 实验功能

- 可基于全部收藏、收藏夹、标签、星标、归档等范围创建 Wiki 空间。
- Wiki 支持按收藏夹、标签、来源和时间线组织内容。
- 支持导出 Markdown 知识架。
- Web 端优先使用浏览器目录选择能力，无法使用时回退为文件下载。
- Native 端导出到本地文档目录。

### 数据导入导出

- 支持导出完整 JSON 备份。
- 支持导入 JSON 备份并合并到当前数据库。
- 导出覆盖收藏、标签、收藏夹、关联关系、笔记、统计、成就、设置和 Wiki 空间。
- 导入按 URL 合并收藏，按名称合并标签和收藏夹，避免大量重复数据。
- 导入过程使用事务，失败会回滚。
- Web 端额外有 localStorage 备份兜底，用于降低浏览器 SQLite 存储丢失风险。

## 技术栈

- Expo SDK 56
- React 19
- React Native 0.85
- React Navigation Native Stack
- Zustand
- Expo SQLite
- Expo Notifications
- Expo File System
- Expo Document Picker
- TypeScript

## 快速开始

安装依赖：

```bash
npm install
```

启动 Web：

```bash
npm run web
```

启动 Expo：

```bash
npm start
```

Android：

```bash
npm run android
```

iOS：

```bash
npm run ios
```

类型检查：

```bash
npm run ts:check
```

## 数据存储说明

Native 端使用 `expo-sqlite` 本地数据库。

Web 端使用浏览器本地 SQLite 能力，数据不是服务端数据。它通常和浏览器、访问地址、端口、站点数据存储相关。比如 `localhost:19006` 和 `127.0.0.1:19006` 可能被浏览器视为不同数据空间。

为降低 Web 端数据丢失风险，项目增加了自动备份：

- 每次数据库写入后会延迟同步一份 JSON 到 `localStorage`。
- 启动时如果 SQLite 是空库，但 localStorage 备份中存在收藏，会自动恢复。
- 手动重置所有数据时，会同步清空这份备份。

建议重要数据定期使用设置页的“导出数据”生成 JSON 备份。

## 当前导航结构

项目当前使用单栈导航，默认进入收藏主页。

```text
RootNavigator
└── HomeStack
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

Web 端首页包含左侧图标栏和可折叠侧边栏。折叠后侧边栏不会完全消失，会保留图标入口。我的书房通过左侧头像进入。

## 项目结构

```text
src/
├── assets/          # 静态资源
├── components/      # 通用 UI 组件
├── db/              # SQLite、迁移、备份、Web 防丢恢复
├── hooks/           # 页面使用的业务 Hook
├── navigation/      # 路由配置与类型
├── screens/         # 页面
├── services/        # 业务服务、解析器、统计、提醒、Wiki
├── store/           # Zustand 状态
├── theme/           # 颜色、间距、字体
├── types/           # 业务类型
└── utils/           # 格式化、媒体、来源、UUID 等工具
```

更详细的结构说明见 [PROJECT_SKELETON.md](./PROJECT_SKELETON.md)。

后续计划见 [PROJECT_TODO.md](./PROJECT_TODO.md)。
