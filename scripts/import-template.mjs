#!/usr/bin/env node
/**
 * 模板导入工具
 * 
 * 用法：
 *   方式1（推荐）：直接指定 JSON 文件路径
 *     npm run import -- path/to/template.json
 *     npm run import -- ~/Downloads/地铁玩偶装扮_template.json
 * 
 *   方式2：交互式粘贴
 *     npm run import
 *     然后粘贴分享链接或 JSON 数据
 * 
 * 支持的输入格式：
 *   - JSON 文件路径（推荐，避免终端粘贴截断问题）
 *   - 分享链接 (https://...#/share?share=xxxxx)
 *   - 短码 (如: ABC123)
 *   - 口令格式 (#pf$xxxxx$)
 *   - 原始压缩数据
 *   - 已解压的 JSON 对象
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';
import pako from 'pako';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 文件路径
const TEMPLATES_FILE = path.join(__dirname, '../src/data/templates.js');
const BANKS_FILE = path.join(__dirname, '../src/data/banks.js');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`),
};

/**
 * Base64 解码（兼容 Node.js）
 */
function base64Decode(str) {
  return Buffer.from(str, 'base64');
}

/**
 * 解压分享数据
 */
function decompressTemplate(compressedBase64) {
  try {
    if (!compressedBase64) return null;

    // 还原 URL-safe Base64 字符
    let base64 = compressedBase64.replace(/-/g, '+').replace(/_/g, '/');

    // 补齐 Base64 填充字符
    const pad = base64.length % 4;
    if (pad) {
      if (pad === 1) return null;
      base64 += '='.repeat(4 - pad);
    }

    const binary = base64Decode(base64);
    const decompressed = pako.inflate(binary);
    const jsonStr = Buffer.from(decompressed).toString('utf8');
    const data = JSON.parse(jsonStr);

  // 映射回原始键名
    const result = {
      name: data.n || data.name,
      content: data.c || data.content,
      tags: data.t || data.tags || [],
      author: data.a || data.author || 'User',
      language: data.l || data.language || ['cn', 'en'],
      imageUrl: data.i || data.imageUrl || "",
      selections: data.s || data.selections || {},
      type: data.ty || data.type || 'image',
      videoUrl: data.vu || data.videoUrl || "",
      source: data.src || data.source || [],
      banks: data.b || data.banks || {},
      categories: data.cat || data.categories || {},
      linkedTemplates: data.lt || data.linkedTemplates || [],
    };

    // 清理 selections 中的无效数据（空对象、null 等）
    if (result.selections && typeof result.selections === 'object') {
      Object.keys(result.selections).forEach(key => {
        const val = result.selections[key];
        if (val === null || val === undefined) {
          delete result.selections[key];
        } else if (typeof val === 'object' && Object.keys(val).length === 0) {
          delete result.selections[key];
        }
      });
    }

    return result;
  } catch (e) {
    console.error('Decompress error:', e.message);
    return null;
  }
}

/**
 * 尝试修复常见的 JSON 格式错误并解析
 * 
 * 典型的损坏场景：selections 中有运行时 key（如 "character_type-0": {），
 * 其值为不完整对象，导致大括号层级错乱。
 * 修复策略：先删除带 -N 后缀的 key 行及其不完整值，再尝试解析。
 */
function tryRepairAndParseJson(str) {
  try {
    return JSON.parse(str);
  } catch (originalError) {
    log.warn('JSON 标准解析失败，尝试自动修复...');
    let fixed = str;

    // 修复1：删除带 -数字 后缀的 key 及其值（这些是运行时 uniqueKey，不应出现在导出中）
    // 匹配模式："someKey-0": { ... } 或 "someKey-0": "..." 等各种值形式
    // 最常见的损坏是：值为 { 后未正确闭合（少了一层 }）
    fixed = fixed.replace(/,?\s*"[^"]*-\d+"\s*:\s*\{[^{}]*\}/g, '');
    // 也处理值为 { 后直接换行的（不完整对象，{ 后面没内容到下一个 } ）
    fixed = fixed.replace(/,?\s*"[^"]*-\d+"\s*:\s*\{\s*\n/g, '\n');

    // 修复2：修复尾随逗号
    fixed = fixed.replace(/,(\s*[}\]])/g, '$1');
    // 修复3：修复开头逗号（删除 key 后可能留下的）
    fixed = fixed.replace(/\{\s*,/g, '{');

    try {
      const result = JSON.parse(fixed);
      log.success('JSON 自动修复成功');
      return result;
    } catch (e2) {
      log.error('JSON 解析失败（自动修复无效）: ' + originalError.message);
      log.info('提示：请检查 JSON 中是否有不完整的对象（如 "key": { 后缺少闭合 }）');
      return null;
    }
  }
}

