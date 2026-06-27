// JoinWorkspaceModal.jsx
// مودال الانضمام لورك سبيس عن طريق كود دعوة — نسخة مُعاد كتابتها بوضوح من منطق
// الدالة `F` والـ JSX المرافق لها بالكود الأصلي.
//
// ملاحظة سلوكية مهمة محفوظة من الأصل: رسائل الخطأ تفرّق بين 3 حالات فعلية:
// 1. مشكلة صلاحيات Firestore (permission denied)
// 2. قاعدة بيانات Firestore غير مُنشأة أصلاً (404 / not-found)
// 3. كود دعوة غلط فعلياً
// هذا التمييز موجود بالكود الأصلي لمساعدة المستخدم يفهم المشكلة الحقيقية، وليس فقط
// "حدث خطأ" عامة — تم الحفاظ عليه حرفياً.

import { useState } from 'react';
import { Modal } from './Modal';
import { workspaceService } from '../services/workspaceService';
import { wsRefsService } from '../services/wsRefsService';
import { useAuthStore } from '../store/authStore';
import { useWorkspacesStore } from '../store/workspacesStore';
import { useMembersStore } from '../store/membersStore';
import { showToast } from '../store/toastStore';

export function JoinWorkspaceModal({ onClose, onJoined, testMode = false }) {
  const user = useAuthStore((s) => s.user);
  const workspaces = useWorkspacesStore((s) => s.workspaces);
  const addWorkspace = useWorkspacesStore((s) => s.addWorkspace);
  const addMember = useMembersStore((s) => s.addMember);

  const [code, setCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [joining, setJoining] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!user) return;

    setErrorMsg('');
    const trimmedCode = code.trim().toUpperCase();
    if (trimmedCode.length < 9) {
      setErrorMsg('Enter a valid code (XXXX-XXXX)');
      return;
    }

    setJoining(true);
    try {
      const member = {
        uid: user.uid,
        name: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        role: 'member',
        joinedAt: new Date().toISOString(),
      };

      let joinedWs = null;
      let errText = '';
      if (!testMode) {
        try {
          joinedWs = await workspaceService.joinByCode(trimmedCode, member);
        } catch (err) {
          errText = err instanceof Error ? err.message : String(err);
        }
      }

      // محاولة احتياطية: لو فشل الاتصال بـ Firestore، نتحقق محلياً من الورك سبيسات
      // الموجودة بالستور أصلاً (احتمال إنه كان عضو فيها بالفعل من قبل).
      joinedWs ||= workspaces.find((w) => w.inviteCode === trimmedCode) ?? null;

      if (!joinedWs) {
        if (errText.includes('permission') || errText.includes('PERMISSION_DENIED')) {
          setErrorMsg('Firestore rules not configured. Please enable Firestore in Firebase Console and set read/write rules.');
        } else if (errText.includes('not-found') || errText.includes('404')) {
          setErrorMsg('Firestore database not created yet. Go to Firebase Console → Firestore → Create database.');
        } else {
          setErrorMsg(errText ? `Connection error: ${errText}` : 'Invalid invite code. Make sure the code is exactly correct (case-sensitive).');
        }
        return;
      }

      if (!workspaces.some((w) => w.id === joinedWs.id)) addWorkspace(joinedWs);
      addMember(joinedWs.id, member);
      wsRefsService.save(user.uid, joinedWs.id, { wsId: joinedWs.id, role: 'member' }).catch(() => {});
      showToast(`Joined "${joinedWs.name}"`);
      onClose();
      setCode('');
      onJoined?.(joinedWs);
    } finally {
      setJoining(false);
    }
  }

  return (
    <Modal title="Join Workspace" onClose={onClose} maxWidth={400}>
      <form onSubmit={handleSubmit}>
        <div className="modal-body">
          <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 12, lineHeight: 1.5 }}>
            Ask the workspace owner for their invite code. It looks like{' '}
            <code style={{ fontFamily: 'var(--mono)', color: 'var(--accent)' }}>XXXX-XXXX</code>.
          </p>
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="label">Invite Code</label>
            <input
              className="input"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="XXXX-XXXX"
              maxLength={9}
              autoFocus
              style={{
                fontFamily: 'var(--mono)',
                letterSpacing: '.12em',
                fontSize: 18,
                textTransform: 'uppercase',
                textAlign: 'center',
              }}
            />
          </div>
          {errorMsg && (
            <p style={{ fontSize: 12, color: 'var(--red)', marginTop: 10, padding: '6px 10px', background: 'var(--red-bg)', borderRadius: 6 }}>
              {errorMsg}
            </p>
          )}
          {joining && (
            <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 8, textAlign: 'center' }}>
              Searching for workspace…
            </p>
          )}
        </div>
        <div className="modal-footer">
          <button
            type="submit"
            disabled={code.length < 9 || joining}
            style={{
              padding: '7px 20px',
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              fontFamily: 'var(--font)',
              fontSize: 13,
              fontWeight: 500,
              cursor: code.length >= 9 && !joining ? 'pointer' : 'not-allowed',
              opacity: code.length >= 9 && !joining ? 1 : 0.5,
            }}
          >
            {joining ? 'Joining…' : 'Join'}
          </button>
          <button type="button" onClick={onClose} className="btn-cancel">
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  );
}
