import React, { useMemo, useState } from 'react';
import { Search, X, ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { getLocalized } from '../../utils/helpers';

/**
 * 获取模版指定索引的图片
 */
function getTemplateImageUrl(template, index = 0) {
  if (template.imageUrls && template.imageUrls.length > 0) {
    return template.imageUrls[index] || template.imageUrls[0];
  }
  return template.imageUrl || '';
}

/**
 * LinkTemplateModal - 关联模版选择弹窗
 * 宫格相册 3×N，支持多图切换预览；Hover 时外置大图预览。
 *
 * @param {boolean} isOpen - 是否打开
 * @param {Function} onClose - 关闭回调
 * @param {Function} onSelect - 选中模版回调 (template, selectedImageUrl) => void
 * @param {Array} templates - 全部模版列表
 * @param {string} currentTemplateId - 当前编辑的模版 id
 * @param {string} language - 语言 cn | en
 * @param {boolean} isDarkMode - 暗色模式
 */
export const LinkTemplateModal = React.memo(({
  isOpen,
  onClose,
  onSelect,
  templates = [],
  currentTemplateId,
  language = 'cn',
  isDarkMode,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredTemplate, setHoveredTemplate] = useState(null);
  // 记录每个模版当前显示的图片索引: { templateId: index }
  const [templateIndices, setTemplateIndices] = useState({});

  const imageTemplates = useMemo(() => {
    return templates.filter((t) => {
      const type = t.type || t.ty || 'image';
      return type === 'image' && t.id !== currentTemplateId;
    });
  }, [templates, currentTemplateId]);

  const filteredTemplates = useMemo(() => {
    if (!searchQuery.trim()) return imageTemplates;
    const q = searchQuery.trim().toLowerCase();
    return imageTemplates.filter((t) => {
      const name = getLocalized(t.name, language) || '';
      return name.toLowerCase().includes(q);
    });
  }, [imageTemplates, searchQuery, language]);

  const handleSelect = (template) => {
    const idx = templateIndices[template.id] || 0;
    const url = getTemplateImageUrl(template, idx);
    onSelect(template, url);
    onClose();
  };

  const handleIndexChange = (e, templateId, delta, total) => {
    e.stopPropagation();
    setTemplateIndices(prev => ({
      ...prev,
      [templateId]: ( (prev[templateId] || 0) + delta + total ) % total
    }));
  };

  if (!isOpen) return null;

  // 获取悬停项当前索引对应的图片
  const hoveredIdx = hoveredTemplate ? (templateIndices[hoveredTemplate.id] || 0) : 0;
  const previewImageUrl = hoveredTemplate ? getTemplateImageUrl(hoveredTemplate, hoveredIdx) : '';

  return (
    <div
      className="fixed inset-0 z-[1000] bg-black/40 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className={`
          w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-2xl overflow-hidden border flex flex-col
          animate-in zoom-in-95 duration-200
          ${isDarkMode ? 'bg-[#242120] border-white/10' : 'bg-white border-gray-100'}
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex-shrink-0 flex items-center justify-between px-5 py-4 border-b ${isDarkMode ? 'border-white/10' : 'border-gray-100'}`}>
          <h3 className={`text-lg font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {language === 'cn' ? '关联模版' : 'Link Template'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-full transition-all ${isDarkMode ? 'text-gray-500 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'}`}
            aria-label={language === 'cn' ? '关闭' : 'Close'}
          >
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className={`flex-shrink-0 px-5 pt-3 pb-2 ${isDarkMode ? 'border-white/5' : 'border-gray-50'}`}>
          <div className={`premium-search-container group ${isDarkMode ? 'dark' : 'light'} rounded-xl`}>
            <Search
              className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10 ${isDarkMode ? 'text-gray-600 group-focus-within:text-orange-500' : 'text-gray-400 group-focus-within:text-orange-500'}`}
              size={16}
            />
            <input
              type="text"
              placeholder={language === 'cn' ? '搜索模版…' : 'Search templates…'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`premium-search-input ${isDarkMode ? 'dark' : 'light'} pl-10`}
            />
          </div>
        </div>

        {/* Body: Grid */}
        <div className="flex-1 min-h-0 flex flex-col p-5">
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar pr-1">
            <div className="grid grid-cols-3 gap-3 pb-2">
              {filteredTemplates.map((t) => {
                const totalImages = (t.imageUrls && t.imageUrls.length) || (t.imageUrl ? 1 : 0);
                const currentIdx = templateIndices[t.id] || 0;
                const thumbUrl = getTemplateImageUrl(t, currentIdx);
                const name = getLocalized(t.name, language);
                const isHovered = hoveredTemplate?.id === t.id;

                return (
                  <div
                    key={t.id}
                    onMouseEnter={() => setHoveredTemplate(t)}
                    onMouseLeave={() => setHoveredTemplate(null)}
                    className={`
                      group/item relative w-full aspect-square rounded-xl overflow-hidden
                      border-2 transition-all duration-300 cursor-pointer
                      ${isHovered
                        ? 'border-orange-500 scale-[1.02] shadow-lg z-10'
                        : isDarkMode ? 'border-white/5 hover:border-white/20' : 'border-gray-100 hover:border-orange-200'
                      }
                    `}
                    onClick={() => handleSelect(t)}
                  >
                    {thumbUrl ? (
                      <img
                        src={thumbUrl}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                      />
                    ) : (
                      <div className={`absolute inset-0 flex items-center justify-center ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                        <ImageIcon size={28} className={isDarkMode ? 'text-gray-600' : 'text-gray-400'} />
                      </div>
                    )}

                    {/* 多图切换箭头 */}
                    {totalImages > 1 && (
                      <div className="absolute inset-0 flex items-center justify-between px-1 opacity-0 group-hover/item:opacity-100 transition-opacity pointer-events-none">
                        <button
                          type="button"
                          className="p-1 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors pointer-events-auto shadow-md"
                          onClick={(e) => handleIndexChange(e, t.id, -1, totalImages)}
                        >
                          <ChevronLeft size={14} />
                        </button>
                        <button
                          type="button"
                          className="p-1 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors pointer-events-auto shadow-md"
                          onClick={(e) => handleIndexChange(e, t.id, 1, totalImages)}
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    )}

                    {/* 图片指示器 (点点) */}
                    {totalImages > 1 && (
                      <div className="absolute top-2 right-2 flex gap-1 pointer-events-none">
                        {[...Array(totalImages)].map((_, i) => (
                          <div key={i} className={`w-1 h-1 rounded-full ${i === currentIdx ? 'bg-orange-500' : 'bg-white/40'}`} />
                        ))}
                      </div>
                    )}

                    {/* Bottom gradient + title */}
                    <div
                      className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 to-transparent pointer-events-none"
                      aria-hidden
                    />
                    <span className="absolute inset-x-0 bottom-0 left-0 right-0 p-2 text-[10px] md:text-[11px] font-bold text-white truncate text-center drop-shadow-md">
                      {name || (language === 'cn' ? '未命名' : 'Untitled')}
                    </span>
                  </div>
                );
              })}
            </div>
            {filteredTemplates.length === 0 && (
              <div className={`py-12 text-center text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                {language === 'cn' ? '暂无符合条件的图片模版' : 'No matching image templates'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview: 弹窗外悬浮 (仅桌面端) */}
      <div
        className={`
          hidden lg:block fixed z-[1010] w-80 pointer-events-none transition-all duration-300
          ${previewImageUrl ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}
        `}
        style={{
          top: '50%',
          left: 'calc(50% + 336px + 32px)',
          transform: 'translateY(-50%)',
        }}
      >
        {previewImageUrl && (
          <img
            key={previewImageUrl}
            src={previewImageUrl}
            alt=""
            className="w-full h-auto max-h-[70vh] object-contain rounded-2xl shadow-2xl shadow-black/40 animate-in fade-in zoom-in-95 duration-200"
            referrerPolicy="no-referrer"
          />
        )}
      </div>
    </div>
  );
});

LinkTemplateModal.displayName = 'LinkTemplateModal';
