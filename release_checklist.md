# Prompt Fill 发版与数据维护指南 (Release Checklist)

本仓库采用“代码版本”与“数据版本”分离的机制。为了实现“一处修改，全端同步”，请务必遵循以下流程。

---

## 1. 版本号管理

### [应用版本] App Version
涉及 UI 改动、逻辑修复或新功能开发。
- **`package.json`**: `"version": "x.x.x"`
- **`src/App.jsx`**: `const APP_VERSION = "x.x.x";`
- **注意**：修改此版本后，必须重新通过 Git 推送并触发 Vercel 部署。

### [数据版本] Data Version
仅涉及模板添加、词库扩充或默认值修改。
- **`src/data/templates.js`**: `export const SYSTEM_DATA_VERSION = "x.x.x";`
- **注意**：数据变动后必须**手动递增**此版本号，以便触发用户的“新模板提醒”。

---

## 2. 模板与词库制作 (Data Update)

### 添加新模板
1.  在 `src/data/templates.js` 顶部定义模板内容常量（支持双语）。
2.  在 `INITIAL_TEMPLATES_CONFIG` 数组中注册该模板。
3.  确保 `id` 唯一，并配置好 `imageUrl` 和 `selections` 默认值。

### 扩充词库
1.  在 `src/data/banks.js` 的 `INITIAL_BANKS` 中添加新词条。
2.  若涉及新变量名，需同步在 `INITIAL_DEFAULTS` 中设置默认值。

---

## 3. 自动化同步 (Automation)

在任何数据修改完成后，必须运行同步脚本以生成分发用的 JSON 文件：

```bash
npm run sync-data
```

**该脚本会自动执行：**
- 将 `src/data/*.js` 的最新数据提取并转换为 `public/data/*.json`。
- 同步最新的 `appVersion` 和 `dataVersion` 到 `version.json`。
- 更新文件修改时间。

---

## 4. 后端部署 (Cloud Sync)

为了让国内用户和已安装用户实时获取更新，需要将生成的 JSON 上传至宝塔服务器：

- **目标目录**：`/www/wwwroot/promptfillapi/data/`
- **必传文件**：
    - `public/data/version.json`
    - `public/data/templates.json`
    - `public/data/banks.json`
- **生效操作**：
    1. 上传覆盖上述三个文件。
    2. **重启 Node 服务**：在宝塔“Node项目管理”中点击“重启”，确保静态资源缓存更新。
- **验证**：访问 `http://data.tanshilong.com/data/version.json` 确认版本号已更新。

---

## 5. 文档与 UI 同步

### 更新日志 (Changelog)
- **`src/components/SettingsView.jsx`**: 在 `updateLogs` 数组最前端添加版本说明。
- **`src/components/MobileSettingsView.jsx`**: 同步添加。

### 外部文档
- **`README.md`**: 更新顶部的 Shields.io Badge 徽章及版本描述。

---

## 6. AI 功能维护 (AI Feature)

### 功能开关
- **`src/constants/aiConfig.js`**: `AI_FEATURE_ENABLED`
  - 开发/测试环境建议开启 (`true`)。
  - 生产环境发版前需确认是否开放此功能。

### API Key 安全
- API Key 仅存储在用户浏览器的 `localStorage` 中，**严禁**硬编码在代码或提交到 Git。
- 测试时请确保清除本地缓存的测试 Key。

### UI 兼容性
- AI 功能开启时，`Variable` 组件会变为两列布局（宽度约 580px），需确保在各种屏幕尺寸下的显示效果。
- 检查 `TemplateEditor` -> `TemplatePreview` -> `Variable` 的 `onGenerateAITerms` 回调传递是否正常。

---

## 6.5 智能拆分功能发版检查 (Smart Split Release)

> ⚠️ **推送前必须完成以下所有项目**，否则会导致调试接口暴露或 AI 拆分功能不可用。

### 🔴 调试模式（必须关闭）

- **`.env.local`**：确认 `VITE_DEBUG_SPLIT` 未设置为 `true`，或该文件已被 `.gitignore` 排除（默认已排除）。
- **Vercel 环境变量**：确认 Vercel 项目设置中**没有**配置 `VITE_DEBUG_SPLIT=true`，否则会在生产环境暴露调试入口。
- **验证方法**：本地执行 `npm run build && npm run preview`，确认"智能拆分"按钮旁**不显示**「🐛调试」按钮。