/**
 * 从输入中提取分享数据
 */
function extractShareData(input) {
  let shareData = input.trim();

  // 尝试直接解析为 JSON（含自动修复）
  if (shareData.startsWith('{')) {
    const parsed = tryRepairAndParseJson(shareData);
    if (parsed && (parsed.name || parsed.n || parsed.content || parsed.c)) {
      return parsed;
    }
  }

  // 识别口令格式 #pf$token$
  if (shareData.includes('#pf$') && shareData.includes('$')) {
    const match = shareData.match(/#pf\$([^$]+)\$/);
    if (match) shareData = match[1];
  }

  // 识别 URL 链接
  if (shareData.includes('share=')) {
    const match = shareData.match(/share=([^&?#\s]+)/);
    if (match) shareData = match[1];
  }

  // 尝试解压
  const decompressed = decompressTemplate(shareData);
  if (decompressed) return decompressed;

  return null;
}

/**
 * 生成模板常量名
 */
function generateConstName(name) {
  const cnName = typeof name === 'object' ? name.cn : name;
  // 简单转换：移除特殊字符，转大写，用下划线连接
  const cleaned = cnName
    .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, '')
    .trim();
  
  // 如果是纯中文，生成时间戳
  if (/^[\u4e00-\u9fa5\s]+$/.test(cleaned)) {
    const timestamp = Date.now().toString(36).toUpperCase();
    return `TEMPLATE_IMPORTED_${timestamp}`;
  }
  
  // 转换为大写下划线格式
  const constName = cleaned
    .replace(/\s+/g, '_')
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .toUpperCase();
  
  return `TEMPLATE_${constName}`;
}

/**
 * 生成模板 ID
 */
function generateTemplateId(name) {
  const cnName = typeof name === 'object' ? name.cn : name;
  const timestamp = Date.now().toString(36);
  const cleaned = cnName
    .replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '')
    .slice(0, 20);
  return `tpl_imported_${timestamp}_${cleaned || 'template'}`;
}

/**
 * 格式化 JS 对象为代码字符串
 */
function formatValue(value, indent = 2) {
  const spaces = ' '.repeat(indent);
  
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'string') {
    // 多行字符串使用模板字符串
    if (value.includes('\n')) {
      return '`' + value.replace(/`/g, '\\`').replace(/\$\{/g, '\\${') + '`';
    }
    return JSON.stringify(value);
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    if (value.every(v => typeof v === 'string' && !v.includes('\n'))) {
      return JSON.stringify(value);
    }
    const items = value.map(v => formatValue(v, indent + 2));
    return `[\n${spaces}  ${items.join(`,\n${spaces}  `)}\n${spaces}]`;
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value);
    if (entries.length === 0) return '{}';
    
    const lines = entries.map(([k, v]) => {
      const key = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) ? k : JSON.stringify(k);
      return `${spaces}  ${key}: ${formatValue(v, indent + 2)}`;
    });
    return `{\n${lines.join(',\n')}\n${spaces}}`;
  }
  return String(value);
}

/**
 * 生成模板内容常量代码
 */
function generateTemplateContentCode(constName, content) {
  if (typeof content === 'string') {
    return `export const ${constName} = \`${content.replace(/`/g, '\\`').replace(/\$\{/g, '\\${')}\`;\n`;
  }
  
  // 双语对象
  let code = `export const ${constName} = {\n`;
  if (content.cn) {
    code += `  cn: \`${content.cn.replace(/`/g, '\\`').replace(/\$\{/g, '\\${')}\`,\n`;
  }
  if (content.en) {
    code += `  en: \`${content.en.replace(/`/g, '\\`').replace(/\$\{/g, '\\${')}\`\n`;
  }
  code += `};\n`;
  return code;
}

/**
 * 生成 INITIAL_TEMPLATES_CONFIG 数组项代码
 */
function generateTemplateEntryCode(templateId, constName, data) {
  const lines = [];
  lines.push(`  {`);
  lines.push(`    id: "${templateId}",`);
  
  // name
  if (typeof data.name === 'object') {
    lines.push(`    name: { cn: ${JSON.stringify(data.name.cn)}, en: ${JSON.stringify(data.name.en)} },`);
  } else {
    lines.push(`    name: ${JSON.stringify(data.name)},`);
  }
  
  // content 引用常量
  lines.push(`    content: ${constName},`);
  
  // imageUrl
  if (data.imageUrl) {
    lines.push(`    imageUrl: ${JSON.stringify(data.imageUrl)},`);
  }
  
  // author
  lines.push(`    author: ${JSON.stringify(data.author || "@tanshilong")},`);

  // type (如果是视频模板)
  if (data.type && data.type !== 'image') {
    lines.push(`    type: ${JSON.stringify(data.type)},`);
  }
  
  // videoUrl
  if (data.videoUrl) {
    lines.push(`    videoUrl: ${JSON.stringify(data.videoUrl)},`);
  }
  
  // source
  if (data.source && data.source.length > 0) {
    lines.push(`    source: ${JSON.stringify(data.source)},`);
  }
  
  // selections
  if (data.selections && Object.keys(data.selections).length > 0) {
    lines.push(`    selections: ${formatValue(data.selections, 4)},`);
  } else {
    lines.push(`    selections: {},`);
  }
  
  // tags
  lines.push(`    tags: ${JSON.stringify(data.tags || [])},`);
  
  // language
  lines.push(`    language: ${JSON.stringify(data.language || ["cn", "en"])},`);

  // bestModel
  if (data.bestModel) {
    lines.push(`    bestModel: ${JSON.stringify(data.bestModel)},`);
  }

  // baseImage
  lines.push(`    baseImage: ${JSON.stringify(data.baseImage || "no_base_image")}`);
  
  lines.push(`  }`);
  return lines.join('\n');
}

/**
 * 生成词库代码
 */
function generateBankCode(bankKey, bank) {
  const lines = [];
  lines.push(`  ${bankKey}: {`);
  
  // label
  if (typeof bank.label === 'object') {
    lines.push(`    label: { cn: ${JSON.stringify(bank.label.cn)}, en: ${JSON.stringify(bank.label.en)} },`);
  } else {
    lines.push(`    label: ${JSON.stringify(bank.label)},`);
  }
  
  // category
  lines.push(`    category: ${JSON.stringify(bank.category || 'other')},`);
  
  // options
  lines.push(`    options: [`);
  (bank.options || []).forEach((opt, i) => {
    const comma = i < bank.options.length - 1 ? ',' : '';
    if (typeof opt === 'object') {
      lines.push(`      { cn: ${JSON.stringify(opt.cn)}, en: ${JSON.stringify(opt.en)} }${comma}`);
    } else {
      lines.push(`      ${JSON.stringify(opt)}${comma}`);
    }
  });
  lines.push(`    ]`);
  
  lines.push(`  }`);
  return lines.join('\n');
}

/**
 * 写入模板到 templates.js
 */
function writeTemplate(data) {
  log.info('读取 templates.js...');
  let content = fs.readFileSync(TEMPLATES_FILE, 'utf8');
  
  const constName = generateConstName(data.name);
  const templateId = generateTemplateId(data.name);
  
  // 1. 在 INITIAL_TEMPLATES_CONFIG 之前插入内容常量
  const templateConstCode = generateTemplateContentCode(constName, data.content);
  
  // 找到 INITIAL_TEMPLATES_CONFIG 的位置
  const initialTemplatesMatch = content.match(/export const INITIAL_TEMPLATES_CONFIG\s*=\s*\[/);
  if (!initialTemplatesMatch) {
    log.error('找不到 INITIAL_TEMPLATES_CONFIG，请检查 templates.js 格式');
    return null;
  }
  
  const insertPos = initialTemplatesMatch.index;
  content = content.slice(0, insertPos) + templateConstCode + '\n' + content.slice(insertPos);
  
  // 2. 在 INITIAL_TEMPLATES_CONFIG 数组末尾插入模板配置
  const templateEntryCode = generateTemplateEntryCode(templateId, constName, data);
  
  // 找到数组的最后一个 } 和 ];
  const arrayEndRegex = /(\s*}\s*)(];?\s*(?:\/\/[^\n]*)?)\s*$/;
  const match = content.match(arrayEndRegex);
  
  if (match) {
    const beforeEnd = content.slice(0, match.index + match[1].length);
    const afterEnd = content.slice(match.index + match[1].length);
    content = beforeEnd + ',\n' + templateEntryCode + '\n' + afterEnd;
  } else {
    log.error('无法找到 INITIAL_TEMPLATES_CONFIG 数组结尾');
    return null;
  }
  
  fs.writeFileSync(TEMPLATES_FILE, content, 'utf8');
  log.success(`模板已写入: ${constName}`);
  
  return { constName, templateId };
}

