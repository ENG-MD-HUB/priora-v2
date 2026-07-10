// applyWsTaskChange.js
// ⚠️ إضافة جديدة بطلب صريح: دالة موحّدة لتطبيق أي تعديل على نسخة تاسك بالورك
// سبيس، مع مزامنة آمنة للمصدر الشخصي (لو ينطبق). السبب: نفس منطق "زامن للمصدر
// الشخصي" كان مكرر بعدة أماكن (WorkspaceTaskUpdateModal، WorkspaceTaskDetailModal،
// WorkspaceTaskRow) — وكل مرة نصلحه بمكان، ينسى بمكان ثاني (بالضبط اللي صار مع
// قائمة الزر اليمين وزر Re-open). دالة واحدة مشتركة تمنع تكرار هذا مستقبلاً.
//
// تستخدم:
// - wsTaskService.update (تحديث جزئي، مو استبدال كامل) لنسخة الورك سبيس.
// - tasksService.updateIfNotStale (فحص تعارض + retry) للمصدر الشخصي، لو التاسك
//   أصله شخصي مشارك (workspaceId === null) والمستخدم الحالي هو مالكه.

import { useTasksStore } from '../store/tasksStore';
import { useAuthStore } from '../store/authStore';
import { tasksService } from '../services/tasksService';
import { wsTaskService } from '../services/wsTaskService';
import { retryFirestoreWrite } from './retryFirestoreWrite';
import { showToast } from '../store/toastStore';

export async function applyWsTaskChangeAndSyncPersonal(task, wsId, changedFields) {
  await wsTaskService.update(wsId, task.id, changedFields);

  const user = useAuthStore.getState().user;
  if (task.workspaceId !== null || !user || task.ownerId !== user.uid) return;

  const uid = user.uid;
  retryFirestoreWrite(
    async () => {
      const result = await tasksService.updateIfNotStale(uid, task.id, changedFields, task._syncTs);
      if (result.conflict) {
        useTasksStore.setState((state) => ({
          tasks: state.tasks.map((t) => (t.id === task.id ? { ...t, _conflictPending: true } : t)),
        }));
        showToast(`"${task.name}" was updated elsewhere — showing you the latest version`, 'error');
      } else {
        useTasksStore.setState((state) => ({
          tasks: state.tasks.some((t) => t.id === task.id)
            ? state.tasks.map((t) => (t.id === task.id ? { ...t, ...changedFields, _conflictPending: false } : t))
            : state.tasks,
        }));
      }
    },
    { onFinalFailure: () => showToast(`Couldn't save changes to "${task.name}" — check your connection and try again`, 'error') }
  );
}
