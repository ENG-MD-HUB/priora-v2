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
import { collection, getDocs } from 'firebase/firestore';
import { getUserScopedDb } from '../services/firebaseClient';
import { useWorkspacesStore } from '../store/workspacesStore';
import { useAuthStore } from '../store/authStore';
import { wsTaskService } from '../services/wsTaskService';
import { tasksService } from '../services/tasksService';

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

// ⚠️ إصلاح مؤقت بطلب عاجل — محدود بـ4 تاسكات معروفة بالاسم (من نتيجة التشخيص
// اللي راجعها المستخدم فعلياً)، مو مسح شامل جديد. يعيد فقط: sharedToWsIds
// (إضافة أي ورك سبيس فيه نسخة حقيقية لهذا التاسك — بدون حذف أي ورك سبيس موجود
// أصلاً بالمصفوفة)، وtimeline/lastUpdate (من أكمل نسخة ورك سبيس موجودة). لا يمس
// أي حقل ثاني (name, desc, folderId, involvedIds, إلخ) إطلاقاً.
//
// كتابة Firestore عبر tasksService.update (merge:true) — إضافة/تحديث حقول محددة
// بس، صفر استبدال كامل للمستند.
//
// الاستخدام (خطوتين إجباريتين، بالترتيب):
// 1. __priora_fixSharedTaskMismatches()        ← "تجربة جافة" فقط، يطبع
//    بالضبط وش رح يتغيّر بكل تاسك، بدون ما يكتب أي شي إطلاقاً.
// 2. __priora_fixSharedTaskMismatches(false)   ← يطبّق فعلياً، بعد ما تراجع
//    نتيجة الخطوة 1 وتتأكد إنها صح.
const KNOWN_MISMATCHED_TASK_IDS = ['mpza6bbez3wu', 'mpqvzjyyqaqx', 'mpqw3aggxgpc', 'mpstuyj07izf'];

export async function fixSharedTaskMismatches(dryRun = true) {
  const { tasks } = useTasksStore.getState();
  const { workspaces } = useWorkspacesStore.getState();
  const uid = useAuthStore.getState().user?.uid;

  for (const taskId of KNOWN_MISMATCHED_TASK_IDS) {
    const personalTask = tasks.find((t) => t.id === taskId);
    if (!personalTask) {
      console.warn(`[Priora] ${taskId} مو موجود شخصياً — تجاهلته.`);
      continue;
    }

    let bestWsCopy = null;
    const foundInWsIds = [];

    for (const ws of workspaces) {
      let wsTasksList;
      try {
        wsTasksList = await wsTaskService.getAll(ws.id);
      } catch {
        continue;
      }
      const wsTask = wsTasksList.find((t) => t.id === taskId && t.workspaceId === null);
      if (!wsTask) continue;
      foundInWsIds.push(ws.id);
      if (!bestWsCopy || (wsTask.timeline?.length ?? 0) > (bestWsCopy.timeline?.length ?? 0)) {
        bestWsCopy = wsTask;
      }
    }

    if (!bestWsCopy) {
      console.warn(`[Priora] ${taskId} مو موجود بأي ورك سبيس — تجاهلته.`);
      continue;
    }

    const newSharedToWsIds = [...new Set([...(personalTask.sharedToWsIds ?? []), ...foundInWsIds])];
    const changes = { sharedToWsIds: newSharedToWsIds, timeline: bestWsCopy.timeline, lastUpdate: bestWsCopy.lastUpdate };

    console.log(`[Priora] ${dryRun ? '🔎 تجربة جافة (بدون كتابة) —' : '✍️ يُطبَّق الآن —'} "${personalTask.name}" (${taskId})`);
    console.log('  قبل:', { sharedToWsIds: personalTask.sharedToWsIds, timelineCount: personalTask.timeline?.length, lastUpdate: personalTask.lastUpdate });
    console.log('  بعد:', { sharedToWsIds: newSharedToWsIds, timelineCount: bestWsCopy.timeline?.length, lastUpdate: bestWsCopy.lastUpdate });

    if (!dryRun && uid) {
      useTasksStore.setState((state) => ({
        tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, ...changes } : t)),
      }));
      await tasksService.update(uid, taskId, changes);
    }
  }

  console.log(
    dryRun
      ? '[Priora] ✅ انتهت التجربة الجافة — ما انكتب أي شي. راجع النتايج فوق، ولو تمام نفّذ: __priora_fixSharedTaskMismatches(false)'
      : '[Priora] ✅ التعديلات انكتبت فعلياً.'
  );
}

