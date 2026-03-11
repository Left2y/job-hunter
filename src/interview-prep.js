#!/usr/bin/env node
/**
 * JobHunter - 面试准备助手
 * 生成公司资料、预测面试问题、提供参考回答
 */

const { execSync } = require('child_process');

/**
 * 搜索公司资料
 * @param {string} companyName - 公司名称
 * @returns {Object} 公司资料
 */
function searchCompanyInfo(companyName) {
  try {
    console.log(`🔍 搜索公司资料：${companyName}`);
    
    const cmd = `ask-search "${companyName} 公司 产品 业务 规模"`;
    const result = execSync(cmd, { encoding: 'utf-8' });
    
    const info = {
      name: companyName,
      raw: result,
      products: extractProducts(result),
      culture: extractCulture(result)
    };
    
    console.log(`✅ 公司资料获取成功`);
    
    return info;
  } catch (e) {
    console.error('❌ 公司资料搜索失败:', e.message);
    return null;
  }
}

/**
 * 提取产品信息
 */
function extractProducts(text) {
  const keywords = ['产品', '业务', '服务', '平台'];
  const products = [];
  
  const lines = text.split('\n');
  for (const line of lines) {
    if (keywords.some(k => line.includes(k))) {
      products.push(line.trim());
      if (products.length >= 5) break;
    }
  }
  
  return products;
}

/**
 * 提取文化信息
 */
function extractCulture(text) {
  const cultureKeywords = ['文化', '价值观', '使命', '愿景'];
  
  for (const keyword of cultureKeywords) {
    const match = text.match(new RegExp(`${keyword}[：:]?\\s*([^\\n]+)`, 'i'));
    if (match) return match[1].trim();
  }
  
  return '';
}

/**
 * 生成预测问题
 * @param {string} position - 职位
 * @param {Object} jd - JD 对象
 * @param {string} companyType - 公司类型
 * @returns {Array} 问题列表
 */
function generateQuestions(position, jd, companyType = '互联网') {
  const questions = [];
  
  // 1. 自我介绍类
  questions.push({
    type: '自我介绍',
    question: '请做一个 3 分钟的自我介绍',
    tips: '突出与职位相关的经验和技能，控制在 3 分钟内'
  });
  
  // 2. 专业技能类
  if (jd && jd.skills && jd.skills.length > 0) {
    questions.push({
      type: '专业技能',
      question: `你如何使用${jd.skills[0]}完成一个设计项目？`,
      tips: '结合具体项目案例，说明工作流程和工具使用'
    });
  }
  
  // 3. 项目经验类
  questions.push({
    type: '项目经验',
    question: '介绍一个你最满意的项目，你是如何解决的？',
    tips: '使用 STAR 法则：情境 (S) - 任务 (T) - 行动 (A) - 结果 (R)'
  });
  
  // 4. 行为面试类
  questions.push({
    type: '行为面试',
    question: '如何平衡业务目标和用户体验？',
    tips: '展示数据驱动思维，举例说明如何权衡'
  });
  
  // 5. 工具/技术类
  if (position.includes('设计')) {
    questions.push({
      type: '工具技能',
      question: '有使用过 AI 设计工具吗？（Midjourney/Stable Diffusion）',
      tips: '如实回答，展示学习意愿和能力'
    });
  }
  
  // 6. 薪资期望类
  questions.push({
    type: '薪资期望',
    question: '你的期望薪资是多少？',
    tips: '给出范围而非具体数字，说明基于市场水平和个人能力'
  });
  
  console.log(`✅ 生成 ${questions.length} 个预测问题`);
  
  return questions;
}

/**
 * 生成参考回答框架
 * @param {Object} question - 问题对象
 * @param {Object} resume - 简历对象
 * @returns {string} 回答框架
 */
