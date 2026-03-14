import React, { useState, useEffect } from 'react';
import { useStickyState } from '../../../hooks';
import { RightPanel } from '../RightPanel';
import { ShotEditor } from '../ShotEditor';

const RIGHT_PANEL_MIN = 260;
const RIGHT_PANEL_MAX = 720;
const RIGHT_PANEL_DEFAULT = 320;
const STORAGE_KEY = 'app_video_right_panel_width_v1';

export const VideoLayout = ({ isDarkMode }) => {
  const [rightPanelWidth, setRightPanelWidth] = useStickyState(RIGHT_PANEL_DEFAULT, STORAGE_KEY);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      const w = window.innerWidth - e.clientX;
      const clamped = Math.max(RIGHT_PANEL_MIN, Math.min(RIGHT_PANEL_MAX, w));
      setRightPanelWidth(clamped);
    };
    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, setRightPanelWidth]);

  const getContainerStyle = (width, flex = 'none') => {
    const baseStyle = {
      height: '100%',
      borderRadius: '24px',
      border: '1px solid transparent',
      backgroundOrigin: 'border-box',
      backgroundClip: 'padding-box, border-box',
      width: typeof width === 'number' ? `${width}px` : width,
      flex,
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
    };
    return isDarkMode
      ? {
          ...baseStyle,
          backgroundImage:
            'linear-gradient(180deg, #3B3B3B 0%, #242120 100%), linear-gradient(180deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 100%)',
        }
      : {
          ...baseStyle,
          backgroundImage:
            'linear-gradient(180deg, #FAF5F1 0%, #F6EBE6 100%), linear-gradient(180deg, #FFFFFF 0%, rgba(255, 255, 255, 0) 100%)',
        };
  };

  return (
    <div className="flex-1 flex gap-0 h-full min-h-0 overflow-hidden">
      {/* 1. 左侧导航树容器 */}
      <div style={getContainerStyle('256px')} className="shrink-0">
        <div
          className={`p-4 font-bold border-b ${isDarkMode ? 'border-white/5 text-white/70' : 'border-black/5 text-black/70'}`}
        >
          剧集管理
        </div>
        <div className="flex-1 p-4 overflow-y-auto min-h-0">
          {/* 这里稍后放 LeftNav */}
        </div>
      </div>

      {/* 2. 中央编辑区容器（透明，无背景无边框） */}
      <div
        style={{
          flex: 1,
          height: '100%',
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative',
        }}
        className="mx-2"
      >
        <ShotEditor isDarkMode={isDarkMode} />
      </div>

      {/* 3. 右侧素材区容器（可拖拽改变宽度） */}
      <div
        style={getContainerStyle(rightPanelWidth)}
        className="shrink-0 relative"
      >
        {/* 拖拽条：在素材区左边缘 */}
        <div
          role="button"
          tabIndex={0}
          aria-label="拖拽调整素材区宽度"
          className={`absolute -left-2 top-0 bottom-0 w-4 cursor-col-resize z-10 flex items-center justify-center group`}
          onMouseDown={() => setIsResizing(true)}
          onKeyDown={(e) => e.key === 'Enter' && setIsResizing(true)}
        >
          <div
            className={`h-12 w-1.5 rounded-full transition-all duration-300 shadow-sm group-hover:shadow-lg group-hover:shadow-orange-400/30 ${
              isDarkMode
                ? 'bg-white/5 group-hover:from-orange-400 group-hover:to-orange-500 group-hover:bg-gradient-to-b'
                : 'bg-gray-300/60 group-hover:bg-gradient-to-b group-hover:from-orange-400 group-hover:to-orange-500'
            }`}
          />
        </div>
        <div className="flex-1 flex flex-col min-h-0 h-full">
          <RightPanel isDarkMode={isDarkMode} className="flex-1 min-h-0" />
        </div>
      </div>
    </div>
  );
};
