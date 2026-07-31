// WorkspaceTaskEditModal.jsx
// مودال تعديل تاسك بورك سبيس — نسخة مُعاد كتابتها بوضوح من المكوّن Tt بالكود الأصلي.
// بعكس مودال التعديل الشخصي (EditTaskModal بقسم 7)، هذا أبسط (بدون منتقي جهات اتصال)
// ويحفظ مباشرة عن طريق wsTaskService.save.

import { useState } from 'react';
import { Modal } from './Modal';
import { wsTaskService } from '../services/wsTaskService';
import { showToast } from '../store/toastStore';
import { getEffectiveToday } from '../utils/taskDateLogic';

export function WorkspaceTaskEditModal({ task, wsId, onClose }) {
  const [name, setName] = useState(task.name);
  const [desc, setDesc] = useState(task.desc);
  const [status, setStatus] = useState(task.status);
  const [priority, setPriority] = useState(task.priority);
  const [followupDate, setFollowupDate] = useState(task.nextFollowup ?? '');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await wsTaskService.save(wsId, {
        ...task,
        name: name.trim(),
        desc: desc.trim(),
        status,
        priority,
        nextFollowup: followupDate || null,
      });
      showToast('Task updated');
      onClose();
    } catch {
      showToast('Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Edit Task" onClose={onClose} maxWidth={480}>
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
          <div className="field" style={{ marginTop: 12, marginBottom: 0 }}>
            <label className="label">Follow-up Date</label>
            <input className="input" type="date" value={followupDate} onChange={(e) => setFollowupDate(e.target.value)} min={getEffectiveToday()} />
          </div>
        </div>
        <div className="modal-footer">
          <button type="submit" disabled={!name.trim() || saving} style={{ padding: '7px 20px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 6, fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          <button type="button" onClick={onClose} className="btn-cancel">Cancel</button>
        </div>
      </form>
    </Modal>
  );
}
