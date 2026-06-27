// notificationService.js
// خدمة إشعارات تحديثات تاسكات الورك سبيس — نسخة مُعاد كتابتها بوضوح من المتغير We
// بالكود الأصلي. مسار التخزين: workspaces/{wsId}/notifications/{notifId}.
//
// ملاحظة سلوكية مهمة محفوظة من الأصل: onUnread و onAll يستثنيان دائماً الإشعارات
// اللي كاتبها هو نفس المستخدم الحالي (authorId !== uid) — يعني لا تصلك إشعارات
// عن تحديثاتك الخاصة. onUnread أيضاً يستثني أي إشعار already موجود بقائمة readBy.

import { collection, addDoc, onSnapshot, query, limit, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { getNotificationsDb } from './firebaseNotificationsClient';

export const notificationService = {
  async add(wsId, notification) {
    const db = await getNotificationsDb();
    await addDoc(collection(db, 'workspaces', wsId, 'notifications'), {
      ...notification,
      readBy: [],
      createdAt: new Date().toISOString(),
    });
  },

  /**
   * استماع لحظي لآخر 50 إشعار غير مقروء (يستثني إشعارات المستخدم نفسه وما قرأه بالفعل).
   * يرجع دالة لإلغاء الاستماع.
   */
  onUnread(wsId, uid, callback) {
    let cancelled = false;
    let unsubscribe = null;

    getNotificationsDb()
      .then((db) => {
        if (cancelled) return;
        unsubscribe = onSnapshot(query(collection(db, 'workspaces', wsId, 'notifications'), limit(50)), (snapshot) => {
          const items = snapshot.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
            .filter((n) => n.authorId !== uid && !(n.readBy ?? []).includes(uid));
          callback(items);
        });
      })
      .catch(console.warn);

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  },

  /**
   * استماع لحظي لآخر 30 إشعار (مقروء وغير مقروء)، يستثني إشعارات المستخدم نفسه فقط.
   */
  onAll(wsId, uid, callback) {
    let cancelled = false;
    let unsubscribe = null;

    getNotificationsDb()
      .then((db) => {
        if (cancelled) return;
        unsubscribe = onSnapshot(query(collection(db, 'workspaces', wsId, 'notifications'), limit(30)), (snapshot) => {
          const items = snapshot.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
            .filter((n) => n.authorId !== uid);
          callback(items);
        });
      })
      .catch(console.warn);

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  },

  async markRead(wsId, notifId, uid) {
    const db = await getNotificationsDb();
    await updateDoc(doc(db, 'workspaces', wsId, 'notifications', notifId), {
      readBy: arrayUnion(uid),
    });
  },

  async markAllRead(wsId, notifications, uid) {
    await Promise.all(notifications.map((n) => this.markRead(wsId, n.id, uid)));
  },
};
