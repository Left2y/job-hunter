#!/usr/bin/env node
/**
 * JobHunter - 公司背景调查
 * 使用 ask-search + Tavily + browser 工具进行公司风险评估
 */

const { execSync } = require('child_process');

// 风险信号词库
const RISK_KEYWORDS = {
  high: [
    '劳动仲裁', '欠薪', '证监会警示', '无牌公司',
    '公司失联', '强制执行', '失信被执行人', '破产'
  ],
  medium: [
    '融资困难', '负面新闻', '频繁换帅', '大规模裁员',
    '拖欠工资', '社保断缴'
  ],
  low: [
    '正常经营', '正面评价', '融资成功', '扩张'
  ]
};

/**
 * 搜索公司基本信息
 * @param {string} companyName - 公司名称
 * @returns {Object} 公司信息
 */
function searchCompanyInfo(companyName) {
  try {
    console.log(`🔍 搜索公司基本信息：${companyName}`);
    
    const cmd = `ask-search "${companyName} 工商信息 成立时间 注册资本"`;
    const result = execSync(cmd, { encoding: 'utf-8' });
    
    // 解析结果（简化版）
    const info = {
      name: companyName,
      raw: result
    };
    
    console.log(`✅ 基本信息获取成功`);
    
    return info;
  } catch (e) {
    console.error('❌ 基本信息搜索失败:', e.message);
    return null;
  }
}

/**
 * 搜索风险信号
 * @param {string} companyName - 公司名称
 * @returns {Array} 风险信号列表
 */
function searchRiskSignals(companyName) {
  const risks = [];
  
  console.log(`⚠️  搜索风险信号：${companyName}`);
  
  // 搜索劳动仲裁/欠薪
  try {
    const cmd = `ask-search "${companyName} 劳动仲裁 欠薪 纠纷"`;
    const result = execSync(cmd, { encoding: 'utf-8' });
    
    if (result.length > 50) {
      risks.push({
        type: 'high',
        keyword: '劳动仲裁/欠薪',
        details: result.substring(0, 500)
      });
    }
  } catch (e) {
    // 无结果
  }
  
  // 搜索证监会警示
  try {
    const cmd = `ask-search "${companyName} 证监会 警示 无牌"`;
    const result = execSync(cmd, { encoding: 'utf-8' });
    
    if (result.length > 50) {
      risks.push({
        type: 'high',
        keyword: '证监会警示',
        details: result.substring(0, 500)
      });
    }
  } catch (e) {
    // 无结果
  }
  
  console.log(`✅ 发现 ${risks.length} 个风险信号`);
  
  return risks;
}

/**
 * 搜索新闻舆情
 * @param {string} companyName - 公司名称
 * @returns {Array} 新闻列表
 */
function searchNews(companyName) {
  try {
    console.log(`📰 搜索新闻舆情：${companyName}`);
    
    const cmd = `mcporter call 'tavily.web_search_tavily(query: "${companyName} 新闻 2025 2026", maxResults: 5)'`;
    const result = execSync(cmd, { encoding: 'utf-8' });
    
    const news = JSON.parse(result);
    
    console.log(`✅ 找到 ${news.results?.length || 0} 条新闻`);
    
    return news.results || [];
  } catch (e) {
    console.error('❌ 新闻搜索失败:', e.message);
    return [];
  }
}

/**
 * 评估综合风险等级
 * @param {Array} risks - 风险信号列表
 * @returns {string} 风险等级（high/medium/low）
 */
function evaluateRiskLevel(risks) {
  const highCount = risks.filter(r => r.type === 'high').length;
  const mediumCount = risks.filter(r => r.type === 'medium').length;
  
  if (highCount > 0) return 'high';
  if (mediumCount > 0) return 'medium';
  return 'low';
}

/**
 * 生成背调报告
 * @param {string} companyName - 公司名称
 * @returns {Object} 背调报告
 */
function generateReport(companyName) {
  console.log(`\n📋 生成公司背调报告：${companyName}\n`);
  
  // 1. 基本信息
  const info = searchCompanyInfo(companyName);
  
  // 2. 风险信号
  const risks = searchRiskSignals(companyName);
  
  // 3. 新闻舆情
  const news = searchNews(companyName);
  
  // 4. 风险等级
  const riskLevel = evaluateRiskLevel(risks);
  
  // 5. 建议
  const suggestions = generateSuggestions(riskLevel, risks);
  
  const report = {
    company: companyName,
    info,
    risks,
    news,
    riskLevel,
    suggestions,
    timestamp: new Date().toISOString()
  };
  
  return report;
}

/**
 * 生成建议
 * @param {string} riskLevel - 风险等级
 * @param {Array} risks - 风险信号
 * @returns {Array} 建议列表
 */
function generateSuggestions(riskLevel, risks) {
  const suggestions = [];
  
  if (riskLevel === 'high') {
    suggestions.push('⚠️  高风险公司，建议谨慎考虑');
    suggestions.push('面试时确认薪资发放记录');
    suggestions.push('要求查看劳动合同主体');
    suggestions.push('同时面试其他公司作为备选');
  } else if (riskLevel === 'medium') {
    suggestions.push('⚠️  中等风险，需要进一步了解');
    suggestions.push('询问公司近期经营状况');
    suggestions.push('确认五险一金缴纳情况');
  } else {
    suggestions.push('✅ 风险较低，可以放心面试');
    suggestions.push('正常准备面试即可');
  }
  
  return suggestions;
}

/**
 * 格式化背调报告输出
 * @param {Object} report - 背调报告
 */
function formatReport(report) {
  console.log('\n## 公司背调报告\n');
  console.log(`**公司**: ${report.company}`);
  console.log(`**生成时间**: ${report.timestamp}\n`);
  
  console.log('### 风险信号');
  
  if (report.risks.length === 0) {
    console.log('✅ 未发现明显风险信号\n');
  } else {
    console.log('| 类型 | 等级 | 详情 |');
    console.log('|------|------|------|');
    
    report.risks.forEach((risk, i) => {
      const icon = risk.type === 'high' ? '🔴' : '🟡';
      console.log(`| ${risk.keyword} | ${icon} ${risk.type} | ${risk.details.substring(0, 50)}... |`);
    });
    console.log('');
  }
  
  console.log('### 综合风险：' + getRiskIcon(report.riskLevel) + ' ' + getRiskText(report.riskLevel));
  console.log('');
  
  console.log('### 建议');
  report.suggestions.forEach(s => console.log('- ' + s));
  console.log('');
}

function getRiskIcon(level) {
  if (level === 'high') return '🔴';
  if (level === 'medium') return '🟡';
  return '🟢';
}

function getRiskText(level) {
  if (level === 'high') return '高风险';
  if (level === 'medium') return '中风险';
  return '低风险';
}

// CLI 入口
if (require.main === module) {
  const [, , companyName] = process.argv;
  
  if (!companyName) {
    console.log('用法：node company-check.js <公司名称>');
    console.log('示例：node company-check.js "多利购科技"');
    process.exit(1);
  }
  
  const report = generateReport(companyName);
  formatReport(report);
}

module.exports = { 
  searchCompanyInfo, 
  searchRiskSignals, 
  searchNews, 
  evaluateRiskLevel,
  generateReport, 
  formatReport 
};
