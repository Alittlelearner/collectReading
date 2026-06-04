# 测试系统文档

## 概述

本项目包含一套完整的交付前测试系统，确保每次交付前所有核心功能正常工作。

## 运行测试

```bash
# 运行所有测试
npm test

# 或直接执行测试脚本
./test.sh
```

## 测试覆盖范围

### 1. URL 提取器模式测试
验证所有支持平台的 URL 模式是否正确匹配：
- ✅ Bilibili (bilibili.com, b23.tv)
- ✅ 知乎 (zhihu.com)
- ✅ 微信公众号 (weixin.qq.com)
- ✅ 掘金 (juejin.cn)
- ✅ 豆瓣 (douban.com)
- ✅ GitHub (github.com)
- ✅ Medium (medium.com)
- ✅ 少数派 (sspai.com)
- ✅ 小红书 (xiaohongshu.com)

### 2. 关键文件检查
验证所有核心文件存在：
- URL 解析服务
- 书签/标签/成就/统计服务
- 数据库层（database, migrations, seed）
- 所有平台提取器（9+ 个）
- 启动脚本

### 3. 提取器实现检查
- Bilibili 提取器包含请求头（防止 403）
- 所有提取器定义了正确的 pattern

### 4. 数据库迁移检查
- bookmarks 表定义
- tags 表定义
- achievements 表定义
- 其他必要表

### 5. 种子数据检查
- 13 个成就数据
- 默认设置（提醒间隔、重出表面开关）

### 6. 文件完整性检查
所有 TypeScript/.tsx 文件可读性检查

## 交付流程

每次交付前必须执行以下步骤：

1. **运行测试**
   ```bash
   npm test
   ```

2. **验证所有测试通过**
   - 看到 `✅ 所有测试通过！可以安全交付` 输出
   - 如果没有通过，修复失败项

3. **运行应用验证**
   ```bash
   npm start
   ```

4. **访问 Web 预览**
   - 确认 https://8081-1cdfda70b7d4f60e.monkeycode-ai.online 可访问
   - 测试添加书签功能
   - 测试 URL 解析功能

5. **提交代码**
   ```bash
   git add .
   git commit -m "feat: xxx"
   git push
   ```

## 故障排查

### URL 解析失败
检查提取器文件：
```bash
cat src/services/extractors/bilibiliExtractor.ts
```

### 数据库错误
检查迁移文件：
```bash
cat src/db/migrations.ts
```

### 种子数据问题
```bash
cat src/db/seed.ts
```

## 新增平台支持

当添加新平台支持时，需要：

1. 创建提取器文件 `src/services/extractors/newPlatformExtractor.ts`
2. 定义 pattern 正则表达式
3. 实现 `extract()` 方法
4. 更新 `test.sh` 添加新模式测试
5. 运行 `npm test` 验证

## 测试脚本结构

```
test.sh
├── [1] URL 提取器模式测试
├── [2] 关键文件检查
├── [3] 提取器实现检查
├── [4] 数据库迁移检查
├── [5] 种子数据检查
└── [6] 文件完整性检查
```

## CI/CD 集成

可以将测试脚本集成到 CI/CD 流程中：

```yaml
# GitHub Actions 示例
- name: Run tests
  run: npm test

- name: Start application
  run: npm start
```

## 注意事项

- 测试脚本使用 bash，请确保在 bash 环境下运行
- 部分测试需要 node 环境
- 确保安装所有依赖：`npm install`
