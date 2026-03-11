#!/usr/bin/env node
/**
 * JobHunter - 自动打招呼
 * 使用 BOSS MCP API 发送个性化招呼语
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 招呼语模板
const GREETING_TEMPLATES = {
  standard: `您好！我对{职位}很感兴趣。我有{年限}年{行业}经验，擅长{技能}。附件是我的作品集，期待进一步沟通！`,
  
  project: `您好！看到{公司}在招聘{职位}，我之前负责过{相关项目}，与岗位要求高度匹配。希望能有机会详细沟通！`,
  
  portfolio: `您好！我是{职业}，专注{领域}{年限}年。这是我的作品集：{链接} 与{公司}的业务方向非常契合，期待交流！`
};

/**
 * 发送打招呼消息
 * @param {string} jobId - 岗位 ID
 * @param {string} message - 招呼语内容
 * @returns {boolean} 发送结果
 */
function sendGreeting(jobId, message) {
  try {
    console.log(`📨 发送招呼语到岗位：${jobId}`);
    
    // 转义消息中的特殊字符
    const escapedMessage = message.replace(/"/g, '\\"');
    
    const cmd = `mcporter call 'bosszp.send_greeting(job_id: "${jobId}", message: "${escapedMessage}")'`;
    const result = execSync(cmd, { encoding: 'utf-8' });
    
    const response = JSON.parse(result);
    
    if (response.success) {
      console.log(`✅ 发送成功`);
      return true;
    } else {
      console.error(`❌ 发送失败：${response.error}`);
      return false;
    }
  } catch (e) {
    console.error('❌ 发送失败:', e.message);
    return false;
  }
}

/**
 * 获取聊天状态
 * @param {string} jobId - 岗位 ID
 * @returns {Object} 聊天状态
 */
function getChatStatus(jobId) {
  try {
    console.log(`💬 获取聊天状态：${jobId}`);
    
    const cmd = `mcporter call 'bosszp.get_chat_status(job_id: "${jobId}")'`;
    const result = execSync(cmd, { encoding: 'utf-8' });
    
    const status = JSON.parse(result);
    
    return status;
  } catch (e) {
    console.error('❌ 获取状态失败:', e.message);
    return null;
  }
}

/**
 * 生成个性化招呼语
 * @param {Object} jd - 岗位描述
 * @param {Object} resume - 用户简历
 * @param {string} template - 模板类型（standard/project/portfolio）
 * @returns {string} 招呼语
 */
function generateGreeting(jd, resume, template = 'standard') {
  const tmpl = GREETING_TEMPLATES[template] || GREETING_TEMPLATES.standard;
  
  // 提取匹配技能
  const matchSkills = extractMatchSkills(resume.skills, jd.requirements);
  
  // 填充模板
  let greeting = tmpl
    .replace(/{职位}/g, jd.title || '该职位')
    .replace(/{公司}/g, jd.company || '贵公司')
    .replace(/{年限}/g, resume.years || 'X')
    .replace(/{行业}/g, jd.industry || '相关')
    .replace(/{技能}/g, matchSkills.slice(0, 3).join('、'))
    .replace(/{职业}/g, resume.title || '设计师')
    .replace(/{领域}/g, jd.field || '设计')
    .replace(/{链接}/g, resume.portfolio || '作品集链接')
    .replace(/{相关项目}/g, resume.projects?.[0] || '相关项目');
  
  return greeting;
}

/**
 * 提取匹配技能
 * @param {Array} userSkills - 用户技能
 * @param {Array} jobRequirements - 岗位要求
 * @returns {Array} 匹配的技能
 */
function extractMatchSkills(userSkills, jobRequirements) {
  if (!userSkills || !jobRequirements) return [];
  
  const matches = [];
  jobRequirements.forEach(req => {
    userSkills.forEach(skill => {
      if (req.toLowerCase().includes(skill.toLowerCase())) {
        matches.push(skill);
      }
    });
  });
  
  return matches.length > 0 ? matches : userSkills.slice(0, 3);
}

/**
 * 批量发送招呼语
 * @param {Array} jobIds - 岗位 ID 列表
 * @param {Object} jd - 岗位描述
 * @param {Object} resume - 用户简历
 * @param {string} template - 模板类型
 * @returns {Object} 发送结果统计
 */
function batchSendGreetings(jobIds, jd, resume, template = 'standard') {
  const results = {
    total: jobIds.length,
    success: 0,
    failed: 0,
    details: []
  };
  
  console.log(`🚀 开始批量发送招呼语（${jobIds.length}个岗位）`);
  
  for (const jobId of jobIds) {
    const greeting = generateGreeting(jd, resume, template);
    const success = sendGreeting(jobId, greeting);
    
    results.details.push({ jobId, success, greeting });
    
    if (success) {
      results.success++;
    } else {
      results.failed++;
    }
    
    // 频率控制：每条间隔 30 秒
    if (jobIds.indexOf(jobId) < jobIds.length - 1) {
      console.log('⏳ 等待 30 秒...');
      execSync('sleep 30');
    }
  }
  
  console.log(`\n✅ 发送完成：成功${results.success}个，失败${results.failed}个`);
  
  return results;
}

/**
 * 格式化发送结果
 * @param {Object} results - 发送结果
 */
function formatResultsTable(results) {
  console.log('\n## 打招呼结果\n');
  console.log('| 岗位 ID | 状态 |');
  console.log('|--------|------|');
  
  results.details.forEach(item => {
    const status = item.success ? '✅ 已发送' : '❌ 失败';
    console.log(`| ${item.jobId} | ${status} |`);
  });
  
  console.log(`\n**统计**: 成功 ${results.success}/${results.total} | 失败 ${results.failed}`);
}

// CLI 入口
if (require.main === module) {
  const [, , command, ...args] = process.argv;
  
  switch (command) {
    case 'send':
      const [jobId, ...messageParts] = args;
      if (!jobId) {
        console.error('❌ 请提供岗位 ID');
        process.exit(1);
      }
      const message = messageParts.join(' ') || '您好，我对这个职位很感兴趣！';
      sendGreeting(jobId, message);
      break;
      
    case 'status':
      const statusJobId = args[0];
      if (!statusJobId) {
        console.error('❌ 请提供岗位 ID');
        process.exit(1);
      }
      const status = getChatStatus(statusJobId);
      console.log(JSON.stringify(status, null, 2));
      break;
      
    default:
      console.log('用法：node auto-greeting.js <command> [args]');
      console.log('命令:');
      console.log('  send <岗位 ID> [消息]  - 发送招呼语');
      console.log('  status <岗位 ID>        - 获取聊天状态');
      process.exit(1);
  }
}

module.exports = { 
  sendGreeting, 
  getChatStatus, 
  generateGreeting, 
  batchSendGreetings,
  formatResultsTable,
  TEMPLATES: GREETING_TEMPLATES
};
