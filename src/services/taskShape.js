// taskShape.js
// دوال تحويل شكل بيانات التاسك — نسخة مُعاد كتابتها بوضوح من Se و Ce بالكود الأصلي.
// هذي الدوال خاصة بتاسكات الورك سبيس (wsTasks) تحديداً، وتُستخدم لضمان شكل ثابت
// للحقول دائماً (مع قيم افتراضية)، بغض النظر عن شكل البيانات الخام بـ Firestore.

/**
 * يحوّل تاسك (من شكله الكامل بالتطبيق) إلى الشكل المُخزَّن في Firestore.
 * يُستخدم عند الحفظ (wsTaskService.save).
 * نسخة من: Se
 */
export function taskToFirestoreShape(task) {
  return {
    id: task.id,
    name: task.name,
    desc: task.desc,
    status: task.status,
    priority: task.priority,
    lastUpdate: task.lastUpdate,
    nextFollowup: task.nextFollowup ?? null,
    createdAt: task.createdAt,
    ownerId: task.ownerId,
    folderId: task.folderId,
    workspaceId: task.workspaceId ?? null,
    sharedToWsIds: task.sharedToWsIds ?? [],
    involvedIds: task.involvedIds ?? [],
    timeline: task.timeline ?? [],
    _type: 'task',
  };
}

/**
 * يحوّل مستند Firestore خام (id + data) إلى شكل تاسك كامل بقيم افتراضية أمنة.
 * يُستخدم عند القراءة (wsTaskService.onTasks, getAll).
 * نسخة من: Ce
 */
export function firestoreDocToTask(id, data) {
  return {
    id,
    _type: 'task',
    name: data.name ?? '',
    desc: data.desc ?? '',
    status: data.status ?? 'active',
    priority: data.priority ?? 'normal',
    lastUpdate: data.lastUpdate ?? null,
    nextFollowup: data.nextFollowup ?? null,
    createdAt: data.createdAt ?? new Date().toISOString(),
    ownerId: data.ownerId ?? '',
    folderId: data.folderId ?? '',
    workspaceId: data.workspaceId ?? null,
    sharedToWsIds: data.sharedToWsIds ?? [],
    involvedIds: data.involvedIds ?? [],
    timeline: data.timeline ?? [],
  };
}
