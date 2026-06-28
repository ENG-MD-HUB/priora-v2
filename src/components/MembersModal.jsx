// MembersModal.jsx
// مودال إدارة أعضاء ورك سبيس — نسخة مُعاد كتابتها بوضوح من المكوّن `kt` بالكود الأصلي.
//
// ⚠️ تغيير سلوك مقصود بطلب صريح: زر "+ Add Member Manually" (موجود بالكود الأصلي
// قبل أي تعديل مني، يضيف عضو فوراً بدون أي تأكيد أو دعوة) تم حذفه بالكامل. الطريقة
// الوحيدة المتبقية للانضمام لورك سبيس الآن هي رمز الدعوة اليدوي (Invite Code) فقط.
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

export function MembersModal({ ws, onClose, testMode = false, initialMembers = [] }) {
  const user = useAuthStore((s) => s.user);
  const removeMemberFromStore = useMembersStore((s) => s.removeMember);

  const [members, setMembers] = useState(initialMembers);

  useEffect(() => {
    if (testMode) return; // بوضع الاختبار، الأعضاء تُمرّر مباشرة عن طريق initialMembers
    workspaceService.getMembers(ws.id).then(setMembers);
  }, [ws.id, testMode]);

  const isOwner = ws.ownerId === user?.uid;

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
    <Modal title={`${ws.name} — Members`} onClose={onClose} maxWidth={480} closeOnOutsideClick>
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
      </div>

      <div className="modal-footer">
        <button onClick={onClose} className="btn-cancel">Close</button>
      </div>
    </Modal>
  );
}
