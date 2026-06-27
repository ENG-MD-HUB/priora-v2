// contactsService.js
// خدمة جهات الاتصال (Contacts) — مسار التخزين: users/{uid}/contacts/{contactId}
// نسخة مُعاد كتابتها بوضوح من المتغير `_e` بالكود الأصلي المضغوط.

import { saveUserDoc, deleteUserDoc, onUserCollection } from './userScopedCrud';

export const contactsService = {
  save: (uid, contact) => saveUserDoc(uid, 'contacts', contact.id, contact),

  delete: (uid, contactId) => deleteUserDoc(uid, 'contacts', contactId),

  onContacts: (uid, callback) =>
    onUserCollection(uid, 'contacts', (docs) =>
      callback(docs.map((d) => ({ id: d.id, ...d.data })))
    ),
};
