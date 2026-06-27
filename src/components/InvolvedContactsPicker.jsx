// InvolvedContactsPicker.jsx
// منتقي جهات اتصال مبسّط (dropdown عادي، بدون بحث فوري) — نسخة مُعاد كتابتها بوضوح
// من المكوّن at بالكود الأصلي. يُستخدم بمودال "Edit Task" (ot)، بعكس
// InvolvedContactsTypeahead الأغنى المستخدم بمودال إنشاء تاسك جديد.

import { useContactsStore } from '../store/contactsStore';

export function InvolvedContactsPicker({ value, onChange }) {
  const contacts = useContactsStore((s) => s.contacts);
  const selectedContacts = value.map((id) => contacts.find((c) => c.id === id)).filter(Boolean);

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {selectedContacts.map((c) => (
        <span
          key={c.id}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5, background: 'var(--accent-light)',
            color: 'var(--accent-text)', border: '1px solid color-mix(in srgb,var(--accent) 30%,var(--border))',
            borderRadius: 99, padding: '3px 8px', fontSize: 12, fontWeight: 500,
          }}
        >
          {c.name}
          <button
            onClick={() => onChange(value.filter((v) => v !== c.id))}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-text)', fontSize: 13, lineHeight: 1, padding: 0, opacity: 0.7 }}
          >
            ×
          </button>
        </span>
      ))}
      <select
        style={{ padding: '3px 8px', borderRadius: 99, fontSize: 12, fontFamily: 'var(--font)', background: 'var(--surface2)', border: '1px dashed var(--border2)', color: 'var(--text3)', cursor: 'pointer', outline: 'none' }}
        value=""
        onChange={(e) => { if (e.target.value) onChange([...new Set([...value, e.target.value])]); }}
      >
        <option value="">+ Add person…</option>
        {contacts.filter((c) => !value.includes(c.id)).map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
    </div>
  );
}
