#!/bin/bash
# BOSS MCP 认证配置脚本
# 帮助解决 BOSS 直聘 MCP 的认证和反爬问题

set -e

echo "🔐 BOSS MCP 认证配置工具"
echo "========================"
echo ""

# 检查 BOSS MCP 是否安装
echo "1️⃣ 检查 BOSS MCP 状态..."
if mcporter list 2>&1 | grep -q "bosszp"; then
    echo "✅ BOSS MCP 已安装"
    mcporter list | grep bosszp
else
    echo "❌ BOSS MCP 未安装"
    echo ""
    echo "请先安装 BOSS MCP Server:"
    echo "  git clone https://github.com/Panniantong/agent-reach.git"
    echo "  cd agent-reach/servers/bosszp"
    echo "  npm install"
    echo "  npm start"
    exit 1
fi

echo ""
echo "2️⃣ 测试 BOSS MCP 连接..."
if mcporter call 'bosszp.get_recommend_jobs(page: 1)' 2>&1 | grep -q "error\|异常"; then
    echo "⚠️ BOSS MCP 连接失败，需要配置认证"
else
    echo "✅ BOSS MCP 连接正常"
    exit 0
fi

echo ""
echo "3️⃣ 配置 BOSS 直聘 Cookie..."
echo ""
echo "请按以下步骤获取 BOSS 直聘 Cookie:"
echo ""
echo "  1. 打开 Chrome/Edge 浏览器"
echo "  2. 访问 https://www.zhipin.com 并登录"
echo "  3. 按 F12 打开开发者工具 → Network 标签"
echo "  4. 刷新页面，点击任意 zhipin.com 请求"
echo "  5. 找到 Request Headers → Cookie: 这一行"
echo "  6. 右键 → 复制值"
echo ""

read -p "是否已获取 Cookie? (y/n): " has_cookie

if [ "$has_cookie" = "y" ]; then
    read -p "粘贴 Cookie 字符串：" BOSS_COOKIE
    
    # 保存到配置文件
    CONFIG_FILE="$HOME/.openclaw/.env"
    
    if grep -q "BOSS_COOKIE" "$CONFIG_FILE" 2>/dev/null; then
        echo "⚠️ 检测到已有 BOSS_COOKIE 配置"
        read -p "是否覆盖？(y/n): " overwrite
        if [ "$overwrite" = "y" ]; then
            sed -i "/BOSS_COOKIE/d" "$CONFIG_FILE"
            echo "export BOSS_COOKIE=\"$BOSS_COOKIE\"" >> "$CONFIG_FILE"
            echo "✅ 已更新 BOSS_COOKIE 配置"
        fi
    else
        echo "export BOSS_COOKIE=\"$BOSS_COOKIE\"" >> "$CONFIG_FILE"
        echo "✅ 已添加 BOSS_COOKIE 配置"
    fi
    
    echo ""
    echo "4️⃣ 重新测试 BOSS MCP..."
    source "$CONFIG_FILE"
    export BOSS_COOKIE
    
    if mcporter call 'bosszp.get_recommend_jobs(page: 1)' 2>&1 | grep -q "error\|异常"; then
        echo "⚠️ 测试仍然失败，可能是："
        echo "  - Cookie 已过期（请重新获取）"
        echo "  - IP 被限制（请切换网络）"
        echo "  - BOSS MCP Server 需要重启"
        echo ""
        echo "建议："
        echo "  1. 重新登录 BOSS 直聘获取新 Cookie"
        echo "  2. 重启 BOSS MCP Server"
        echo "  3. 使用降级方案（ask-search/Tavily）"
    else
        echo "✅ BOSS MCP 配置成功！"
    fi
else
    echo ""
    echo "⚠️ 使用降级方案"
    echo ""
    echo "JobHunter 已配置降级策略："
    echo "  1. BOSS MCP（主）"
    echo "  2. ask-search（备选）"
    echo "  3. Tavily web_search（最后手段）"
    echo ""
    echo "即使 BOSS MCP 不可用，也能正常搜索岗位！"
fi

echo ""
echo "🎉 配置完成！"
