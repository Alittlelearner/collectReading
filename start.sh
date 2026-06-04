#!/bin/bash

# 学习收藏夹 - Expo 开发服务器启动脚本
# 使用方法：./start.sh

set -e

cd /workspace

echo "🚀 学习收藏夹 - Expo 开发服务器"
echo "=================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查端口占用
check_port() {
  local port=$1
  if command -v netstat &> /dev/null; then
    netstat -tlnp 2>/dev/null | grep -q ":$port " && return 0
  elif command -v ss &> /dev/null; then
    ss -tlnp 2>/dev/null | grep -q ":$port " && return 0
  elif command -v lsof &> /dev/null; then
    lsof -i :$port &> /dev/null && return 0
  fi
  return 1
}

# 杀死占用端口的进程
kill_port() {
  local port=$1
  echo -e "${YELLOW}清理端口 $port...${NC}"
  
  if command -v lsof &> /dev/null; then
    lsof -ti :$port | xargs kill -9 2>/dev/null || true
  elif command -v fuser &> /dev/null; then
    fuser -k $port/tcp 2>/dev/null || true
  fi
  
  # 清理 Expo/Metro 进程
  pkill -f "expo" 2>/dev/null || true
  pkill -f "metro" 2>/dev/null || true
  
  sleep 2
}

# 检查 Node.js
if ! command -v node &> /dev/null; then
  echo -e "${RED}错误：Node.js 未安装${NC}"
  exit 1
fi

echo "✓ Node.js: $(node -v)"
echo "✓ npm: $(npm -v)"
echo ""

# 清理旧进程
echo "📋 检查端口状态..."
for port in 8081 8082 8083; do
  if check_port $port; then
    echo -e "${YELLOW}端口 $port 被占用，清理中...${NC}"
    kill_port $port
  else
    echo -e "${GREEN}端口 $port 可用${NC}"
  fi
done
echo ""

# 清理缓存
echo "🗑️  清理缓存..."
rm -rf .expo node_modules/.cache 2>/dev/null || true
echo ""

# 启动 Expo
echo "🚀 启动 Expo 开发服务器..."
echo ""

# 创建日志文件
LOG_FILE="/tmp/expo-start-$(date +%Y%m%d-%H%M%S).log"

# 后台启动
nohup npx expo start --clear > "$LOG_FILE" 2>&1 &
EXPO_PID=$!

echo "📝 进程 ID: $EXPO_PID"
echo "📄 日志文件：$LOG_FILE"
echo ""

# 等待启动
echo "⏳ 等待服务器启动..."
MAX_WAIT=60
WAITED=0
SERVER_READY=false

while [ $WAITED -lt $MAX_WAIT ]; do
  sleep 2
  WAITED=$((WAITED + 2))
  
  # 检查进程是否还在运行
  if ! kill -0 $EXPO_PID 2>/dev/null; then
    echo -e "${RED}❌ 进程意外退出${NC}"
    cat "$LOG_FILE" | tail -20
    exit 1
  fi
  
  # 检查日志中是否有启动成功的标志
  if grep -q "Waiting on http://localhost:8081" "$LOG_FILE" 2>/dev/null; then
    SERVER_READY=true
    break
  fi
  
  echo "   已等待 ${WAITED}s..."
done

if [ "$SERVER_READY" = false ]; then
  echo -e "${RED}❌ 服务器启动超时${NC}"
  cat "$LOG_FILE" | tail -30
  exit 1
fi

echo ""
echo -e "${GREEN}✅ 服务器启动成功！${NC}"
echo ""
echo "=================================="
echo "📱 访问地址:"
echo "   https://8081-1cdfda70b7d4f60e.monkeycode-ai.online"
echo ""
echo "🔧 常用命令:"
echo "   查看日志：tail -f $LOG_FILE"
echo "   停止服务：kill $EXPO_PID"
echo "   重启服务：./start.sh"
echo ""
echo "=================================="
echo ""

# 显示最后几行日志
echo "📊 启动日志:"
cat "$LOG_FILE" | tail -10

exit 0
