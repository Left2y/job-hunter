# JobHunter - 一站式求职助手 🌊

**版本**: v0.1.0  
**作者**: Left2y  
**许可**: MIT

> 从岗位搜索→自动打招呼→面试→入职全流程支持  
> 核心：BOSS 直聘 MCP + 公司背调 + 面试准备

---

## 🚀 快速开始

### 前置要求

1. **OpenClaw** v2026.2.9+ 或 **Claude Code**
2. **Node.js** v18+
3. **BOSS 直聘 MCP** - 已配置并运行
4. **mcporter** - 已安装
5. **SQLite3** - 已安装

### 安装

#### 方式 1: ClawHub（推荐）

```bash
clawhub install job-hunter
```

#### 方式 2: 手动安装

```bash
git clone https://github.com/Left2y/job-hunter.git ~/.openclaw/skills/job-hunter
```

### 配置

#### 1. 检查 BOSS MCP 状态

```bash
mcporter list | grep bosszp
# 应显示：bosszp (5 tools, 0.xs)
```

#### 2. 测试连接

```bash
mcporter call 'bosszp.get_recommend_jobs(page: 1)'
```

#### 3. 创建简历文件

```bash
cat > ~/.openclaw/workspace/resume.md << 'EOF'
# 个人简历

姓名：你的名字
职位：UI 设计师
年限：5
学历：本科
技能：Figma, Sketch, UI 设计，交互设计，Axure
项目：B 端产品设计，SaaS 平台，数据可视化
作品集：https://your-portfolio.com
EOF
```

---

## 📋 使用方式

### 1. 搜索岗位

```bash
# CLI 方式
node ~/.openclaw/skills/job-hunter/src/boss-search.js search "UI 设计师" 广州

# OpenClaw 对话方式
帮我找广州的 UI 设计工作，薪资 15-25K
```

**输出**:
```markdown
## 岗位推荐列表

| 公司 | 职位 | 薪资 | 地点 | 经验 | 学历 |
|------|------|------|------|------|------|
| 腾讯 | UI 设计师 | 18-25K | 广州 | 3-5 年 | 本科 |
| 字节 | 交互设计 | 20-30K | 广州 | 3-5 年 | 本科 |
```

---

### 2. 自动打招呼

```bash
# CLI 方式
node ~/.openclaw/skills/job-hunter/src/auto-greeting.js send 123456 "您好，我对这个职位很感兴趣"

# OpenClaw 对话方式
给腾讯和字节这两个岗位发送招呼语
```

**输出**:
```markdown
## 打招呼结果

| 岗位 ID | 状态 |
|--------|------|
| 123456 | ✅ 已发送 |
| 789012 | ✅ 已发送 |

**统计**: 成功 2/2 | 失败 0
```

---

### 3. JD 匹配度分析

```bash
# CLI 方式
node ~/.openclaw/skills/job-hunter/src/jd-analyzer.js analyze "UI 设计师，要求 Figma/Sketch，5 年经验"

# OpenClaw 对话方式
分析一下这个 JD 和我的匹配度：[JD 链接]
```

**输出**:
```markdown
## JD 匹配度分析

**岗位**: UI 设计师
**匹配度**: 92% 🟢

### 匹配项 ✅
- ✅ Figma
- ✅ Sketch
- ✅ UI 设计

### 差距项 ⚠️
- ⚠️ 缺少：AIGC

### 简历优化建议
- 补充 AI 工具使用经验（Midjourney/Stable Diffusion 等）
- 突出与 JD 要求匹配的项目经验
```

---

### 4. 公司背调

```bash
# CLI 方式
node ~/.openclaw/skills/job-hunter/src/company-check.js "多利购科技"

# OpenClaw 对话方式
查一下多利购科技这家公司的风险
```

**输出**:
```markdown
## 公司背调报告

**公司**: 多利购科技

### 风险信号
| 类型 | 等级 | 详情 |
|------|------|------|
| 劳动仲裁 | 🔴 高 | 欠薪 7157 元 |
| 证监会警示 | 🔴 高 | 无牌公司 |

### 综合风险：🔴 高风险
**建议**: 谨慎考虑，确认薪资发放记录
```

---

### 5. 面试准备