/**
 * 写入词库到 banks.js
 */
function writeBanks(banks) {
  if (!banks || Object.keys(banks).length === 0) {
    log.info('没有新词库需要导入');
    return;
  }
  
  log.info('读取 banks.js...');
  let content = fs.readFileSync(BANKS_FILE, 'utf8');
  
  const newBanks = [];
  
  for (const [key, bank] of Object.entries(banks)) {
    // 检查是否已存在
    const existsRegex = new RegExp(`\\b${key}\\s*:\\s*\\{`);
    if (existsRegex.test(content)) {
      log.warn(`词库 "${key}" 已存在，跳过`);
      continue;
    }
    
    newBanks.push({ key, bank });
  }
  
  if (newBanks.length === 0) {
    log.info('所有词库都已存在');
    return;
  }
  
  // 找到 INITIAL_BANKS 的结尾位置
  const banksEndRegex = /(\s{2}\}\s*)(};?\s*(?:\/\/[^\n]*)?)(\s*)$/;
  const match = content.match(banksEndRegex);
  
  if (!match) {
    log.error('无法找到 INITIAL_BANKS 结尾');
    return;
  }
  
  // 生成新词库代码
  const newBanksCode = newBanks.map(({ key, bank }) => generateBankCode(key, bank)).join(',\n');
  
  const beforeEnd = content.slice(0, match.index + match[1].length);
  const afterEnd = content.slice(match.index + match[1].length);
  content = beforeEnd + ',\n' + newBanksCode + '\n' + afterEnd;
  
  fs.writeFileSync(BANKS_FILE, content, 'utf8');
  log.success(`已导入 ${newBanks.length} 个新词库: ${newBanks.map(b => b.key).join(', ')}`);
}

