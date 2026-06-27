// ContactCard.jsx
// كرت جهة اتصال — نسخة مُعاد كتابتها بوضوح من المكوّن `Mt` بالكود الأصلي.
//
// ملاحظتين تصميميتين مقصودتين بالأصل، محفوظتين هنا بدقة:
// 1. الحروف الأولى للأفاتار: أول حرف من كل كلمة بالاسم (حتى حرفين كحد أقصى).
// 2. لون الأفاتار "ثابت" لكل اسم: يُحسب من مجموع أكواد حروف الاسم (charCodeAt) مقسوم
//    على عدد الألوان بالقائمة — يعني نفس الاسم يعطي نفس اللون دائماً (وليس عشوائي).

const AVATAR_COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1'];

function getInitials(name) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(name) {
  const sum = name.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

export function ContactCard({ contact, onEdit, onDelete }) {
  const initials = getInitials(contact.name);
  const color = getAvatarColor(contact.name);

  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r)',
        padding: '14px 15px',
        boxShadow: 'var(--shadow)',
        transition: 'box-shadow .15s, transform .15s',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'var(--shadow)';
        e.currentTarget.style.transform = 'none';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: '50%',
            flexShrink: 0,
            background: color + '22',
            border: `2px solid ${color}44`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            fontWeight: 700,
            color,
          }}
        >
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {contact.name}
          </div>
          {contact.note && (
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {contact.note}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {contact.phone && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ color: 'var(--text3)', flexShrink: 0 }}>
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.62 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.9a16 16 0 0 0 6 6l.95-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.73 16.92z" />
            </svg>
            <span style={{ color: 'var(--text2)', fontFamily: 'var(--mono)' }}>{contact.phone}</span>
          </div>
        )}
        {contact.email && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ color: 'var(--text3)', flexShrink: 0 }}>
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            <span style={{ color: 'var(--accent-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{contact.email}</span>
          </div>
        )}
        {!contact.phone && !contact.email && (
          <span style={{ fontSize: 11, color: 'var(--text3)', fontStyle: 'italic' }}>No contact details</span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
        <button
          onClick={onEdit}
          style={{
            flex: 1, padding: '5px 0', background: 'var(--surface2)', border: '1px solid var(--border)',
            borderRadius: 5, fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text2)',
            cursor: 'pointer', transition: 'all .12s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-light)'; e.currentTarget.style.color = 'var(--accent-text)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.color = 'var(--text2)'; }}
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          style={{
            flex: 1, padding: '5px 0', background: 'var(--surface2)', border: '1px solid var(--border)',
            borderRadius: 5, fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text2)',
            cursor: 'pointer', transition: 'all .12s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--red-bg)'; e.currentTarget.style.color = 'var(--red)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.color = 'var(--text2)'; }}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
