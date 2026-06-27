// sortTasks.js
// مقارن ترتيب التاسكات — نسخة مُعاد كتابتها بوضوح من الدالة `ee` بالكود الأصلي.

const STATUS_ORDER = { active: 0, waiting: 1, ontrack: 2, closed: 3 };

/**
 * يرتّب مصفوفة تاسكات حسب حقل واتجاه معيّن (sortConfig = { field, dir }).
 * لا يُعدّل المصفوفة الأصلية (يرجع نسخة جديدة).
 *
 * الحقول المدعومة: lastUpdate, createdAt, nextFollowup, status, priority, name.
 * priority: "urgent" دائماً يسبق غيره بغض النظر عن باقي القيم.
 * nextFollowup: التاسكات بدون تاريخ متابعة تُعامل كـ "9999" (تذهب لآخر القائمة بترتيب تصاعدي).
 */
export function sortTasks(tasks, sortConfig) {
  return [...tasks].sort((a, b) => {
    let comparison = 0;
    switch (sortConfig.field) {
      case 'lastUpdate':
        comparison = (b.lastUpdate ?? '').localeCompare(a.lastUpdate ?? '');
        break;
      case 'createdAt':
        comparison = (b.createdAt ?? '').localeCompare(a.createdAt ?? '');
        break;
      case 'nextFollowup':
        comparison = (a.nextFollowup ?? '9999').localeCompare(b.nextFollowup ?? '9999');
        break;
      case 'status':
        comparison = (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
        break;
      case 'priority':
        comparison = (a.priority === 'urgent' ? 0 : 1) - (b.priority === 'urgent' ? 0 : 1);
        break;
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
    }
    return sortConfig.dir === 'asc' ? comparison : -comparison;
  });
}
