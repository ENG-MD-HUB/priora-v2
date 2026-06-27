// WorkspaceTaskDetailModal.jsx
// مودال تفاصيل تاسك بورك سبيس — نسخة مُعاد كتابتها بوضوح من المكوّن St بالكود الأصلي.
//
// ⚠️ فرق صلاحيات مهم محفوظ من الأصل (مختلف عن TaskDetailModal الشخصي بقسم 5):
// صلاحية تعديل/حذف ملاحظة هنا = task.ownerId === currentUser.uid فقط (صاحب التاسك
// الفردي) — وليس "صاحب التاسك أو كاتب الملاحظة" كما بالتاسكات الشخصية. أي عضو آخر
// بالورك سبيس، حتى لو هو كاتب الملاحظة نفسها، لا يقدر يعدّلها أو يحذفها هنا.

import { useState } from 'react';
import { Modal } from './Modal';
import { useAuthStore } from '../store/authStore';
import { useContactsStore } from '../store/contactsStore';
import { wsTaskService } from '../services/wsTaskService';
import { formatDateForDisplay } from '../utils/taskDateLogic';
import { WorkspaceTaskUpdateModal } from './WorkspaceTaskUpdateModal';

const STATUS_LABELS = { active: 'Action Required', waiting: 'Waiting Feedback', ontrack: 'On Track', closed: 'Completed' };

export function WorkspaceTaskDetailModal({ task, wsId, onClose, onUpdate }) {
  const user = useAuthStore((s) => s.user);
  const contacts = useContactsStore((s) => s.contacts);

  const [editingEntryId, setEditingEntryId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editDate, setEditDate] = useState('');

  const involvedContacts = (task.involvedIds ?? []).map((id) => contacts.find((c) => c.id === id)).filter(Boolean);
  const isOwner = task.ownerId === user?.uid;

  async function saveEditedEntry(entryId) {
    if (!editText.trim()) return;
    const updatedTask = {
      ...task,
      timeline: task.timeline.map((e) => (e.id === entryId ? { ...e, text: editText, date: editDate } : e)),
    };
    updatedTask.lastUpdate = updatedTask.timeline.reduce((max, e) => (e.date > max ? e.date : max), '') || updatedTask.lastUpdate;
    await wsTaskService.save(wsId, updatedTask);
    setEditingEntryId(null);
  }

  async function deleteEntry(entryId) {
    const updatedTask = { ...task, timeline: task.timeline.filter((e) => e.id !== entryId) };
    await wsTaskService.save(wsId, updatedTask);
  }

  return (
    <Modal title={task.name} onClose={onClose} maxWidth={580} zIndex={1000} closeOnOutsideClick={!editingEntryId}>
      <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 12 }}>
          <span className={`badge badge-${task.status}`}>{STATUS_LABELS[task.status]}</span>
          {task.priority === 'urgent' && <span className="badge badge-urgent">Urgent</span>}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
          {[
            { label: 'Created', val: formatDateForDisplay(task.createdAt.split('T')[0]) },
            { label: 'Last Update', val: formatDateForDisplay(task.lastUpdate) },
            { label: 'Follow-up', val: formatDateForDisplay(task.nextFollowup) },
          ].map((item) => (
            <div key={item.label} style={{ background: 'var(--surface2)', borderRadius: 6, padding: '6px 9px' }}>
              <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 2 }}>{item.label}</div>
              <div style={{ fontSize: 12, color: 'var(--text)', fontFamily: 'var(--mono)' }}>{item.val}</div>
            </div>
          ))}
        </div>

        {task.desc && (
          <div style={{ background: 'var(--surface2)', borderRadius: 6, padding: '9px 11px', marginBottom: 12, fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>{task.desc}</div>
        )}

        {involvedContacts.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 7 }}>Involved ({involvedContacts.length})</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {involvedContacts.map((contact) => (
                <div key={contact.id} style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 99, padding: '4px 12px 4px 6px' }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'var(--accent-text)' }}>
                    {(contact.name || '?')[0].toUpperCase()}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>{contact.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Update Log ({task.timeline.length})</div>
          <button onClick={onUpdate} style={{ padding: '4px 12px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 5, fontFamily: 'var(--font)', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>
            + Add Update
          </button>
        </div>

        {task.timeline.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text3)', fontStyle: 'italic' }}>No updates yet.</p>
        ) : (
          task.timeline.map((entry, index) => {
            const isLast = index === task.timeline.length - 1;
            const isEditingThis = editingEntryId === entry.id;
            const avatarSrc = entry.authorId === user?.uid ? user?.photoURL ?? entry.authorAvatar : entry.authorAvatar;
            const initials = (entry.authorName || '?').split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2);

            return (
              <div key={entry.id} style={{ display: 'flex', gap: 9, paddingBottom: isLast ? 0 : 10, position: 'relative' }}>
                {!isLast && <div style={{ position: 'absolute', insetInlineStart: 11, top: 22, bottom: 0, width: 1, background: 'var(--border)' }} />}
                <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, zIndex: 1, background: index === 0 ? 'var(--accent)' : 'var(--surface3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: index === 0 ? '#fff' : 'var(--text3)', border: '2px solid var(--surface)', overflow: 'hidden' }}>
                  {avatarSrc ? <img src={avatarSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} /> : initials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text3)' }}>{entry.authorId === user?.uid && user?.displayName ? user.displayName : entry.authorName}</span>
                    <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>{formatDateForDisplay(entry.date)}</span>
                    {isOwner && !isEditingThis && (
                      <div style={{ marginInlineStart: 'auto', display: 'flex', gap: 4 }}>
                        <button onClick={() => { setEditingEntryId(entry.id); setEditText(entry.text); setEditDate(entry.date); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 11, fontFamily: 'var(--font)', padding: '1px 4px' }} onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text)')} onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text3)')}>
                          Edit
                        </button>
                        <button onClick={() => deleteEntry(entry.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 11, fontFamily: 'var(--font)', padding: '1px 4px' }} onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--red)')} onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text3)')}>
                          Delete
                        </button>
                      </div>
                    )}
                  </div>

                  {isEditingThis ? (
                    <div>
                      <textarea value={editText} onChange={(e) => setEditText(e.target.value)} className="textarea" style={{ marginBottom: 6, minHeight: 54 }} autoFocus />
                      <div style={{ display: 'flex', gap: 6 }}>
                        <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="input" style={{ width: 140 }} min={task.createdAt.split('T')[0]} max={new Date().toISOString().split('T')[0]} />
                        <button onClick={() => saveEditedEntry(entry.id)} style={{ padding: '5px 12px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 5, fontSize: 12, fontFamily: 'var(--font)', cursor: 'pointer' }}>Save</button>
                        <button onClick={() => setEditingEntryId(null)} className="btn-cancel" style={{ padding: '5px 9px', fontSize: 12 }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{entry.text}</p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="modal-footer">
        <button onClick={onClose} className="btn-cancel">Close</button>
      </div>
    </Modal>
  );
}
