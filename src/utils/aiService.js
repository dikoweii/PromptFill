/**
 * AI 服务工具函数
 * 用于处理 AI 词条生成的逻辑
 * 对接宝塔后端 AI 代理接口
 */

import { AI_FEATURE_ENABLED } from '../constants/aiConfig';
import { smartFetch } from './platform';

/**
 * 智能生成词条（增强版：支持上下文感知）
 * @param {Object} params - 生成参数
 * @param {string} params.variableLabel - 变量标签
 * @param {string} params.language - 语言 (cn/en)
 * @param {string} params.currentValue - 当前值
 * @param {Array} params.localOptions - 本地词库选项
 * @param {string} params.templateContext - 模板上下文内容
 * @param {number} params.count - 生成数量
 * @param {Object} params.selectedValues - 用户已选择的其他变量值（新增）
 * @returns {Promise<Array>} - AI 生成的词条数组
 */
export const generateAITerms = async (params) => {
  const {
    variableLabel,
    language,
    currentValue,
    localOptions = [],
    templateContext = "",
    count = 5,
    selectedValues = {},
    debugModel = null,   // 调试模式：前端直调时传入模型名
    debugApiKey = null,  // 调试模式：前端直调时传入 API Key
  } = params;

  // 检查功能开关
  if (!AI_FEATURE_ENABLED) {
    console.warn('[AI Service] AI feature is disabled');
    return [];
  }

  // 调试模式：前端直接调用智谱 GLM API，绕过后端
  if (debugModel) {
    return await generateAITermsDirect({ variableLabel, language, currentValue, localOptions, templateContext, count, selectedValues, model: debugModel, apiKey: debugApiKey });
  }

  try {
    // 宝塔后端统一处理接口
    const CLOUD_API_URL = "https://data.tanshilong.com/api/ai/process";

    const response = await smartFetch(CLOUD_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'generate-terms',
        language: language,
        payload: {
          variableLabel,
          context: templateContext,
          localOptions: localOptions.slice(0, 15), // 传递部分本地选项供参考
          currentValue,
          count,
          selectedValues  // 新增：传递用户已选择的变量值
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `AI Server Error: ${response.status}`);
    }

    const result = await response.json();
    
    // 后端返回的是 { success: true, terms: [...] }
    if (result.success && Array.isArray(result.terms)) {
      return result.terms;
    }
    
    return [];
  } catch (error) {
    console.error('[AI Service] Failed to fetch smart terms:', error);
    throw error;
  }
};

/**
 * 调试模式：前端直接调用智谱 GLM API 生成词条（不经过后端）
 * ⚠️ 仅用于开发调试
 */
