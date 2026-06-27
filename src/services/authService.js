// authService.js
// خدمة المصادقة (Authentication) — نسخة مُعاد كتابتها بوضوح من المتغير `j` بالكود الأصلي.
// كل الدوال هنا غلاف (wrapper) حول Firebase Auth، مع تحويل شكل البيانات عن طريق
// firebaseUserToAppUser قبل رجوعها للتطبيق.

import {
  initFirebaseAuth,
  getFirebaseAuthInstance,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  firebaseSignOut,
  firebaseUpdateProfile,
} from './firebaseAuthClient';
import { firebaseUserToAppUser } from './userShape';

export const authService = {
  async init() {
    await initFirebaseAuth();
  },

  /**
   * يسجّل callback يستدعى كل ما تغيّرت حالة تسجيل الدخول.
   * callback يستقبل مستخدم بشكل التطبيق (firebaseUserToAppUser) أو null لو ما فيه تسجيل دخول.
   * يرجع دالة لإلغاء الاشتراك (unsubscribe) — تُستخدم بـ useEffect cleanup.
   */
  async onAuthChange(callback) {
    const auth = await initFirebaseAuth();
    return onAuthStateChanged(auth, (firebaseUser) => {
      callback(firebaseUser ? firebaseUserToAppUser(firebaseUser) : null);
    });
  },

  async signIn(email, password) {
    const auth = await initFirebaseAuth();
    const result = await signInWithEmailAndPassword(auth, email, password);
    return firebaseUserToAppUser(result.user);
  },

  async register(email, password, displayName) {
    await initFirebaseAuth();
    const auth = getFirebaseAuthInstance();
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await firebaseUpdateProfile(result.user, { displayName });
    return firebaseUserToAppUser(result.user);
  },

  async signInWithGoogle() {
    const auth = await initFirebaseAuth();
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    return firebaseUserToAppUser(result.user);
  },

  async signOut() {
    const auth = await initFirebaseAuth();
    await firebaseSignOut(auth);
  },

  /**
   * يحدّث الاسم/الصورة الشخصية. يرمي خطأ لو ما فيه مستخدم مسجل دخول حالياً.
   */
  async updateProfile(displayName, photoURL) {
    await initFirebaseAuth();
    const auth = getFirebaseAuthInstance();
    if (!auth.currentUser) throw new Error('Not signed in');

    await firebaseUpdateProfile(auth.currentUser, {
      displayName: displayName || undefined,
      photoURL: photoURL || undefined,
    });
    await auth.currentUser.reload();
    return firebaseUserToAppUser(auth.currentUser);
  },

  getCurrentUser() {
    const auth = getFirebaseAuthInstance();
    return auth?.currentUser ? firebaseUserToAppUser(auth.currentUser) : null;
  },

  // محفوظة من الكود الأصلي كما هي — دائماً ترجع false. الظاهر بقايا من ميزة "تجاوز
  // تسجيل الدخول" (bypass mode) لأغراض تطوير/اختبار، غير مفعّلة حالياً بالنسخة الحالية.
  isBypass: () => false,
};
