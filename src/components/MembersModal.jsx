// MembersModal.jsx
// مودال إدارة أعضاء ورك سبيس — نسخة مُعاد كتابتها بوضوح من المكوّن `kt` بالكود الأصلي.
//
// ملاحظة مهمة بخصوص حذف عضو (مؤكدة من الكود الأصلي حرفياً، وليست تخميناً):
// 1. تاسكات العضو الداخلية بالورك سبيس (workspaces/{wsId}/tasks، ownerId = هذا العضو،
//    workspaceId === null) تُحذف نهائياً.
// 2. تاسكات العضو الشخصية (بقائمته الخاصة) المشتركة مع هذا الورك سبيس تبقى موجودة
//    بقائمته الشخصية — فقط تُشال مشاركتها مع هذا الورك سبيس تحديداً (sharedToWsIds).
//
// ✅ تحديث: مربوط الآن بـ useTasksStore الحقيقي (قسم Tasks، القسم 5) — لم يعد يستخدم
// tasksStoreStub المؤقت من قسم Workspaces. الاستبدال كان بسطر استيراد واحد بالضبط،
// تماماً كما كان مخطط له بتعليق tasksStoreStub.js الأصلي.

import { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { workspaceService } from '../services/workspaceService';
import { wsTaskService } from '../services/wsTaskService';
import { wsRefsService } from '../services/wsRefsService';
import { useAuthStore } from '../store/authStore';
import { useMembersStore } from '../store/membersStore';
import { useTasksStore } from '../store/tasksStore';
import { showToast } from '../store/toastStore';
import { generateId } from '../utils/generateId';

export function MembersModal({ ws, onClose, testMode = false, initialMembers = [] }) {
  const user = useAuthStore((s) => s.user);
  const addMember = useMembersStore((s) => s.addMember);
  const removeMemberFromStore = useMembersStore((s) => s.removeMember);

  const [members, setMembers] = useState(initialMembers);

  useEffect(() => {
    if (testMode) return; // بوضع الاختبار، الأعضاء تُمرّر مباشرة عن طريق initialMembers
    workspaceService.getMembers(ws.id).then(setMembers);
  }, [ws.id, testMode]);

  const isOwner = ws.ownerId === user?.uid;

  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  function handleAddMemberManually(e) {
    e.preventDefault();
    if (!newName.trim()) return;

    const member = {
      uid: generateId(),
      name: newName.trim(),
      email: newEmail.trim(),
      role: 'member',
      joinedAt: new Date().toISOString(),
    };

    addMember(ws.id, member);
    setNewName('');
    setNewEmail('');
    setShowAddForm(false);
    showToast('Member added');
  }

  async function handleRemoveMember(member) {
    if (!window.confirm(`Remove ${member.name} from workspace? Their shared tasks will be removed.`)) return;

    if (!testMode) {
      await workspaceService.removeMember(ws.id, member.uid);

      try {
        const wsInternalTasks = (await wsTaskService.getAll(ws.id)).filter(
          (t) => t.ownerId === member.uid && t.workspaceId === null
        );
        await Promise.all(wsInternalTasks.map((t) => wsTaskService.delete(ws.id, t.id)));
      } catch {
        // فشل حذف بعض التاسكات الداخلية لا يوقف باقي العملية — نفس سلوك الأصل.
      }
    }

    const { tasks, updateTask } = useTasksStore.getState();
    tasks
      .filter((t) => t.ownerId === member.uid && (t.sharedToWsIds ?? []).includes(ws.id))
      .forEach((t) => {
        updateTask(t.id, {
          sharedToWsIds: (t.sharedToWsIds ?? []).filter((id) => id !== ws.id),
        });
      });

    setMembers((prev) => prev.filter((m) => m.uid !== member.uid));
    removeMemberFromStore(ws.id, member.uid);
    if (!testMode) wsRefsService.delete(member.uid, ws.id).catch(() => {});
    showToast(`${member.name} removed from workspace`);
  }

  return (
    <Modal title={`${ws.name} — Members`} onClose={onClose} maxWidth={480} closeOnOutsideClick={!showAddForm}>
      <div className="modal-body" style={{ maxHeight: '55vh', overflowY: 'auto' }}>
        <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8 }}>
          Members ({members.length})
        </div>

        {members.map((member) => {
          const isCurrentUser = member.uid === user?.uid;
          const displayName = isCurrentUser ? user.displayName ?? member.name : member.name;
          const avatarSrc = isCurrentUser ? user?.photoURL ?? member.photoURL : member.photoURL;

          return (
            <div
              key={member.uid}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--border)' }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: '50%',
                  background: member.role === 'owner' ? 'var(--accent)' : 'var(--surface3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                  color: member.role === 'owner' ? '#fff' : 'var(--text3)',
                  flexShrink: 0,
                  border: isCurrentUser ? '2px solid var(--accent)' : 'none',
                  overflow: 'hidden',
                }}
              >
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  displayName[0]?.toUpperCase() ?? '?'
                )}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {displayName}
                  {isCurrentUser && <span style={{ fontSize: 10, color: 'var(--text3)' }}>(you)</span>}
                </div>
                {member.email && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{member.email}</div>}
              </div>

              <span className={`badge ${member.role === 'owner' ? 'badge-active' : 'badge-ontrack'}`} style={{ fontSize: 11 }}>
                {member.role === 'owner' ? 'Owner' : 'Member'}
              </span>

              {isOwner && member.role !== 'owner' && (
                <button
                  onClick={() => handleRemoveMember(member)}
                  style={{
                    padding: '3px 8px',
                    background: 'var(--red-bg)',
                    color: 'var(--red)',
                    border: '1px solid color-mix(in srgb,var(--red) 30%,var(--border))',
                    borderRadius: 5,
                    fontFamily: 'var(--font)',
                    fontSize: 11,
                    cursor: 'pointer',
                  }}
                >
                  Remove
                </button>
              )}
            </div>
          );
        })}

        {members.length === 0 && (
          <p style={{ fontSize: 12, color: 'var(--text3)', padding: '8px 0', fontStyle: 'italic' }}>
            Share the invite code to add members.
          </p>
        )}

        {isOwner && (
          <div style={{ marginTop: 14 }}>
            {showAddForm ? (
              <form
                onSubmit={handleAddMemberManually}
                style={{ background: 'var(--surface2)', borderRadius: 8, padding: 12, border: '1px solid var(--border)' }}
              >
                <div className="field">
                  <label className="label">Name *</label>
                  <input className="input" value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus />
                </div>
                <div className="field" style={{ marginBottom: 10 }}>
                  <label className="label">Email</label>
                  <input className="input" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} type="email" />
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="submit"
                    disabled={!newName.trim()}
                    style={{
                      padding: '5px 14px',
                      background: 'var(--accent)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 5,
                      fontFamily: 'var(--font)',
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: 'pointer',
                      opacity: newName.trim() ? 1 : 0.5,
                    }}
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowAddForm(false); setNewName(''); setNewEmail(''); }}
                    className="btn-cancel"
                    style={{ padding: '5px 12px', fontSize: 12 }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowAddForm(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 12px',
                  background: 'var(--accent-light)',
                  color: 'var(--accent-text)',
                  border: '1px solid color-mix(in srgb,var(--accent) 25%,var(--border))',
                  borderRadius: 6,
                  fontFamily: 'var(--font)',
                  fontSize: 12,
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                + Add Member Manually
              </button>
            )}
          </div>
        )}
      </div>

      <div className="modal-footer">
        <button onClick={onClose} className="btn-cancel">Close</button>
      </div>
    </Modal>
  );
}
