import React from 'react';
import { X, Video, ImageIcon, ChevronRight } from 'lucide-react';

/**
 * AddTemplateTypeModal - 选择新建模板类型的弹窗
 */
export const AddTemplateTypeModal = ({ isOpen, onClose, onSelect, isDarkMode, language }) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden border animate-in slide-in-from-bottom-4 duration-300 ${isDarkMode ? 'bg-[#1C1917] border-white/10' : 'bg-white border-gray-100'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-6 md:p-8 flex justify-between items-center ${isDarkMode ? 'bg-white/[0.02]' : 'bg-gray-50/50'}`}>
          <h3 className={`font-black text-xl tracking-tight ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
            {language === 'cn' ? '选择模版类型' : 'Select Template Type'}
          </h3>
          <button
            onClick={onClose}
            className={`p-2.5 rounded-xl transition-all ${isDarkMode ? 'hover:bg-white/10 text-gray-500 hover:text-gray-300' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'}`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 flex flex-col gap-5">
          {/* Image Template Option */}
          <button
            onClick={() => onSelect('image')}
            className="group relative w-full transition-all duration-300 active:scale-[0.98] outline-none"
          >
            {/* Card Body */}
            <div 
              className="rounded-[24px] p-6 flex items-center gap-6 relative z-10 transition-all duration-300 group-hover:translate-y-[-2px] group-hover:shadow-xl"
              style={{
                background: isDarkMode 
                  ? 'linear-gradient(180deg, #393939 9%, #242220 99%) padding-box, linear-gradient(0deg, #1A1A1A 0%, #494949 96%) border-box'
                  : 'linear-gradient(180deg, #F0EAE5 9%, #DEDCDC 96%) padding-box, linear-gradient(0deg, #BFBFBF 0%, #FFFFFF 100%) border-box',
                border: '2px solid transparent',
              }}
            >
              {/* Icon - No background rectangle as requested */}
              <div className={`${isDarkMode ? 'text-orange-400' : 'text-orange-500'} group-hover:scale-110 transition-transform duration-300`}>
                <ImageIcon size={40} strokeWidth={1.5} />
              </div>

              {/* Text Info */}
              <div className="text-left flex-1 min-w-0">
                <h4 className={`font-black text-lg md:text-xl tracking-tight mb-1 transition-colors ${isDarkMode ? 'text-white group-hover:text-orange-400' : 'text-gray-900 group-hover:text-orange-600'}`}>
                  {language === 'cn' ? '图像模版' : 'Image Template'}
                </h4>
                <p className={`text-xs md:text-sm font-medium leading-relaxed opacity-60 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {language === 'cn' ? '创建用于生成图片的提示词模版' : 'Create prompt templates for generating images'}
                </p>
              </div>

              <div className={`opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-[-10px] group-hover:translate-x-0 ${isDarkMode ? 'text-orange-400/50' : 'text-orange-500/50'}`}>
                <ChevronRight size={20} />
              </div>
            </div>
          </button>

          {/* Video Template Option */}
          <button
            onClick={() => onSelect('video')}
            className="group relative w-full transition-all duration-300 active:scale-[0.98] outline-none"
          >
            {/* Card Body */}
            <div 
              className="rounded-[24px] p-6 flex items-center gap-6 relative z-10 transition-all duration-300 group-hover:translate-y-[-2px] group-hover:shadow-xl"
              style={{
                background: isDarkMode 
                  ? 'linear-gradient(180deg, #393939 9%, #242220 99%) padding-box, linear-gradient(0deg, #1A1A1A 0%, #494949 96%) border-box'
                  : 'linear-gradient(180deg, #F0EAE5 9%, #DEDCDC 96%) padding-box, linear-gradient(0deg, #BFBFBF 0%, #FFFFFF 100%) border-box',
                border: '2px solid transparent',
              }}
            >
              {/* Icon - No background rectangle as requested */}
              <div className={`${isDarkMode ? 'text-orange-400' : 'text-orange-500'} group-hover:scale-110 transition-transform duration-300`}>
                <Video size={40} strokeWidth={1.5} />
              </div>

              {/* Text Info */}
              <div className="text-left flex-1 min-w-0">
                <h4 className={`font-black text-lg md:text-xl tracking-tight mb-1 transition-colors ${isDarkMode ? 'text-white group-hover:text-orange-400' : 'text-gray-900 group-hover:text-orange-600'}`}>
                  {language === 'cn' ? '视频模版' : 'Video Template'}
                </h4>
                <p className={`text-xs md:text-sm font-medium leading-relaxed opacity-60 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {language === 'cn' ? '创建用于生成视频的提示词模版，支持素材参考' : 'Create prompt templates for generating videos with assets'}
                </p>
              </div>

              <div className={`opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-[-10px] group-hover:translate-x-0 ${isDarkMode ? 'text-orange-400/50' : 'text-orange-500/50'}`}>
                <ChevronRight size={20} />
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
