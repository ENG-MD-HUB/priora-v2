// NewTaskModal.jsx
// مودال إنشاء تاسك جديد — نسخة مُعاد كتابتها بوضوح من المكوّن rt بالكود الأصلي.
//
// ملاحظات محفوظة من الأصل:
// 1. حقل "First Update Note" اختياري — لو مكتوب، يُضاف كملاحظة تايملاين أولى بعد
//    إنشاء التاسك مباشرة (بتاريخ "Task Date" نفسه، مش بالضرورة اليوم الفعلي).
// 2. createdAt يُبنى من "Task Date" + الساعة 00:00:00 — وليس وقت الإنشاء الفعلي.
// 3. تاريخ المتابعة (Follow-up) أقل قيمة مسموحة (min) = Task Date نفسه، مش اليوم
//    الحقيقي — يعني تقدر تسوي follow-up بنفس تاريخ التاسك حتى لو كان بالماضي.

import { useState } from 'react';
import { Modal } from './Modal';
import { InvolvedContactsTypeahead } from './InvolvedContactsTypeahead';
import { getEffectiveToday } from '../utils/taskDateLogic';

export function NewTaskModal({ folderId, onClose, onSave }) {
  const today = getEffectiveToday();

  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [status, setStatus] = useState('active');
  const [priority, setPriority] = useState('normal');
  const [taskDate, setTaskDate] = useState(today);
  const [showFollowup, setShowFollowup] = useState(false);
  const [followupDate, setFollowupDate] = useState('');
  const [firstUpdateNote, setFirstUpdateNote] = useState('');
  const [involvedIds, setInvolvedIds] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Task name is required');
      return;
    }
    onSave({
      name: name.trim(),
      desc: desc.trim(),
      status,
      priority,
      nextFollowup: showFollowup && followupDate ? followupDate : null,
      lastUpdate: taskDate,
      createdAt: new Date(taskDate + 'T00:00:00').toISOString(),
      involvedIds,
      folderId,
      _type: 'task',
      firstUpdate: firstUpdateNote.trim() || undefined,
    });
  }

  return (
    <Modal title="Add Task" onClose={onClose} maxWidth={500}>
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          <div className="field">
            <label className="label">Task Name *</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Task name…" autoFocus />
          </div>

          <div className="field">
            <label className="label">
              Description <span style={{ opacity: 0.4, fontWeight: 400 }}>(optional)</span>
            </label>
            <textarea className="textarea" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Context or details…" style={{ minHeight: 64 }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">Status</label>
              <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="active">Action Required</option>
                <option value="waiting">Waiting Feedback</option>
                <option value="ontrack">On Track</option>
              </select>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">Priority</label>
              <select className="select" value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="normal">Normal</option>
                <option value="urgent">🔴 Urgent</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">Task Date</label>
              <input className="input" type="date" value={taskDate} onChange={(e) => setTaskDate(e.target.value)} max={today} />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">Follow-up Date</label>
              {showFollowup ? (
                <div style={{ display: 'flex', gap: 6 }}>
                  <input className="input" type="date" value={followupDate} onChange={(e) => setFollowupDate(e.target.value)} min={today} style={{ flex: 1 }} />
                  <button
                    type="button"
                    onClick={() => { setShowFollowup(false); setFollowupDate(''); }}
                    style={{ padding: '0 9px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', color: 'var(--text3)', fontSize: 14, lineHeight: 1, flexShrink: 0, transition: 'all .12s' }}
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
                  style={{ width: '100%', padding: '7px 11px', background: 'var(--surface2)', border: '1px dashed var(--border2)', borderRadius: 6, fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text3)', cursor: 'pointer', transition: 'all .15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
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

          <div className="field" style={{ marginTop: 14, marginBottom: 0 }}>
            <label className="label">
              First Update Note <span style={{ opacity: 0.4, fontWeight: 400 }}>(optional)</span>
            </label>
            <textarea className="textarea" value={firstUpdateNote} onChange={(e) => setFirstUpdateNote(e.target.value)} placeholder="Add an initial status note…" style={{ minHeight: 56 }} />
            <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
              Date will be set to <span style={{ fontFamily: 'var(--mono)', color: 'var(--text2)' }}>{formatForDisplay(taskDate)}</span> (task date)
            </p>
          </div>

          <div className="field" style={{ marginTop: 14, marginBottom: 0 }}>
            <label className="label">
              Involved <span style={{ opacity: 0.4, fontWeight: 400 }}>(optional)</span>
            </label>
            <InvolvedContactsTypeahead value={involvedIds} onChange={setInvolvedIds} />
          </div>

          {errorMsg && <p style={{ fontSize: 12, color: 'var(--red)', marginTop: 10 }}>{errorMsg}</p>}
        </div>

        <div className="modal-footer">
          <button type="submit" style={{ padding: '7px 22px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 6, fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
            Add Task
          </button>
          <button type="button" onClick={onClose} style={{ padding: '7px 14px', background: 'var(--surface2)', color: 'var(--text2)', border: '1px solid var(--border)', borderRadius: 6, fontFamily: 'var(--font)', fontSize: 13, cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}

function formatForDisplay(dateStr) {
  if (!dateStr) return '—';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}
