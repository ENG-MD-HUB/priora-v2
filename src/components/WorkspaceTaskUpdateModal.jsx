// WorkspaceTaskUpdateModal.jsx
// مودال "إضافة تحديث" لتاسك بورك سبيس — نسخة مُعاد كتابتها بوضوح من المكوّن wt
// بالكود الأصلي.
//
// ⚠️ منطق مهم جداً ودقيق محفوظ بالضبط من الأصل — لا تبسيط:
// 1. حفظ التاسك بالورك سبيس (wsTaskService.save) يحصل دائماً، بغض النظر عن أي شي آخر.
// 2. لو هذا التاسك أصله تاسك شخصي مُشارَك (workspaceId === null بالنسخة المحلية —
//    لاحظ: غريب، بس هذا الشرط الفعلي بالأصل) — إضافة، يُستدعى أيضاً addTimelineEntry/
//    updateTask من المخزن الشخصي مباشرة (تحديث مزدوج: نسخة الورك سبيس + نسخة شخصية).
// 3. إشعار (notification) يُرسل دائماً لباقي أعضاء الورك سبيس، بغض النظر عن نوع التاسك.
// 4. النجاح (toast + إغلاق المودال) يحصل فوراً قبل انتظار نتيجة الحفظ الفعلي بـ Firestore
//    (Optimistic UI) — فشل الحفظ بالخلفية يُسجَّل بـ console.warn فقط، بدون رسالة خطأ
//    للمستخدم (هذا قرار تصميمي بالأصل، وليس خطأ، رغم إنه قرار جريء).

import { useState } from 'react';
import { Modal } from './Modal';
import { useAuthStore } from '../store/authStore';
import { useTasksStore } from '../store/tasksStore';
import { wsTaskService } from '../services/wsTaskService';
import { notificationService } from '../services/notificationService';
import { showToast } from '../store/toastStore';
import { generateId } from '../utils/generateId';
import { getEffectiveToday } from '../utils/taskDateLogic';

export function WorkspaceTaskUpdateModal({ task, wsId, wsName, onClose }) {
  const user = useAuthStore((s) => s.user);
  const today = getEffectiveToday();

  const [noteText, setNoteText] = useState('');
  const [noteDate, setNoteDate] = useState(new Date().toISOString().split('T')[0]);
  const [newStatus, setNewStatus] = useState('');
  const [showFollowup, setShowFollowup] = useState(false);
  const [followupDate, setFollowupDate] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!noteText.trim() || !user) return;

    const entry = {
      id: generateId(),
      text: noteText.trim(),
      date: noteDate,
      ts: new Date().toISOString(),
      authorId: user.uid,
      authorName: user.displayName ?? 'Unknown',
      authorAvatar: user.photoURL ?? null,
    };

    const updatedTask = {
      ...task,
      timeline: [entry, ...task.timeline],
      lastUpdate: noteDate,
      status: newStatus || task.status,
      nextFollowup: showFollowup && followupDate ? followupDate : task.nextFollowup,
    };

    // Optimistic: التنبيه والإغلاق يحصلون فوراً، قبل تأكيد الحفظ بـ Firestore.
    showToast('Update added');
    onClose();
    wsTaskService.save(wsId, updatedTask).catch((err) => console.warn('ws save:', err));

    if (updatedTask.workspaceId === null) {
      const { updateTask, addTimelineEntry } = useTasksStore.getState();
      addTimelineEntry(task.id, entry.text, entry.date, entry.authorId, entry.authorName, entry.authorAvatar);
      if (newStatus && newStatus !== task.status) updateTask(task.id, { status: updatedTask.status });
      if (showFollowup && followupDate) updateTask(task.id, { nextFollowup: followupDate });
    }

    notificationService
      .add(wsId, {
        type: 'update',
        wsId,
        wsName,
        taskId: task.id,
        taskName: task.name,
        authorId: entry.authorId,
        authorName: entry.authorName,
        text: entry.text,
        createdAt: new Date().toISOString(),
      })
      .catch((err) => console.warn('notif:', err));
  }

  return (
    <Modal title="Add Update" onClose={onClose} maxWidth={480} zIndex={1010}>
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 12, padding: '6px 10px', background: 'var(--surface2)', borderRadius: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {task.name}
          </div>

          <div className="field">
            <label className="label">Update Note *</label>
            <textarea className="textarea" value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="What happened?…" style={{ minHeight: 88 }} autoFocus />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">Date</label>
              <input className="input" type="date" value={noteDate} onChange={(e) => setNoteDate(e.target.value)} min={task.createdAt.split('T')[0]} max={today} />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">Change Status</label>
              <select className="select" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                <option value="">— No change —</option>
                <option value="active">Action Required</option>
                <option value="waiting">Waiting Feedback</option>
                <option value="ontrack">On Track</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label" style={{ display: 'block', marginBottom: 6 }}>Next Follow-up Date</label>
            {showFollowup ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="input" type="date" value={followupDate} onChange={(e) => setFollowupDate(e.target.value)} min={today} style={{ flex: 1 }} />
                <button
                  type="button"
                  onClick={() => { setShowFollowup(false); setFollowupDate(''); }}
                  style={{ padding: '0 10px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', color: 'var(--text3)', fontSize: 16 }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--red-bg)'; e.currentTarget.style.color = 'var(--red)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.color = 'var(--text3)'; }}
                >
                  ×
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowFollowup(true)}
                style={{ width: '100%', padding: '7px', background: 'var(--surface2)', border: '1px dashed var(--border2)', borderRadius: 6, fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                onMouseEnter={(e) => { const t = e.currentTarget; t.style.borderColor = 'var(--accent)'; t.style.color = 'var(--accent)'; t.style.background = 'var(--accent-light)'; }}
                onMouseLeave={(e) => { const t = e.currentTarget; t.style.borderColor = 'var(--border2)'; t.style.color = 'var(--text3)'; t.style.background = 'var(--surface2)'; }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                Set follow-up date
              </button>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button type="submit" disabled={!noteText.trim()} style={{ padding: '7px 20px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 6, fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, cursor: noteText.trim() ? 'pointer' : 'not-allowed', opacity: noteText.trim() ? 1 : 0.5 }}>
            Save Update
          </button>
          <button type="button" onClick={onClose} className="btn-cancel">Cancel</button>
        </div>
      </form>
    </Modal>
  );
}
