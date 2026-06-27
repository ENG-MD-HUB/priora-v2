// AddUpdateModal.jsx
// مودال "إضافة تحديث" لتاسك — نسخة مُعاد كتابتها بوضوح من المكوّن qe بالكود الأصلي.
//
// ملاحظة مهمة محفوظة من الأصل: قائمة "تغيير الحالة" هنا تستثني عمداً "Closed" — فيها
// فقط Action Required, Waiting Feedback, On Track. يعني إغلاق تاسك لا يحصل من هنا؛
// هذا قرار تصميمي أصلي (الإغلاق غالباً يحصل من سياق آخر لم نبنيه بعد).
//
// منطق الحفظ (handleSubmit) محفوظ بالترتيب الدقيق نفسه: إضافة ملاحظة التايملاين أولاً،
// ثم تحديث الحالة (لو اختير تغيير)، ثم تحديث تاريخ المتابعة (لو فُعّل وله قيمة)، ثم
// التنبيه، ثم إغلاق المودال.

import { useState } from 'react';
import { Modal } from './Modal';
import { useTasksStore } from '../store/tasksStore';
import { useAuthStore } from '../store/authStore';
import { showToast } from '../store/toastStore';
import { getEffectiveToday } from '../utils/taskDateLogic';

export function AddUpdateModal({ taskId, onClose, zIndex = 1000 }) {
  const task = useTasksStore((s) => s.tasks.find((t) => t.id === taskId));
  const addTimelineEntry = useTasksStore((s) => s.addTimelineEntry);
  const updateTask = useTasksStore((s) => s.updateTask);
  const user = useAuthStore((s) => s.user);

  const today = getEffectiveToday();

  const [noteText, setNoteText] = useState('');
  const [noteDate, setNoteDate] = useState(today);
  const [newStatus, setNewStatus] = useState('');
  const [showFollowup, setShowFollowup] = useState(false);
  const [followupDate, setFollowupDate] = useState('');

  if (!task) return null;

  function handleSubmit(e) {
    e.preventDefault();
    if (!noteText.trim()) return;

    addTimelineEntry(taskId, noteText.trim(), noteDate, user?.uid ?? 'unknown', user?.displayName ?? 'Unknown', user?.photoURL);

    if (newStatus) updateTask(taskId, { status: newStatus, lastUpdate: noteDate });
    if (showFollowup && followupDate) updateTask(taskId, { nextFollowup: followupDate });

    showToast('Update added');
    onClose();
  }

  return (
    <Modal title="Add Update" onClose={onClose} maxWidth={480} zIndex={zIndex}>
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 12, padding: '6px 10px', background: 'var(--surface2)', borderRadius: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {task.name}
          </div>

          <div className="field">
            <label className="label">Update Note *</label>
            <textarea
              className="textarea"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="What happened? What's the current status?…"
              style={{ minHeight: 88 }}
              autoFocus
            />
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
            <label className="label" style={{ marginBottom: 6, display: 'block' }}>Next Follow-up Date</label>
            {showFollowup ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="input" type="date" value={followupDate} onChange={(e) => setFollowupDate(e.target.value)} min={today} style={{ flex: 1 }} />
                <button
                  type="button"
                  onClick={() => { setShowFollowup(false); setFollowupDate(''); }}
                  style={{ padding: '0 10px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', color: 'var(--text3)', fontSize: 16, transition: 'all .12s' }}
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
                style={{
                  width: '100%', padding: '7px', background: 'var(--surface2)', border: '1px dashed var(--border2)',
                  borderRadius: 6, fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text3)', cursor: 'pointer',
                  transition: 'all .15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-light)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.color = 'var(--text3)'; e.currentTarget.style.background = 'var(--surface2)'; }}
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                Set follow-up date
              </button>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="submit"
            disabled={!noteText.trim()}
            style={{
              padding: '7px 20px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 6,
              fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500,
              cursor: noteText.trim() ? 'pointer' : 'not-allowed', opacity: noteText.trim() ? 1 : 0.5,
            }}
          >
            Save Update
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{ padding: '7px 14px', background: 'var(--surface2)', color: 'var(--text2)', border: '1px solid var(--border)', borderRadius: 6, fontFamily: 'var(--font)', fontSize: 13, cursor: 'pointer', transition: 'background .12s, color .12s' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface3)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--surface2)')}
          >
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}
