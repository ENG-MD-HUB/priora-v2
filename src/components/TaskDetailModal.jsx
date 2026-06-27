// TaskDetailModal.jsx
// مودال عرض تفاصيل التاسك الكامل — نسخة مُعاد كتابتها بوضوح من المكوّن Je بالكود
// الأصلي (الأكبر والأعقد بكل المشروع، ~451 سطر بعد التنسيق).
//
// ملاحظات سلوكية مهمة محفوظة بدقة من الأصل:
// 1. صلاحية تعديل/حذف ملاحظة بالتايملاين: صاحب التاسك (ownerId) أو كاتب الملاحظة نفسها
//    (authorId) فقط — وليس أي عضو آخر.
// 2. اسم وصورة كاتب الملاحظة: لو الكاتب هو المستخدم الحالي، يُعرض اسمه/صورته الحاليين
//    (تحديث فوري لو غيّر اسمه لاحقاً)، وإلا يُعرض الاسم/الصورة المحفوظة بالملاحظة وقت
//    إنشائها (snapshot، لا تتغيّر لاحقاً لأعضاء آخرين حتى لو حدّثوا ملفهم الشخصي).
// 3. تعديل تاريخ ملاحظة قديمة محدود بمجال [تاريخ إنشاء التاسك, اليوم الفعلي] —
//    لا يمكن تعديل تاريخها لخارج عمر التاسك أو لتاريخ مستقبلي.
// 4. حالة "Closed" تُعرض كـ "Completed" بهذا المودال تحديداً (نص مختلف عن باقي
//    الأماكن اللي تعرضها "Closed" — هذا فرق نصي مقصود موجود بالأصل).

import { useState } from 'react';
import { Modal } from './Modal';
import { useTasksStore } from '../store/tasksStore';
import { useAuthStore } from '../store/authStore';
import { useContactsStore } from '../store/contactsStore';
import { formatDateForDisplay } from '../utils/taskDateLogic';
import { AddUpdateModal } from './AddUpdateModal';

const STATUS_LABELS_DETAIL = {
  active: 'Action Required',
  waiting: 'Waiting Feedback',
  ontrack: 'On Track',
  closed: 'Completed',
};

