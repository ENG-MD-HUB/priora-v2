// debounce.js
// دالة debounce عامة — نسخة مُعاد كتابتها بوضوح من الدالة `z` بالكود الأصلي.
// تُستخدم بشكل أساسي لتأخير تنفيذ البحث أثناء الكتابة (search-as-you-type).

export function debounce(fn, delayMs) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delayMs);
  };
}
