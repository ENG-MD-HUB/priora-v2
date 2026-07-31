// foldersService.js
// خدمة المجلدات (Folders) — مسار التخزين: users/{uid}/folders/{folderId}
// نسخة مُعاد كتابتها بوضوح من المتغير `ge` بالكود الأصلي المضغوط.

import { saveUserDoc, deleteUserDoc, onUserCollection } from './userScopedCrud';

export const foldersService = {
  save: (uid, folder) => saveUserDoc(uid, 'folders', folder.id, folder),

  delete: (uid, folderId) => deleteUserDoc(uid, 'folders', folderId),

  onFolders: (uid, callback) =>
    onUserCollection(uid, 'folders', (docs) =>
      callback(docs.map((d) => ({ id: d.id, ...d.data })))
    ),
};
