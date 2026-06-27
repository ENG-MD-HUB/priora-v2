// searchTasks.js
// فلترة تاسكات بالبحث النصي — نسخة مُعاد كتابتها بوضوح من الدالة lt بالكود الأصلي.
// يبحث بالاسم، الوصف، وكل نصوص التايملاين (أي ملاحظة قديمة).

export function searchTasks(tasks, query) {
  if (!query.trim()) return tasks;
  const q = query.toLowerCase();
  return tasks.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      (t.desc ?? '').toLowerCase().includes(q) ||
      t.timeline.some((entry) => entry.text.toLowerCase().includes(q))
  );
}
