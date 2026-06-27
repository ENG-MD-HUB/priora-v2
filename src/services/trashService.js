// trashService.js
// خدمة سلة المهملات (Trash) — مسار التخزين: users/{uid}/trash/{itemId}
// نسخة مُعاد كتابتها بوضوح من المتغير `ve` بالكود الأصلي المضغوط.

import { saveUserDoc, deleteUserDoc, onUserCollection } from './userScopedCrud';

export const trashService = {
  save: (uid, item) => saveUserDoc(uid, 'trash', item.id, item),

  delete: (uid, itemId) => deleteUserDoc(uid, 'trash', itemId),

  onTrash: (uid, callback) =>
    onUserCollection(uid, 'trash', (docs) =>
      callback(docs.map((d) => ({ id: d.id, ...d.data })))
    ),
};
