// NewWorkspaceTaskModal.jsx
// مودال إنشاء تاسك جديد داخل ورك سبيس — نسخة مُعاد كتابتها بوضوح من المكوّن Ct
// بالكود الأصلي.
//
// ملاحظة بنية محفوظة من الأصل: التاسك يُحفظ مباشرة بـ workspaces/{wsId}/tasks عن طريق
// wsTaskService.save (وليس tasksStore.addTask) — لأنه تاسك ينتمي للورك سبيس مباشرة،
// مش تاسك شخصي مُشارَك. folderId يُضبط لـ ws:{wsId} (نفس النمط المستخدم بكل التطبيق
// لاستثناء تاسكات الورك سبيس من منطق التنقل بالمجلدات الشخصية).
//
// ملاحظة سلوكية محفوظة من الأصل: رسائل الخطأ تفرّق بين صلاحيات Firestore (permission)
// وعدم وجود الورك سبيس بقاعدة البيانات (not-found) — لمساعدة المستخدم يفهم المشكلة
// الحقيقية، نفس نمط JoinWorkspaceModal بقسم Workspaces.

import { useState } from 'react';
import { Modal } from './Modal';
import { useAuthStore } from '../store/authStore';
import { useContactsStore } from '../store/contactsStore';
import { wsTaskService } from '../services/wsTaskService';
import { showToast } from '../store/toastStore';
import { generateId } from '../utils/generateId';

export function NewWorkspaceTaskModal({ wsId, onClose }) {
  const user = useAuthStore((s) => s.user);
  const contacts = useContactsStore((s) => s.contacts);

  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [status, setStatus] = useState('active');
  const [firstUpdateNote, setFirstUpdateNote] = useState('');
  const [involvedIds, setInvolvedIds] = useState([]);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !user) return;

    setSaving(true);
    const today = new Date().toISOString().split('T')[0];
    const timeline = firstUpdateNote.trim()
      ? [{ id: generateId(), text: firstUpdateNote.trim(), date: today, ts: new Date().toISOString(), authorId: user.uid, authorName: user.displayName ?? 'Unknown', authorAvatar: user.photoURL ?? null }]
      : [];

    const newTask = {
      id: generateId(),
      _type: 'task',
      name: name.trim(),
      desc: desc.trim(),
      status,
      priority: 'normal',
      lastUpdate: today,
      nextFollowup: null,
      createdAt: new Date().toISOString(),
      ownerId: user.uid,
      folderId: `ws:${wsId}`,
      workspaceId: wsId,
      sharedToWsIds: [],
      involvedIds,
      timeline,
    };

    try {
      await wsTaskService.save(wsId, newTask);
      showToast('Task added');
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message.includes('permission') || message.includes('PERMISSION_DENIED')) {
        showToast('Permission denied — check Firestore Rules');
      } else if (message.includes('not-found') || message.includes('NOT_FOUND')) {
        showToast('Workspace not found in Firestore — recreate workspace');
      } else {
        showToast(`Error: ${message.slice(0, 80)}`);
      }
      console.error('wsTaskService.save error:', err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="New Workspace Task" onClose={onClose} maxWidth={480}>
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          <div className="field">
            <label className="label">Task Name *</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div className="field">
            <label className="label">Description <span style={{ opacity: 0.4 }}>(optional)</span></label>
            <textarea className="textarea" value={desc} onChange={(e) => setDesc(e.target.value)} style={{ minHeight: 54 }} />
          </div>
          <div className="field">
            <label className="label">Status</label>
            <select className="select" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="active">Action Required</option>
              <option value="waiting">Waiting Feedback</option>
              <option value="ontrack">On Track</option>
            </select>
          </div>
          <div className="field">
            <label className="label">Involved <span style={{ opacity: 0.4 }}>(optional)</span></label>
            <select
              className="select"
              value=""
              onChange={(e) => { if (e.target.value && !involvedIds.includes(e.target.value)) setInvolvedIds([...involvedIds, e.target.value]); }}
            >
              <option value="">+ Add person…</option>
              {contacts.filter((c) => !involvedIds.includes(c.id)).map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {involvedIds.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
                {involvedIds.map((id) => {
                  const contact = contacts.find((c) => c.id === id);
                  return contact ? (
                    <span key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'var(--accent-light)', color: 'var(--accent-text)', border: '1px solid color-mix(in srgb,var(--accent) 30%,var(--border))', borderRadius: 99, padding: '3px 8px', fontSize: 12 }}>
                      {contact.name}
                      <button type="button" onClick={() => setInvolvedIds(involvedIds.filter((v) => v !== id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-text)', fontSize: 13, lineHeight: 1, padding: 0, opacity: 0.7 }}>×</button>
                    </span>
                  ) : null;
                })}
              </div>
            )}
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="label">First Update Note <span style={{ opacity: 0.4 }}>(optional)</span></label>
            <textarea className="textarea" value={firstUpdateNote} onChange={(e) => setFirstUpdateNote(e.target.value)} style={{ minHeight: 52 }} />
          </div>
        </div>
        <div className="modal-footer">
          <button type="submit" disabled={!name.trim() || saving} style={{ padding: '7px 20px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 6, fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, cursor: name.trim() && !saving ? 'pointer' : 'not-allowed', opacity: name.trim() && !saving ? 1 : 0.5 }}>
            {saving ? 'Saving…' : 'Add Task'}
          </button>
          <button type="button" onClick={onClose} className="btn-cancel">Cancel</button>
        </div>
      </form>
    </Modal>
  );
}
