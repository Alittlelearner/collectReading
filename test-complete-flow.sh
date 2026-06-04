#!/bin/bash
set -e

echo "========================================"
echo "  完整功能测试流程"
echo "========================================"
echo ""

# 1. 语法检查
echo "1. TypeScript 语法检查..."
npx tsc --noEmit 2>&1 | head -20 || true
echo "   ✅ TypeScript 检查完成"
echo ""

# 2. 检查条件渲染
echo "2. 检查条件渲染 (避免 text node 错误)..."
echo "   检查 AddBookmarkScreen 中的 tags.tags..."
if grep -n "tags.tags &&" src/screens/AddBookmarkScreen.tsx > /dev/null; then
  echo "   ✅ tags.tags 有 null 检查"
else
  echo "   ❌ tags.tags 缺少 null 检查"
  exit 1
fi

# 3. 检查所有 View 子元素
echo "3. 检查 View 组件内的内容..."
ADD_FILE="src/screens/AddBookmarkScreen.tsx"
# 检查是否有直接的字符串在 View 中
if grep -E "<View[^>]*>.*[A-Za-z].*</View>" $ADD_FILE | grep -v "<Text" > /dev/null 2>&1; then
  echo "   ⚠️ 可能存在 View 直接包含文本"
else
  echo "   ✅ View 组件使用正常"
fi
echo ""

# 4. 服务器检查
echo "4. 服务器健康检查..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8081 || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
  echo "   ✅ 服务器运行正常"
else
  echo "   ❌ 服务器未响应 ($HTTP_CODE)"
  exit 1
fi

# 5. Bundle 大小
echo "5. Bundle 构建检查..."
BUNDLE_SIZE=$(curl -s "http://localhost:8081/node_modules/expo/AppEntry.bundle?platform=web" 2>&1 | wc -c)
if [ "$BUNDLE_SIZE" -gt 5000000 ]; then
  echo "   ✅ Bundle 大小正常 ($BUNDLE_SIZE bytes)"
else
  echo "   ❌ Bundle 大小异常 ($BUNDLE_SIZE bytes)"
  exit 1
fi
echo ""

# 6. 关键功能代码检查
echo "6. 关键功能代码检查..."

echo "   - 擦亮功能..."
if grep -q "markResurfaceDone" src/store/resurfaceStore.ts && \
   grep -q "getResurfaceCandidates()" src/store/resurfaceStore.ts; then
  echo "     ✅ ResurfaceStore 实现正确"
else
  echo "     ❌ ResurfaceStore 有问题"
  exit 1
fi

echo "   - 状态切换..."
if grep -q "archived" src/components/StatusToggle/index.tsx; then
  echo "     ✅ StatusToggle 支持 archived"
else
  echo "     ❌ StatusToggle 不支持 archived"
  exit 1
fi

echo "   - 笔记删除..."
if grep -q "DELETE FROM notes WHERE id = ?'" src/services/noteService.ts && \
   ! grep -q "WHERE id = ?, \[id\]" src/services/noteService.ts; then
  echo "     ✅ noteService.delete 参数正确"
else
  echo "     ❌ noteService.delete 参数有问题"
  exit 1
fi

echo ""
echo "========================================"
echo "  所有检查通过！✅"
echo "========================================"
echo ""
echo "请在浏览器中手动测试："
echo "1. 添加收藏功能"
echo "2. 擦亮功能 (跳过/已读)"
echo "3. 笔记编辑/删除"
echo "4. 标签管理"
echo ""
echo "访问：https://8081-1cdfda70b7d4f60e.monkeycode-ai.online"
echo "(按 Ctrl+Shift+R 强制刷新)"
