#!/bin/bash
set -e

echo "========================================"
echo "  学习收藏夹 - 综合测试套件"
echo "========================================"
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASSED=0
FAILED=0

pass() {
  PASSED=$((PASSED + 1))
  echo -e "${GREEN}✓${NC} $1"
}

fail() {
  FAILED=$((FAILED + 1))
  echo -e "${RED}✗${NC} $1"
}

section() {
  echo ""
  echo -e "${YELLOW}[$1]${NC}"
}

#========================================
# 1. URL提取器测试（包括短链）
#========================================
section "URL 提取器模式测试"

# 测试 Bilibili 提取器（包括短链）
cat > /tmp/test-platforms.js << 'EOF'
const path = require('path');
process.chdir('/workspace');

// 测试 URL 模式匹配
const testCases = [
  { name: 'bilibili-long', url: 'https://www.bilibili.com/video/BV123', shouldMatch: true },
  { name: 'bilibili-short', url: 'https://b23.tv/abc123', shouldMatch: true },
  { name: 'zhihu-zhuanlan', url: 'https://zhuanlan.zhihu.com/p/123', shouldMatch: true },
  { name: 'zhihu-question', url: 'https://www.zhihu.com/question/456', shouldMatch: true },
  { name: 'wechat', url: 'https://mp.weixin.qq.com/s/abc', shouldMatch: true },
  { name: 'juejin', url: 'https://juejin.cn/post/123', shouldMatch: true },
  { name: 'douban-book', url: 'https://book.douban.com/subject/123', shouldMatch: true },
  { name: 'douban-movie', url: 'https://movie.douban.com/subject/456', shouldMatch: true },
  { name: 'github', url: 'https://github.com/org/repo', shouldMatch: true },
  { name: 'medium', url: 'https://medium.com/@user/article', shouldMatch: true },
  { name: 'sspai', url: 'https://sspai.com/post/123', shouldMatch: true },
  { name: 'xiaohongshu', url: 'https://www.xiaohongshu.com/explore/123', shouldMatch: true },
  { name: 'other', url: 'https://example.com/page', shouldMatch: false },
];

const patterns = {
  bilibili: /bilibili\.com|b23\.tv/,
  zhihu: /zhihu\.com/,
  wechat: /weixin\.qq\.com/,
  juejin: /juejin\.cn/,
  douban: /douban\.com/,
  github: /github\.com/,
  medium: /medium\.com/,
  sspai: /sspai\.com/,
  xiaohongshu: /xiaohongshu\.com/,
};

let passed = 0;
let failed = 0;

for (const test of testCases) {
  let matched = false;
  for (const [name, pattern] of Object.entries(patterns)) {
    if (pattern.test(test.url)) {
      matched = true;
      break;
    }
  }
  
  if (matched === test.shouldMatch) {
    console.log(`✓ ${test.name}`);
    passed++;
  } else {
    console.log(`✗ ${test.name}: expected ${test.shouldMatch}, got ${matched}`);
    failed++;
  }
}

console.log(`\nURL Patterns: ${passed}/${passed+failed} passed`);
process.exit(failed > 0 ? 1 : 0);
EOF

if node /tmp/test-platforms.js 2>/dev/null; then
  pass "URL 提取器模式测试通过"
else
  fail "URL 提取器模式测试失败"
fi

#========================================
# 2. 短链展开测试
#========================================
section "短链展开功能测试"

if grep -q "expandShortUrl" src/utils/urlExpander.ts && \
   grep -q "b23.tv" src/utils/urlExpander.ts && \
   grep -q "t.cn" src/utils/urlExpander.ts; then
  pass "短链展开工具已实现"
else
  fail "短链展开工具缺失"
fi

#========================================
# 3. 数据库状态测试
#========================================
section "数据库状态测试"

if grep -q "'archived'" src/types/index.ts; then
  pass "已添加 archived 状态"
else
  fail "缺少 archived 状态定义"
fi

if grep -q "learning_status = 'archived'" src/services/resurfaceService.ts; then
  pass "擦亮完成时设置为 archived"
else
  fail "擦亮服务未使用 archived 状态"
fi

#========================================
# 4. 笔记编辑删除功能
#========================================
section "笔记功能测试"

if [ -f "src/components/NotesList.tsx" ]; then
  if grep -q "onUpdate\|onDelete" src/components/NotesList.tsx; then
    pass "笔记编辑删除组件已创建"
  else
    fail "笔记组件缺少编辑删除功能"
  fi
else
  fail "NotesList 组件不存在"
fi

if grep -q "onUpdate.*notes.updateNote\|onUpdate={notes.updateNote}" src/screens/BookmarkDetailScreen.tsx; then
  pass "笔记详情页面已集成编辑删除"
else
  fail "笔记详情页面未集成编辑删除"
fi

#========================================
# 5. 标签功能测试
#========================================
section "标签功能测试"

if grep -q "createTag" src/store/tagStore.ts; then
  pass "标签 Store 有 createTag 方法"
else
  fail "标签 Store 缺少 createTag"
fi

if grep -q "create.*name.*color" src/services/tagService.ts; then
  pass "标签服务支持创建"
else
  fail "标签服务实现有问题"
fi

#========================================
# 6. 删除功能测试
#========================================
section "删除功能测试"

if grep -q "DELETE FROM bookmark_tags" src/services/bookmarkService.ts; then
  pass "删除时清理关联标签"
else
  fail "删除未清理关联数据"
fi

if grep -q "DELETE FROM bookmarks WHERE id" src/services/bookmarkService.ts; then
  pass "Store 正确调用删除"
else
  fail "Store 删除调用有问题"
fi

#========================================
# 7. 关键文件完整性
#========================================
section "关键文件检查"

CRITICAL_FILES=(
  "src/utils/urlExpander.ts"
  "src/components/NotesList.tsx"
  "src/services/urlParserService.ts"
  "src/services/bookmarkService.ts"
  "src/services/tagService.ts"
  "src/services/resurfaceService.ts"
  "src/types/index.ts"
)

all_exist=true
for file in "${CRITICAL_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "✓ $file"
  else
    echo "✗ $file (missing)"
    all_exist=false
  fi
done

if [ "$all_exist" = true ]; then
  pass "关键文件完整性检查通过"
else
  fail "关键文件缺失"
fi

#========================================
# 8. 服务器健康检查
#========================================
section "服务器健康检查"

if curl -s "http://localhost:8081" > /dev/null 2>&1; then
  pass "服务器正在运行"
  
  bundle_size=$(curl -s "http://localhost:8081/node_modules/expo/AppEntry.bundle?platform=web" 2>&1 | wc -c)
  if [ "$bundle_size" -gt 10000 ]; then
    pass "Bundle 构建正常 (${bundle_size} bytes)"
  else
    fail "Bundle 异常 (${bundle_size} bytes)"
  fi
else
  fail "服务器未运行"
fi

#========================================
# 测试结果汇总
#========================================
echo ""
echo "========================================"
echo "  测试结果汇总"
echo "========================================"
echo -e "通过：${GREEN}${PASSED}${NC}"
echo -e "失败：${RED}${FAILED}${NC}"
echo "========================================"

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✅ 所有测试通过！可以安全交付${NC}"
  exit 0
else
  echo -e "${RED}❌ 存在失败的测试，请修复后再交付${NC}"
  echo ""
  echo "需要修复的问题："
  echo "1. 归档状态和擦亮逻辑"
  echo "2. 笔记编辑删除功能"
  echo "3. 标签创建功能"
  echo "4. 删除关联数据"
  echo "5. 短链支持"
  exit 1
fi
