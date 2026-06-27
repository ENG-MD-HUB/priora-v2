// firebaseAuthClient.js
// تهيئة Firebase Authentication — نسخة مُعاد كتابتها بوضوح من دالة `k` بالكود الأصلي.
//
// ملاحظة معمارية: هذي نسخة Firebase App منفصلة عن نسخ Firestore الموجودة بقسم Services
// (firebaseClient.js). هذا الفصل موجود بالكود الأصلي نفسه (3 نسخ مختلفة لتهيئة التطبيق:
// واحدة لـ Auth، واحدة لـ Firestore الخاص بالمستخدم، وواحدة لـ Firestore الخاص بالورك سبيس)،
// ولم نُغيّره — فقط أوضحناه.

import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  updateProfile as firebaseUpdateProfile,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let _auth = null;

/**
 * يهيّئ Firebase Auth مرة واحدة فقط (نسخة مخبأة/cached).
 * نسخة من: k()
 */
export async function initFirebaseAuth() {
  if (_auth) return _auth;
  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  _auth = getAuth(app);
  return _auth;
}

export function getFirebaseAuthInstance() {
  return _auth;
}

// إعادة تصدير دوال Firebase Auth الخام عشان authService يستخدمها مباشرة
export {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  firebaseSignOut,
  firebaseUpdateProfile,
};
