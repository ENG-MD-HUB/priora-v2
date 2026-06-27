// CreateWorkspaceModal.jsx
// مودال إنشاء ورك سبيس جديد — نسخة مُعاد كتابتها بوضوح من منطق الدالة `P` والـ JSX
// المرافق لها بالكود الأصلي (العنوان الحقيقي "New Workspace"، كانت جزء من دالة ضخمة
// واحدة `At`، فُصلت هنا لمكوّن مستقل قابل للاختبار بمعزل).

import { useState } from 'react';
import { Modal } from './Modal';
import { workspaceService } from '../services/workspaceService';
import { wsRefsService } from '../services/wsRefsService';
import { useAuthStore } from '../store/authStore';
import { useWorkspacesStore } from '../store/workspacesStore';
import { useMembersStore } from '../store/membersStore';
import { showToast } from '../store/toastStore';
import { generateId } from '../utils/generateId';
import { generateInviteCode } from '../utils/generateInviteCode';

export function CreateWorkspaceModal({ onClose, testMode = false }) {
  const user = useAuthStore((s) => s.user);
  const addWorkspace = useWorkspacesStore((s) => s.addWorkspace);
  const addMember = useMembersStore((s) => s.addMember);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !user) return;

    setSubmitting(true);
    try {
      const workspace = {
        id: generateId(),
        name: name.trim(),
        description: description.trim(),
        ownerId: user.uid,
        inviteCode: generateInviteCode(),
        createdAt: new Date().toISOString(),
        memberCount: 1,
      };
      const ownerMember = {
        uid: user.uid,
        name: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        role: 'owner',
        joinedAt: new Date().toISOString(),
      };

      if (!testMode) {
        try {
          await workspaceService.create(workspace, ownerMember);
          wsRefsService.save(user.uid, workspace.id, { wsId: workspace.id, role: 'owner' }).catch(() => {});
        } catch {
          // فشل الحفظ بـ Firestore لا يمنع التحديث المحلي — نفس سلوك الكود الأصلي بالضبط.
        }
      }

      addWorkspace(workspace);
      addMember(workspace.id, ownerMember);
      onClose();
      setName('');
      setDescription('');
      showToast(`Workspace "${workspace.name}" created`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal title="New Workspace" onClose={onClose} maxWidth={420}>
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          <div className="field">
            <label className="label">Name *</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Team or project name…"
              autoFocus
            />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="label">
              Description <span style={{ opacity: 0.4 }}>(optional)</span>
            </label>
            <textarea
              className="textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this workspace for?"
              style={{ minHeight: 56 }}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button
            type="submit"
            disabled={!name.trim() || submitting}
            style={{
              padding: '7px 20px',
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              fontFamily: 'var(--font)',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              opacity: name.trim() && !submitting ? 1 : 0.5,
            }}
          >
            {submitting ? 'Creating…' : 'Create'}
          </button>
          <button type="button" onClick={onClose} className="btn-cancel">
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}
