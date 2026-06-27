// SidebarNavItem.jsx
// عنصر تنقّل واحد بالشريط الجانبي — نسخة مُعاد كتابتها بوضوح من المكوّن Le بالكود
// الأصلي. يدعم badge (عداد دائري) و note (نص تنبيهي صغير، مثل "3↑" بجانب Dashboard).

import { Icon } from './Icon';

export function SidebarNavItem({ viewId, icon, label, badge, activeView, setActiveView, note }) {
  const isActive = activeView === viewId;

  return (
    <button
      onClick={() => setActiveView(viewId)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px',
        cursor: 'pointer', color: isActive ? 'var(--accent)' : 'var(--text2)', fontSize: 13,
        background: isActive ? 'var(--accent-light)' : 'none', border: 'none',
        borderInlineStart: `2px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
        fontFamily: 'var(--font)', fontWeight: isActive ? 500 : 400, transition: 'all .12s', textAlign: 'start',
      }}
      onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.color = 'var(--text)'; } }}
      onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text2)'; } }}
    >
      <Icon name={icon} />
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {label}
        {note && <span style={{ marginInlineStart: 4, fontSize: 10, color: 'var(--red)', fontFamily: 'var(--mono)' }}>{note}</span>}
      </span>
      {(badge ?? 0) > 0 && (
        <span style={{ background: isActive ? 'var(--accent-light)' : 'var(--surface2)', border: `1px solid ${isActive ? 'var(--accent)' : 'var(--border)'}`, color: isActive ? 'var(--accent-text)' : 'var(--text3)', borderRadius: 99, fontSize: 11, padding: '1px 6px', fontFamily: 'var(--mono)', flexShrink: 0 }}>
          {badge}
        </span>
      )}
    </button>
  );
}
