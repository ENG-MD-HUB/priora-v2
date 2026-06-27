// firebaseClient.js
// طبقة تهيئة Firebase — نسخة مُعاد كتابتها بوضوح من الكود الأصلي المضغوط.
//
// المنطق الأصلي: دالتين منفصلتين لتهيئة Firestore (de و J في الكود المضغوط)،
// كل واحدة منهم تحتفظ بنسخة مخبأة (cached instance) خاصة بها.
// تم الحفاظ على هذا التكرار بالضبط كما كان في الأصل — لا تغيير في السلوك.
//
// ملاحظة: قيم firebaseConfig تُقرأ من ملف .env (انظر .env.example) ولا توجد هنا
// كنص ثابت، لأن هذا القسم يعمل ببيانات وهمية (mock) بدون اتصال Firebase حقيقي.
// عند الدمج بالنسخة الإنتاجية الحقيقية، تُستبدل بمفاتيح Firebase الفعلية لمشروعك.

import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  enableIndexedDbPersistence,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// ===== نسخة Firestore المستخدمة في: tasks, folders, contacts, trash, wsrefs =====
// (مسار التخزين: users/{uid}/{collection}/{docId})
let _userScopedDb = null;

export async function getUserScopedDb() {
  if (_userScopedDb) return _userScopedDb;

  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  _userScopedDb = getFirestore(app);

  try {
    await enableIndexedDbPersistence(_userScopedDb);
  } catch {
    // فشل تفعيل التخزين المحلي (IndexedDB) ليس خطأ حرج — نتجاهله بنفس الطريقة الأصلية.
  }

  return _userScopedDb;
}

// ===== نسخة Firestore المستخدمة في: workspaces, wsTasks =====
// (مسار التخزين: workspaces/{wsId}[/tasks/{taskId}])
// ملاحظة مهمة محفوظة من الكود الأصلي: هذي نسخة منفصلة، بدون enableIndexedDbPersistence.
let _workspaceScopedDb = null;

export async function getWorkspaceScopedDb() {
  if (_workspaceScopedDb) return _workspaceScopedDb;

  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  _workspaceScopedDb = getFirestore(app);

  return _workspaceScopedDb;
}
