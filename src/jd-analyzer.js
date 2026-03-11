#!/usr/bin/env node
/**
 * JobHunter - JD 解析与简历匹配度分析
 * 提取 JD 核心要求，与用户简历对比，输出匹配度评分
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 默认简历路径
const DEFAULT_RESUME_PATH = path.join(process.env.HOME, '.openclaw/workspace/resume.md');

/**
 * 读取用户简历
 * @returns {Object} 简历对象
 */
function loadResume(resumePath = DEFAULT_RESUME_PATH) {
  try {
    if (!fs.existsSync(resumePath)) {
      console.warn('⚠️  简历文件不存在，请创建：' + resumePath);
      return createDefaultResume();
    }
    
    const content = fs.readFileSync(resumePath, 'utf-8');
    
    // 简单解析 Markdown 简历
    const resume = {
      name: extractField(content, '姓名') || '用户',
      title: extractField(content, '职位') || '设计师',
      years: parseInt(extractField(content, '年限') || '0'),
      skills: extractSkills(content),
      projects: extractProjects(content),
      education: extractField(content, '学历') || '本科',
      portfolio: extractField(content, '作品集') || ''
    };
    
    console.log(`✅ 简历加载成功：${resume.name} - ${resume.title}`);
    
    return resume;
  } catch (e) {
    console.error('❌ 简历加载失败:', e.message);
    return createDefaultResume();
  }
}

/**
 * 创建默认简历模板
 */
function createDefaultResume() {
  return {
    name: '用户',
    title: '设计师',
    years: 5,
    skills: ['Figma', 'Sketch', 'UI 设计', '交互设计'],
    projects: ['B 端产品设计', 'SaaS 平台'],
    education: '本科',
    portfolio: ''
  };
}

/**
 * 提取 Markdown 字段
 */
function extractField(content, field) {
  const regex = new RegExp(`${field}[：:]\\s*(.+)`, 'i');
  const match = content.match(regex);
  return match ? match[1].trim() : null;
}

/**
 * 提取技能列表
 */
function extractSkills(content) {
  const skills = [];
  const skillMatch = content.match(/技能 [：:]?\s*([^\n]+)/i);
  if (skillMatch) {
    return skillMatch[1].split(/[,,]/).map(s => s.trim()).filter(s => s);
  }
  return [];
}

/**
 * 提取项目列表
 */
function extractProjects(content) {
  const projects = [];
  const projectMatch = content.match(/项目 [：:]?\s*([^\n]+)/i);
  if (projectMatch) {
    return projectMatch[1].split(/[,,]/).map(p => p.trim()).filter(p => p);
  }
  return [];
}

/**
 * 解析 JD 内容
 * @param {string} jdText - JD 文本
 * @returns {Object} JD 对象
 */
function parseJD(jdText) {
  const jd = {
    title: '',
    company: '',
    salary: '',
    location: '',
    experience: '',
    education: '',
    requirements: [],
    responsibilities: [],
    skills: []
  };
  
  // 提取职位标题
  const titleMatch = jdText.match(/([A-Za-z 0-9\u4e00-\u9fa5]+设计师|[A-Za-z 0-9\u4e00-\u9fa5]+工程师)/);
  if (titleMatch) jd.title = titleMatch[0];
  
  // 提取薪资
  const salaryMatch = jdText.match(/(\d+-\d+K|\d+k-\d+k|\d+-\d+ 万)/i);
  if (salaryMatch) jd.salary = salaryMatch[0];
  
  // 提取地点
  const locationMatch = jdText.match(/(北京 | 上海 | 广州 | 深圳 | 杭州 | 成都)/);
  if (locationMatch) jd.location = locationMatch[0];
  
  // 提取经验要求
  const expMatch = jdText.match(/(\d+-?\d*年 | 经验不限 | 应届生 | 在校生)/);
  if (expMatch) jd.experience = expMatch[0];
  
  // 提取学历要求
  const eduMatch = jdText.match(/(本科 | 硕士 | 大专 | 博士 | 学历不限)/);
  if (eduMatch) jd.education = eduMatch[0];
  
  // 提取技能要求
  const skillKeywords = ['Figma', 'Sketch', 'Photoshop', 'AI', 'Axure', 'Principle', 'UI', 'UX', '交互', '视觉', '前端', 'HTML', 'CSS'];
  skillKeywords.forEach(keyword => {
    if (jdText.toLowerCase().includes(keyword.toLowerCase())) {
      jd.skills.push(keyword);
    }
  });
  
  // 提取要求列表
  const reqSection = jdText.split(/职位职责|任职要求/)[1] || jdText;
  const reqLines = reqSection.split('\n').filter(line => line.trim().match(/^[\d\.\-•]/));
  jd.requirements = reqLines.slice(0, 10);
  
  console.log(`✅ JD 解析成功：${jd.title || '未知职位'}`);
  
  return jd;
}

