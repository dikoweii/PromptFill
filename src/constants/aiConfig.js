/**
 * AI 功能配置文件
 * 用于控制 AI 智能词组功能的开关和参数
 */

// ===== 功能开关 =====
// 测试功能开关：设置为 false 即可完全关闭 AI 智能词组功能
export const AI_FEATURE_ENABLED = true;

// 智能拆分功能开关
export const AI_SMART_SPLIT_ENABLED = true;

// ===== AI 提供商配置 =====
// 支持的 AI 提供商类型
export const AI_PROVIDERS = {
  OPENAI: 'openai',
  ANTHROPIC: 'anthropic',
  CUSTOM: 'custom' // 自定义 API
};

// 默认提供商
export const DEFAULT_AI_PROVIDER = AI_PROVIDERS.OPENAI;

// ===== API 配置 =====
// API Key 存储键名（使用 localStorage，保护用户隐私）
export const AI_API_KEY_STORAGE_KEY = 'prompt_fill_ai_api_key';
export const AI_PROVIDER_STORAGE_KEY = 'prompt_fill_ai_provider';
export const AI_MODEL_STORAGE_KEY = 'prompt_fill_ai_model';

// 默认模型配置
export const DEFAULT_AI_MODELS = {
  [AI_PROVIDERS.OPENAI]: 'gpt-3.5-turbo',
  [AI_PROVIDERS.ANTHROPIC]: 'claude-3-haiku-20240307',
  [AI_PROVIDERS.CUSTOM]: 'custom-model'
};

// ===== 生成参数配置 =====
// AI 生成词条的数量
export const AI_GENERATION_COUNT = {
  MIN: 3,
  MAX: 8,
  DEFAULT: 5
};

// 系统提示词模板
export const AI_SYSTEM_PROMPT_TEMPLATE = {
  cn: `你是一个专业的AI提示词助手，专门为{variableLabel}生成{count}个富有创意的选项。

要求：
1. 生成的选项应该多样化，覆盖不同的风格和角度
2. 每个选项应该简洁有力，通常在2-8个字之间
3. 考虑上下文语境，生成与当前主题相关的词条
4. 输出格式必须是纯文本，每行一个选项，不要编号
5. 不要包含任何解释、引言或总结

示例输出格式：
选项一
选项二
选项三`,

  en: `You are a professional AI prompt assistant specializing in generating {count} creative options for {variableLabel}.

Requirements:
1. Generated options should be diverse, covering different styles and perspectives
2. Each option should be concise and powerful, typically between 2-8 words
3. Consider the context and generate terms relevant to the current theme
4. Output format must be plain text, one option per line, no numbering
5. Do not include any explanations, introductions, or summaries

Example output format:
Option One
Option Two
Option Three`
};

// 用户提示词模板
export const AI_USER_PROMPT_TEMPLATE = {
  cn: `请为"{variableLabel}"生成{count}个不同的选项。\n\n当前上下文：{context}`,
  en: `Please generate {count} different options for "{variableLabel}".\n\nCurrent context: {context}`
};

// ===== 隐私和安全配置 =====
// 是否记录 AI 使用日志（本地存储，不上传）
export const AI_LOGGING_ENABLED = true;

// 日志存储键名
export const AI_LOGS_STORAGE_KEY = 'prompt_fill_ai_logs';

// 最大日志条数
export const AI_MAX_LOGS = 100;

// ===== UI 配置 =====
// AI 词组按钮文本
export const AI_BUTTON_TEXT = {
  cn: '✨ 智能词条',
  en: '✨ AI Terms'
};

// AI 加载状态文本
export const AI_LOADING_TEXT = {
  cn: 'AI 生成中...',
  en: 'AI Generating...'
};

// AI 错误提示
export const AI_ERROR_MESSAGES = {
  NO_API_KEY: {
    cn: '请先设置 API Key',
    en: 'Please set API Key first'
  },
  GENERATION_FAILED: {
    cn: 'AI 生成失败，请重试',
    en: 'AI generation failed, please retry'
  },
  NETWORK_ERROR: {
    cn: '网络错误，请检查连接',
    en: 'Network error, please check connection'
  },
  RATE_LIMIT: {
    cn: '请求过于频繁，请稍后重试',
    en: 'Too many requests, please try again later'
  }
};

// AI 列表标题
export const AI_SECTION_TITLE = {
  cn: '智能词条',
  en: 'Smart Terms'
};

// 本地词库标题
export const LOCAL_SECTION_TITLE = {
  cn: '本地词库',
  en: 'Local Library'
};
