# 🎯 JobHunter - 一站式求职助手

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![OpenClaw Skill](https://img.shields.io/badge/OpenClaw-Skill-green.svg)](https://docs.openclaw.ai)

> BOSS 直聘岗位搜索 + 公司背调 + 面试准备，基于 OpenClaw Skill

---

## 🚀 功能特性

### 1. 岗位搜索 🔍
- **BOSS MCP API** - 官方接口，数据准确
- **降级策略** - MCP 不可用时自动降级到 ask-search/Tavily
- **智能匹配** - 简历与 JD 匹配度分析

### 2. 公司背调 🔎
- **风险检测** - 劳动仲裁/欠薪/证监会警示
- **工商信息** - 成立时间/注册资本/法人
- **新闻舆情** - 正面/负面新闻分析

### 3. 自动打招呼 💬
- **个性化招呼语** - 根据 JD 定制
- **批量发送** - 支持批量打招呼
- **频率控制** - 避免被封号

### 4. 面试准备 📚
- **公司资料** - 产品/业务/文化
- **预测问题** - 根据 JD 生成
- **参考回答** - 回答框架建议

---

## 📦 安装

### 前置要求

- **OpenClaw** - https://docs.openclaw.ai
- **Node.js** >= 18
- **BOSS MCP** (可选，用于 BOSS 直聘 API)

### 安装方式

#### 方式 1: ClawHub（推荐）

```bash
clawhub install job-hunter
```

#### 方式 2: 源码安装

```bash
# 克隆仓库
git clone https://github.com/Left2y/job-hunter.git
cd job-hunter

# 安装依赖（如有）
npm install
```

---

## 🚀 使用方式

### 岗位搜索

```bash
# 搜索岗位
node src/boss-search.js search "UI 设计师" 广州 "15-25K"

# 获取推荐
node src/boss-search.js recommend 1

# 获取详情
node src/boss-search.js detail <job_id>
```

### 公司背调

```bash
# 查询公司风险
node src/company-check.js "多利购科技"
```

### 自动打招呼

```bash
# 发送招呼语
node src/auto-greeting.js send <job_id> "您好，我对这个职位很感兴趣..."
```

### 面试准备

```bash
# 准备面试
node src/interview-prep.js "腾讯" "UI 设计师"
```

---

## 📊 降级策略

JobHunter 采用三层降级策略，确保在 BOSS MCP 不可用时仍能正常工作：

```
L1: BOSS MCP (主搜索源)
   ↓ 失败/超时/认证错误
L2: ask-search (备选搜索源)
   ↓ 失败/无结果
L3: Tavily web_search (最后手段)
```

**测试结果**:
```bash
$ node src/boss-search.js search "UI 设计师" 广州

✅ ask-search 成功：找到 4 个岗位
```

---

## 📁 项目结构

```
job-hunter/
├── src/                    # 源代码
│   ├── boss-search.js      # 岗位搜索
│   ├── auto-greeting.js    # 自动打招呼
│   ├── company-check.js    # 公司背调
│   ├── jd-analyzer.js      # JD 解析
│   ├── interview-prep.js   # 面试准备
│   └── tracker.js          # 进度管理
├── docs/                   # 文档
│   ├── fallback-strategy.md # 降级策略
│   └── optimization-report.md # 优化报告
├── scripts/                # 脚本
│   └── configure-boss-mcp.sh # BOSS MCP 配置
├── evals/                  # 测试用例
│   └── evals.json
├── SKILL.md                # OpenClaw Skill
└── README.md               # 本文件
```

---

## 🔧 配置

### BOSS MCP 配置（可选）

```bash
# 运行配置脚本
bash scripts/configure-boss-mcp.sh

# 或手动配置
export BOSS_COOKIE="your_cookie_here"
```

### Tavily API（可选）

```bash
export TAVILY_API_KEY="your_api_key"
```

---

## 🧪 测试

### 运行测试用例

```bash
# 岗位搜索测试
node src/boss-search.js search "UI 设计师" 广州

# 公司背调测试
node src/company-check.js "多利购科技"

# 打招呼测试
node src/auto-greeting.js send 123456 "您好..."
```

---

## 📝 更新日志

### v0.2 (2026-03-11)

- ✅ 添加三层降级策略
- ✅ 实现 ask-search 解析
- ✅ 实现 Tavily 降级
- ✅ 添加认证配置脚本
- ✅ 改进错误处理

### v0.1 (2026-03-10)

- ✅ 初始版本

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE)

---

## 🔗 相关链接

- **OpenClaw 文档**: https://docs.openclaw.ai
- **ClawHub**: https://clawhub.com
- **BOSS 直聘**: https://www.zhipin.com

---

*Made with ❤️ by LE FTIsland*
