// InvolvedContactsTypeahead.jsx
// منتقي جهات الاتصال المرتبطة بتاسك — بحث فوري (typeahead) + إضافة جهة اتصال جديدة
// لو ما لقيت تطابق. نسخة مُعاد كتابتها بوضوح من المكوّن nt بالكود الأصلي.
//
// ملاحظة: هذا مختلف عن InvolvedContactsPicker (at) الأبسط — هذا يدعم البحث الفوري
// وإنشاء جهة اتصال جديدة inline عن طريق QuickAddContactModal لو ما لقى تطابق دقيق.

import { useState, useRef, useEffect } from 'react';
import { useContactsStore } from '../store/contactsStore';
import { QuickAddContactModal } from './QuickAddContactModal';

export function InvolvedContactsTypeahead({ value, onChange }) {
  const contacts = useContactsStore((s) => s.contacts);
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [prefillForNewContact, setPrefillForNewContact] = useState(null);
  const [openUpward, setOpenUpward] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // ⚠️ إصلاح بطلب صريح: القائمة كانت تظهر دائماً تحت الحقل، حتى لو ما فيه مساحة
  // كافية (مثلاً الحقل قريب من نهاية نافذة/مودال) — تختفي مقتطعة جزئياً. الآن نفحص
  // المساحة المتاحة أسفل الحقل فعلياً لحظة الفتح، ولو غير كافية، تظهر القائمة فوق
  // الحقل تلقائياً بدلاً من تحته.
  function openDropdown() {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenUpward(spaceBelow < 220); // 220 يطابق تقريباً ارتفاع القائمة الأقصى (maxHeight: 200 + هوامش)
    }
    setShowDropdown(true);
  }

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setShowDropdown(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const normalizedQuery = query.trim().toLowerCase();
  const matchingContacts = contacts.filter(
    (c) => !value.includes(c.id) && (!normalizedQuery || c.name.toLowerCase().includes(normalizedQuery))
  );
  const exactMatch = contacts.find((c) => c.name.toLowerCase() === normalizedQuery);
  const showCreateNew = normalizedQuery.length >= 2 && !exactMatch;
  const selectedContacts = value.map((id) => contacts.find((c) => c.id === id)).filter(Boolean);

  function selectContact(contact) {
    onChange([...value, contact.id]);
    setQuery('');
    inputRef.current?.focus();
  }

  function removeContact(id) {
    onChange(value.filter((v) => v !== id));
  }

  return (
    <div ref={containerRef}>
      {selectedContacts.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 6 }}>
          {selectedContacts.map((c) => (
            <span
              key={c.id}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5, background: 'var(--accent-light)',
                color: 'var(--accent-text)', border: '1px solid color-mix(in srgb, var(--accent) 30%, var(--border))',
                borderRadius: 99, padding: '3px 8px', fontSize: 12, fontWeight: 500,
              }}
            >
              {c.name}
              <button
                onClick={() => removeContact(c.id)}
                style={{ background: 'none', border: 'none', color: 'var(--accent-text)', cursor: 'pointer', fontSize: 13, lineHeight: 1, padding: 0, opacity: 0.7 }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          className="input"
          value={query}
          onChange={(e) => { setQuery(e.target.value); openDropdown(); }}
          onFocus={openDropdown}
          placeholder={selectedContacts.length ? 'Add another…' : 'Type a name…'}
        />
        {showDropdown && (query.length >= 1 || contacts.length > 0) && (
          <div
            style={{
              position: 'absolute', left: 0, right: 0, zIndex: 200, background: 'var(--surface)',
              border: '1px solid var(--border)', borderRadius: 8, boxShadow: 'var(--shadow-lg)',
              maxHeight: 200, overflowY: 'auto',
              ...(openUpward ? { bottom: '100%', marginBottom: 3 } : { top: '100%', marginTop: 3 }),
            }}
          >
            {matchingContacts.slice(0, 7).map((c) => (
              <button
                key={c.id}
                onMouseDown={(e) => { e.preventDefault(); selectContact(c); }}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '8px 12px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'start', fontFamily: 'var(--font)' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface2)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              >
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--accent-text)', flexShrink: 0 }}>
                  {(c.name || '?')[0].toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>{c.name}</div>
                  {(c.phone || c.email) && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{c.phone ?? c.email}</div>}
                </div>
              </button>
            ))}

            {showCreateNew && (
              <button
                onMouseDown={(e) => { e.preventDefault(); setShowDropdown(false); setPrefillForNewContact(query); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', background: 'none',
                  border: 'none', borderTop: matchingContacts.length ? '1px solid var(--border)' : 'none', cursor: 'pointer',
                  textAlign: 'start', fontFamily: 'var(--font)', color: 'var(--accent)', fontSize: 13, fontWeight: 500,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--accent-light)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
              >
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </div>
                Add "{query}" as new contact
              </button>
            )}

            {matchingContacts.length === 0 && !showCreateNew && (
              <div style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text3)' }}>
                {normalizedQuery ? 'No contacts found' : 'No contacts yet'}
              </div>
            )}
          </div>
        )}
      </div>

      {prefillForNewContact !== null && (
        <QuickAddContactModal
          prefillName={prefillForNewContact}
          onClose={() => setPrefillForNewContact(null)}
          onAdded={(newContact) => {
            onChange([...value, newContact.id]);
            setPrefillForNewContact(null);
            setQuery('');
          }}
        />
      )}
    </div>
  );
}
