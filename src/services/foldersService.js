// foldersService.js
// خدمة المجلدات (Folders) — مسار التخزين: users/{uid}/folders/{folderId}
// نسخة مُعاد كتابتها بوضوح من المتغير `ge` بالكود الأصلي المضغوط.

import { saveUserDoc, updateUserDoc, deleteUserDoc, onUserCollection } from './userScopedCrud';

export const foldersService = {
  save: (uid, folder) => saveUserDoc(uid, 'folders', folder.id, folder),

  // ⚠️ إضافة بطلب صريح (لازمة لحفظ ترتيب السحب-والإفلات فوراً بـFirestore) —
  // نفس نمط tasksService.update، تحديث جزئي بدل استبدال كامل.
  update: (uid, folderId, partialData) => updateUserDoc(uid, 'folders', folderId, partialData),

  delete: (uid, folderId) => deleteUserDoc(uid, 'folders', folderId),

  onFolders: (uid, callback) =>
    onUserCollection(uid, 'folders', (docs) =>
      callback(docs.map((d) => ({ id: d.id, ...d.data })))
    ),
};
