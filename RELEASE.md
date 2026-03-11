# 🚀 JobHunter Skill 发布说明

**版本**: v0.1.0  
**发布日期**: 2026-03-11  
**作者**: Left2y

---

## 📦 发布内容

### 核心功能

1. **BOSS 直聘岗位搜索** - 使用 BOSS MCP API 自动抓取岗位
2. **自动打招呼** - 个性化招呼语批量发送
3. **JD 匹配度分析** - 简历与 JD 智能对比
4. **公司背调** - 风险信号检测（劳动仲裁/欠薪/证监会警示）
5. **面试准备** - 公司资料 + 问题预测 + 参考回答
6. **SQLite 进度追踪** - 申请记录管理 + 统计报告

### 文件结构

```
job-hunter/
├── SKILL.md              # 技能说明（OpenClaw 用）
├── README.md             # 使用文档
├── clawhub.yaml          # ClawHub 配置
├── LICENSE               # MIT 许可
├── .gitignore            # Git 忽略文件
├── src/
│   ├── boss-search.js    # BOSS 岗位搜索
│   ├── auto-greeting.js  # 自动打招呼
│   ├── jd-analyzer.js    # JD 解析
│   ├── company-check.js  # 公司背调
│   ├── interview-prep.js # 面试准备
│   └── tracker.js        # 进度管理
└── data/
    └── .gitkeep          # 数据库目录占位
```

---

## 🎯 目标用户

### OpenClaw 用户

- 已安装 OpenClaw v2026.2.9+
- 已配置 BOSS MCP
- 需要求职辅助

### Claude Code 用户

- 已安装 Claude Code CLI
- 已配置 MCP 服务器
- 需要求职辅助

---

## 📥 安装方式

### 方式 1: ClawHub（推荐）

```bash
clawhub install job-hunter
```

### 方式 2: GitHub

```bash
# 1. 克隆仓库
git clone https://github.com/Left2y/job-hunter.git ~/.openclaw/skills/job-hunter

# 2. 检查 BOSS MCP
mcporter list | grep bosszp

# 3. 创建简历文件
cat > ~/.openclaw/workspace/resume.md << 'EOF'
# 个人简历

姓名：你的名字
职位：UI 设计师
年限：5
学历：本科
技能：Figma, Sketch, UI 设计
EOF

# 4. 测试
node ~/.openclaw/skills/job-hunter/src/boss-search.js search "UI 设计师" 广州
```

---

## 🔧 前置要求

### 必需

- **Node.js** v18+
- **SQLite3** v3.30+
- **mcporter** v0.7+
- **BOSS 直聘 MCP** - 已配置并运行

### 可选

- **ask-search** - 公司背调（已包含在 Agent-Reach）
- **Tavily API** - 新闻搜索（通过 mcporter 配置）

---

## 🧪 测试命令

```bash
# 1. 测试岗位搜索
node src/boss-search.js search "UI 设计师" 广州

# 2. 测试 JD 解析
node src/jd-analyzer.js analyze "UI 设计师，要求 Figma，5 年经验"

# 3. 测试公司背调
node src/company-check.js "腾讯"

# 4. 测试面试准备
node src/interview-prep.js "腾讯" "UI 设计师"

# 5. 测试进度管理
node src/tracker.js list
node src/tracker.js stats
```

---

## 📊 使用示例

### OpenClaw 对话

```
用户：帮我找广州的 UI 设计工作
→ 自动调用 boss-search.js
→ 输出岗位列表

用户：给腾讯和字节发送招呼语
→ 自动调用 auto-greeting.js
→ 发送个性化招呼语

用户：查一下多利购科技的风险
→ 自动调用 company-check.js
→ 输出背调报告

用户：帮我准备腾讯的面试
→ 自动调用 interview-prep.js
→ 输出面试准备资料

用户：我的求职进度怎么样
→ 自动调用 tracker.js
→ 输出进度看板
```

---

## ⚠️ 注意事项

### BOSS MCP 限制

1. **频率控制** - 每小时最多 20 个招呼，每天 100 个
2. **工作时间** - 建议 9:00-18:00 发送
3. **Cookie 配置** - 需要用户登录 BOSS 直聘

### 隐私保护

- 所有数据本地存储
- 不上传任何个人信息
- SQLite 数据库仅本地访问

---

## 🔄 更新计划

### v0.2.0（计划中）

- [ ] 员工评价抓取（看准网/脉脉）
- [ ] 自动提醒系统
- [ ] 拉勾网支持

### v0.3.0（计划中）

- [ ] 简历优化建议
- [ ] 薪资查询
- [ ] 周报生成

---

## 🤝 贡献指南

### 提交 Issue

- Bug 报告
- 功能建议
- 使用问题

### 提交 PR

1. Fork 仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

---

## 📄 许可

MIT License - 详见 [LICENSE](LICENSE)

---

## 🔗 相关链接

- **GitHub**: https://github.com/Left2y/job-hunter
- **ClawHub**: https://clawhub.com
- **OpenClaw 文档**: https://docs.openclaw.ai
- **Agent-Reach**: https://github.com/Panniantong/agent-reach

---

## 📞 联系方式

- **作者**: Left2y
- **Email**: (可选)
- **Twitter**: (可选)

---

*JobHunter v0.1.0 - 让求职更高效！🌊*