export const generateAITermsDirect = async ({ variableLabel, language, currentValue, localOptions = [], templateContext = "", count = 5, selectedValues = {}, model = 'glm-4.5-air', apiKey }) => {
  const key = apiKey || localStorage.getItem('debug_zhipu_api_key');
  if (!key) {
    throw new Error('调试模式需要设置智谱 API Key');
  }

  // 复用后端相同的 GENERATE_TERMS prompt 逻辑
  const optionsText = localOptions.map(opt => {
    if (typeof opt === 'string') return opt;
    if (typeof opt === 'object' && opt !== null) return opt[language] || opt.cn || opt.en || JSON.stringify(opt);
    return String(opt);
  }).join(', ');

  const selectedContext = Object.keys(selectedValues).length > 0
    ? `【用户已选择的关键约束（强制遵守 - 这是最重要的上下文）】:\n${Object.entries(selectedValues).map(([key, val]) => `  ✓ {{${key}}}: ${val}`).join('\n')}\n\n`
    : '';

  const prompt = `你是一个顶级艺术与图像生成的提示词专家，精通人物设定、场景描述与风格搭配的关联逻辑。

${selectedContext}【模版全文（用于理解整体创作逻辑）】:
"${templateContext}"

【当前任务】:
用户正在填写变量 "${variableLabel}"，需要你生成 ${count} 个扩展词条。

【已有本地选项（参考风格与格式，避免重复）】:
[${optionsText}]

【输出要求】:
- 直接返回 ${count} 个词条，每行一个
- 严禁输出序号、严禁带有点号或星号
- 严禁输出任何解释文字、前言或总结`;

  // 词条生成任务不需要 thinking，全部关闭，避免 token 被推理过程消耗
  const requestBody = {
    model,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 300,
    top_p: 0.9,
    thinking: { type: 'disabled' },
  };

  console.log('[DEBUG Terms] 完整请求体:', JSON.stringify(requestBody, null, 2));

  const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key.trim()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(`GLM API 错误: ${response.status} - ${errData.error?.message || JSON.stringify(errData)}`);
  }

  const data = await response.json();
  console.log('[DEBUG Terms] 完整响应数据:', JSON.stringify(data, null, 2));
  const aiContent = data.choices?.[0]?.message?.content;

  if (!aiContent) throw new Error('GLM 返回内容为空');

  // 解析词条（与后端相同逻辑）
  let rawTerms = aiContent.includes('\n') ? aiContent.split('\n') : aiContent.split(/[,，;；]/);
  const terms = rawTerms
    .map(line => line.replace(/^(\d+[\.、\s]|-|\*|•)\s*/, '').trim().replace(/^["'「【\(]/, '').trim().replace(/["'」】\]]$/, '').trim())
    .filter(term => term.length > 0 && term.length < 50 && !/^(输出|返回|生成|词条|选项|结果|Explanation|Note)/.test(term));

  return [...new Set(terms)].slice(0, count);
};

/**
 * 智能一键润色与拆分
 * @param {Object} params - 参数
 * @param {string} params.rawPrompt - 原始提示词（已替换变量为实际值）
 * @param {string} params.existingBankContext - 现有词库上下文信息
 * @param {Array} params.availableTags - 可选标签列表
 * @param {string} params.language - 语言
 * @param {string|null} params.customSystemPrompt - 调试模式：前端自定义系统提示词（绕过后端）
 * @param {string} params.splitMode - 拆分方案：'classic'（经典JSON）| 'lite'（轻量纯文本）
 * @returns {Promise<Object>} - AI 处理结果
 */
export const polishAndSplitPrompt = async (params) => {
  const { rawPrompt, existingBankContext = '', availableTags = [], language = 'cn', customSystemPrompt = null, debugModel = null, debugApiKey = null, splitMode = 'lite' } = params;

  if (!AI_FEATURE_ENABLED) {
    console.warn('[AI Service] AI feature is disabled');
    throw new Error('AI 功能已禁用');
  }

  // 调试模式：前端直接调用智谱 GLM API，绕过后端
  if (customSystemPrompt !== null) {
    if (splitMode === 'lite') {
      return await polishAndSplitLite({ rawPrompt, systemPrompt: customSystemPrompt, model: debugModel || undefined, apiKey: debugApiKey || undefined });
    }
    return await polishAndSplitDirect({ rawPrompt, systemPrompt: customSystemPrompt, model: debugModel || undefined, apiKey: debugApiKey || undefined });
  }

  try {
    const CLOUD_API_URL = "https://data.tanshilong.com/api/ai/process";

    const response = await smartFetch(CLOUD_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'polish-and-split-lite',
        language: language,
        payload: {
          rawPrompt,
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `AI Server Error: ${response.status}`);
    }

    const result = await response.json();
    if (result.success && result.data) {
      return result.data;
    }
    throw new Error('AI 返回数据格式错误');
  } catch (error) {
    console.error('[AI Service] Polish and Split failed:', error);
    throw error;
  }
};

/**
 * 调试模式：前端直接调用智谱 GLM API（不经过后端）
 * ⚠️ 仅用于开发调试，正式发版时此入口应不可用
 */
export const polishAndSplitDirect = async ({ rawPrompt, systemPrompt, apiKey, model = 'glm-4.5-air' }) => {
  // 从 localStorage 读取调试用 API Key
  const key = apiKey || localStorage.getItem('debug_zhipu_api_key');
  if (!key) {
    throw new Error('调试模式需要设置智谱 API Key（点击调试按钮右侧的设置图标）');
  }

  // glm-4.7-standard 是前端标识符，实际调用 glm-4.7 并关闭 thinking
  const isGlm47Standard = model === 'glm-4.7-standard';
  const actualModel = isGlm47Standard ? 'glm-4.7' : model;

  console.log('[DEBUG] 前端直调 GLM，模型:', actualModel, isGlm47Standard ? '(thinking disabled)' : '', '提示词长度:', systemPrompt.length);

  const fullPrompt = `${systemPrompt}\n\n${rawPrompt}`;

  const requestBody = {
    model: actualModel,
    messages: [{ role: 'user', content: fullPrompt }],
    temperature: 0.7,
    max_tokens: 6000,
    top_p: 0.9,
    ...(isGlm47Standard && { thinking: { type: 'disabled' } }),
  };

  console.log('[DEBUG] 完整请求体:', JSON.stringify(requestBody, null, 2));

  const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key.trim()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(`GLM API 错误: ${response.status} - ${errData.error?.message || JSON.stringify(errData)}`);
  }

  const data = await response.json();
  console.log('[DEBUG] 完整响应数据:', JSON.stringify(data, null, 2));
  const aiContent = data.choices?.[0]?.message?.content;

  if (!aiContent) {
    throw new Error('GLM 返回内容为空');
  }

  console.log('[DEBUG] GLM 原始返回:', aiContent.substring(0, 300));

  // 解析 JSON，含截断修复逻辑
  let cleanedJson = aiContent.replace(/```json/g, '').replace(/```/g, '').trim();
  const start = cleanedJson.indexOf('{');
  const end = cleanedJson.lastIndexOf('}');
  if (start === -1 || end === -1) {
    throw new Error(`GLM 返回内容中没有有效的 JSON\n\n原始返回：\n${aiContent.substring(0, 500)}`);
  }
  cleanedJson = cleanedJson.substring(start, end + 1);

  let result;
  try {
    result = JSON.parse(cleanedJson);
  } catch (firstErr) {
    console.warn('[DEBUG] 直接解析失败，尝试截断修复:', firstErr.message);
    const variablesStart = cleanedJson.indexOf('"variables"');
    const arrayOpen = variablesStart !== -1 ? cleanedJson.indexOf('[', variablesStart) : -1;
    if (arrayOpen !== -1) {
      let lastValidEnd = -1, depth = 0, inString = false, escape = false;
      for (let i = arrayOpen; i < cleanedJson.length; i++) {
        const ch = cleanedJson[i];
        if (escape) { escape = false; continue; }
        if (ch === '\\') { escape = true; continue; }
        if (ch === '"') { inString = !inString; continue; }
        if (inString) continue;
        if (ch === '{') depth++;
        if (ch === '}') { depth--; if (depth === 0) lastValidEnd = i; }
      }
      if (lastValidEnd !== -1) {
        const fixed = cleanedJson.substring(0, lastValidEnd + 1) + '\n  ],\n  "tags": []\n}';
        result = JSON.parse(fixed);
        console.log('[DEBUG] 截断修复成功');
      } else {
        throw firstErr;
      }
    } else {
      throw firstErr;
    }
  }

  if (!result.name || !result.content || !result.variables) {
    throw new Error('GLM 返回 JSON 缺少必需字段（name/content/variables）');
  }

  // 过滤掉不完整的变量条目
  result.variables = (result.variables || []).filter(v =>
    v && v.key && Array.isArray(v.options) && v.options.length > 0
  );

  return result;
};

/**
 * 轻量拆分模式（Lite）：前端直调 GLM，AI 只返回标注后的纯文本
 * 将原文中可替换的词标记为 {{variable_key}}，不生成 options
 * 前端解析后自动匹配已有词库
 */
export const polishAndSplitLite = async ({ rawPrompt, systemPrompt, apiKey, model = 'glm-4.5-air' }) => {
  const key = apiKey || localStorage.getItem('debug_zhipu_api_key');
  if (!key) {
    throw new Error('调试模式需要设置智谱 API Key');
  }

  const isGlm47Standard = model === 'glm-4.7-standard';
  const actualModel = isGlm47Standard ? 'glm-4.7' : model;

  const fullPrompt = `${systemPrompt}\n\n${rawPrompt}`;

  const requestBody = {
    model: actualModel,
    messages: [{ role: 'user', content: fullPrompt }],
    temperature: 0.3,
    max_tokens: 2000,
    top_p: 0.9,
    thinking: { type: 'disabled' },
  };

  console.log('[DEBUG Lite] 前端直调 GLM，模型:', actualModel, '提示词长度:', fullPrompt.length);
  console.log('[DEBUG Lite] 完整请求体:', JSON.stringify(requestBody, null, 2));

  const splitStartTime = Date.now();
  const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key.trim()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(`GLM API 错误: ${response.status} - ${errData.error?.message || JSON.stringify(errData)}`);
  }

  const data = await response.json();
  const splitElapsed = Date.now() - splitStartTime;
  console.log(`[DEBUG Lite] 拆分完成 (${splitElapsed}ms)，响应:`, JSON.stringify(data, null, 2));
  const aiContent = data.choices?.[0]?.message?.content;

  if (!aiContent) {
    throw new Error('GLM 返回内容为空');
  }

  console.log('[DEBUG Lite] GLM 原始返回:', aiContent);

  // 解析 {{key::原词}} 格式，同时兼容 {{key}} 无原词的情况
  const varMatches = [...aiContent.matchAll(/\{\{(\w+)(?:::([^}]+))?\}\}/g)];

  if (varMatches.length === 0) {
    throw new Error('AI 未标记任何变量，请检查提示词或重试');
  }

  // 按 key 去重，保留第一次出现的原词
  const varMap = new Map();
  varMatches.forEach(m => {
    const [, key, originalWord] = m;
    if (!varMap.has(key)) {
      varMap.set(key, originalWord?.trim() || key);
    }
  });

  console.log('[DEBUG Lite] 提取到变量:', Object.fromEntries(varMap));

  // 将 {{key::原词}} 格式统一替换为 {{key}}，生成干净的模板内容
  const cleanContent = aiContent.replace(/\{\{(\w+)(?:::[^}]+)?\}\}/g, '{{$1}}').trim();

  // 检测原文语言
  const chineseCharCount = (rawPrompt.match(/[\u4e00-\u9fa5]/g) || []).length;
  const isChinese = chineseCharCount / Math.max(rawPrompt.length, 1) > 0.1;
  const sourceLang = isChinese ? 'cn' : 'en';
  const targetLang = isChinese ? 'en' : 'cn';

  // 构建翻译请求：content + 所有变量原词，一次请求搞定
  const varEntries = [...varMap.entries()].slice(0, 5);
  const wordsToTranslate = varEntries.map(([k, w]) => w);

  const translatePrompt = `Translate to ${isChinese ? 'English' : 'Chinese'}.

Rules:
- All {{xxx}} placeholders (like {{art_style}}, {{character_type}}) MUST be kept as-is, DO NOT translate them
- Output ONLY the translation, no explanations

===TEMPLATE===
${cleanContent}
===WORDS===
${wordsToTranslate.join('\n')}

Output format (keep ===TEMPLATE=== and ===WORDS=== markers exactly):
===TEMPLATE===
(translated template with {{xxx}} kept unchanged)
===WORDS===
(one translated word per line, same order)`;

  console.log('[DEBUG Lite] 发起翻译请求，源语言:', sourceLang, '→', targetLang);
  const translateStartTime = Date.now();

  try {
    const translateResponse = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: actualModel,
        messages: [{ role: 'user', content: translatePrompt }],
        temperature: 0.3,
        max_tokens: 2000,
        top_p: 0.9,
        thinking: { type: 'disabled' },
      }),
    });

    if (translateResponse.ok) {
      const translateData = await translateResponse.json();
      const translateContent = translateData.choices?.[0]?.message?.content || '';
      const translateElapsed = Date.now() - translateStartTime;
      console.log(`[DEBUG Lite] 翻译完成 (${translateElapsed}ms)，原始返回:`, translateContent);

      // 解析翻译结果（兼容多种标记格式）
      const contentMatch = translateContent.match(/===TEMPLATE===\s*([\s\S]*?)(?:===WORDS===|$)/)
        || translateContent.match(/---CONTENT---\s*([\s\S]*?)(?:---WORDS---|$)/)
        || translateContent.match(/---TEMPLATE---\s*([\s\S]*?)(?:---WORDS---|$)/);
      const wordsMatch = translateContent.match(/===WORDS===\s*([\s\S]*?)$/)
        || translateContent.match(/---WORDS---\s*([\s\S]*?)$/);

      const translatedContent = contentMatch?.[1]?.trim() || '';
      const translatedWords = wordsMatch?.[1]?.trim().split('\n').map(w => w.trim()).filter(Boolean) || [];

      console.log('[DEBUG Lite] 翻译后内容长度:', translatedContent.length, '翻译后词条:', translatedWords);

      // 构造双语结果
      const contentBilingual = {
        [sourceLang]: cleanContent,
        [targetLang]: translatedContent || cleanContent,
      };

      const variables = varEntries.map(([varKey, originalWord], i) => {
        const translatedWord = translatedWords[i] || originalWord;
        return {
          key: varKey,
          label: { cn: varKey, en: varKey },
          category: 'other',
          options: [{ [sourceLang]: originalWord, [targetLang]: translatedWord }],
          default: { [sourceLang]: originalWord, [targetLang]: translatedWord },
          _liteMode: true,
        };
      });

      return {
        name: null,
        content: contentBilingual,
        variables,
        tags: [],
        _liteMode: true,
        _bilingual: true,
      };
    }
  } catch (translateErr) {
    console.warn('[DEBUG Lite] 翻译请求失败，回退单语模式:', translateErr.message);
  }

  // 翻译失败时回退：单语结果
  const variables = varEntries.map(([varKey, originalWord]) => ({
    key: varKey,
    label: { cn: varKey, en: varKey },
    category: 'other',
    options: [{ cn: originalWord, en: originalWord }],
    default: { cn: originalWord, en: originalWord },
    _liteMode: true,
  }));

  return {
    name: null,
    content: cleanContent,
    variables,
    tags: [],
    _liteMode: true,
  };
};

/**
 * 以下函数由于采用了后端代理，且 Key 存储在服务器环境变量中，
 * 前端不再直接管理 API Key。保留空实现或按需移除。
 */
export const validateApiKey = () => true;
export const getStoredApiKey = () => "MANAGED_BY_BACKEND";
export const storeApiKey = () => true;
export const clearApiKey = () => true;
