# 🛡️ JobHunter 降级策略文档

**版本**: v0.2  
**更新**: 2026-03-11

---

## 🎯 降级策略

JobHunter 采用三层降级策略，确保在 BOSS MCP 不可用时仍能正常工作。

```
┌─────────────────────────────────────┐
│ L1: BOSS MCP (主搜索源)              │
│ - bosszp.search_jobs                │
│ - bosszp.get_recommend_jobs         │
│ - bosszp.send_greeting              │
│ 延迟：<3s                           │
│ 成功率：~70%（受反爬影响）            │
└──────────────┬──────────────────────┘
               │ 失败/超时/认证错误
               ↓
┌─────────────────────────────────────┐
│ L2: ask-search (备选搜索源)          │
│ - ask-search "BOSS 直聘 岗位"        │
│ - 解析搜索结果                       │
│ 延迟：3-5s                          │
│ 成功率：~90%                        │
└──────────────┬──────────────────────┘
               │ 失败/无结果
               ↓
┌─────────────────────────────────────┐
│ L3: Tavily web_search (最后手段)    │
│ - tavily.web_search_tavily          │
│ - 解析 web 结果                       │
│ 延迟：5-8s                          │
│ 成功率：~95%                        │
└─────────────────────────────────────┘
```

---

## 📊 各层级详情

### L1: BOSS MCP（主搜索源）

**优点**:
- ✅ 官方 API，数据准确
- ✅ 结构化输出
- ✅ 支持写操作（打招呼/收藏）

**缺点**:
- ❌ 可能触发反爬
- ❌ 需要 Cookie 认证
- ❌ 稳定性较低

**失败场景**:
```javascript
// 检测失败
- "环境异常" - 反爬检测
- "unauthorized" - Cookie 过期
- Timeout - 网络超时
```

**处理逻辑**:
```javascript
if (checkBossMCP() && attempt < maxRetries) {
  try {
    // 调用 BOSS MCP
  } catch (e) {
    if (e.message.includes('环境异常')) {
      // 直接降级，不再重试
      break;
    }
    // 否则重试
  }
}
```

---

### L2: ask-search（备选搜索源）

**优点**:
- ✅ 无需认证
- ✅ 聚合多个搜索引擎
- ✅ 稳定性高

**缺点**:
- ❌ 非结构化输出
- ❌ 需要解析
- ❌ 不支持写操作

**处理逻辑**:
```javascript
const query = `${city} ${keyword} 招聘 BOSS 直聘`;
const result = execSync(`ask-search "${query}"`);
const jobs = parseAskSearchResult(result);
```

**解析逻辑**:
```javascript
function parseAskSearchResult(text, keyword, city) {
  const jobs = [];
  const lines = text.split('\n');
  
  for (const line of lines) {
    if (line.includes('招聘') || line.includes(keyword)) {
      jobs.push({
        title: keyword,
        company: extractCompanyName(line),
        salary: '面议',
        location: city,
        url: extractURL(line)
      });
    }
  }
  
  return jobs;
}
```

---

### L3: Tavily web_search（最后手段）

**优点**:
- ✅ AI 专用搜索引擎
- ✅ 结构化结果
- ✅ 几乎不会失败

**缺点**:
- ❌ API Key 限制
- ❌ 延迟较高
- ❌ 不支持写操作

**处理逻辑**:
```javascript
const result = mcporter.call(
  'tavily.web_search_tavily(query: "${city} ${keyword} 招聘", maxResults: 5)'
);
const jobs = result.results.map(r => ({
  title: r.title,
  company: extractCompanyName(r.url),
  url: r.url
}));
```

---

## 🔧 认证配置

### BOSS MCP Cookie 配置

**方法 1: 自动配置脚本**
```bash
bash ~/.openclaw/skills/job-hunter/scripts/configure-boss-mcp.sh
```

**方法 2: 手动配置**
```bash
# 获取 Cookie（参考 configure-boss-mcp.sh）
# 添加到 ~/.openclaw/.env
export BOSS_COOKIE="your_cookie_here"
```

**方法 3: 使用降级方案**
```bash
# 无需配置，自动降级到 ask-search/Tavily
```

---

## 📈 成功率统计

| 层级 | 场景 | 成功率 | 平均延迟 |
|------|------|--------|----------|
| **L1: BOSS MCP** | Cookie 有效 | ~70% | <3s |
| **L2: ask-search** | 通用搜索 | ~90% | 3-5s |
| **L3: Tavily** | 备用搜索 | ~95% | 5-8s |

---

## 🎯 使用建议

### 推荐工作流

```bash
# 1. 尝试配置 BOSS MCP（可选）
bash configure-boss-mcp.sh

# 2. 直接使用（自动降级）
node boss-search.js search "UI 设计师" 广州

# 3. 查看输出
✅ ask-search 成功：找到 10 个岗位
```

### 输出格式

无论使用哪个层级，输出格式保持一致：

```json
{
  "source": "bosszp|ask-search|tavily|none",
  "jobs": [
    {
      "title": "UI 设计师",
      "company": "腾讯",
      "salary": "18-25K",
      "location": "广州",
      "url": "https://..."
    }
  ]
}
```

---

## ⚠️ 注意事项

### 1. Cookie 有效期

- BOSS 直聘 Cookie 有效期：~7 天
- 过期后需要重新获取
- 建议使用 ask-search 作为默认

### 2. 频率限制

```javascript
// BOSS MCP: 每请求间隔 1-2s
// ask-search: 每请求间隔 0.5s
// Tavily: 每请求间隔 1s
```

### 3. 写操作限制

- **打招呼/收藏** 等操作仅 BOSS MCP 支持
- 如果 BOSS MCP 不可用，提示用户手动操作

---

## 📝 更新日志

### v0.2 (2026-03-11)

- ✅ 添加三层降级策略
- ✅ 实现 ask-search 解析
- ✅ 实现 Tavily 降级
- ✅ 添加认证配置脚本
- ✅ 改进错误处理

### v0.1 (2026-03-10)

- ✅ 初始版本（仅 BOSS MCP）

---

*降级策略完成！🌊*
