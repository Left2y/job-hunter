#!/usr/bin/env node
/**
 * JobHunter - 进度追踪管理
 * 使用 SQLite 存储申请记录，支持进度查询、统计、提醒
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 数据库路径
const DB_PATH = path.join(process.env.HOME, '.openclaw/skills/job-hunter/data/applications.db');

/**
 * 初始化数据库
 */
function initDB() {
  try {
    // 确保目录存在
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // 创建表
    const createTable = `
      CREATE TABLE IF NOT EXISTS applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        job_id TEXT,
        company TEXT NOT NULL,
        position TEXT NOT NULL,
        salary_range TEXT,
        status TEXT DEFAULT '已投递',
        risk_level TEXT DEFAULT 'unknown',
        match_rate INTEGER DEFAULT 0,
        greeting_sent BOOLEAN DEFAULT 0,
        hr_replied BOOLEAN DEFAULT 0,
        interview_date TEXT,
        offer_salary TEXT,
        notes TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
      
      CREATE TABLE IF NOT EXISTS reminders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        application_id INTEGER,
        type TEXT,
        scheduled_time TEXT,
        completed BOOLEAN DEFAULT 0,
        reminder_text TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY (application_id) REFERENCES applications(id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_status ON applications(status);
      CREATE INDEX IF NOT EXISTS idx_company ON applications(company);
    `;
    
    execSync(`sqlite3 "${DB_PATH}" "${createTable}"`, { encoding: 'utf-8' });
    
    console.log('✅ 数据库初始化成功');
    
    return true;
  } catch (e) {
    console.error('❌ 数据库初始化失败:', e.message);
    return false;
  }
}

/**
 * 添加申请记录
 */
function addApplication(data) {
  try {
    const sql = `
      INSERT INTO applications 
      (job_id, company, position, salary_range, status, risk_level, match_rate, greeting_sent, notes)
      VALUES 
      ('${data.job_id || ''}', '${data.company}', '${data.position}', '${data.salary || ''}', 
       '${data.status || '已投递'}', '${data.risk_level || 'unknown'}', ${data.match_rate || 0}, 
       ${data.greeting_sent ? 1 : 0}, '${data.notes || ''}');
    `;
    
    execSync(`sqlite3 "${DB_PATH}" "${sql}"`, { encoding: 'utf-8' });
    
    console.log(`✅ 添加申请记录：${data.company} - ${data.position}`);
    
    return true;
  } catch (e) {
    console.error('❌ 添加记录失败:', e.message);
    return false;
  }
}

/**
 * 更新申请状态
 */
function updateStatus(id, status, notes = '') {
  try {
    const sql = `
      UPDATE applications 
      SET status = '${status}', notes = '${notes}', updated_at = datetime('now')
      WHERE id = ${id};
    `;
    
    execSync(`sqlite3 "${DB_PATH}" "${sql}"`, { encoding: 'utf-8' });
    
    console.log(`✅ 更新状态：${status}`);
    
    return true;
  } catch (e) {
    console.error('❌ 更新状态失败:', e.message);
    return false;
  }
}

/**
 * 查询申请记录
 */
function queryApplications(filters = {}) {
  try {
    let where = [];
    
    if (filters.status) {
      where.push(`status = '${filters.status}'`);
    }
    
    if (filters.company) {
      where.push(`company LIKE '%${filters.company}%'`);
    }
    
    const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';
    
    const sql = `
      SELECT id, job_id, company, position, salary_range, status, risk_level, 
             match_rate, greeting_sent, hr_replied, interview_date, notes, created_at
      FROM applications
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT 50;
    `;
    
    const result = execSync(`sqlite3 "${DB_PATH}" "${sql}"`, { encoding: 'utf-8' });
    
    // 解析结果
    const applications = result.trim().split('\n').filter(line => line).map(line => {
      const [id, job_id, company, position, salary_range, status, risk_level, 
             match_rate, greeting_sent, hr_replied, interview_date, notes, created_at] = line.split('|');
      
      return {
        id, job_id, company, position, salary_range, status, risk_level,
        match_rate, greeting_sent: greeting_sent === '1', hr_replied: hr_replied === '1',
        interview_date, notes, created_at
      };
    });
    
    return applications;
  } catch (e) {
    console.error('❌ 查询失败:', e.message);
    return [];
  }
}

