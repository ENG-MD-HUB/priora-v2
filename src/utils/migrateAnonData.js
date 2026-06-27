// migrateAnonData.js
// نقل بيانات المستخدم "المجهول" (anon) المحفوظة محلياً (localStorage) إلى المستخدم
// الحقيقي بعد تسجيل الدخول لأول مرة.
// نسخة مُعاد كتابتها بوضوح من الدالة `ce` بالكود الأصلي.
//
// ملاحظة سلوكية مهمة محفوظة من الأصل: لو المستخدم الحقيقي عنده بيانات محفوظة بالفعل
// تحت مفتاحه (من جلسة سابقة)، تُستخدم هذي أولاً؛ بيانات anon تُستخدم فقط كـ fallback
// (?? وليس ||) — يعني لو بيانات المستخدم موجودة لكنها فاضية [] (مصفوفة فاضية)، ما يرجع
// لبيانات anon، لأن [] قيمة "موجودة" مش null/undefined.

import { STORAGE_KEY_PREFIX } from './appConstants';

const MIGRATABLE_NAMESPACES = ['tasks', 'folders', 'contacts'];

/**
 * يرجع شكل: { tasks?: [...], folders?: [...], contacts?: [...] }
 * فقط الحقول اللي فيها بيانات فعلية تُرجع — namespace بدون بيانات لا يظهر بالنتيجة.
 */
export function readMigratableAnonData(uid) {
  const result = {};

  for (const namespace of MIGRATABLE_NAMESPACES) {
    const userKey = `${STORAGE_KEY_PREFIX}_${uid}_${namespace}`;
    const anonKey = `${STORAGE_KEY_PREFIX}_anon_${namespace}`;
    const raw = localStorage.getItem(userKey) ?? localStorage.getItem(anonKey);

    if (!raw) continue;

    try {
      const parsedState = JSON.parse(raw)?.state;
      if (!parsedState) continue;

      if (namespace === 'tasks') result.tasks = parsedState.tasks ?? [];
      if (namespace === 'folders') result.folders = parsedState.folders ?? [];
      if (namespace === 'contacts') result.contacts = parsedState.contacts ?? [];
    } catch {
      // JSON تالف أو غير متوقع — نتجاهله بصمت، بنفس سلوك الكود الأصلي بالضبط.
    }
  }

  return result;
}
