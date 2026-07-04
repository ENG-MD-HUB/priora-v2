// EditTaskModal.jsx
// مودال "تعديل تاسك" الكامل (كل الحقول) — نسخة مُعاد كتابتها بوضوح من المكوّن ot
// بالكود الأصلي. هذا مختلف عن AddUpdateModal (qe بالأصل) — هذا يعدّل كل بيانات
// التاسك مباشرة (مش يضيف ملاحظة تايملاين)، ويشمل خيار "Completed" بقائمة الحالة
// (على عكس AddUpdateModal اللي يستثنيه عمداً).

import { useState } from 'react';
import { Modal } from './Modal';
import { useTasksStore } from '../store/tasksStore';
import { showToast } from '../store/toastStore';
import { InvolvedContactsTypeahead } from './InvolvedContactsTypeahead';
import { getEffectiveToday } from '../utils/taskDateLogic';

export function EditTaskModal({ task, onClose }) {
  const updateTask = useTasksStore((s) => s.updateTask);

  const [name, setName] = useState(task.name);
  const [desc, setDesc] = useState(task.desc);
  const [status, setStatus] = useState(task.status);
  const [priority, setPriority] = useState(task.priority);
  const [followupDate, setFollowupDate] = useState(task.nextFollowup ?? '');
  const [showFollowup, setShowFollowup] = useState(!!task.nextFollowup);
  const [involvedIds, setInvolvedIds] = useState(task.involvedIds ?? []);

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    updateTask(task.id, {
      name: name.trim(),
      desc: desc.trim(),
      status,
      priority,
      nextFollowup: showFollowup && followupDate ? followupDate : null,
      involvedIds,
    });
    showToast('Task updated');
    onClose();
  }

  return (
    <Modal title="Edit Task" onClose={onClose} maxWidth={500}>
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          <div className="field">
            <label className="label">Name *</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div className="field">
            <label className="label">Description</label>
            <textarea className="textarea" value={desc} onChange={(e) => setDesc(e.target.value)} style={{ minHeight: 70 }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label className="label">Status</label>
              <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="active">Action Required</option>
                <option value="waiting">Waiting Feedback</option>
                <option value="ontrack">On Track</option>
                <option value="closed">Completed</option>
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

          <div style={{ marginTop: 14 }}>
            <label className="label" style={{ marginBottom: 6, display: 'block' }}>Follow-up Date</label>
            {showFollowup ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="input" type="date" value={followupDate} onChange={(e) => setFollowupDate(e.target.value)} min={getEffectiveToday()} style={{ flex: 1 }} />
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
                style={{ width: '100%', padding: '7px', background: 'var(--surface2)', border: '1px dashed var(--border2)', borderRadius: 6, fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text3)', cursor: 'pointer', transition: 'all .15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-light)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.color = 'var(--text3)'; e.currentTarget.style.background = 'var(--surface2)'; }}
              >
                + Set follow-up date
              </button>
            )}
          </div>

          <div className="field" style={{ marginTop: 14, marginBottom: 0 }}>
            <label className="label">Involved</label>
            <InvolvedContactsTypeahead value={involvedIds} onChange={setInvolvedIds} />
          </div>
        </div>

        <div className="modal-footer">
          <button type="submit" style={{ padding: '7px 20px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 6, fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
            Save Changes
          </button>
          <button type="button" onClick={onClose} className="btn-cancel">Cancel</button>
        </div>
      </form>
    </Modal>
  );
}
