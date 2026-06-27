// userShape.js
// تحويل مستخدم Firebase Auth الخام إلى شكل بيانات المستخدم بالتطبيق.
// نسخة مُعاد كتابتها بوضوح من الدالة `A` بالكود الأصلي.

/**
 * @param {import('firebase/auth').User} firebaseUser
 */
export function firebaseUserToAppUser(firebaseUser) {
  return {
    uid: firebaseUser.uid,
    displayName: firebaseUser.displayName ?? '',
    email: firebaseUser.email ?? '',
    photoURL: firebaseUser.photoURL,
    joinedAt: new Date().toISOString(),
  };
}
