// taskColors.js
// دوال تحديد ألوان المؤشرات البصرية بالتاسكات — نسخة مُعاد كتابتها بوضوح من الدوال
// ne و re بالكود الأصلي.

/**
 * لون مؤشر "عدد الأيام منذ آخر تحديث" — يتدرّج من رمادي (طبيعي) إلى عنبري (تحذير)
 * إلى برتقالي (تنبيه أقوى) كلما زادت الأيام.
 * نسخة من: ne()
 */
export function getDaysSinceColor(days) {
  if (days <= 7) return 'var(--text3)';
  if (days <= 14) return 'var(--amber)';
  return 'var(--orange)';
}

/**
 * لون تاريخ المتابعة القادمة (nextFollowup) حسب موقعه من اليوم الحقيقي (منتصف الليل):
 * اليوم نفسه = عنبري، فات = أحمر، مستقبلي = نص عادي، بدون تاريخ = رمادي.
 * نسخة من: re()
 */
export function getFollowupDateColor(dateStr) {
  if (!dateStr) return 'var(--text3)';
  const today = new Date().toISOString().split('T')[0];
  if (dateStr === today) return 'var(--amber)';
  if (dateStr < today) return 'var(--red)';
  return 'var(--text2)';
}
