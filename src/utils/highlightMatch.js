// highlightMatch.js
// تمييز نص البحث داخل نتائج البحث — نسخة مُعاد كتابتها بوضوح من الدوال `te` (تهريب HTML)
// و `B` (التمييز نفسه) بالكود الأصلي.
//
// ملاحظة أمان مهمة: escapeHtml ضرورية هنا لأن highlightMatch ترجع HTML سيُحقن مباشرة
// بالصفحة (dangerouslySetInnerHTML بالواجهة) — تطبيق escape أولاً يمنع XSS من نص
// يكتبه المستخدم بحقول مثل اسم التاسك أو الوصف.

export function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * يرجع HTML فيه كل تطابقات query (case-insensitive) داخل text محاطة بـ mark.
 * لو query فاضي، يرجع فقط النص بعد تهريبه (بدون أي تمييز).
 */
export function highlightMatch(text, query) {
  if (!query.trim()) return escapeHtml(text);

  const escapedText = escapeHtml(text);
  const escapedQuery = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  return escapedText.replace(
    new RegExp(`(${escapedQuery})`, 'gi'),
    '<mark style="background:color-mix(in srgb,var(--amber) 28%,transparent);color:var(--amber);border-radius:2px;padding:0 2px">$1</mark>'
  );
}