```bash
# CLI 方式
node ~/.openclaw/skills/job-hunter/src/interview-prep.js "腾讯" "UI 设计师"

# OpenClaw 对话方式
帮我准备腾讯 UI 设计师的面试
```

**输出**:
```markdown
## 面试准备资料

**公司**: 腾讯
**职位**: UI 设计师

### 预测问题
1. **自我介绍**: 请做一个 3 分钟的自我介绍
   💡 突出与职位相关的经验和技能

2. **项目经验**: 介绍一个你最满意的项目
   💡 使用 STAR 法则

### 作品集建议
- 准备 3-5 个完整的设计案例
- 每个案例准备设计决策说明
```

---

### 6. 进度管理

```bash
# CLI 方式
node ~/.openclaw/skills/job-hunter/src/tracker.js list
node ~/.openclaw/skills/job-hunter/src/tracker.js stats

# OpenClaw 对话方式
我的求职进度怎么样
```

**输出**:
```markdown
## 求职进度看板

| 公司 | 职位 | 状态 | 薪资 | 匹配度 | 风险 | 下一步 |
|------|------|------|------|--------|------|--------|
| 腾讯 | UI 设计 | 面试中 | 18-25K | 92% | 🟢 | 周二 14:00 |
| 字节 | 交互设计 | 已沟通 | 20-30K | 88% | 🟢 | 等待回复 |

### 待处理提醒
- ⏰ 周二 14:00 - 腾讯 UI 设计：二面
```

---

## 🛠️ 开发

### 文件结构

```
job-hunter/
├── SKILL.md              # 技能说明
├── README.md             # 本文件
├── clawhub.yaml          # ClawHub 配置
├── src/
│   ├── boss-search.js    # BOSS 岗位搜索
│   ├── auto-greeting.js  # 自动打招呼
│   ├── jd-analyzer.js    # JD 解析
│   ├── company-check.js  # 公司背调
│   ├── interview-prep.js # 面试准备
│   └── tracker.js        # 进度管理
└── data/
    └── applications.db   # SQLite 数据库（自动生成）
```

### 本地测试

```bash
# 安装依赖（如有）
npm install

# 测试各模块
node src/boss-search.js search "UI 设计师" 广州
node src/auto-greeting.js send 123456 "您好"
node src/jd-analyzer.js analyze "UI 设计师，要求 Figma"
node src/company-check.js "腾讯"
node src/interview-prep.js "腾讯" "UI 设计师"
node src/tracker.js list
```

---

## 📊 功能特性

### ✅ 已实现

- [x] BOSS 直聘岗位搜索
- [x] 自动打招呼（个性化招呼语）
- [x] JD 解析与匹配度分析
- [x] 公司背景调查（风险检测）
- [x] 面试准备（问题预测 + 参考回答）
- [x] SQLite 进度追踪
- [x] 统计报告生成

### 🚧 计划中

- [ ] 员工评价抓取（看准网/脉脉）
- [ ] 自动提醒系统
- [ ] 周报生成
- [ ] 多平台支持（拉勾/猎聘）
- [ ] 简历优化建议
- [ ] 薪资查询

---

## ⚠️ 注意事项

### BOSS MCP 限制

1. **频率控制** - 每小时最多 20 个招呼，每天 100 个
2. **工作时间** - 仅 9:00-18:00 发送
3. **账号安全** - 避免短时间大量发送
4. **Cookie 配置** - 需要用户登录 BOSS 直聘

### 隐私保护

- 所有数据存储在本地（~/.openclaw/skills/job-hunter/data/）
- 不会上传任何个人信息到云端
- SQLite 数据库仅本地访问

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 开发环境设置

```bash
git clone https://github.com/Left2y/job-hunter.git
cd job-hunter
npm install  # 如有依赖
```

### 提交规范

- `feat:` 新功能
- `fix:` Bug 修复
- `docs:` 文档更新
- `style:` 代码格式
- `refactor:` 重构
- `test:` 测试
- `chore:` 构建/工具

---

## 📄 许可

MIT License - 详见 [LICENSE](LICENSE)

---

## 🔗 相关资源

- [OpenClaw 文档](https://docs.openclaw.ai)
- [ClawHub](https://clawhub.com)
- [Agent-Reach](https://github.com/Panniantong/agent-reach)
- [BOSS 直聘](https://www.zhipin.com/)

---

*JobHunter v0.1.0 - 让求职更高效！🌊*
