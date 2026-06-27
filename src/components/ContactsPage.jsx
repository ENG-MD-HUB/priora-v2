// ContactsPage.jsx
// صفحة جهات الاتصال الرئيسية — نسخة مُعاد كتابتها بوضوح من المكوّن `Nt` بالكود الأصلي.
//
// البحث (filter) محفوظ بدقة: يبحث بالاسم، البريد، ورقم الهاتف معاً (case-insensitive
// للاسم والبريد، حساس للحالة بالضرورة لرقم الهاتف لأنه أرقام أصلاً) — يكفي تطابق
// جزئي بأي حقل واحد منهم.

import { useState } from 'react';
import { useContactsStore } from '../store/contactsStore';
import { showToast } from '../store/toastStore';
import { ContactCard } from './ContactCard';
import { ContactFormModal } from './ContactFormModal';
import { Modal } from './Modal';

export function ContactsPage() {
  const contacts = useContactsStore((s) => s.contacts);
  const addContact = useContactsStore((s) => s.addContact);
  const updateContact = useContactsStore((s) => s.updateContact);
  const deleteContact = useContactsStore((s) => s.deleteContact);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [deletingContact, setDeletingContact] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = searchQuery.trim()
    ? contacts.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (c.email ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
          (c.phone ?? '').includes(searchQuery)
      )
    : contacts;

  return (
    <div style={{ animation: 'fade-in .2s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', flex: 1 }}>
          Contacts <span style={{ fontFamily: 'var(--mono)', opacity: 0.5 }}>({contacts.length})</span>
        </div>

        <div style={{ position: 'relative' }}>
          <svg
            width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            style={{ position: 'absolute', top: '50%', insetInlineStart: 9, transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none' }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search…"
            style={{
              background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6,
              fontSize: 12, color: 'var(--text)', padding: '6px 10px 6px 30px', outline: 'none',
              fontFamily: 'var(--font)', width: 180, transition: 'border-color .15s',
            }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
          />
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '5px 13px',
            background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 6,
            fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Contact
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <p>{searchQuery ? `No contacts matching "${searchQuery}"` : 'No contacts yet'}</p>
          {!searchQuery && (
            <p style={{ fontSize: 12, opacity: 0.6 }}>Add people you work with to use them in tasks.</p>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {filtered.map((c) => (
            <ContactCard key={c.id} contact={c} onEdit={() => setEditingContact(c)} onDelete={() => setDeletingContact(c)} />
          ))}
        </div>
      )}

      {showAddModal && (
        <ContactFormModal
          title="Add Contact"
          onClose={() => setShowAddModal(false)}
          onSave={(data) => {
            addContact(data);
            setShowAddModal(false);
            showToast(`${data.name} added`);
          }}
        />
      )}

      {editingContact && (
        <ContactFormModal
          title="Edit Contact"
          initial={editingContact}
          onClose={() => setEditingContact(null)}
          onSave={(data) => {
            updateContact(editingContact.id, data);
            setEditingContact(null);
            showToast('Contact updated');
          }}
        />
      )}

      {deletingContact && (
        <Modal title="Delete Contact" onClose={() => setDeletingContact(null)} maxWidth={360} closeOnOutsideClick>
          <div className="modal-body">
            <p style={{ fontSize: 13, color: 'var(--text2)' }}>
              Delete <strong style={{ color: 'var(--text)' }}>{deletingContact.name}</strong>? This cannot be undone.
            </p>
          </div>
          <div className="modal-footer">
            <button
              onClick={() => {
                deleteContact(deletingContact.id);
                setDeletingContact(null);
                showToast('Deleted');
              }}
              style={{
                padding: '7px 18px', background: 'var(--red)', color: '#fff', border: 'none',
                borderRadius: 6, fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
              }}
            >
              Delete
            </button>
            <button onClick={() => setDeletingContact(null)} className="btn-cancel">
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
