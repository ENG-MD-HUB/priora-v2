// workspaceService.js
// خدمة الورك سبيس (Workspace) — مسار التخزين: workspaces/{wsId}
// نسخة مُعاد كتابتها بوضوح من المتغير `Y` بالكود الأصلي المضغوط.
//
// ملاحظة معمارية مهمة: هذي الخدمة تستخدم نسخة Firestore منفصلة (getWorkspaceScopedDb)
// عن خدمات tasks/folders/contacts/trash/wsrefs (اللي تستخدم getUserScopedDb).
// هذا فرق موجود بالكود الأصلي نفسه، وتم الحفاظ عليه بدون تغيير.

import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  arrayUnion,
  onSnapshot,
} from 'firebase/firestore';
import { getWorkspaceScopedDb } from './firebaseClient';

export const workspaceService = {
  /**
   * ينشئ ورك سبيس جديد. العضو الأول يُضاف تلقائياً (عادة صاحب الورك سبيس).
   */
  async create(workspace, firstMember) {
    const db = await getWorkspaceScopedDb();
    await setDoc(doc(db, 'workspaces', workspace.id), {
      id: workspace.id,
      name: workspace.name,
      description: workspace.description ?? '',
      ownerId: workspace.ownerId,
      inviteCode: workspace.inviteCode,
      createdAt: workspace.createdAt,
      members: [firstMember],
    });
  },

  /**
   * ينضم المستخدم لورك سبيس عن طريق كود الدعوة.
   * يرجع null إذا الكود غلط/مش موجود.
   * لو المستخدم عضو بالفعل، ما يضيفه مرة ثانية (تحقق عن طريق uid).
   */
  async joinByCode(inviteCode, member) {
    const db = await getWorkspaceScopedDb();
    const matchingDocs = await getDocs(
      query(collection(db, 'workspaces'), where('inviteCode', '==', inviteCode))
    );

    if (matchingDocs.empty) return null;

    const wsDoc = matchingDocs.docs[0];
    const wsData = wsDoc.data();

    const alreadyMember = (wsData.members ?? []).some((m) => m.uid === member.uid);
    if (!alreadyMember) {
      await updateDoc(doc(db, 'workspaces', wsDoc.id), {
        members: arrayUnion(member),
      });
    }

    return {
      id: wsDoc.id,
      name: wsData.name,
      description: wsData.description,
      ownerId: wsData.ownerId,
      inviteCode: wsData.inviteCode,
      createdAt: wsData.createdAt,
    };
  },

  async getMembers(wsId) {
    const db = await getWorkspaceScopedDb();
    const snap = await getDoc(doc(db, 'workspaces', wsId));
    return snap.exists() ? snap.data().members ?? [] : [];
  },

  /**
   * استماع لحظي لقائمة أعضاء ورك سبيس معيّن.
   * يرجع دالة لإلغاء الاستماع.
   */
  onMembers(wsId, callback) {
    let unsubscribe = () => {};

    getWorkspaceScopedDb().then((db) => {
      unsubscribe = onSnapshot(doc(db, 'workspaces', wsId), (snap) => {
        if (!snap.exists()) {
          callback([]);
          return;
        }
        callback(snap.data().members ?? []);
      });
    });

    return () => unsubscribe();
  },

  /**
   * يرجع كل الورك سبيسات اللي المستخدم عضو فيها.
   * يتجاهل أي مستند placeholder أو بدون اسم (نفس فلترة الكود الأصلي بالضبط).
   * كل عنصر بالنتيجة: { ws: {...}, members: [...] }
   */
  async getUserWorkspaces(uid) {
    try {
      const db = await getWorkspaceScopedDb();
      const snapshot = await getDocs(collection(db, 'workspaces'));
      const result = [];

      for (const wsDoc of snapshot.docs) {
        const data = wsDoc.data();
        if (data._placeholder || !data.name) continue;

        // ⚠️ تصحيح خلل حقيقي: ?? [] يتعامل بس مع null/undefined — لو data.members
        // موجود لكن نوعه مو array فعلاً (مستند قديم/تالف بقيمة خاطئة)، ?? ما
        // يلتقطها، و.some() تنهار بـTypeError. Array.isArray يتحقق من النوع
        // الفعلي، يحمي من أي قيمة غير متوقعة.
        const members = Array.isArray(data.members) ? data.members : [];
        const isMember = members.some((m) => m.uid === uid);
        if (isMember) {
          result.push({
            ws: {
              id: wsDoc.id,
              name: data.name,
              description: data.description,
              ownerId: data.ownerId,
              inviteCode: data.inviteCode,
              createdAt: data.createdAt,
            },
            members,
          });
        }
      }

      return result;
    } catch (err) {
      console.warn('getUserWorkspaces failed:', err);
      throw err;
    }
  },

  async updateInviteCode(wsId, newCode) {
    const db = await getWorkspaceScopedDb();
    await updateDoc(doc(db, 'workspaces', wsId), { inviteCode: newCode });
  },

  /**
   * يحذف ورك سبيس بالكامل، بما فيه كل تاسكاته (subcollection: workspaces/{wsId}/tasks).
   */
  async delete(wsId) {
    const db = await getWorkspaceScopedDb();
    const tasksSnapshot = await getDocs(collection(db, 'workspaces', wsId, 'tasks'));
    await Promise.all(tasksSnapshot.docs.map((d) => deleteDoc(d.ref)));
    await deleteDoc(doc(db, 'workspaces', wsId));
  },

  /**
   * يحذف عضو من قائمة أعضاء الورك سبيس.
   */
  async removeMember(wsId, memberUid) {
    const db = await getWorkspaceScopedDb();
    const snap = await getDoc(doc(db, 'workspaces', wsId));
    if (!snap.exists()) return;

    const data = snap.data();
    await updateDoc(doc(db, 'workspaces', wsId), {
      members: (data.members ?? []).filter((m) => m.uid !== memberUid),
    });
  },
};