export function TaskDetailModal({ taskId, onClose, onUpdate }) {
  const task = useTasksStore((s) => s.tasks.find((t) => t.id === taskId));
  const updateTimelineEntry = useTasksStore((s) => s.updateTimelineEntry);
  const deleteTimelineEntry = useTasksStore((s) => s.deleteTimelineEntry);
  const user = useAuthStore((s) => s.user);
  const contacts = useContactsStore((s) => s.contacts);

  const [editingEntryId, setEditingEntryId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editDate, setEditDate] = useState('');
  const [showAddUpdate, setShowAddUpdate] = useState(false);

  if (!task) return null;

  function getDisplayAuthorName(entry) {
    return entry.authorId === user?.uid && user.displayName ? user.displayName : entry.authorName;
  }

  function getDisplayAuthorAvatar(entry) {
    return entry.authorId === user?.uid ? user.photoURL ?? entry.authorAvatar ?? null : entry.authorAvatar ?? null;
  }

  const involvedContacts = (task.involvedIds ?? []).map((id) => contacts.find((c) => c.id === id)).filter(Boolean);

  function startEditingEntry(entry) {
    setEditingEntryId(entry.id);
    setEditText(entry.text);
    setEditDate(entry.date);
  }

  function saveEditedEntry(entryId) {
    if (!editText.trim()) return;
    updateTimelineEntry(taskId, entryId, editText.trim(), editDate);
    setEditingEntryId(null);
  }

  return (
    <>
      <Modal title={task.name} onClose={onClose} maxWidth={600} zIndex={1000} closeOnOutsideClick={!editingEntryId && !showAddUpdate}>
        <div className="modal-body" style={{ maxHeight: '65vh', overflowY: 'auto' }}>
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 14 }}>
            <span className={`badge badge-${task.status}`}>{STATUS_LABELS_DETAIL[task.status]}</span>
            {task.priority === 'urgent' && <span className="badge badge-urgent">Urgent</span>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
            {[
              { label: 'Created', val: formatDateForDisplay(task.createdAt.split('T')[0]) },
              { label: 'Last Update', val: formatDateForDisplay(task.lastUpdate) },
              { label: 'Follow-up', val: formatDateForDisplay(task.nextFollowup) },
            ].map((item) => (
              <div key={item.label} style={{ background: 'var(--surface2)', borderRadius: 6, padding: '7px 10px' }}>
                <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 3 }}>
                  {item.label}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text)', fontFamily: 'var(--mono)' }}>{item.val}</div>
              </div>
            ))}
          </div>

          {task.desc && (
            <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 12px', marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 5 }}>
                Description
              </div>
              <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{task.desc}</p>
            </div>
          )}

          {involvedContacts.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 7 }}>
                Involved ({involvedContacts.length})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {involvedContacts.map((contact) => (
                  <div key={contact.id} style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 99, padding: '4px 12px 4px 6px' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'var(--accent-text)', flexShrink: 0 }}>
                      {(contact.name || '?')[0].toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>{contact.name}</div>
                      {(contact.phone || contact.email) && (
                        <div style={{ fontSize: 10, color: 'var(--text3)' }}>{contact.phone ?? contact.email}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 500 }}>
              Update Log <span style={{ fontFamily: 'var(--mono)' }}>({task.timeline.length})</span>
            </div>
            <button
              onClick={() => setShowAddUpdate(true)}
              style={{ padding: '4px 12px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 5, fontFamily: 'var(--font)', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
            >
              + Add Update
            </button>
          </div>

          {task.timeline.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text3)', padding: '8px 0' }}>No updates yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {task.timeline.map((entry, index) => {
                const isEditingThis = editingEntryId === entry.id;
                const canEdit = task.ownerId === user?.uid || entry.authorId === user?.uid;
                const initials = (entry.authorName || '?').split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2);
                const isLast = index === task.timeline.length - 1;
                const avatarSrc = getDisplayAuthorAvatar(entry);

                return (
                  <div key={entry.id} style={{ display: 'flex', gap: 10, paddingBottom: isLast ? 0 : 12, position: 'relative' }}>
                    {!isLast && (
                      <div style={{ position: 'absolute', insetInlineStart: 13, top: 28, bottom: 0, width: 1, background: 'var(--border)' }} />
                    )}
                    <div
                      style={{
                        width: 26, height: 26, borderRadius: '50%', flexShrink: 0, zIndex: 1,
                        background: index === 0 ? 'var(--accent)' : 'var(--surface3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9, fontWeight: 700, color: index === 0 ? '#fff' : 'var(--text3)',
                        border: '2px solid var(--surface)', overflow: 'hidden',
                      }}
                    >
                      {avatarSrc ? (
                        <img src={avatarSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />
                      ) : (
                        initials
                      )}
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text3)' }}>{getDisplayAuthorName(entry)}</span>
                        <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>{formatDateForDisplay(entry.date)}</span>
                        {canEdit && !isEditingThis && (
                          <div style={{ display: 'flex', gap: 4, marginInlineStart: 'auto' }}>
                            <button
                              onClick={() => startEditingEntry(entry)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: '1px 5px', borderRadius: 3, fontSize: 11, fontFamily: 'var(--font)', transition: 'color .1s' }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text)')}
                              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text3)')}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteTimelineEntry(taskId, entry.id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: '1px 5px', borderRadius: 3, fontSize: 11, fontFamily: 'var(--font)', transition: 'color .1s' }}
                              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--red)')}
                              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text3)')}
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </div>

                      {isEditingThis ? (
                        <div>
                          <textarea value={editText} onChange={(e) => setEditText(e.target.value)} className="textarea" style={{ marginBottom: 6, minHeight: 60 }} autoFocus />
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <input
                              type="date"
                              value={editDate}
                              onChange={(e) => setEditDate(e.target.value)}
                              className="input"
                              style={{ width: 140 }}
                              min={task.createdAt.split('T')[0]}
                              max={(() => {
                                const now = new Date();
                                if (now.getHours() < 5) now.setDate(now.getDate() - 1);
                                return now.toISOString().split('T')[0];
                              })()}
                            />
                            <button
                              onClick={() => saveEditedEntry(entry.id)}
                              style={{ padding: '5px 12px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 5, fontSize: 12, fontFamily: 'var(--font)', cursor: 'pointer' }}
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingEntryId(null)}
                              style={{ padding: '5px 10px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 5, fontSize: 12, fontFamily: 'var(--font)', cursor: 'pointer', color: 'var(--text2)' }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{entry.text}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            onClick={onClose}
            style={{ padding: '7px 18px', background: 'var(--surface2)', color: 'var(--text2)', border: '1px solid var(--border)', borderRadius: 6, fontFamily: 'var(--font)', fontSize: 13, cursor: 'pointer' }}
          >
            Close
          </button>
        </div>
      </Modal>

      {showAddUpdate && <AddUpdateModal taskId={taskId} onClose={() => setShowAddUpdate(false)} zIndex={1050} />}
    </>
  );
}
