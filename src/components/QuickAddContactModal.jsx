// QuickAddContactModal.jsx
// مودال إضافة سريعة لجهة اتصال — نسخة مُعاد كتابتها بوضوح من المكوّن `tt` بالكود الأصلي.
//
// الفرق عن ContactFormModal: هذا أبسط (بدون حقل note)، ويُستخدم من سياقات أخرى بالتطبيق
// (مثل تخصيص تاسك لشخص غير موجود بقائمة جهات الاتصال بعد).
//
// ملاحظة محفوظة من الأصل: disableEscape و zIndex={1100} — هذا المودال يُفتح غالباً
// من فوق مودال آخر، فـ z-index الأعلى وتعطيل Escape يمنعان إغلاقه بالخطأ بينما
// المودال الأصلي لسا مفتوح تحته.

import { useState } from 'react';
import { Modal } from './Modal';
import { useContactsStore } from '../store/contactsStore';

export function QuickAddContactModal({ prefillName, onClose, onAdded }) {
  const addContact = useContactsStore((s) => s.addContact);

  const [name, setName] = useState(prefillName ?? '');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onAdded(
      addContact({
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
      })
    );
  }

  return (
    <Modal title="Add Contact" onClose={onClose} maxWidth={380} zIndex={1100} disableEscape>
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          <div className="field">
            <label className="label">Name *</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full name"
              autoFocus
            />
          </div>
          <div className="field">
            <label className="label">
              Phone <span style={{ opacity: 0.4, fontWeight: 400 }}>(optional)</span>
            </label>
            <input
              className="input"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+966 5x xxx xxxx"
              type="tel"
            />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="label">
              Email <span style={{ opacity: 0.4, fontWeight: 400 }}>(optional)</span>
            </label>
            <input
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              type="email"
            />
          </div>
        </div>
        <div className="modal-footer">
          <button
            type="submit"
            disabled={!name.trim()}
            style={{
              padding: '7px 20px',
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              fontFamily: 'var(--font)',
              fontSize: 13,
              fontWeight: 500,
              cursor: name.trim() ? 'pointer' : 'not-allowed',
              opacity: name.trim() ? 1 : 0.5,
            }}
          >
            Add Contact
          </button>
          <button type="button" onClick={onClose} className="btn-cancel">
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}
