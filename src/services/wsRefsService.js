// wsRefsService.js
// خدمة مراجع الورك سبيس (wsrefs) — تربط المستخدم بالورك سبيسات اللي هو عضو فيها.
// مسار التخزين: users/{uid}/wsrefs/{wsId}
// نسخة مُعاد كتابتها بوضوح من المتغير `ye` بالكود الأصلي المضغوط.

import { doc, collection, getDocs } from 'firebase/firestore';
import { getUserScopedDb } from './firebaseClient';
import { saveUserDoc, deleteUserDoc } from './userScopedCrud';

export const wsRefsService = {
  save: (uid, wsId, refData) => saveUserDoc(uid, 'wsrefs', wsId, refData),

  delete: (uid, wsId) => deleteUserDoc(uid, 'wsrefs', wsId),

  /**
   * يرجع كل مراجع الورك سبيس الخاصة بالمستخدم (وليس استماع لحظي — قراءة لمرة واحدة).
   * كل عنصر يرجع بشكل: { id, wsId, ...refFields }
   * ملاحظة: wsId مكرر عمداً (id و wsId لهما نفس القيمة) — هذا محفوظ كما هو بالكود الأصلي.
   */
  getAll: async (uid) => {
    const db = await getUserScopedDb();
    const snapshot = await getDocs(collection(db, 'users', uid, 'wsrefs'));
    return snapshot.docs.map((d) => ({
      id: d.id,
      wsId: d.id,
      ...d.data(),
    }));
  },
};
