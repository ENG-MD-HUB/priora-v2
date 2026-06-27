// firebaseNotificationsClient.js
// تهيئة Firebase منفصلة خاصة بخدمة الإشعارات — نسخة مُعاد كتابتها بوضوح من الدالة
// Ue بالكود الأصلي.
//
// ملاحظة معمارية: هذي نسخة Firestore رابعة منفصلة بالتطبيق (إضافة لنسخ: Auth،
// Firestore الشخصي، Firestore الورك سبيس) — موجودة بالكود الأصلي نفسه بهذا الشكل،
// ولم نُغيّرها أو نوحّدها مع باقي النسخ، حفاظاً على نفس البنية الأصلية بالضبط.

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

let _notificationsDb = null;

export async function getNotificationsDb() {
  if (_notificationsDb) return _notificationsDb;
  const app = getApps().length ? getApps()[0] : initializeApp({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  });
  _notificationsDb = getFirestore(app);
  return _notificationsDb;
}
