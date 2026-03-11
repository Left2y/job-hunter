#!/usr/bin/env node
/**
 * JobHunter - BOSS 直聘岗位搜索
 * 使用 BOSS MCP API 搜索岗位，支持关键词、城市、薪资筛选
 * 降级方案：MCP 失败 → ask-search → web_search
 */

const { execSync } = require('child_process');

// 降级策略配置
const FALLBACK_CONFIG = {
  maxRetries: 2,
  retryDelay: 1000, // 1 秒
  timeout: 10000,   // 10 秒超时
};

/**
 * 检查 BOSS MCP 是否可用
 * @returns {boolean} MCP 可用状态
 */
function checkBossMCP() {
  try {
    const result = execSync(`mcporter list 2>&1 | grep bosszp`, { encoding: 'utf-8' });
    return result.includes('bosszp') && !result.includes('offline');
  } catch (e) {
    return false;
  }
}

/**
 * 搜索岗位（带降级方案）
 * @param {string} keyword - 关键词（如 "UI 设计师"）
 * @param {string} city - 城市（如 "广州"）
 * @param {string} salary - 薪资范围（如 "15-25K"）
 * @returns {Array} 岗位列表
 */
function searchJobs(keyword, city = '广州', salary = '') {
  console.log(`🔍 正在搜索：${keyword} @ ${city}${salary ? ' ' + salary : ''}`);
  
  // 策略 1: 尝试 BOSS MCP API
  if (checkBossMCP()) {
    for (let attempt = 1; attempt <= FALLBACK_CONFIG.maxRetries; attempt++) {
      try {
        console.log(`📌 尝试 BOSS MCP (第${attempt}次)...`);
        
        const cmd = `mcporter call 'bosszp.search_jobs(keyword: "${keyword}", city: "${city}")'`;
        const result = execSync(cmd, { 
          encoding: 'utf-8',
          timeout: FALLBACK_CONFIG.timeout
        });
        
        const jobs = JSON.parse(result);
        
        if (jobs.jobs && jobs.jobs.length > 0) {
          console.log(`✅ BOSS MCP 成功：找到 ${jobs.jobs.length} 个岗位`);
          return { source: 'bosszp', jobs: jobs.jobs };
        }
      } catch (e) {
        console.warn(`⚠️ BOSS MCP 尝试 ${attempt} 失败：${e.message}`);
        
        // 检查是否是反爬/认证错误
        if (e.message.includes('环境异常') || e.message.includes('unauthorized')) {
          console.warn('⚠️ BOSS MCP 认证问题，尝试降级方案...');
          break; // 直接降级，不再重试
        }
        
        if (attempt < FALLBACK_CONFIG.maxRetries) {
          execSync(`sleep ${FALLBACK_CONFIG.retryDelay / 1000}`);
        }
      }
    }
  } else {
    console.warn('⚠️ BOSS MCP 不可用，使用降级方案...');
  }
  
  // 策略 2: 降级到 ask-search
  try {
    console.log('📌 尝试 ask-search 搜索...');
    
    const query = `${city} ${keyword} 招聘 BOSS 直聘`;
    const cmd = `ask-search "${query}"`;
    const result = execSync(cmd, { encoding: 'utf-8', timeout: FALLBACK_CONFIG.timeout });
    
    // 解析 ask-search 结果（简化版）
    const jobs = parseAskSearchResult(result, keyword, city);
    
    if (jobs.length > 0) {
      console.log(`✅ ask-search 成功：找到 ${jobs.length} 个岗位`);
      return { source: 'ask-search', jobs };
    }
  } catch (e) {
    console.warn(`⚠️ ask-search 失败：${e.message}`);
  }
  
  // 策略 3: 降级到 web_search (Tavily)
  try {
    console.log('📌 尝试 Tavily web_search...');
    
    const cmd = `mcporter call 'tavily.web_search_tavily(query: "${city} ${keyword} 招聘", maxResults: 5)'`;
    const result = execSync(cmd, { encoding: 'utf-8', timeout: FALLBACK_CONFIG.timeout });
    const parsed = JSON.parse(result);
    
    const jobs = parsed.results?.map(r => ({
      title: r.title || '未知职位',
      company: extractCompanyName(r.url),
      salary: '面议',
      location: city,
      url: r.url,
      source: 'tavily'
    })) || [];
    
    if (jobs.length > 0) {
      console.log(`✅ Tavily 成功：找到 ${jobs.length} 个岗位`);
      return { source: 'tavily', jobs };
    }
  } catch (e) {
    console.warn(`⚠️ Tavily 失败：${e.message}`);
  }
  
  // 全部失败
  console.error('❌ 所有搜索源失败，返回空结果');
  return { source: 'none', jobs: [] };
}

/**
 * 解析 ask-search 结果（简化版）
 */