/**
 * 主函数
 */
async function main() {
  log.title('📦 Prompt Fill 模板导入工具');
  
  let input = '';

  // 方式1：命令行参数指定文件路径
  const fileArg = process.argv[2];
  if (fileArg) {
    const filePath = path.resolve(fileArg);
    if (!fs.existsSync(filePath)) {
      log.error(`文件不存在: ${filePath}`);
      process.exit(1);
    }
    log.info(`从文件读取: ${filePath}`);
    input = fs.readFileSync(filePath, 'utf8');
  } else {
    // 方式2：交互式粘贴
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    console.log('请粘贴分享链接、口令或 JSON 数据（支持多行，输入空行结束）:');
    console.log(`${colors.yellow}提示: 推荐使用文件路径方式避免粘贴截断: npm run import -- path/to/file.json${colors.reset}\n`);
    
    let emptyLineCount = 0;
    
    for await (const line of rl) {
      if (line.trim() === '') {
        emptyLineCount++;
        if (emptyLineCount >= 1 && input.trim()) break;
      } else {
        emptyLineCount = 0;
        input += line + '\n';
      }
    }
    
    rl.close();
  }
  
  if (!input.trim()) {
    log.error('未输入任何数据');
    process.exit(1);
  }
  
  log.info('解析输入数据...');
  const data = extractShareData(input);
  
  if (!data) {
    log.error('无法解析输入数据，请检查格式');
    process.exit(1);
  }
  
  const templateName = typeof data.name === 'object' ? data.name.cn : data.name;
  log.success(`解析成功: "${templateName}"`);
  
  // 显示模板信息
  console.log('\n--- 模板信息 ---');
  console.log(`名称: ${templateName}`);
  console.log(`标签: ${(data.tags || []).join(', ') || '无'}`);
  console.log(`类型: ${data.type || 'image'}`);
  console.log(`词库数量: ${Object.keys(data.banks || {}).length}`);
  console.log('----------------\n');
  
  // 写入模板
  const result = writeTemplate(data);
  if (!result) {
    process.exit(1);
  }
  
  // 写入词库
  writeBanks(data.banks);
  
  // 更新版本号
  /*
  log.info('更新版本号...');
  const templateContent = fs.readFileSync(TEMPLATES_FILE, 'utf8');
  const versionMatch = templateContent.match(/SYSTEM_DATA_VERSION\s*=\s*"([^"]+)"/);
  if (versionMatch) {
    const [major, minor, patch] = versionMatch[1].split('.').map(Number);
    const newVersion = `${major}.${minor}.${patch + 1}`;
    fs.writeFileSync(
      TEMPLATES_FILE,
      templateContent.replace(/SYSTEM_DATA_VERSION\s*=\s*"[^"]+"/, `SYSTEM_DATA_VERSION = "${newVersion}"`),
      'utf8'
    );
    log.success(`版本号更新: ${versionMatch[1]} → ${newVersion}`);
  }
  */
  
  log.title('✅ 导入完成！');
  console.log(`模板 ID: ${result.templateId}`);
  console.log(`常量名: ${result.constName}`);
  console.log('\n请运行 npm run dev 查看效果');
}

main().catch(e => {
  log.error(e.message);
  process.exit(1);
});
