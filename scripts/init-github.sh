#!/bin/bash
# JobHunter GitHub 仓库初始化脚本

set -e

REPO_NAME="job-hunter"
REPO_DIR="$HOME/.openclaw/skills/$REPO_NAME"

echo "🚀 JobHunter GitHub 仓库初始化"
echo "================================"
echo ""

# 1. 检查 Git
if ! command -v git &> /dev/null; then
    echo "❌ Git 未安装，请先安装 Git"
    exit 1
fi
echo "✅ Git 已安装"

# 2. 初始化 Git 仓库
cd "$REPO_DIR"
git init
echo "✅ Git 仓库初始化完成"

# 3. 添加所有文件
git add .
echo "✅ 文件已添加到暂存区"

# 4. 首次提交
git commit -m "feat: initial commit - JobHunter v0.1.0

✨ 功能:
- BOSS 直聘岗位搜索
- 自动打招呼（个性化招呼语）
- JD 匹配度分析
- 公司背调（风险检测）
- 面试准备
- SQLite 进度追踪

📦 技术栈:
- Node.js
- BOSS MCP
- SQLite3
- Agent-Reach

🎯 目标:
- OpenClaw 用户
- Claude Code 用户
- 求职者

Co-authored-by: Left2y"
echo "✅ 首次提交完成"

# 5. 创建 GitHub 仓库（需要 gh CLI）
if command -v gh &> /dev/null; then
    echo ""
    echo "📦 创建 GitHub 仓库..."
    gh repo create "$REPO_NAME" --public --source="$REPO_DIR" --remote=origin --push
    echo "✅ GitHub 仓库创建完成"
    echo ""
    echo "🔗 仓库地址：https://github.com/Left2y/$REPO_NAME"
else
    echo ""
    echo "⚠️  gh CLI 未安装，跳过 GitHub 仓库创建"
    echo ""
    echo "手动创建步骤:"
    echo "1. 访问 https://github.com/new"
    echo "2. 仓库名：$REPO_NAME"
    echo "3. 描述：一站式求职助手 - 从岗位搜索→自动打招呼→面试→入职全流程支持"
    echo "4. 选择 Public"
    echo "5. 不要初始化（我们已经初始化了）"
    echo "6. 创建后执行:"
    echo "   git remote add origin https://github.com/Left2y/$REPO_NAME.git"
    echo "   git branch -M main"
    echo "   git push -u origin main"
fi

echo ""
echo "================================"
echo "✅ 初始化完成！"
echo ""
echo "下一步:"
echo "1. 在 GitHub 创建仓库（如未自动创建）"
echo "2. 推送到 GitHub"
echo "3. 发布到 ClawHub: clawhub publish"
echo ""
echo "🎉 JobHunter v0.1.0 准备发布！"
