// dashboardLabels.js
// ترجمة محدودة (scoped) فقط لتسميات بطاقات لوحة التحكم — نسخة جزئية من نظام i18n
// الكامل الموجود بالكود الأصلي (المتغير ze + الدالة Be).
//
// ⚠️ تعديل بطلب صريح: overdueItems أصلها "Overdue" بالكود الأصلي، عُدِّلت هنا
// لـ"Follow-up Overdue" / "تأخر المتابعة" — توضيحاً إن التعريف الجديد لهذا المصطلح
// باللوحة مرتبط حصرياً بتاريخ المتابعة (Follow-up)، وليس "تأخر" بمعنى عام.
//
// ملاحظة نطاق: نظام i18n الكامل بالتطبيق الأصلي يغطي كل نصوص الواجهة (عشرات المفاتيح)،
// وهو نظام عابر للأقسام يستحق قسمه الخاص لاحقاً (غالباً جزء من قسم Settings/UI).
// هنا نقلت فقط الـ 5 مفاتيح اللي تحتاجها لوحة تحكم التاسكات تحديداً.

const DASHBOARD_LABELS = {
  en: {
    activeTasks: 'Active',
    urgentTasks: 'Urgent',
    waitingFeedback: 'Waiting',
    overdueItems: 'Follow-up Overdue',
    completedItems: 'Completed',
  },
  ar: {
    activeTasks: 'نشطة',
    urgentTasks: 'عاجلة',
    waitingFeedback: 'انتظار',
    overdueItems: 'تأخر المتابعة',
    completedItems: 'مكتملة',
  },
};

export function getDashboardLabel(lang, key) {
  return DASHBOARD_LABELS[lang]?.[key] ?? DASHBOARD_LABELS.en[key] ?? key;
}
