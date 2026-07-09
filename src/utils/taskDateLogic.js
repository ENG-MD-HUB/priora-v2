// taskDateLogic.js
// منطق التواريخ الخاص بالتاسكات — نسخة مُعاد كتابتها بوضوح من الدوال N, P, F, I, L, R, ie
// بالكود الأصلي.
//
// قاعدة عمل مهمة جداً، محفوظة بدقة تامة من الأصل: "اليوم" بمنطق التطبيق لا يبدأ
// عند منتصف الليل (00:00) — بل عند الساعة 5 فجراً. يعني لو الساعة الآن 2:00 صباحاً،
// التطبيق يعتبرها لسا "أمس". هذا يؤثر على: تاريخ "آخر تحديث" الافتراضي، حساب التأخير،
// وحساب "هل تم التحديث اليوم". هذي القاعدة لا تنطبق على isToday (الدالة الأخيرة بالأسفل) —
// تلك تستخدم منتصف الليل الحقيقي، وهذا فرق مقصود بالأصل وليس خطأ.

/**
 * يرجع تاريخ "اليوم الفعلي" بصيغة YYYY-MM-DD، مع مراعاة قاعدة حد الساعة 5 فجراً.
 * نسخة من: N()
 *
 * ⚠️ تصحيح خلل حقيقي بطلب صريح: كانت الدالة تفحص الساعة المحلية (getHours — صح)،
 * لكن تستخرج نص التاريخ عبر toISOString() — واللي يرجع دائماً بتوقيت UTC، بغض
 * النظر عن توقيت الجهاز المحلي! لأي منطقة توقيت متقدمة عن UTC (زي السعودية،
 * +3)، بين منتصف الليل وحوالي الساعة 3 فجراً محلياً، يكون التاريخ بـUTC لسا
 * "أمس" — فتطلع الدالة تاريخ أمس حتى لو الساعة المحلية تجاوزت الـ5 فجراً وصار
 * "اليوم" فعلياً محلياً. الحل: نبني نص التاريخ يدوياً من مكوّنات التاريخ المحلية
 * (getFullYear/getMonth/getDate) بدل toISOString، فيطابق التقويم المحلي دائماً.
 */
export function getEffectiveToday() {
  const now = new Date();
  if (now.getHours() < 5) now.setDate(now.getDate() - 1);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * يرجع timestamp (بالمللي ثانية) لحظة بداية "اليوم الفعلي" (الساعة 5 فجراً بالضبط)
 * مع مراعاة نفس قاعدة حد الساعة 5 فجراً.
 * نسخة من: P()
 */
export function getEffectiveDayStartTimestamp() {
  const now = new Date();
  const boundary = new Date(now);
  if (now.getHours() < 5) boundary.setDate(boundary.getDate() - 1);
  boundary.setHours(5, 0, 0, 0);
  return boundary.getTime();
}

/**
 * يحوّل تاريخ بصيغة YYYY-MM-DD إلى صيغة عرض DD/MM/YYYY. يرجع رمز خط — لو التاريخ فاضي.
 * نسخة من: F()
 */
export function formatDateForDisplay(dateStr) {
  if (!dateStr) return '—';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

/**
 * عدد الأيام المنقضية منذ تاريخ معيّن (مقرّب لأسفل). يرجع 9999 (قيمة استثنائية تعني
 * "أبداً"/"غير محدد") لو ما فيه تاريخ.
 * نسخة من: I()
 */
export function daysSince(dateStr) {
  if (!dateStr) return 9999;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

/**
 * هل التاسك متأخر (overdue)؟ التاسكات المُغلقة لا تُعتبر متأخرة أبداً، بغض النظر عن
 * أي شرط آخر. غير ذلك، متأخر لو: تاريخ المتابعة القادمة فات "اليوم الفعلي"، أو
 * آخر تحديث له 7 أيام أو أكثر.
 * نسخة من: L()
 */
export function isTaskOverdue(task) {
  if (task.status === 'closed') return false;
  const followupPassed = task.nextFollowup && task.nextFollowup < getEffectiveToday();
  const staleUpdate = daysSince(task.lastUpdate) >= 7;
  return !!(followupPassed || staleUpdate);
}

/**
 * هل تم تحديث التاسك "اليوم" (بمعنى اليوم الفعلي)؟ صحيح لو lastUpdate يطابق اليوم
 * الفعلي تماماً، أو لو أول عنصر بالتايملاين (الأحدث، لأن العناصر الجديدة تُضاف بالبداية)
 * وقته يقع بعد أو عند لحظة بداية اليوم الفعلي.
 * نسخة من: R()
 */
export function wasUpdatedToday(task) {
  const dayStartTs = getEffectiveDayStartTimestamp();
  if (task.lastUpdate === getEffectiveToday()) return true;
  if (task.timeline?.length) return new Date(task.timeline[0].ts).getTime() >= dayStartTs;
  return false;
}

/**
 * هل هذا التاريخ هو تاريخ اليوم الحقيقي (منتصف الليل، بدون قاعدة الساعة 5 فجراً)؟
 * فرق مقصود عن getEffectiveToday: هذي تستخدم منتصف الليل الحقيقي.
 * نسخة من: ie()
 */
export function isToday(dateStr) {
  return dateStr ? dateStr === new Date().toISOString().split('T')[0] : false;
}
