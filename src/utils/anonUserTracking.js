// anonUserTracking.js
// نظام تتبع "المستخدم الحالي" لبناء مفاتيح localStorage الصحيحة.
// نسخة مُعاد كتابتها بوضوح من المتغيرات والدوال: ae (المتغير), oe(), se() بالكود الأصلي.
//
// السبب وراء هذا النظام: قبل تسجيل الدخول، بيانات المستخدم (تاسكات/مجلدات/جهات اتصال)
// تُحفظ محلياً في localStorage تحت مفتاح "anon". بعد تسجيل الدخول، يصير عندنا uid حقيقي،
// فنحتاج نعرف "إيش المستخدم الحالي الآن" عشان نبني مفتاح التخزين الصحيح — وهذا ما توفره
// هذي الوحدة (module-level variable يتغيّر بعد تسجيل الدخول).

import { STORAGE_KEY_PREFIX } from './appConstants';

let _currentUserId = 'anon';

/**
 * يحدّث "المستخدم الحالي" — يُستدعى بعد كل تسجيل دخول ناجح.
 * نسخة من: oe()
 */
export function setCurrentUserId(uid) {
  _currentUserId = uid;
}

export function getCurrentUserId() {
  return _currentUserId;
}

/**
 * يبني مفتاح localStorage الكامل لمستخدم معيّن وnamespace معيّن (مثلاً 'tasks', 'ui').
 * نسخة من: se()
 */
export function buildStorageKey(namespace) {
  return `${STORAGE_KEY_PREFIX}_${_currentUserId}_${namespace}`;
}
