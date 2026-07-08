// tasksService.js
// خدمة التاسكات الشخصية — مسار التخزين: users/{uid}/tasks/{taskId}
// نسخة مُعاد كتابتها بوضوح من المتغير `he` بالكود الأصلي المضغوط.

import { saveUserDoc, updateUserDoc, deleteUserDoc, onUserCollection } from './userScopedCrud';

export const tasksService = {
  save: (uid, task) => saveUserDoc(uid, 'tasks', task.id, task),

  // ⚠️ إضافة بطلب صريح — راجع الشرح المفصّل بـuserScopedCrud.js (updateUserDoc).
  update: (uid, taskId, partialData) => updateUserDoc(uid, 'tasks', taskId, partialData),

  delete: (uid, taskId) => deleteUserDoc(uid, 'tasks', taskId),

  /**
   * يستمع لحظياً لكل تاسكات المستخدم.
   * callback يستقبل مصفوفة كاملة من التاسكات بشكلها النهائي: [{ id, ...taskFields }]
   */
  onTasks: (uid, callback) =>
    onUserCollection(uid, 'tasks', (docs) =>
      callback(docs.map((d) => ({ id: d.id, ...d.data })))
    ),
};
