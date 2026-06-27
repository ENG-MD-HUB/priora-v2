// ContactFormModal.jsx
// مودال إضافة/تعديل جهة اتصال (موحّد لكلا الحالتين) — نسخة مُعاد كتابتها بوضوح من
// المكوّن `jt` بالكود الأصلي.

import { useState } from 'react';
import { Modal } from './Modal';

export function ContactFormModal({ initial, onSave, onClose, title }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [note, setNote] = useState(initial?.note ?? '');

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      note: note.trim() || undefined,
    });
  }

  return (
    <Modal title={title} onClose={onClose} maxWidth={420}>
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
          <div className="field">
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
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="label">
              Note <span style={{ opacity: 0.4, fontWeight: 400 }}>(optional)</span>
            </label>
            <textarea
              className="textarea"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Any notes…"
              style={{ minHeight: 56 }}
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
            Save
          </button>
          <button type="button" onClick={onClose} className="btn-cancel">
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}
