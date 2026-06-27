// deletedFoldersService.js
// خدمة المجلدات المحذوفة (Soft Delete) — مسار التخزين: users/{uid}/deletedFolders/{folderId}.
//
// ⚠️ ميزة جديدة كلياً (بطلب صريح، غير موجودة بالكود الأصلي): تسمح باستعادة مجلد كامل
// (مع كل تاسكاته) بعد حذفه، بدل الحذف النهائي الفوري. منفصلة عن trash العادية
// (الخاصة بالتاسكات فقط) لأن شكل بيانات المجلد مختلف تماماً عن التاسك.

import { saveUserDoc, deleteUserDoc, onUserCollection } from './userScopedCrud';

export const deletedFoldersService = {
  save: (uid, folder) => saveUserDoc(uid, 'deletedFolders', folder.id, folder),

  delete: (uid, folderId) => deleteUserDoc(uid, 'deletedFolders', folderId),

  onDeletedFolders: (uid, callback) =>
    onUserCollection(uid, 'deletedFolders', (docs) =>
      callback(docs.map((d) => ({ id: d.id, ...d.data })))
    ),
};