function generateAnswerFramework(question, resume) {
  switch (question.type) {
    case '自我介绍':
      return `1. 基本信息：我是${resume.name}，${resume.years}年${resume.title}经验
2. 核心技能：擅长${resume.skills.slice(0, 3).join('、')}
3. 代表项目：主导过${resume.projects?.[0] || '多个重要项目'}
4. 求职意向：希望加入贵公司，在${position}领域发展`;
    
    case '项目经验':
      return `S (情境)：项目背景是...
T (任务)：我负责的任务是...
A (行动)：我采取了以下行动...
  - 第一步...
  - 第二步...
R (结果)：最终取得了...成果（最好有数据支撑）`;
    
    case '行为面试':
      return `1. 表明态度：我认为业务目标和用户体验是统一的
2. 举例说明：在 XX 项目中...
3. 展示方法：通过数据验证、用户调研等方式
4. 总结：好的设计应该兼顾两者`;
    
    case '薪资期望':
      return `1. 市场调研：根据市场水平和我${resume.years}年的经验...
2. 给出范围：我的期望是 X-Y K（比底线高 20%）
3. 说明理由：基于我的技能和项目经验...
4. 表示灵活：具体可以根据公司薪酬体系协商`;
    
    default:
      return `1. 直接回答问题核心
2. 结合具体案例说明
3. 展示思考过程和方法论
4. 总结要点`;
  }
}

/**
 * 生成作品集建议
 * @param {string} position - 职位
 * @returns {Array} 建议列表
 */
function generatePortfolioSuggestions(position) {
  const suggestions = [];
  
  if (position.includes('设计')) {
    suggestions.push('准备 3-5 个完整的设计案例，包含设计过程');
    suggestions.push('每个案例准备设计决策说明（为什么这样设计）');
    suggestions.push('带上有数据验证的案例（上线后效果）');
    suggestions.push('准备 Sketch/Figma 源文件，可能现场查看');
  }
  
  if (position.includes('产品')) {
    suggestions.push('准备产品文档和原型');
    suggestions.push '展示数据分析能力');
    suggestions.push('准备用户调研案例');
  }
  
  suggestions.push('所有作品脱敏处理，避免泄露前公司机密');
  
  return suggestions;
}

/**
 * 生成面试准备报告
 * @param {string} company - 公司名称
 * @param {string} position - 职位
 * @param {Object} jd - JD 对象
 * @param {Object} resume - 简历对象
 * @returns {Object} 准备报告
 */
function generatePrepReport(company, position, jd, resume) {
  console.log(`\n📋 生成面试准备报告：${company} - ${position}\n`);
  
  // 1. 公司资料
  const companyInfo = searchCompanyInfo(company);
  
  // 2. 预测问题
  const questions = generateQuestions(position, jd);
  
  // 3. 参考回答
  questions.forEach(q => {
    q.answer = generateAnswerFramework(q, resume);
  });
  
  // 4. 作品集建议
  const portfolioSuggestions = generatePortfolioSuggestions(position);
  
  const report = {
    company,
    position,
    companyInfo,
    questions,
    portfolioSuggestions,
    timestamp: new Date().toISOString()
  };
  
  return report;
}

/**
 * 格式化面试准备报告
 */
function formatPrepReport(report) {
  console.log('\n## 面试准备资料\n');
  console.log(`**公司**: ${report.company}`);
  console.log(`**职位**: ${report.position}`);
  console.log(`**生成时间**: ${report.timestamp}\n`);
  
  if (report.companyInfo) {
    console.log('### 公司资料');
    if (report.companyInfo.products.length > 0) {
      console.log('**核心产品/业务**:');
      report.companyInfo.products.forEach(p => console.log('- ' + p));
    }
    if (report.companyInfo.culture) {
      console.log('\n**文化/价值观**: ' + report.companyInfo.culture);
    }
    console.log('');
  }
  
  console.log('### 预测问题\n');
  report.questions.forEach((q, i) => {
    console.log(`${i + 1}. **${q.type}**: ${q.question}`);
    console.log(`   💡 ${q.tips}`);
    console.log(`   📝 回答框架:\n   ${q.answer.split('\n').join('\n   ')}\n`);
  });
  
  console.log('### 作品集建议');
  report.portfolioSuggestions.forEach(s => console.log('- ' + s));
  console.log('');
}

// CLI 入口
if (require.main === module) {
  const [, , company, position] = process.argv;
  
  if (!company || !position) {
    console.log('用法：node interview-prep.js <公司> <职位>');
    console.log('示例：node interview-prep.js "腾讯" "UI 设计师"');
    process.exit(1);
  }
  
  const { loadResume } = require('./jd-analyzer.js');
  const resume = loadResume();
  const report = generatePrepReport(company, position, {}, resume);
  formatPrepReport(report);
}

module.exports = { 
  searchCompanyInfo, 
  generateQuestions, 
  generateAnswerFramework,
  generatePortfolioSuggestions,
  generatePrepReport,
  formatPrepReport
};
