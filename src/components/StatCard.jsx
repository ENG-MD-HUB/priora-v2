// StatCard.jsx
// كرت إحصائية بلوحة التحكم — نسخة مُعاد كتابتها بوضوح من المكوّن Ye بالكود الأصلي.

export function StatCard({ label, value, color, onClick, icon }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: color ? `color-mix(in srgb,${color} 6%,var(--surface))` : 'var(--surface)',
        border: `1px solid ${color ? `color-mix(in srgb,${color} 25%,var(--border))` : 'var(--border)'}`,
        borderRadius: 'var(--r)',
        padding: '12px 14px 10px',
        boxShadow: 'var(--shadow)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform .12s, box-shadow .12s',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'var(--shadow)';
      }}
    >
      <div style={{ position: 'absolute', top: 10, insetInlineEnd: 10, color: color ?? 'var(--border2)', opacity: 0.35 }}>
        {icon}
      </div>
      <div style={{ fontSize: 10, color: color ?? 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4, fontWeight: 500 }}>
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 600, color: color ?? 'var(--text)', fontFamily: 'var(--mono)', lineHeight: 1 }}>
        {value}
      </div>
    </div>
  );
}
