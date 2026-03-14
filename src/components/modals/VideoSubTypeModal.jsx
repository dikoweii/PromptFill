import React from 'react';
import { X, LayoutTemplate, Sparkles, ChevronRight } from 'lucide-react';

/**
 * 视频子类型选项配置
 * 便于后续扩展更多子类型
 */
const VIDEO_SUB_TYPES = [
  {
    id: 'structured',
    icon: LayoutTemplate,
    labelKey: 'video_subtype_structured',
    descKey: 'video_subtype_structured_desc',
  },
  {
    id: 'freeform',
    icon: Sparkles,
    labelKey: 'video_subtype_freeform',
    descKey: 'video_subtype_freeform_desc',
  },
];

/**
 * VideoSubTypeModal - 选择视频模板子类型的弹窗
 * 在用户选择「视频模版」后弹出，让用户选择「固定范式」或「自由创作」
 */
export const VideoSubTypeModal = ({ isOpen, onClose, onSelect, isDarkMode, language, t }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1001] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden border animate-in slide-in-from-bottom-4 duration-300 ${isDarkMode ? 'bg-[#1C1917] border-white/10' : 'bg-white border-gray-100'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-6 md:p-8 flex justify-between items-center ${isDarkMode ? 'bg-white/[0.02]' : 'bg-gray-50/50'}`}>
          <div>
            <h3 className={`font-black text-xl tracking-tight ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
              {t('video_subtype_title')}
            </h3>
            <p className={`text-xs mt-1 font-medium opacity-50 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {t('video_subtype_subtitle')}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2.5 rounded-xl transition-all ${isDarkMode ? 'hover:bg-white/10 text-gray-500 hover:text-gray-300' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'}`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 flex flex-col gap-5">
          {VIDEO_SUB_TYPES.map((subType) => {
            const IconComp = subType.icon;
            return (
              <button
                key={subType.id}
                onClick={() => onSelect(subType.id)}
                className="group relative w-full transition-all duration-300 active:scale-[0.98] outline-none"
              >
                <div
                  className="rounded-[24px] p-6 flex items-center gap-6 relative z-10 transition-all duration-300 group-hover:translate-y-[-2px] group-hover:shadow-xl"
                  style={{
                    background: isDarkMode
                      ? 'linear-gradient(180deg, #393939 9%, #242220 99%) padding-box, linear-gradient(0deg, #1A1A1A 0%, #494949 96%) border-box'
                      : 'linear-gradient(180deg, #F0EAE5 9%, #DEDCDC 96%) padding-box, linear-gradient(0deg, #BFBFBF 0%, #FFFFFF 100%) border-box',
                    border: '2px solid transparent',
                  }}
                >
                  {/* Icon */}
                  <div className={`${isDarkMode ? 'text-orange-400' : 'text-orange-500'} group-hover:scale-110 transition-transform duration-300`}>
                    <IconComp size={40} strokeWidth={1.5} />
                  </div>

                  {/* Text Info */}
                  <div className="text-left flex-1 min-w-0">
                    <h4 className={`font-black text-lg md:text-xl tracking-tight mb-1 transition-colors ${isDarkMode ? 'text-white group-hover:text-orange-400' : 'text-gray-900 group-hover:text-orange-600'}`}>
                      {t(subType.labelKey)}
                    </h4>
                    <p className={`text-xs md:text-sm font-medium leading-relaxed opacity-60 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {t(subType.descKey)}
                    </p>
                  </div>

                  <div className={`opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-[-10px] group-hover:translate-x-0 ${isDarkMode ? 'text-orange-400/50' : 'text-orange-500/50'}`}>
                    <ChevronRight size={20} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