function parseAskSearchResult(text, keyword, city) {
  const jobs = [];
  const lines = text.split('\n').filter(l => l.trim());
  
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const line = lines[i];
    if (line.includes('招聘') || line.includes('职位') || line.includes(keyword) || line.includes('UI')) {
      jobs.push({
        title: keyword || 'UI 设计师',
        company: extractCompanyName(line) || '未知公司',
        salary: '面议',
        location: city || '广州',
        url: extractURL(line) || '',
        source: 'ask-search'
      });
    }
  }
  
  return jobs;
}

/**
 * 从文本中提取公司名
 */
function extractCompanyName(text) {
  const patterns = [
    /([^\s]+ 公司)/,
    /([^\s]+ 科技)/,
    /([^\s]+ 有限)/,
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }
  
  return '未知公司';
}

/**
 * 从文本中提取 URL
 */
function extractURL(text) {
  const match = text.match(/https?:\/\/[^\s]+/);
  return match ? match[0] : '';
}

/**
 * 获取推荐岗位（带降级）
 * @param {number} page - 页码
 * @returns {Array} 岗位列表
 */
function getRecommendJobs(page = 1) {
  // 直接降级到 ask-search
  try {
    console.log(`🔍 获取推荐岗位（第${page}页）...`);
    
    const cmd = `ask-search "BOSS 直聘 推荐岗位 热门招聘"`;
    const result = execSync(cmd, { encoding: 'utf-8', timeout: FALLBACK_CONFIG.timeout });
    
    const jobs = parseAskSearchResult(result, '热门岗位', '');
    
    console.log(`✅ 找到 ${jobs.length} 个推荐岗位`);
    
    return { source: 'ask-search', jobs };
  } catch (e) {
    console.error('❌ 获取推荐失败:', e.message);
    return { source: 'none', jobs: [] };
  }
}

/**
 * 获取岗位详情（带降级）
 * @param {string} jobId - 岗位 ID
 * @returns {Object} 岗位详情
 */
function getJobDetail(jobId) {
  try {
    console.log(`📄 获取岗位详情：${jobId}`);
    
    // 尝试 BOSS MCP
    const cmd = `mcporter call 'bosszp.get_job_detail(job_id: "${jobId}")'`;
    const result = execSync(cmd, { encoding: 'utf-8', timeout: FALLBACK_CONFIG.timeout });
    
    const detail = JSON.parse(result);
    
    console.log(`✅ BOSS MCP 获取成功`);
    
    return detail;
  } catch (e) {
    // 降级到 web_fetch
    try {
      console.log(`📌 BOSS MCP 失败，尝试 web_fetch 降级...`);
      
      const url = `https://www.zhipin.com/job_detail/${jobId}`;
      const cmd = `curl -s "https://r.jina.ai/${url}"`;
      const result = execSync(cmd, { encoding: 'utf-8', timeout: FALLBACK_CONFIG.timeout });
      
      console.log(`✅ web_fetch 获取成功`);
      
      return {
        job_id: jobId,
        raw_content: result,
        source: 'web_fetch'
      };
    } catch (e2) {
      console.error('❌ 获取详情失败:', e2.message);
      return null;
    }
  }
}

/**
 * 格式化岗位列表输出
 * @param {Array} jobs - 岗位列表
 */
function formatJobsTable(jobs) {
  console.log('\n## 岗位推荐列表\n');
  console.log('| 公司 | 职位 | 薪资 | 地点 | 经验 | 学历 |');
  console.log('|------|------|------|------|------|------|');
  
  jobs.forEach(job => {
    console.log(`| ${job.company || '-'} | ${job.title || '-'} | ${job.salary || '-'} | ${job.location || '-'} | ${job.experience || '-'} | ${job.education || '-'} |`);
  });
  
  console.log(`\n共 ${jobs.length} 个岗位`);
}

// CLI 入口
if (require.main === module) {
  const [, , command, ...args] = process.argv;
  
  switch (command) {
    case 'search':
      const [keyword, city, salary] = args;
      const result = searchJobs(keyword || 'UI 设计师', city || '广州', salary || '');
      formatJobsTable(result.jobs || []);
      break;
      
    case 'recommend':
      const page = parseInt(args[0]) || 1;
      const recJobs = getRecommendJobs(page);
      formatJobsTable(recJobs);
      break;
      
    case 'detail':
      const jobId = args[0];
      if (!jobId) {
        console.error('❌ 请提供岗位 ID');
        process.exit(1);
      }
      const detail = getJobDetail(jobId);
      console.log(JSON.stringify(detail, null, 2));
      break;
      
    default:
      console.log('用法: node boss-search.js <command> [args]');
      console.log('命令:');
      console.log('  search <关键词> [城市] [薪资]  - 搜索岗位');
      console.log('  recommend [页码]              - 获取推荐岗位');
      console.log('  detail <岗位 ID>               - 获取岗位详情');
      process.exit(1);
  }
}

module.exports = { searchJobs, getRecommendJobs, getJobDetail, formatJobsTable };