/**
 * 添加提醒
 */
function addReminder(applicationId, type, scheduledTime, text) {
  try {
    const sql = `
      INSERT INTO reminders (application_id, type, scheduled_time, reminder_text)
      VALUES (${applicationId}, '${type}', '${scheduledTime}', '${text}');
    `;
    
    execSync(`sqlite3 "${DB_PATH}" "${sql}"`, { encoding: 'utf-8' });
    
    console.log(`✅ 添加提醒：${text}`);
    
    return true;
  } catch (e) {
    console.error('❌ 添加提醒失败:', e.message);
    return false;
  }
}

/**
 * 查询待处理提醒
 */
function getPendingReminders() {
  try {
    const sql = `
      SELECT r.id, r.application_id, r.type, r.scheduled_time, r.reminder_text,
             a.company, a.position
      FROM reminders r
      LEFT JOIN applications a ON r.application_id = a.id
      WHERE r.completed = 0
      ORDER BY r.scheduled_time ASC;
    `;
    
    const result = execSync(`sqlite3 "${DB_PATH}" "${sql}"`, { encoding: 'utf-8' });
    
    const reminders = result.trim().split('\n').filter(line => line).map(line => {
      const [id, application_id, type, scheduled_time, reminder_text, company, position] = line.split('|');
      return { id, application_id, type, scheduled_time, reminder_text, company, position };
    });
    
    return reminders;
  } catch (e) {
    console.error('❌ 查询提醒失败:', e.message);
    return [];
  }
}

/**
 * 标记提醒为已完成
 */
function completeReminder(id) {
  try {
    const sql = `UPDATE reminders SET completed = 1 WHERE id = ${id};`;
    execSync(`sqlite3 "${DB_PATH}" "${sql}"`, { encoding: 'utf-8' });
    console.log(`✅ 标记提醒已完成`);
    return true;
  } catch (e) {
    console.error('❌ 更新提醒失败:', e.message);
    return false;
  }
}

/**
 * 生成统计报告
 */
function generateStats() {
  try {
    const stats = {
      total: 0,
      byStatus: {},
      byRisk: {},
      avgMatchRate: 0,
      greetingSent: 0,
      hrReplied: 0
    };
    
    // 总数
    const totalResult = execSync(`sqlite3 "${DB_PATH}" "SELECT COUNT(*) FROM applications;"`, { encoding: 'utf-8' });
    stats.total = parseInt(totalResult.trim());
    
    // 按状态统计
    const statusResult = execSync(`sqlite3 "${DB_PATH}" "SELECT status, COUNT(*) FROM applications GROUP BY status;"`, { encoding: 'utf-8' });
    statusResult.trim().split('\n').filter(l => l).forEach(line => {
      const [status, count] = line.split('|');
      stats.byStatus[status] = parseInt(count);
    });
    
    // 按风险等级统计
    const riskResult = execSync(`sqlite3 "${DB_PATH}" "SELECT risk_level, COUNT(*) FROM applications GROUP BY risk_level;"`, { encoding: 'utf-8' });
    riskResult.trim().split('\n').filter(l => l).forEach(line => {
      const [risk, count] = line.split('|');
      stats.byRisk[risk] = parseInt(count);
    });
    
    // 平均匹配度
    const matchResult = execSync(`sqlite3 "${DB_PATH}" "SELECT AVG(match_rate) FROM applications;"`, { encoding: 'utf-8' });
    stats.avgMatchRate = Math.round(parseFloat(matchResult.trim()) || 0);
    
    // 打招呼统计
    const greetingResult = execSync(`sqlite3 "${DB_PATH}" "SELECT SUM(CASE WHEN greeting_sent = 1 THEN 1 ELSE 0 END), SUM(CASE WHEN hr_replied = 1 THEN 1 ELSE 0 END) FROM applications;"`, { encoding: 'utf-8' });
    const [sent, replied] = greetingResult.trim().split('|');
    stats.greetingSent = parseInt(sent) || 0;
    stats.hrReplied = parseInt(replied) || 0;
    
    return stats;
  } catch (e) {
    console.error('❌ 生成统计失败:', e.message);
    return null;
  }
}

