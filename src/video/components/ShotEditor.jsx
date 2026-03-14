import React, { useState, useRef, useCallback } from 'react';
import { ChevronRight } from 'lucide-react';

// ─── TV 坐标常量（与 UITestPage 保持一致） ──────────────────────────────────
const TV_BASE_W = 900;
const TV_BASE_H = 720;
const TV_TEXT_X = 50;
const TV_TEXT_Y = 55;
const TV_TEXT_WIDTH = 800;
const TV_TEXT_HEIGHT = 540;

// ─── 字体注入（仅注入一次） ──────────────────────────────────────────────────
const FONT_STYLE_ID = 'shot-editor-fonts';
if (typeof document !== 'undefined' && !document.getElementById(FONT_STYLE_ID)) {
  const style = document.createElement('style');
  style.id = FONT_STYLE_ID;
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;600&display=swap');
    @font-face {
      font-family: 'VonwaonBitmap 12px';
      src: url('/VonwaonBitmap-16px.woff2') format('woff2');
      font-weight: normal;
      font-style: normal;
      font-display: swap;
    }
    @font-face {
      font-family: 'VonwaonBitmap';
      src: url('/VonwaonBitmap-16px.woff2') format('woff2');
      font-weight: normal;
      font-style: normal;
      font-display: swap;
    }
    .shot-tv-textarea {
      font-family: 'VonwaonBitmap 12px', 'VonwaonBitmap', monospace;
      font-size: 18px;
      font-weight: normal;
      line-height: 120%;
      letter-spacing: 0;
      color: #455748;
      background: transparent;
      border: none;
      outline: none;
      resize: none;
      white-space: pre-wrap;
      overflow-y: auto;
      width: 100%;
      height: 100%;
      padding: 0;
      box-sizing: border-box;
      caret-color: #c86030;
    }
    .shot-tv-textarea::selection {
      background: rgba(200, 96, 48, 0.25);
    }
    .shot-tv-textarea::-webkit-scrollbar {
      width: 4px;
    }
    .shot-tv-textarea::-webkit-scrollbar-track {
      background: transparent;
    }
    .shot-tv-textarea::-webkit-scrollbar-thumb {
      background: rgba(200, 96, 48, 0.3);
      border-radius: 2px;
    }
  `;
  document.head.appendChild(style);
}

// ─── 面包屑控件 ──────────────────────────────────────────────────────────────
function Breadcrumb({ items, isDarkMode }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        padding: '8px 16px',
        flexShrink: 0,
        background: 'transparent',
      }}
    >
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <React.Fragment key={i}>
            <span
              style={{
                fontSize: 12,
                fontFamily: 'monospace',
                color: isLast
                  ? (isDarkMode ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.7)')
                  : (isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'),
                fontWeight: isLast ? 600 : 400,
                cursor: isLast ? 'default' : 'pointer',
                transition: 'color 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              {item.label}
            </span>
            {!isLast && (
              <ChevronRight
                size={12}
                style={{
                  color: isDarkMode ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.18)',
                  flexShrink: 0,
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── 电视编辑器主体 ──────────────────────────────────────────────────────────
// TV 自适应策略：
//   - 外层用 flex: 1 撑满面包屑以下的空间
//   - 底部预留 80px 给后续控件
//   - 电视本体在剩余空间内按 900/720 比例，以高度为基准等比缩放
//   - 使用 useRef + ResizeObserver 实时获取容器高度，计算电视宽度
function TVEditor({ value, onChange, isDarkMode }) {
  const svgMode = 'light';
  const containerRef = React.useRef(null);
  const [tvWidth, setTvWidth] = React.useState(0);

  // 底部为后续控件预留的高度（px）
  const BOTTOM_RESERVE = 280;

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const calc = () => {
      const availH = el.clientHeight - BOTTOM_RESERVE;
      // 按 TV 比例，由可用高度推算宽度
      const w = Math.max(0, (availH * TV_BASE_W) / TV_BASE_H);
      // 同时不超出容器宽度（留少量边距）
      const maxW = el.clientWidth - 48;
      setTvWidth(Math.min(w, maxW));
    };
    calc();
    const ro = new ResizeObserver(calc);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // 电视实际高度（由 tvWidth 推算）
  const tvHeight = tvWidth > 0 ? (tvWidth * TV_BASE_H) / TV_BASE_W : 0;

  return (
    <div
      ref={containerRef}
      style={{
        flex: '1 1 0',
        minHeight: 0,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: 8,
        background: 'transparent',
        overflow: 'hidden',
      }}
    >
      {/* 电视容器：固定尺寸，由容器高度驱动 */}
      {tvWidth > 0 && (
        <div
          style={{
            width: tvWidth,
            height: tvHeight,
            flexShrink: 0,
            position: 'relative',
            background: '#e8e4da',
            borderRadius: 20,
            overflow: 'hidden',
            boxShadow: isDarkMode
              ? '0 8px 40px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.4)'
              : '0 8px 32px rgba(0,0,0,0.15), 0 2px 6px rgba(0,0,0,0.08)',
          }}
        >
          {/* z:0 电视体 SVG */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 0,
              backgroundImage: `url(/assets/tv/tv-body-${svgMode}.svg)`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              backgroundSize: '100% 100%',
            }}
          />

          {/* z:1 可编辑文本框 */}
          <div
            style={{
              position: 'absolute',
              top: `${(TV_TEXT_Y / TV_BASE_H) * 100}%`,
              left: `${(TV_TEXT_X / TV_BASE_W) * 100}%`,
              width: `${(TV_TEXT_WIDTH / TV_BASE_W) * 100}%`,
              height: `${(TV_TEXT_HEIGHT / TV_BASE_H) * 100}%`,
              zIndex: 1,
              overflow: 'hidden',
              mixBlendMode: 'multiply',
            }}
          >
            <textarea
              className="shot-tv-textarea"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              spellCheck={false}
              placeholder="在此输入分镜内容…"
            />
          </div>

          {/* z:2 Logo SVG */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 2,
              pointerEvents: 'none',
              backgroundImage: `url(/assets/tv/tv-logo-${svgMode}.svg)`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              backgroundSize: '100% 100%',
            }}
          />

          {/* z:2 Spot SVG */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 2,
              pointerEvents: 'none',
              backgroundImage: `url(/assets/tv/tv-spot-${svgMode}.svg)`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              backgroundSize: '100% 100%',
            }}
          />
        </div>
      )}

      {/* 底部预留区：260px 可容纳后续控件，BOTTOM_RESERVE 中另有余量作为间距 */}
      <div style={{ height: BOTTOM_RESERVE, flexShrink: 0 }} />
    </div>
  );
}

// ─── 末级片段视图（ShotEditor 主组件） ──────────────────────────────────────
// 面包屑数据目前为假数据占位，后续接入真实剧集/集/片段数据
const MOCK_BREADCRUMB = [
  { label: '剧集 · 雨夜侦探' },
  { label: '第 2 集' },
  { label: '片段 03' },
];

const INITIAL_CONTENT = `(00:00 - 00:04) 开场
  · 场景：古旧的酒馆内部，烛光摇曳
  · 人物：在此描述角色的外貌与状态
  · 事件：在此描述开场事件
  · 对白：（无 / 在此填写角色台词）
  · 镜头：Epic Ultra Wide Aerial Shot
  · 运镜：Fast-cut montage（多角度快切）

(00:04 - 00:08) 发展
  · 场景：承接上一幕，在此描述场景变化
  · 人物：在此描述角色动作与表情
  · 事件：在此描述推进剧情的关键事件
  · 对白：（无 / 在此填写角色台词）
  · 镜头：Wide Angle Tracking Shot
  · 运镜：Fast-cut montage（多角度快切）`;

export function ShotEditor({ isDarkMode }) {
  const [content, setContent] = useState(INITIAL_CONTENT);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'transparent',
      }}
    >
      {/* 面包屑 */}
      <Breadcrumb items={MOCK_BREADCRUMB} isDarkMode={isDarkMode} />

      {/* 电视编辑器（占满剩余空间） */}
      <TVEditor value={content} onChange={setContent} isDarkMode={isDarkMode} />
    </div>
  );
}
