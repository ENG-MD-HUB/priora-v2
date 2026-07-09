// diagnoseSharedTasks.js
// ⚠️ أداة تشخيصية مؤقتة بطلب عاجل (بعد حادثة استرجاع بيانات) — تقرأ بس، ما تكتب
// ولا تغيّر أي شي بـFirestore أو الحالة المحلية إطلاقاً. الهدف: نعرف بالضبط أي
// تاسكات "شخصية" (مستعادة من Trash) صارت غير متطابقة مع نسختها بالورك سبيس
// (فقدت علامة "مشترك"، أو تحديثات أحدث بالورك سبيس ما انعكست بالنسخة الشخصية)،
// عشان نراجعها سوا قبل أي إصلاح كتابي.
//
// طريقة الاستخدام: افتح Developer Console (F12) بعد ما يفتح التطبيق بالمتصفح،
// واكتب: __priora_diagnoseSharedTasks()
// النتيجة تطلع كجدول (console.table) — كل صف = تاسك فيه اختلاف يستاهل مراجعة.

import { useTasksStore } from '../store/tasksStore';
import { useWorkspacesStore } from '../store/workspacesStore';
import { wsTaskService } from '../services/wsTaskService';

export async function diagnoseSharedTasks() {
  const { tasks } = useTasksStore.getState();
  const { workspaces } = useWorkspacesStore.getState();

  if (workspaces.length === 0) {
    console.log('[Priora] No workspaces to check.');
    return [];
  }

  const report = [];

  for (const ws of workspaces) {
    let wsTasks;
    try {
      wsTasks = await wsTaskService.getAll(ws.id);
    } catch (err) {
      console.warn(`[Priora] Couldn't read workspace "${ws.name}":`, err);
      continue;
    }

    for (const wsTask of wsTasks) {
      // تاسكات أنشئت مباشرة بالورك سبيس (workspaceId !== null) مالها "مصدر شخصي" أصلاً — نتجاهلها.
      if (wsTask.workspaceId !== null) continue;

      const personalTask = tasks.find((t) => t.id === wsTask.id);

      if (!personalTask) {
        report.push({
          taskId: wsTask.id,
          name: wsTask.name,
          workspace: ws.name,
          issue: 'موجود بالورك سبيس بس مفقود كلياً من التاسكات الشخصية',
        });
        continue;
      }

      const missingSharedFlag = !(personalTask.sharedToWsIds ?? []).includes(ws.id);
      const personalTimelineCount = personalTask.timeline?.length ?? 0;
      const wsTimelineCount = wsTask.timeline?.length ?? 0;
      const timelineBehind = personalTimelineCount < wsTimelineCount;
      const lastUpdateBehind = (personalTask.lastUpdate ?? '') < (wsTask.lastUpdate ?? '');

      if (missingSharedFlag || timelineBehind || lastUpdateBehind) {
        report.push({
          taskId: wsTask.id,
          name: wsTask.name,
          workspace: ws.name,
          'علامة مشترك مفقودة شخصياً؟': missingSharedFlag ? 'نعم' : '—',
          'ملاحظات شخصي/ورك سبيس': `${personalTimelineCount} / ${wsTimelineCount}`,
          'آخر تحديث شخصي': personalTask.lastUpdate ?? '—',
          'آخر تحديث ورك سبيس': wsTask.lastUpdate ?? '—',
        });
      }
    }
  }

  console.log(`[Priora] فحص ${workspaces.length} ورك سبيس — ${report.length} تاسك فيه اختلاف يستاهل مراجعة:`);
  console.table(report);
  return report;
}

if (typeof window !== 'undefined') {
  window.__priora_diagnoseSharedTasks = diagnoseSharedTasks;
}
