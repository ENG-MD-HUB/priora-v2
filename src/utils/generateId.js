// generateId.js
// مولّد معرّف فريد بسيط — نسخة مُعاد كتابتها بوضوح من الدالة `M` بالكود الأصلي.
// يُستخدم لأي id محلي (تاسك جديد، عضو يُضاف يدوياً، توست...) قبل الحفظ بـ Firestore.

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}