/**
 * 计算匹配度
 * @param {Object} jd - JD 对象
 * @param {Object} resume - 简历对象
 * @returns {Object} 匹配度分析结果
 */
function calculateMatch(jd, resume) {
  const dimensions = [
    { name: '硬技能', weight: 40, score: calculateSkillMatch(jd.skills, resume.skills) },
    { name: '经验', weight: 25, score: calculateExperienceMatch(jd.experience, resume.years) },
    { name: '学历', weight: 10, score: calculateEducationMatch(jd.education, resume.education) },
    { name: '软技能', weight: 20, score: calculateSoftSkillMatch(jd.requirements, resume.projects) },
    { name: '薪资', weight: 5, score: 80 } // 默认薪资匹配
  ];
  
  const totalScore = dimensions.reduce((sum, d) => sum + d.score * d.weight / 100, 0);
  
  const matches = [];
  const gaps = [];
  
  // 找出匹配项
  jd.skills.forEach(skill => {
    if (resume.skills.some(s => s.toLowerCase().includes(skill.toLowerCase()))) {
      matches.push(`✅ ${skill}`);
    } else {
      gaps.push(`⚠️ 缺少：${skill}`);
    }
  });
  
  return {
    totalScore: Math.round(totalScore),
    dimensions,
    matches,
    gaps,
    suggestions: generateSuggestions(gaps, jd)
  };
}

/**
 * 技能匹配度
 */
function calculateSkillMatch(jdSkills, resumeSkills) {
  if (!jdSkills.length) return 80;
  
  const matched = jdSkills.filter(skill => 
    resumeSkills.some(s => s.toLowerCase().includes(skill.toLowerCase()))
  );
  
  return Math.round((matched.length / jdSkills.length) * 100);
}

/**
 * 经验匹配度
 */
function calculateExperienceMatch(jdExperience, resumeYears) {
  if (!jdExperience) return 80;
  
  const expMatch = jdExperience.match(/(\d+)-?(\d*)/);
  if (!expMatch) return 80;
  
  const minYears = parseInt(expMatch[1]);
  const maxYears = expMatch[2] ? parseInt(expMatch[2]) : minYears + 5;
  
  if (resumeYears >= minYears && resumeYears <= maxYears) return 100;
  if (resumeYears >= minYears - 1) return 80;
  if (resumeYears >= minYears - 2) return 60;
  return 40;
}

/**
 * 学历匹配度
 */
function calculateEducationMatch(jdEducation, resumeEducation) {
  const eduLevels = { '大专': 1, '本科': 2, '硕士': 3, '博士': 4 };
  
  if (!jdEducation || jdEducation === '学历不限') return 100;
  
  const jdLevel = eduLevels[jdEducation] || 0;
  const resumeLevel = eduLevels[resumeEducation] || 0;
  
  if (resumeLevel >= jdLevel) return 100;
  if (resumeLevel === jdLevel - 1) return 70;
  return 40;
}

/**
 * 软技能匹配度
 */
function calculateSoftSkillMatch(requirements, projects) {
  const softKeywords = ['沟通', '团队', '协作', '管理', '领导', '抗压', '学习'];
  const hasSoftSkills = requirements.some(req => 
    softKeywords.some(keyword => req.includes(keyword))
  );
  
  if (!hasSoftSkills) return 80;
  if (projects.length > 0) return 90;
  return 70;
}

/**
 * 生成建议
 */
