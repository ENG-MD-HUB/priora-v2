// TopBar.jsx
// الشريط العلوي للتطبيق — نسخة مُعاد كتابتها بوضوح من المكوّن Ke بالكود الأصلي.
//
// ملاحظات سلوكية محفوظة من الأصل:
// 1. حقل البحث مؤجّل (debounced) بـ 220ms — يكتب المستخدم محلياً فوراً، بس تحديث
//    searchQuery بمخزن الواجهة (وبالتالي تشغيل البحث الفعلي بكل الصفحات) يتأخر
//    220ms عن آخر ضغطة مفتاح، لتجنب إعادة الفلترة مع كل حرف.
// 2. لما activeView === 'workspaces'، حقل البحث العام يختفي ويظهر بدلاً منه بادج
//    "Workspaces" ثابت — البحث داخل الورك سبيس له حقل بحث منفصل بصفحة التفاصيل نفسها.
// 3. أيقونة البحث تتموضع حسب اتجاه اللغة (يمين بالعربي، يسار بالإنجليزي) تلقائياً.

import { useState, useRef, useCallback } from 'react';
import { useUIStore } from '../store/uiStore';
import { createTranslator } from '../utils/translations';
import { debounce } from '../utils/debounce';
import { useOnlineStatus } from '../utils/useOnlineStatus';
import { NotificationBell } from './NotificationBell';
import { FontScaleControl } from './FontScaleControl';

export function TopBar({ fontScale }) {
  const lang = useUIStore((s) => s.lang);
  const theme = useUIStore((s) => s.theme);
  const setSearchQuery = useUIStore((s) => s.setSearchQuery);
  const activeView = useUIStore((s) => s.activeView);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);

  const t = createTranslator(lang);
  const [localQuery, setLocalQuery] = useState('');
  const inputRef = useRef(null);
  const isWorkspacesView = activeView === 'workspaces';
  const { online } = useOnlineStatus();

  const debouncedSetSearchQuery = useCallback(
    debounce((value) => setSearchQuery(String(value)), 220),
    []
  );

  function handleSearchChange(e) {
    setLocalQuery(e.target.value);
    debouncedSetSearchQuery(e.target.value);
  }

  function clearSearch() {
    setLocalQuery('');
    setSearchQuery('');
    inputRef.current?.focus();
  }

  const searchPlaceholder = isWorkspacesView
    ? lang === 'ar' ? 'بحث في مساحات العمل…' : 'Search in workspaces…'
    : t('search');

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 100, background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '0 18px', display: 'flex', alignItems: 'center', gap: 12, height: 'var(--topbar-h)', transition: 'background .2s' }}>
      <button
        className="hamburger-btn"
        onClick={() => setSidebarOpen((v) => !v)}
        aria-label="Menu"
        style={{ display: 'none', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', flexShrink: 0 }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        <img src={theme === 'dark' ? '/logo-night.png' : '/logo-day.png'} alt="Priora" style={{ height: 28, objectFit: 'contain' }} />
      </div>

      {!isWorkspacesView && (
        <div style={{ flex: 1, maxWidth: 400, margin: '0 auto', position: 'relative' }}>
          <svg
            width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none', ...(lang === 'ar' ? { right: 10 } : { left: 10 }) }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            ref={inputRef}
            value={localQuery}
            onChange={handleSearchChange}
            placeholder={searchPlaceholder}
            type="search"
            style={{
              width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 7, fontSize: 13,
              color: 'var(--text)', padding: lang === 'ar' ? '7px 34px 7px 10px' : '7px 10px 7px 34px', outline: 'none',
              transition: 'border-color .15s, box-shadow .15s', fontFamily: 'var(--font)',
            }}
            onFocus={(e) => { e.target.style.borderColor = 'var(--accent)'; e.target.style.boxShadow = '0 0 0 2px color-mix(in srgb, var(--accent) 18%, transparent)'; }}
            onBlur={(e) => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; }}
          />
          {localQuery && (
            <button
              onClick={clearSearch}
              style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', right: lang === 'ar' ? 'auto' : 8, left: lang === 'ar' ? 8 : 'auto', background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', display: 'flex', padding: 2, borderRadius: 4 }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      )}

      {isWorkspacesView && (
        <div style={{ fontSize: 11, color: 'var(--accent-text)', background: 'var(--accent-light)', border: '1px solid color-mix(in srgb,var(--accent) 25%,var(--border))', borderRadius: 99, padding: '2px 10px', flexShrink: 0, fontWeight: 500 }}>
          {lang === 'ar' ? 'مساحات العمل' : 'Workspaces'}
        </div>
      )}

      <div style={{ marginInlineStart: 'auto', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 6px', border: '1px solid var(--border)', borderRadius: 9, background: 'var(--surface)' }}>
          <FontScaleControl fontScale={fontScale} />
          <div style={{ width: 1, height: 18, background: 'var(--border)' }} />
          <NotificationBell />
        </div>
        <div style={{ flexShrink: 0 }}>
          {online ? (
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 5px rgba(34,197,94,.5)' }} title="Online" />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 6, background: 'rgba(239,68,68,.08)', border: '0.5px solid rgba(239,68,68,.25)' }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: '#ef4444' }}>Offline</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
