// adminBackup.js
// ⚠️ إضافة جديدة بطلب صريح: نسخة احتياطية كاملة لقاعدة البيانات (كل المستخدمين
// + كل الورك سبيسات) — مجانية بالكامل (بدون Blaze/Cloud Functions)، وآمنة فعلياً
// (الحماية عبر هوية Firebase Auth الحقيقية + قاعدة أمان Firestore، مو كلمة سر
// بكود العميل القابل للاكتشاف).
//
// ⚠️ حرج جداً: ADMIN_UID هنا لازم يطابق بالضبط الـUID المكتوب بقاعدة الأمان
// (Firestore Rules) اللي أضافها المستخدم بلوحة تحكم Firebase. القراءة الفعلية
// لبيانات كل المستخدمين محمية هناك (بجانب السيرفر) — مو بهذا التحقق هنا (اللي هو
// مجرد تحسين لتجربة الاستخدام: نخفي الزر عن غير الأدمن، لا أكثر). حتى لو حد عدّل
// هذا الملف بالمتصفح وحاول يشغّل الدالة، قاعدة الأمان بالسيرفر ترفض الطلب لأي
// حساب غير حساب الأدمن الحقيقي.
const ADMIN_UID = 'iFAIMlJKV9OrTEK0JlCEwAQNTpN2';

import { collectionGroup, collection, getDocs } from 'firebase/firestore';
import { getUserScopedDb } from '../services/firebaseClient';

export function isAdminUser(uid) {
  return uid === ADMIN_UID;
}

/**
 * يجمع بيانات كل المستخدمين (tasks/folders/contacts/trash/deletedFolders) وكل
 * الورك سبيسات (المعلومات الأساسية + tasks + notifications) بكائن واحد منظّم:
 * { exportedAt, users: { [uid]: {...} }, workspaces: { [wsId]: {...} } }
 *
 * يستخدم collectionGroup — يجيب كل المستندات بنفس اسم الـsubcollection عبر كل
 * المستخدمين/الورك سبيسات دفعة وحدة (بدل ما نحتاج نعرف كل uid مسبقاً)، ونفرزها
 * حسب المستند الأب (users/{uid}/... أو workspaces/{wsId}/...) عن طريق مسار
 * المرجع (ref.parent.parent).
 */
export async function runFullAdminBackup(currentUid) {
  if (!isAdminUser(currentUid)) {
    throw new Error('Not authorized — admin backup is restricted to the admin account.');
  }

  const db = await getUserScopedDb();
  const result = { exportedAt: new Date().toISOString(), users: {}, workspaces: {} };

  const personalSubcollections = ['tasks', 'folders', 'contacts', 'trash', 'deletedFolders'];
  const workspaceSubcollections = ['tasks', 'notifications'];

  for (const name of personalSubcollections) {
    const snap = await getDocs(collectionGroup(db, name));
    for (const d of snap.docs) {
      const userDocRef = d.ref.parent.parent; // users/{uid}
      if (!userDocRef || userDocRef.parent.id !== 'users') continue;
      const uid = userDocRef.id;
      result.users[uid] ??= {};
      result.users[uid][name] ??= [];
      result.users[uid][name].push({ id: d.id, ...d.data() });
    }
  }

  for (const name of workspaceSubcollections) {
    const snap = await getDocs(collectionGroup(db, name));
    for (const d of snap.docs) {
      const wsDocRef = d.ref.parent.parent; // workspaces/{wsId}
      if (!wsDocRef || wsDocRef.parent.id !== 'workspaces') continue;
      const wsId = wsDocRef.id;
      result.workspaces[wsId] ??= {};
      result.workspaces[wsId][name] ??= [];
      result.workspaces[wsId][name].push({ id: d.id, ...d.data() });
    }
  }

  const wsSnap = await getDocs(collection(db, 'workspaces'));
  for (const d of wsSnap.docs) {
    result.workspaces[d.id] ??= {};
    result.workspaces[d.id].meta = { id: d.id, ...d.data() };
  }

  return result;
}

export function downloadBackupJson(backupData) {
  const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `priora-ADMIN-full-backup-${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
}