### 🟡 后端代码同步（必须更新服务器）

- **`后端index.js`** 包含智能拆分的核心 `POLISH_AND_SPLIT` 系统提示词及 JSON 健壮解析逻辑，本地修改后**需手动同步至宝塔服务器**。
- **目标服务器路径**：`/www/wwwroot/promptfillapi/index.js`（或你的实际部署路径）
- **同步步骤**：
    1. 将本地最新的 `后端index.js` 内容上传/替换至服务器对应文件。
    2. 在宝塔「Node 项目管理」中点击**重启**，使新系统提示词生效。
    3. **验证**：在前端触发一次智能拆分，打开 DevTools Network 确认请求走 `/api/polish-and-split`，且返回正常 JSON。

### 🟡 调试系统提示词转正式流程（调试完成后执行）

> 当你在前端调试完系统提示词，准备发正式版时，需按以下步骤将提示词"归还"后端：

1. **同步提示词到后端**：将 `src/App.jsx` 中 `getDebugSystemPrompt` 函数里拼出的完整系统提示词，复制并替换到 `后端index.js` 的 `POLISH_AND_SPLIT` 函数模板字符串中。
2. **清理前端调试代码**（可选，建议做）：
   - 删除 `App.jsx` 中的 `getDebugSystemPrompt` 回调（约第 1299 行）
   - 删除 `App.jsx` 中的 `handleDebugSplitRun` 回调（约第 1398 行）
   - 删除 `App.jsx` 中传给 `TemplateEditor` 的 `onDebugSplitRun` 和 `getDebugSystemPrompt` props
   - `aiService.js` 中的 `polishAndSplitDirect` 函数可保留（有守卫条件，正式路径不触发），也可删除
3. **关闭调试按钮**：确认 `VITE_DEBUG_SPLIT` 未在 Vercel 生产环境配置（`EditorToolbar.jsx` 中的调试按钮由此环境变量控制，无需改代码）。
4. 按本节"后端代码同步"步骤上传并重启服务器。

### 🟢 功能验证

- [ ] 对一段**无变量**的纯文本执行智能拆分，结果变量数量在 2-5 个之间。
- [ ] 对一段**已有变量**的模板执行智能拆分，确认弹出「当前已有变量，确认重新拆分？」提示框。
- [ ] 拆分成功后，工具栏出现「重置」按钮（PremiumButton 样式）。
- [ ] 点击「重置」，弹出左右对比弹窗，左侧显示拆分前内容，右侧显示拆分后内容。
- [ ] 点击「还原」，内容正确回退至拆分前，「重置」按钮消失。
- [ ] 切换模板后，「重置」按钮自动消失（快照已清除）。
- [ ] 拆分失败时（如断网），内容自动回滚，弹出失败提示，**不留下半截变量**。

---

## 7. 存储架构 (Storage)

### IndexedDB 迁移
- 核心数据（模板、词库、分类、默认值）已切换至 **IndexedDB** 存储，以突破 LocalStorage 的 5MB 限制。
- 只有设置信息（语言、主题、最后版本号等）保留在 LocalStorage。
- 发版前确保 `src/utils/db.js` 中的数据库版本号和迁移逻辑正常。

---

## 8. 发版最终检查清单

**通用**
1. [ ] `SYSTEM_DATA_VERSION` 已递增？
2. [ ] 已运行 `npm run sync-data`？
3. [ ] `public/data/` 下的 JSON 是否已上传至宝塔 `/api/data` 目录？
4. [ ] 宝塔 Node 项目是否已重启？
5. [ ] 手机端和电脑端的更新日志是否已同步？
6. [ ] 本地代码是否已执行 `git push`？

**智能拆分相关（有改动时必查）**
7. [ ] `.env.local` 的 `VITE_DEBUG_SPLIT=true` 未提交 / Vercel 未配置此变量？
8. [ ] `后端index.js` 最新版本已同步至宝塔服务器并重启？
9. [ ] 生产构建（`npm run build`）后确认无调试按钮可见？
10. [ ] 若本次调试了系统提示词：`getDebugSystemPrompt` 中的最新提示词已同步至 `后端index.js` 的 `POLISH_AND_SPLIT` 函数？
