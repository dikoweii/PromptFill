import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getLocalized } from '../../../utils/helpers';

// ─── 分类 Tab 映射：knowledge-index.json 的 categoryId → LEVEL2_KNOWLEDGE tab id ───
const CATEGORY_TAB_MAP = {
  'prompt-tips': 'prompt_tips',
  'case-analysis': 'case_study',
  cinematography: 'photography',
};

// ─── 解析 Markdown frontmatter（兼容 BOM / CRLF）─────────────────────────────
function parseFrontmatter(raw) {
  const normalizedRaw = String(raw || '').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  const match = normalizedRaw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return { meta: {}, content: normalizedRaw };
  const meta = {};
  match[1].split('\n').forEach((line) => {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) return;
    const key = line.slice(0, colonIdx).trim();
    const val = line.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, '');
    meta[key] = val;
  });
  const content = normalizedRaw.slice(match[0].length).trim();
  return { meta, content };
}

// ─── MarkdownRenderer ─────────────────────────────────────────────────────────
const MarkdownRenderer = ({ content, isDarkMode }) => {
  const d = isDarkMode;
  const c = {
    text:        d ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.72)',
    textStrong:  d ? '#fff'                   : 'rgba(0,0,0,0.88)',
    heading1:    d ? '#fff'                   : 'rgba(0,0,0,0.88)',
    heading2:    d ? 'rgba(255,255,255,0.9)'  : 'rgba(0,0,0,0.82)',
    heading3:    d ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.75)',
    quote:       d ? 'rgba(255,255,255,0.32)' : 'rgba(0,0,0,0.3)',
    divider:     d ? 'rgba(255,255,255,0.1)'  : 'rgba(0,0,0,0.1)',
    h2Border:    d ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    codeBg:      d ? '#1a1a1a'                : '#ddd8d1',
    codeBorder:  d ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)',
    codeText:    d ? '#e2e8f0'                : 'rgba(0,0,0,0.78)',
    inlineCodeBg:d ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
    thBg:        d ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
    thText:      d ? 'rgba(255,255,255,0.8)'  : 'rgba(0,0,0,0.75)',
    thBorder:    d ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
    tdText:      d ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.6)',
    tdBorder:    d ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
  };

  const components = {
    img({ src, alt }) {
      return (
        <img
          src={src}
          alt={alt}
          style={{
            maxWidth: '100%',
            borderRadius: 8,
            display: 'block',
            margin: '12px 0',
          }}
        />
      );
    },
    a({ href, children }) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#f97316', textDecoration: 'none', borderBottom: '1px solid rgba(249,115,22,0.4)' }}
        >
          {children}
        </a>
      );
    },
    pre({ children }) {
      return (
        <blockquote
          style={{
            borderLeft: '3px solid #f97316',
            background: d ? 'rgba(249,115,22,0.08)' : 'rgba(249,115,22,0.06)',
            borderRadius: 8,
            padding: '10px 12px',
            margin: '12px 0',
          }}
        >
          {children}
        </blockquote>
      );
    },
    code({ children }) {
      return (
        <code
          style={{
            background: c.inlineCodeBg,
            color: '#f97316',
            padding: '1px 5px',
            borderRadius: 4,
            fontSize: '0.88em',
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {children}
        </code>
      );
    },
    blockquote({ children }) {
      return (
        <blockquote
          style={{
            borderLeft: '3px solid #f97316',
            paddingLeft: 14,
            margin: '16px 0',
            color: c.quote,
            fontStyle: 'italic',
            fontSize: '0.9em',
          }}
        >
          {children}
        </blockquote>
      );
    },
    h1({ children }) {
      return <h1 style={{ fontSize: '1.25em', fontWeight: 700, color: c.heading1, margin: '20px 0 10px' }}>{children}</h1>;
    },
    h2({ children }) {
      return (
        <h2
          style={{
            fontSize: '1.1em',
            fontWeight: 700,
            color: c.heading2,
            margin: '18px 0 8px',
            paddingBottom: 6,
            borderBottom: `1px solid ${c.h2Border}`,
          }}
        >
          {children}
        </h2>
      );
    },
    h3({ children }) {
      return <h3 style={{ fontSize: '1em', fontWeight: 600, color: c.heading3, margin: '14px 0 6px' }}>{children}</h3>;
    },
    p({ children }) {
      return <p style={{ margin: '10px 0', lineHeight: 1.85, color: c.text }}>{children}</p>;
    },
    ul({ children }) {
      return <ul style={{ paddingLeft: 20, margin: '8px 0', color: c.text }}>{children}</ul>;
    },
    ol({ children }) {
      return <ol style={{ paddingLeft: 20, margin: '8px 0', color: c.text }}>{children}</ol>;
    },
    li({ children }) {
      return <li style={{ marginBottom: 4, lineHeight: 1.85 }}>{children}</li>;
    },
    hr() {
      return <hr style={{ border: 'none', borderTop: `1px solid ${c.divider}`, margin: '16px 0' }} />;
    },
    strong({ children }) {
      return <strong style={{ color: c.textStrong, fontWeight: 600 }}>{children}</strong>;
    },
    table({ children }) {
      return (
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.9em' }}>{children}</table>
        </div>
      );
    },
    th({ children }) {
      return (
        <th
          style={{
            padding: '6px 10px',
            background: c.thBg,
            color: c.thText,
            fontWeight: 600,
            textAlign: 'left',
            borderBottom: `1px solid ${c.thBorder}`,
          }}
        >
          {children}
        </th>
      );
    },
    td({ children }) {
      return (
        <td
          style={{
            padding: '6px 10px',
            color: c.tdText,
            borderBottom: `1px solid ${c.tdBorder}`,
          }}
        >
          {children}
        </td>
      );
    },
  };

  return (
    <div style={{ userSelect: 'text', WebkitUserSelect: 'text' }}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
};

// ─── ArticleCard：画廊单张卡片 ────────────────────────────────────────────────
const ArticleCard = ({ article, language, isDarkMode, onClick }) => {
  const title = language === 'en' ? (article.titleEn || article.title) : article.title;
  const tags = language === 'en' ? (article.tagsEn || article.tags) : article.tags;

  const borderBase = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';
  const titleColor = isDarkMode ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)';
  const metaColor = isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
  const timeColor = isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)';
  const tagBg = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
  const tagColor = isDarkMode ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)';
  const coverBg = isDarkMode ? '#1a1a1a' : '#d8d3cc';
  const noImgColor = isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)';

  return (
    <button
      type="button"
      onClick={() => onClick(article)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        background: 'transparent',
        border: `1px solid ${borderBase}`,
        borderRadius: 10,
        overflow: 'hidden',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'border-color 0.18s, transform 0.18s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(249,115,22,0.45)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = borderBase;
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* 封面图 */}
      <div style={{ width: '100%', aspectRatio: '16/9', background: coverBg, overflow: 'hidden', position: 'relative' }}>
        {article.cover ? (
          <img
            src={article.cover}
            alt={title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            loading="lazy"
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: noImgColor, fontSize: 32 }}>
            📄
          </div>
        )}
        {article.featured && (
          <span style={{
            position: 'absolute', top: 6, right: 6,
            background: 'rgba(249,115,22,0.9)', color: '#fff',
            fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 4,
          }}>
            精选
          </span>
        )}
      </div>
      {/* 卡片信息 */}
      <div style={{ padding: '10px 12px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: titleColor, lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
          {article.author && (
            <span style={{ fontSize: 11, color: metaColor }}>{article.author}</span>
          )}
          {article.readingTime && (
            <span style={{ fontSize: 11, color: timeColor }}>· {article.readingTime} 分钟</span>
          )}
        </div>
        {tags && tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 2 }}>
            {tags.slice(0, 3).map((tag) => (
              <span key={tag} style={{
                fontSize: 10, padding: '2px 6px',
                background: tagBg,
                color: tagColor,
                borderRadius: 4,
              }}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
};

// ─── SubcategoryCard：子类卡片（色块封面） ───────────────────────────────────
const SUBCATEGORY_COLORS = [
  ['#2a2018', '#f97316'],
  ['#181f2a', '#3b82f6'],
  ['#1a2218', '#22c55e'],
  ['#221828', '#a855f7'],
];

const SubcategoryCard = ({ subcategory, index, language, isDarkMode, articleCount, onClick }) => {
  const name = language === 'en' ? (subcategory.nameEn || subcategory.name?.en || subcategory.name?.cn) : (subcategory.name?.cn || subcategory.name);
  const desc = language === 'en' ? (subcategory.descriptionEn || subcategory.description?.en) : subcategory.description?.cn;
  const [bgDark, accent] = SUBCATEGORY_COLORS[index % SUBCATEGORY_COLORS.length];
  const borderBase = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';
  const titleColor = isDarkMode ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.85)';
  const descColor = isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.45)';
  const coverBg = isDarkMode ? bgDark : '#ddd8d1';

  return (
    <button
      type="button"
      onClick={() => onClick(subcategory)}
      style={{
        display: 'flex', flexDirection: 'column', width: '100%',
        background: 'transparent', border: `1px solid ${borderBase}`,
        borderRadius: 10, overflow: 'hidden', cursor: 'pointer',
        textAlign: 'left', transition: 'border-color 0.18s, transform 0.18s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(249,115,22,0.45)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = borderBase;
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* 封面：有图片时显示图片，否则显示色块 + emoji */}
      <div style={{ width: '100%', aspectRatio: '16/9', background: coverBg, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
        {subcategory.cover ? (
          <img
            src={subcategory.cover}
            alt={name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            loading="lazy"
          />
        ) : (
          <span style={{ fontSize: 28, opacity: 0.6, color: isDarkMode ? accent : 'rgba(0,0,0,0.25)' }}>
            {['🎬', '🎥', '✂️', '🎵'][index % 4]}
          </span>
        )}
      </div>
      {/* 卡片信息 */}
      <div style={{ padding: '10px 12px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: titleColor, lineHeight: 1.45 }}>{name}</div>
        {desc && (
          <div style={{ fontSize: 11, color: descColor, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {desc}
          </div>
        )}
        {typeof articleCount === 'number' && (
          <div style={{ fontSize: 10, color: descColor, marginTop: 2 }}>
            {articleCount > 0 ? `${articleCount} ${language === 'cn' ? '篇' : 'articles'}` : (language === 'cn' ? '暂无文章' : 'No articles')}
          </div>
        )}
      </div>
    </button>
  );
};

// ─── SubcategoryGallery：子类两列画廊 ────────────────────────────────────────
const SubcategoryGallery = ({ subcategories, articles, categoryDbId, language, isDarkMode, onSelectSubcategory }) => {
  const emptyColor = isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)';
  if (!subcategories || subcategories.length === 0) {
    return (
      <div style={{ padding: '32px 0', textAlign: 'center', color: emptyColor, fontSize: 13 }}>
        {language === 'cn' ? '暂无子类' : 'No subcategories'}
      </div>
    );
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      {subcategories.map((sub, i) => {
        const count = articles.filter(a => a.published && a.categoryId === categoryDbId && a.subcategoryId === sub.id).length;
        return (
          <SubcategoryCard
            key={sub.id}
            subcategory={sub}
            index={i}
            language={language}
            isDarkMode={isDarkMode}
            articleCount={count}
            onClick={onSelectSubcategory}
          />
        );
      })}
    </div>
  );
};

// ─── ArticleGallery：文章两列画廊 ─────────────────────────────────────────────
const ArticleGallery = ({ categoryId, subcategoryId, articles, language, isDarkMode, onSelectArticle }) => {
  const filtered = articles.filter((a) => {
    if (!a.published) return false;
    const catMatch = CATEGORY_TAB_MAP[a.categoryId] === categoryId;
    if (!catMatch) return false;
    if (subcategoryId) return a.subcategoryId === subcategoryId;
    return true;
  });

  const emptyColor = isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)';

  if (filtered.length === 0) {
    return (
      <div style={{ padding: '32px 0', textAlign: 'center', color: emptyColor, fontSize: 13 }}>
        {language === 'cn' ? '暂无文章' : 'No articles yet'}
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      {filtered.map((article) => (
        <ArticleCard
          key={article.id}
          article={article}
          language={language}
          isDarkMode={isDarkMode}
          onClick={onSelectArticle}
        />
      ))}
    </div>
  );
};

// ─── BreadcrumbBar：文章画廊顶部的子类返回条 ─────────────────────────────────
const BreadcrumbBar = ({ label, onBack, isDarkMode, language }) => {
  const backColor = isDarkMode ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)';
  const labelColor = isDarkMode ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.7)';
  const dividerColor = isDarkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 12, marginBottom: 12, borderBottom: `1px solid ${dividerColor}` }}>
      <button
        type="button"
        onClick={onBack}
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          background: 'none', border: 'none', cursor: 'pointer',
          color: backColor, fontSize: 12, padding: '2px 0',
          transition: 'color 0.15s', flexShrink: 0,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = '#f97316'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = backColor; }}
      >
        <span style={{ fontSize: 14 }}>←</span>
        <span>{language === 'cn' ? '返回' : 'Back'}</span>
      </button>
      <span style={{ fontSize: 12, color: labelColor, fontWeight: 600 }}>{label}</span>
    </div>
  );
};

// ─── ArticleDetail：全文渲染 ───────────────────────────────────────────────────
const ArticleDetail = ({ article, language, isDarkMode, onBack, subcategoryName, style }) => {
  const [mdContent, setMdContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [titleHidden, setTitleHidden] = useState(false);
  const titleRef = useRef(null);
  const scrollAreaRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(article.contentPath)
      .then((r) => {
        if (!r.ok) throw new Error('fetch failed');
        return r.text();
      })
      .then((raw) => {
        const { content } = parseFrontmatter(raw);
        // 去掉正文开头的 h1 标题（与元信息区标题重复）
        setMdContent(content.replace(/^#[^#][^\n]*\n?/, '').trimStart());
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [article.contentPath]);

  // IntersectionObserver 以内容滚动区为 root，监听标题是否滚出顶部
  useEffect(() => {
    const el = titleRef.current;
    const root = scrollAreaRef.current;
    if (!el || !root) return;
    const observer = new IntersectionObserver(
      ([entry]) => setTitleHidden(!entry.isIntersecting),
      { root, threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const title = language === 'en' ? (article.titleEn || article.title) : article.title;
  const backColor = isDarkMode ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)';
  const stickyBg = isDarkMode ? '#252525' : '#E8E3DD';
  const dividerColor = isDarkMode ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)';
  const stickyTitleColor = isDarkMode ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.7)';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', ...style }}>
      {/* 顶部返回栏：flex 布局常驻顶部，不参与滚动 */}
      <div style={{
        flexShrink: 0,
        background: stickyBg,
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        paddingBottom: 12,
        marginBottom: 4,
        borderBottom: `1px solid ${dividerColor}`,
      }}>
        {/* 返回按钮 */}
        <button
          type="button"
          onClick={onBack}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'none', border: 'none', cursor: 'pointer',
            color: backColor, fontSize: 12, padding: '2px 0',
            transition: 'color 0.15s',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#f97316'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = backColor; }}
        >
          <span style={{ fontSize: 14 }}>←</span>
          <span>{language === 'cn' ? '返回列表' : 'Back'}</span>
        </button>

        {/* 有子类时，常驻显示子类名作为当前层级 */}
        {subcategoryName && (
          <>
            <span style={{ fontSize: 12, color: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)', margin: '0 6px', flexShrink: 0 }}>/</span>
            <span style={{ fontSize: 12, color: isDarkMode ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)', flexShrink: 0, fontWeight: 500 }}>
              {subcategoryName}
            </span>
          </>
        )}

        {/* 文章标题：滚出后渐显，占满剩余空间 */}
        <span style={{
          fontSize: 12,
          color: stickyTitleColor,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
          flex: 1,
          marginLeft: subcategoryName ? 6 : 8,
          opacity: titleHidden ? 1 : 0,
          transform: titleHidden ? 'translateY(0)' : 'translateY(4px)',
          transition: 'opacity 0.2s, transform 0.2s',
        }}>
          {subcategoryName && <span style={{ color: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)', marginRight: 6 }}>/</span>}
          {title}
        </span>
      </div>

      {/* 封面 + 标题 + 正文：独立滚动区域 */}
      <div
        ref={scrollAreaRef}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          paddingBottom: 20,
          userSelect: 'text',
          WebkitUserSelect: 'text',
        }}
        className="custom-scrollbar"
      >
        {/* 封面占位：无图时也保留区域，避免顶部观感突兀 */}
        <div
          style={{
            width: '100%',
            aspectRatio: '16/9',
            borderRadius: 8,
            overflow: 'hidden',
            marginBottom: 14,
            background: isDarkMode ? '#1f1f1f' : '#d8d3cc',
            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {article.cover ? (
            <img src={article.cover} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: 30, opacity: 0.45 }}>{isDarkMode ? '🖼️' : '📄'}</span>
          )}
        </div>

        {/* 标题与元信息：被 ref 监听，滚出视口时触发顶栏显示标题 */}
        <div ref={titleRef} style={{ marginBottom: 14 }}>
          <h1 style={{ fontSize: '1.25em', fontWeight: 700, color: isDarkMode ? '#fff' : 'rgba(0,0,0,0.88)', lineHeight: 1.5, margin: '0 0 8px' }}>{title}</h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}>
            {article.author && (
              <span style={{ fontSize: 12, color: isDarkMode ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)' }}>{article.author}</span>
            )}
            {article.readingTime && (
              <span style={{ fontSize: 12, color: isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }}>
                {language === 'cn' ? `约 ${article.readingTime} 分钟阅读` : `${article.readingTime} min read`}
              </span>
            )}
            {article.source && (
              <a href={article.source} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 12, color: '#f97316', textDecoration: 'none' }}>
                {language === 'cn' ? '查看原文 →' : 'Source →'}
              </a>
            )}
          </div>
        </div>

        {/* Markdown 正文 */}
        <div>
          {loading && (
            <div style={{ textAlign: 'center', padding: '32px 0', color: isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)', fontSize: 13 }}>
              {language === 'cn' ? '加载中...' : 'Loading...'}
            </div>
          )}
          {error && (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#f87171', fontSize: 13 }}>
              {language === 'cn' ? '内容加载失败' : 'Failed to load content'}
            </div>
          )}
          {!loading && !error && <MarkdownRenderer content={mdContent} isDarkMode={isDarkMode} />}
        </div>
      </div>
    </div>
  );
};

// ─── KnowledgePanel：主容器（包含指定样式的子容器）────────────────────────────
export const KnowledgePanel = ({ tabId, language, isDarkMode = true }) => {
  const [indexData, setIndexData] = useState(null);
  // view: 'subcategory-gallery' | 'article-gallery' | 'article-detail'
  const [view, setView] = useState('subcategory-gallery');
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const scrollRef = useRef(null);

  // 加载 knowledge-index.json
  useEffect(() => {
    fetch('/data/knowledge-index.json')
      .then((r) => r.json())
      .then(setIndexData)
      .catch(() => setIndexData(null));
  }, []);

  // 切换 Tab 时重置状态
  useEffect(() => {
    setView('subcategory-gallery');
    setSelectedSubcategory(null);
    setSelectedArticle(null);
  }, [tabId]);

  const scrollToTop = useCallback(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, []);

  // 当前分类的 DB id（knowledge-index 里的 categoryId）
  const categoryDbId = Object.entries(CATEGORY_TAB_MAP).find(([, v]) => v === tabId)?.[0];
  const category = indexData?.categories?.find(c => c.id === categoryDbId);
  const subcategories = category?.subcategories || [];
  const hasSubcategories = subcategories.length > 0;
  const articles = indexData?.articles || [];

  const handleSelectSubcategory = useCallback((sub) => {
    setSelectedSubcategory(sub);
    setView('article-gallery');
    scrollToTop();
  }, [scrollToTop]);

  const handleSelectArticle = useCallback((article) => {
    setSelectedArticle(article);
    setView('article-detail');
    scrollToTop();
  }, [scrollToTop]);

  const handleBackToSubcategory = useCallback(() => {
    setSelectedArticle(null);
    setView('article-gallery');
    scrollToTop();
  }, [scrollToTop]);

  const handleBackToGallery = useCallback(() => {
    setSelectedArticle(null);
    setView(hasSubcategories ? 'subcategory-gallery' : 'article-gallery');
    setSelectedSubcategory(null);
    scrollToTop();
  }, [hasSubcategories, scrollToTop]);

  // 初始 view：无子类则直接是文章画廊
  useEffect(() => {
    if (!indexData) return;
    if (!hasSubcategories) setView('article-gallery');
    else setView('subcategory-gallery');
  }, [indexData, tabId, hasSubcategories]);

  const isDetailView = view === 'article-detail';

  // 渐变边框颜色
  const borderGradient = isDarkMode
    ? 'linear-gradient(0deg, #646464 0%, rgba(0,0,0,0) 20%)'
    : 'linear-gradient(0deg, #FFFFFF 0%, rgba(255,255,255,0) 97%)';
  const contentBg = isDarkMode ? '#252525' : '#E8E3DD';
  const loadingColor = isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)';

  return (
    <div style={{ padding: '4px 2px 8px', height: '100%', boxSizing: 'border-box' }}>
      <div style={{ background: borderGradient, borderRadius: 11, padding: 1, height: '100%', boxSizing: 'border-box' }}>
        {/* 实际内容子容器 */}
        <div
          ref={scrollRef}
          style={{
            background: contentBg,
            boxSizing: 'border-box',
            boxShadow: 'inset 0px 2px 4px 0px rgba(0, 0, 0, 0.3)',
            borderRadius: 10,
            padding: isDetailView ? '14px 14px 0' : '14px 14px 20px',
            height: '100%',
            overflowY: isDetailView ? 'hidden' : 'auto',
            overflowX: 'hidden',
            display: isDetailView ? 'flex' : 'block',
            flexDirection: 'column',
            userSelect: isDetailView ? 'text' : 'auto',
            WebkitUserSelect: isDetailView ? 'text' : 'auto',
          }}
          className={`custom-scrollbar ${isDarkMode ? 'dark-mode' : ''}`}
        >
          {!indexData && (
            <div style={{ padding: '32px 0', textAlign: 'center', color: loadingColor, fontSize: 13 }}>
              {language === 'cn' ? '加载中...' : 'Loading...'}
            </div>
          )}

          {/* 子类画廊 */}
          {indexData && view === 'subcategory-gallery' && (
            <SubcategoryGallery
              subcategories={subcategories}
              articles={articles}
              categoryDbId={categoryDbId}
              language={language}
              isDarkMode={isDarkMode}
              onSelectSubcategory={handleSelectSubcategory}
            />
          )}

          {/* 文章画廊（含子类面包屑返回） */}
          {indexData && view === 'article-gallery' && (
            <div>
              {/* 有子类时显示返回按钮 */}
              {hasSubcategories && selectedSubcategory && (
                <BreadcrumbBar
                  label={language === 'cn'
                    ? (selectedSubcategory.name?.cn || selectedSubcategory.name)
                    : (selectedSubcategory.name?.en || selectedSubcategory.name?.cn)}
                  onBack={handleBackToGallery}
                  isDarkMode={isDarkMode}
                  language={language}
                />
              )}
              <ArticleGallery
                categoryId={tabId}
                subcategoryId={selectedSubcategory?.id}
                articles={articles}
                language={language}
                isDarkMode={isDarkMode}
                onSelectArticle={handleSelectArticle}
              />
            </div>
          )}

          {/* 文章详情 */}
          {indexData && view === 'article-detail' && (
            <ArticleDetail
              article={selectedArticle}
              language={language}
              isDarkMode={isDarkMode}
              onBack={hasSubcategories ? handleBackToSubcategory : handleBackToGallery}
              subcategoryName={hasSubcategories && selectedSubcategory
                ? (language === 'en'
                    ? (selectedSubcategory.name?.en || selectedSubcategory.name?.cn)
                    : (selectedSubcategory.name?.cn || selectedSubcategory.name))
                : null}
              style={{ flex: 1, minHeight: 0 }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default KnowledgePanel;