function generateSuggestions(gaps, jd) {
  const suggestions = [];
  
  if (gaps.length > 0) {
    suggestions.push('简历优化：补充以下技能的学习经历：' + gaps.slice(0, 3).map(g => g.replace('⚠️ 缺少：', '')).join('、'));
  }
  
  if (jd.skills.includes('AI') || jd.skills.includes('AIGC')) {
    suggestions.push('建议补充 AI 工具使用经验（Midjourney/Stable Diffusion 等）');
  }
  
  suggestions.push('突出与 JD 要求匹配的项目经验');
  suggestions.push('使用 JD 中的关键词优化简历描述');
  
  return suggestions;
}

/**
 * 生成招呼语建议
 */
function generateGreetingSuggestion(jd, resume, matchResult) {
  const matchSkills = jd.skills.filter(skill => 
    resume.skills.some(s => s.toLowerCase().includes(skill.toLowerCase()))
  );
  
  return `您好！我对${jd.title || '该职位'}很感兴趣。我有${resume.years}年相关经验，擅长${matchSkills.slice(0, 3).join('、')}。${matchResult.totalScore >= 80 ? '与岗位要求高度匹配，' : ''}期待进一步沟通！`;
}

/**
 * 格式化匹配度输出
 */
function formatMatchResult(jd, resume, result) {
  console.log('\n## JD 匹配度分析\n');
  console.log(`**岗位**: ${jd.title || '未知'} ${jd.company ? '@ ' + jd.company : ''}`);
  console.log(`**匹配度**: ${result.totalScore}% ${getScoreIcon(result.totalScore)}\n`);
  
  console.log('### 匹配项 ✅');
  if (result.matches.length > 0) {
    result.matches.forEach(m => console.log('- ' + m));
  } else {
    console.log('- 基本信息匹配');
  }
  console.log('');
  
  console.log('### 差距项 ⚠️');
  if (result.gaps.length > 0) {
    result.gaps.forEach(g => console.log('- ' + g));
  } else {
    console.log('- 无明显差距');
  }
  console.log('');
  
  console.log('### 简历优化建议');
  result.suggestions.forEach(s => console.log('- ' + s));
  console.log('');
  
  console.log('### 招呼语建议');
  const greeting = generateGreetingSuggestion(jd, resume, result);
  console.log('```');
  console.log(greeting);
  console.log('```\n');
}

function getScoreIcon(score) {
  if (score >= 90) return '🟢';
  if (score >= 70) return '🟡';
  return '🔴';
}

/**
 * 从 URL 提取 JD 内容
 */
function fetchJDFromURL(url) {
  try {
    console.log(`📄 从 URL 提取 JD: ${url}`);
    
    const cmd = `curl -s "https://r.jina.ai/${url}"`;
    const result = execSync(cmd, { encoding: 'utf-8' });
    
    console.log(`✅ JD 提取成功`);
    
    return result;
  } catch (e) {
    console.error('❌ JD 提取失败:', e.message);
    return null;
  }
}

// CLI 入口
if (require.main === module) {
  const [, , command, ...args] = process.argv;
  
  switch (command) {
    case 'analyze':
      const jdText = args.join(' ');
      if (!jdText) {
        console.error('❌ 请提供 JD 内容或 URL');
        process.exit(1);
      }
      
      const jd = parseJD(jdText);
      const resume = loadResume();
      const result = calculateMatch(jd, resume);
      formatMatchResult(jd, resume, result);
      break;
      
    case 'url':
      const url = args[0];
      if (!url) {
        console.error('❌ 请提供 JD URL');
        process.exit(1);
      }
      
      const jdContent = fetchJDFromURL(url);
      if (jdContent) {
        const jdFromURL = parseJD(jdContent);
        const resumeFromURL = loadResume();
        const resultFromURL = calculateMatch(jdFromURL, resumeFromURL);
        formatMatchResult(jdFromURL, resumeFromURL, resultFromURL);
      }
      break;
      
    default:
      console.log('用法：node jd-analyzer.js <command> [args]');
      console.log('命令:');
      console.log('  analyze <JD 内容>     - 分析 JD 匹配度');
      console.log('  url <JD URL>          - 从 URL 分析 JD');
      process.exit(1);
  }
}

module.exports = { 
  loadResume, 
  parseJD, 
  calculateMatch, 
  formatMatchResult,
  generateGreetingSuggestion,
  fetchJDFromURL
};