/**
 * 格式化进度看板
 */
function formatDashboard(applications, reminders) {
  console.log('\n## 求职进度看板\n');
  console.log('| 公司 | 职位 | 状态 | 薪资 | 匹配度 | 风险 | 下一步 |');
  console.log('|------|------|------|------|--------|------|--------|');
  
  applications.forEach(app => {
    const statusIcon = getStatusIcon(app.status);
    const riskIcon = getRiskIcon(app.risk_level);
    const nextStep = getNextStep(app);
    
    console.log(`| ${app.company} | ${app.position} | ${statusIcon} ${app.status} | ${app.salary_range || '-'} | ${app.match_rate}% | ${riskIcon} | ${nextStep} |`);
  });
  
  console.log(`\n**总计**: ${applications.length} 个申请\n`);
  
  if (reminders.length > 0) {
    console.log('### 待处理提醒');
    reminders.forEach(r => {
      console.log(`- ⏰ ${r.scheduled_time} - ${r.company} ${r.position}: ${r.reminder_text}`);
    });
    console.log('');
  }
}

function getStatusIcon(status) {
  const icons = {
    '已投递': '📭',
    '已沟通': '💬',
    '面试中': '🎤',
    '已 offer': '✅',
    '已拒绝': '❌'
  };
  return icons[status] || '📋';
}

function getRiskIcon(risk) {
  if (risk === 'high') return '🔴';
  if (risk === 'medium') return '🟡';
  if (risk === 'low') return '🟢';
  return '⚪';
}

function getNextStep(app) {
  if (app.status === '面试中' && app.interview_date) return app.interview_date;
  if (app.status === '已沟通' && !app.hr_replied) return '等待回复';
  if (app.status === '已投递') return '等待回应';
  return '-';
}

/**
 * 格式化统计报告
 */
function formatStats(stats) {
  console.log('\n## 求职统计\n');
  console.log(`**总申请数**: ${stats.total}`);
  console.log(`**平均匹配度**: ${stats.avgMatchRate}%`);
  console.log(`**已打招呼**: ${stats.greetingSent}`);
  console.log(`**HR 回复**: ${stats.hrReplied}`);
  console.log(`**回复率**: ${stats.greetingSent > 0 ? Math.round(stats.hrReplied / stats.greetingSent * 100) : 0}%\n`);
  
  console.log('### 按状态分布');
  for (const [status, count] of Object.entries(stats.byStatus)) {
    console.log(`- ${status}: ${count}`);
  }
  console.log('');
  
  console.log('### 按风险等级');
  for (const [risk, count] of Object.entries(stats.byRisk)) {
    const icon = getRiskIcon(risk);
    console.log(`- ${icon} ${risk}: ${count}`);
  }
  console.log('');
}

// CLI 入口
if (require.main === module) {
  const [, , command, ...args] = process.argv;
  
  // 初始化数据库
  initDB();
  
  switch (command) {
    case 'add':
      const [company, position, salary] = args;
      if (!company || !position) {
        console.error('❌ 请提供公司和职位');
        process.exit(1);
      }
      addApplication({ company, position, salary });
      break;
      
    case 'list':
      const apps = queryApplications();
      const reminders = getPendingReminders();
      formatDashboard(apps, reminders);
      break;
      
    case 'stats':
      const stats = generateStats();
      if (stats) formatStats(stats);
      break;
      
    case 'update':
      const [id, status] = args;
      if (!id || !status) {
        console.error('❌ 请提供 ID 和状态');
        process.exit(1);
      }
      updateStatus(id, status);
      break;
      
    default:
      console.log('用法：node tracker.js <command> [args]');
      console.log('命令:');
      console.log('  add <公司> <职位> [薪资]  - 添加申请记录');
      console.log('  list                      - 查看进度看板');
      console.log('  stats                     - 查看统计报告');
      console.log('  update <ID> <状态>        - 更新状态');
      process.exit(1);
  }
}

module.exports = { 
  initDB, 
  addApplication, 
  updateStatus, 
  queryApplications,
  addReminder,
  getPendingReminders,
  completeReminder,
  generateStats,
  formatDashboard,
  formatStats
};
