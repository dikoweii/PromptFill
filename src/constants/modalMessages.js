/**
 * 弹窗提示文案常量
 * 用于统一管理各种确认弹窗、警告提示的文案内容
 */

/**
 * 智能拆分确认弹窗文案
 */
export const SMART_SPLIT_CONFIRM_MESSAGE = {
  cn: `当前模板已包含变量，智能拆分将对整个提示词重新分析并提取变量。

这将重写现有内容和变量配置，原有变量可能被删除或重置。

如不满意结果，可通过拆分后出现的「重置」按钮还原。`,

  en: `This template already contains variables. Smart Split will re-analyze
the full prompt and extract variables from scratch.

Existing variables may be removed or reset.

You can restore the previous state via the "Reset" button after splitting.`
};

/**
 * 智能拆分标题
 */
export const SMART_SPLIT_CONFIRM_TITLE = {
  cn: '当前已有变量，确认重新拆分？',
  en: 'Template has variables — confirm re-split?'
};

/**
 * 智能拆分按钮文案
 */
export const SMART_SPLIT_BUTTON_TEXT = {
  confirm: {
    cn: '继续拆分',
    en: 'Continue'
  },
  cancel: {
    cn: '取消',
    en: 'Cancel'
  }
};