if (typeof window !== 'undefined') {
  window.__priora_fixSharedTaskMismatches = fixSharedTaskMismatches;
}

// ⚠️ أداة تشخيصية إضافية بطلب عاجل — تفحص Firestore مباشرة (قراءة فقط، صفر
// كتابة) لتاسك معيّن بالاسم (أو جزء منه)، بدون الحاجة تتنقل بواجهة Firebase
// Console يدوياً. تعرض بالضبط هل التاسك موجود بـtasks (نشط) و/أو trash
// (محذوف) بهذي اللحظة، بكل تفاصيله التقنية (_syncTs، _deletedAt، إلخ).
//
// الاستخدام: __priora_checkTask("جزء من اسم التاسك")
export async function checkTask(nameSubstring) {
  const uid = useAuthStore.getState().user?.uid;
  if (!uid) {
    console.warn('[Priora] ما فيه مستخدم مسجّل دخول.');
    return;
  }

  const db = await getUserScopedDb();
  const q = nameSubstring.trim().toLowerCase();

  const [tasksSnap, trashSnap] = await Promise.all([
    getDocs(collection(db, 'users', uid, 'tasks')),
    getDocs(collection(db, 'users', uid, 'trash')),
  ]);

  const matchingTasks = tasksSnap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((t) => (t.name ?? '').toLowerCase().includes(q));
  const matchingTrash = trashSnap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((t) => (t.name ?? '').toLowerCase().includes(q));

  console.log(`[Priora] موجود بـ"tasks" (نشط) — ${matchingTasks.length} نتيجة:`);
  console.table(matchingTasks.map((t) => ({ id: t.id, name: t.name, status: t.status, lastUpdate: t.lastUpdate, _syncTs: t._syncTs, folderId: t.folderId })));

  console.log(`[Priora] موجود بـ"trash" (محذوف) — ${matchingTrash.length} نتيجة:`);
  console.table(matchingTrash.map((t) => ({ id: t.id, name: t.name, _deletedAt: t._deletedAt, folderId: t.folderId })));

  if (matchingTasks.length > 0 && matchingTrash.length > 0) {
    const overlap = matchingTasks.filter((t) => matchingTrash.some((tr) => tr.id === t.id));
    if (overlap.length > 0) {
      console.warn(`[Priora] ⚠️ ${overlap.length} تاسك موجود بالمكانين بنفس اللحظة (zombie حقيقي بـFirestore الآن) — id: ${overlap.map((t) => t.id).join(', ')}`);
    }
  }

  return { matchingTasks, matchingTrash };
}

if (typeof window !== 'undefined') {
  window.__priora_checkTask = checkTask;
}

// ⚠️ أداة تشخيصية إضافية — تعرض بالضبط وش موجود بذاكرة التطبيق المحلية
// (Zustand، بالـRAM، مو localStorage ولا Firestore) هالثانية بالذات. هذا هو
// المصدر اللي تُبنى منه الواجهة فعلياً (كل شاشة، كل قائمة).
export function debugLocalTasks(statusFilter) {
  const tasks = useTasksStore.getState().tasks;
  const filtered = statusFilter ? tasks.filter((t) => t.status === statusFilter) : tasks;
  console.log(`[Priora] عدد التاسكات بالذاكرة المحلية الآن: ${tasks.length}${statusFilter ? ` (فلترة: ${statusFilter}) — ${filtered.length}` : ''}`);
  console.table(filtered.map((t) => ({ id: t.id, name: t.name, status: t.status, folderId: t.folderId, lastUpdate: t.lastUpdate, _syncTs: t._syncTs })));
  return filtered;
}

if (typeof window !== 'undefined') {
  window.__priora_debugLocalTasks = debugLocalTasks;
}
