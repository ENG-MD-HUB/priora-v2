// tasksStore.js
// مخزن التاسكات الشخصية + سلة المهملات (Zustand + persist) — نسخة مُعاد كتابتها بوضوح
// من المتغير `W` بالكود الأصلي.
//
// ملاحظة معمارية مهمة محفوظة من الأصل: التاسكات وسلة المهملات يعيشون بنفس المخزن
// (وليس مخزنين منفصلين) — الحذف ينقل التاسك من tasks إلى trash بنفس الستور، والاستعادة
// تعكس هذا. هذا قرار تصميمي أصلي، تم الحفاظ عليه هنا بدون "تحسينه" لمخزنين منفصلين.
//
// نمط المزامنة (محفوظ بدقة من الأصل):
// - كل عملية تُحدّث الحالة المحلية فوراً أولاً.
// - المزامنة مع Firestore الشخصي (tasksService) تحصل فقط لو workspaceId === null
//   (يعني التاسك "شخصي بحت"، مش تاسك ورك سبيس).
// - أي تاسك مشترك (sharedToWsIds.length > 0) يُزامَن بالتوازي مع wsTaskService —
//   لكن بحقول مختلفة حسب العملية (شرح أدق بكل دالة بالأسفل).
// - فشل أي مزامنة Firestore يُسجَّل بـ console.error فقط، ولا يُلغي التحديث المحلي.

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useAuthStore } from './authStore';
import { useFoldersStore } from './foldersStore';
import { tasksService } from '../services/tasksService';
import { trashService } from '../services/trashService';
import { wsTaskService } from '../services/wsTaskService';
import { generateId } from '../utils/generateId';
import { getEffectiveToday } from '../utils/taskDateLogic';
import { buildStorageKey } from '../utils/anonUserTracking';
import { TRASH_EXPIRY_MS } from '../utils/trashConstants';
import { retryFirestoreWrite } from '../utils/retryFirestoreWrite';
import { showToast } from './toastStore';

// علم اختباري فقط (مو موجود بالكود الأصلي) — نفس النمط المتبع بقسمي Workspaces
// و Contacts لتفادي تعليق الاتصال الحقيقي بـ Firestore وقت الاختبار بمفاتيح فاضية.
let _disableFirestoreSyncForTesting = false;
export function setDisableFirestoreSyncForTesting(value) {
  _disableFirestoreSyncForTesting = value;
}

// الحقول اللي تُنشر (propagate) لتاسكات الورك سبيس عند تحديث تاسك مشترك — محفوظة
// بدقة من الأصل. ملاحظة: sharedToWsIds نفسها ليست بالقائمة (لتفادي تكرار/تشابك المشاركة).
const SHARED_UPDATE_FIELDS = ['status', 'lastUpdate', 'nextFollowup', 'priority', 'name', 'desc', 'folderId'];

export const useTasksStore = create(
  persist(
    (set, get) => ({
      tasks: [],
      trash: [],

      addTask: (data) => {
        const newTask = {
          id: generateId(),
          createdAt: data.createdAt ?? new Date().toISOString(),
          timeline: [],
          ownerId: useAuthStore.getState().user?.uid ?? 'unknown',
          lastUpdate: data.lastUpdate ?? getEffectiveToday(),
          involvedIds: [],
          sharedToWsIds: [],
          workspaceId: null,
          ...data,
        };

        set((state) => ({ tasks: [newTask, ...state.tasks] }));

        const uid = useAuthStore.getState().user?.uid;
        if (uid && newTask.workspaceId === null && !_disableFirestoreSyncForTesting) {
          tasksService.save(uid, newTask).catch(console.error);
        }

        return newTask;
      },

      /**
       * تعديل تاسك. لو التاسك شخصي (workspaceId === null)، الحقول المتغيّرة فقط
       * (partialData) تُحدَّث بـFirestore — مو المستند كامل. بالتوازي، لو التاسك
       * مشترك مع ورك سبيس واحد أو أكثر، فقط الحقول الموجودة فعلياً بـpartialData
       * (من SHARED_UPDATE_FIELDS) تُنشر لكل ورك سبيس مشترك معه.
       *
       * ⚠️ تصحيح خلل حقيقي (بعد حادثة فقدان بيانات فعلية): كانت تحفظ المستند
       * الشخصي كامل (tasksService.save) — لو جهاز/جلسة عندها نسخة محلية قديمة
       * من هذا التاسك (حتى قبل مدة، من كاش متصفح لم يتزامن)، وسوت أي تعديل بسيط
       * (حالة، تاريخ)، كانت الكتابة الكاملة تمسح أي حقل تغيّر بمكان ثاني بينهما
       * (زي تحديثات timeline أُضيفت من جهاز آخر) — بصمت تام، بدون أي خطأ. الحل:
       * تحديث جزئي فقط (tasksService.update) — نفس المبدأ المطبَّق أصلاً بالورك
       * سبيس (wsTaskService.update)، الآن للتاسكات الشخصية أيضاً.
       */
      updateTask: (id, partialData) => {
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...partialData } : t)),
        }));

        const uid = useAuthStore.getState().user?.uid;
        if (!uid) return;

        const original = get().tasks.find((t) => t.id === id);
        if (!original) return;

        if (original.workspaceId === null && !_disableFirestoreSyncForTesting) {
          // ⚠️ تصحيح خلل حقيقي (بعد بلاغ فعلي: نقل تاسك لفولدر آخر يرجع لـGeneral
          // بعد مسح كاش): نفس فئة خلل الفولدرات بالضبط — كتابة fire-and-forget
          // بدون إعادة محاولة. فشل شبكي لحظي وقت النقل يخلي التغيير "زومبي" محلياً
          // بس، ويرجع الأصل يظهر بأي مزامنة كاملة لاحقة. الآن 3 محاولات + تحذير.
          //
          // ⚠️ إضافة جديدة بطلب صريح ("آلية آمنة" بعد حادثة الجوال بكود قديم):
          // قبل الكتابة، نقارن _syncTs الحالي بالسيرفر (تاريخ+وقت بدقة الثانية،
          // مو lastUpdate اليومي) مع آخر نسخة كان هذا الجهاز يعرفها. لو السيرفر
          // عنده تحديث أحدث ما وصل لهذا الجهاز بعد، نرفض الكتابة (بدل ما تمسحه)،
          // ونعلّم التاسك محلياً بدل ما نكتب — الاستماع اللحظي هيجيب النسخة
          // الصحيحة تلقائياً خلال ثواني.
          retryFirestoreWrite(
            async () => {
              const result = await tasksService.updateIfNotStale(uid, id, partialData, original._syncTs);
              if (result.conflict) {
                // ⚠️ إضافة بطلب صريح: بدل تنبيه عابر بس، نعلّم التاسك محلياً
                // "عالق" (نقطة برتقالية وامضة + تاريخ آخر تحديث برتقالي) — يبقى
                // واضح بالواجهة لحد ما يُحل، مو بس لحظة الحفظ. الكتابة المتعارضة
                // نفسها ما تُرسَل لـFirestore إطلاقاً (راجع updateIfNotStale) —
                // فلا شي يُمسح أو ينكسر بالسيرفر.
                set((state) => ({ tasks: state.tasks.map((t) => (t.id === id ? { ...t, _conflictPending: true } : t)) }));
              } else {
                set((state) => ({ tasks: state.tasks.map((t) => (t.id === id ? { ...t, _conflictPending: false } : t)) }));
              }
            },
            { onFinalFailure: () => showToast(`Couldn't save changes to "${original.name}" — check your connection and try again`, 'error') }
          );
        }

        if ((original.sharedToWsIds ?? []).length > 0 && !_disableFirestoreSyncForTesting) {
          const sharedFields = Object.fromEntries(
            SHARED_UPDATE_FIELDS.filter((k) => partialData[k] !== undefined).map((k) => [k, partialData[k]])
          );
          if (Object.keys(sharedFields).length) {
            (original.sharedToWsIds ?? []).forEach((wsId) =>
              wsTaskService.update(wsId, id, sharedFields).catch(console.error)
            );
          }
        }
      },

      /**
       * حذف تاسك (نقل لسلة المهملات، وليس حذف نهائي). يضيف _deletedAt للتاسك.
       */
      deleteTask: (id) => {
        const original = get().tasks.find((t) => t.id === id);
        if (!original) return;

        const trashedTask = { ...original, _deletedAt: new Date().toISOString() };

        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
          trash: [trashedTask, ...state.trash],
        }));

        const uid = useAuthStore.getState().user?.uid;
        if (uid && original.workspaceId === null && !_disableFirestoreSyncForTesting) {
          // ⚠️ تصحيح خلل حقيقي (بعد بلاغ فعلي: تاسك محذوف من "المكتملة" رجع
          // يظهر بعد مسح كاش) — نفس فئة خلل الفولدرات بالضبط. الآن 3 محاولات
          // + تحذير بدل فشل صامت.
          retryFirestoreWrite(() => tasksService.delete(uid, id), {
            onFinalFailure: () => showToast(`Couldn't fully delete "${original.name}" — check your connection and try again`, 'error'),
          });
          trashService.save(uid, trashedTask).catch(console.error);
        }

        if ((original.sharedToWsIds ?? []).length > 0 && !_disableFirestoreSyncForTesting) {
          (original.sharedToWsIds ?? []).forEach((wsId) => wsTaskService.delete(wsId, id).catch(console.error));
        }
      },

      /**
       * استعادة تاسك من سلة المهملات: يشيل _deletedAt، يرجّع status لـ active.
       *
       * ⚠️ سلوك جديد بطلب صريح (غير موجود بالكود الأصلي): استعادة "ذكية" — لو
       * المجلد اللي يتبع له هذا التاسك (folderId) كان محذوفاً هو نفسه (Soft Delete)،
       * يُسترجَع المجلد تلقائياً مع التاسك، عشان ما يرجع التاسك "معلّق" بمجلد غير
       * موجود. هذا لا يؤثر على تاسكات أخرى بنفس المجلد المحذوف — كل تاسك يرجع
       * مجلده لحاله وقت استعادته فقط.
       */
      restoreTask: (id) => {
        const trashedTask = get().trash.find((t) => t.id === id);
        if (!trashedTask) return;

        const { _deletedAt, ...rest } = trashedTask;
        const restoredTask = { ...rest, status: 'active', _deletedAt: undefined };

        set((state) => ({
          trash: state.trash.filter((t) => t.id !== id),
          tasks: [restoredTask, ...state.tasks],
        }));

        const uid = useAuthStore.getState().user?.uid;
        if (uid && restoredTask.workspaceId === null && !_disableFirestoreSyncForTesting) {
          retryFirestoreWrite(() => tasksService.save(uid, restoredTask), {
            onFinalFailure: () => showToast(`Couldn't restore "${restoredTask.name}" — check your connection and try again`, 'error'),
          });
          retryFirestoreWrite(() => trashService.delete(uid, id));
        }

        if (restoredTask.folderId) {
          const folderStillExists = useFoldersStore.getState().folders.some((f) => f.id === restoredTask.folderId);
          const folderIsSoftDeleted = useFoldersStore.getState().deletedFolders.some((f) => f.id === restoredTask.folderId);
          if (!folderStillExists && folderIsSoftDeleted) {
            useFoldersStore.getState().restoreFolder(restoredTask.folderId);
          }
        }
      },

      /**
       * حذف نهائي من سلة المهملات (بدون إمكانية استعادة).
       */
      permDeleteTask: (id) => {
        set((state) => ({ trash: state.trash.filter((t) => t.id !== id) }));

        const uid = useAuthStore.getState().user?.uid;
        if (uid && !_disableFirestoreSyncForTesting) {
          retryFirestoreWrite(() => trashService.delete(uid, id), {
            onFinalFailure: () => showToast(`Couldn't permanently delete the task — check your connection and try again`, 'error'),
          });
        }
      },

      /**
       * يحذف من سلة المهملات أي عنصر حُذف منذ TRASH_EXPIRY_MS أو أكثر (انتهت صلاحيته).
       * ⚠️ تصحيح خلل حقيقي (السابق): كانت هذي الدالة تستخدم قيمة ثابتة منفصلة
       * (86400000 = 24 ساعة) بدل استيراد TRASH_EXPIRY_MS المشترك — يعني تعديل مدة
       * سلة المهملات لشهرين سابقاً لم يكن يُطبَّق فعلياً هنا. تم ربطها بالثابت الصحيح.
       *
       * ⚠️ تصحيح خلل حقيقي (جديد): هذي الدالة كانت تحذف العناصر المنتهية من الحالة
       * المحلية فقط (set محلي) — بدون استدعاء trashService.delete() على Firestore.
       * يعني العنصر يختفي من هذا الجهاز فقط، ويبقى "زومبي" بمستند Firestore للأبد.
       * أي جلب لاحق كامل من Firestore (تسجيل دخول جديد على جهاز آخر، أو الاستماع
       * اللحظي الجديد onTrash) يرجّعه للظهور من جديد — وهذا بالضبط سبب "عودة ملفات
       * محذوفة سابقاً". الحل: نحذفه من Firestore أولاً (لكل عنصر منتهي)، بالتوازي
       * مع تحديث الحالة المحلية — نفس نمط باقي دوال الحذف بهذا الملف بالضبط.
       */
      expireTrash: () => {
        const uid = useAuthStore.getState().user?.uid;
        const expired = get().trash.filter(
          (t) => t._deletedAt && Date.now() - new Date(t._deletedAt).getTime() >= TRASH_EXPIRY_MS
        );

        set((state) => ({
          trash: state.trash.filter((t) => !t._deletedAt || Date.now() - new Date(t._deletedAt).getTime() < TRASH_EXPIRY_MS),
        }));

        if (uid && !_disableFirestoreSyncForTesting) {
          expired.forEach((t) => trashService.delete(uid, t.id).catch(console.error));
        }
      },

      /**
       * يشارك تاسك شخصي مع ورك سبيس.
       *
       * ⚠️ تصحيح خلل حقيقي (بعد بلاغ فعلي: علامة "مشترك" تختفي بعد الخروج من
       * التاسك والرجوع له): كانت هذي الدالة تحفظ sharedToWsIds بالحالة المحلية
       * فقط + نسخة الورك سبيس الجديدة — **بدون أي كتابة لمستند التاسك الشخصي
       * بـFirestore نفسه!** يعني أي مزامنة لاحقة (تنقّل بالتطبيق، استماع لحظي،
       * إعادة تحميل) كانت تجيب النسخة القديمة (قبل المشاركة) من Firestore وتمسح
       * علامة "مشترك" المحلية المؤقتة. الحل: نكتب sharedToWsIds فعلياً للمستند
       * الشخصي (تحديث جزئي، بإعادة محاولة لضمان عدم فشلها بصمت).
       */
      shareTaskToWs: (taskId, wsId) => {
        const before = get().tasks.find((t) => t.id === taskId);

        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId ? { ...t, sharedToWsIds: [...new Set([...(t.sharedToWsIds ?? []), wsId])] } : t
          ),
        }));

        const updated = get().tasks.find((t) => t.id === taskId);
        if (!updated || _disableFirestoreSyncForTesting) return;

        wsTaskService.save(wsId, updated).catch(console.error);

        const uid = useAuthStore.getState().user?.uid;
        if (uid && updated.workspaceId === null) {
          // ⚠️ إضافة جديدة بطلب صريح ("آلية آمنة" بعد حادثة الجوال بكود قديم) —
          // راجع الشرح المفصّل بـupdateTask أعلى بهذا الملف، نفس المبدأ بالضبط.
          retryFirestoreWrite(
            async () => {
              const result = await tasksService.updateIfNotStale(uid, taskId, { sharedToWsIds: updated.sharedToWsIds }, before?._syncTs);
              if (result.conflict) {
                set((state) => ({ tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, _conflictPending: true } : t)) }));
              } else {
                set((state) => ({ tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, _conflictPending: false } : t)) }));
              }
            },
            { onFinalFailure: () => showToast(`Couldn't save the share status for "${updated.name}" — check your connection and try again`, 'error') }
          );
        }
      },

      // ⚠️ نفس تصحيح shareTaskToWs بالضبط — نفس الخلل، بس بالاتجاه المعاكس
      // (إلغاء مشاركة). كانت ما تحفظ sharedToWsIds المُحدَّث بالمستند الشخصي.
      unshareTaskFromWs: (taskId, wsId) => {
        const before = get().tasks.find((t) => t.id === taskId);

        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId ? { ...t, sharedToWsIds: (t.sharedToWsIds ?? []).filter((id) => id !== wsId) } : t
          ),
        }));

        if (_disableFirestoreSyncForTesting) return;

        wsTaskService.delete(wsId, taskId).catch(console.error);

        const updated = get().tasks.find((t) => t.id === taskId);
        const uid = useAuthStore.getState().user?.uid;
        if (updated && uid && updated.workspaceId === null) {
          retryFirestoreWrite(
            async () => {
              const result = await tasksService.updateIfNotStale(uid, taskId, { sharedToWsIds: updated.sharedToWsIds }, before?._syncTs);
              if (result.conflict) {
                set((state) => ({ tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, _conflictPending: true } : t)) }));
              } else {
                set((state) => ({ tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, _conflictPending: false } : t)) }));
              }
            },
            { onFinalFailure: () => showToast(`Couldn't update the share status for "${updated.name}" — check your connection and try again`, 'error') }
          );
        }
      },

      /**
       * يضيف ملاحظة (timeline entry) لتاسك. lastUpdate يُعاد حسابه دائماً كأقصى تاريخ
       * بين كل عناصر التايملاين (بما فيها العنصر الجديد) والتاريخ المُمرَّر مباشرة.
       *
       * ⚠️ تصحيح خلل حقيقي (بعد حادثة فقدان بيانات فعلية): كانت المزامنة (شخصي
       * وورك سبيس معاً) تحفظ التاسك كامل — نفس فئة الخلل الموضحة أعلى updateTask
       * بالضبط. الآن تحديث جزئي فقط لحقلي timeline وlastUpdate، بغض النظر شخصي
       * أو مشترك، فما يقدر يمسح أي حقل ثاني تغيّر بمكان آخر بينهما.
       */
      addTimelineEntry: (taskId, text, date, authorId, authorName, authorAvatar) => {
        const entry = {
          id: generateId(),
          text,
          date,
          ts: new Date().toISOString(),
          authorId,
          authorName,
          authorAvatar: authorAvatar ?? null,
        };

        set((state) => ({
          tasks: state.tasks.map((t) => {
            if (t.id !== taskId) return t;
            const newTimeline = [entry, ...t.timeline];
            return {
              ...t,
              timeline: newTimeline,
              lastUpdate: newTimeline.reduce((max, e) => (e.date > max ? e.date : max), date),
            };
          }),
        }));

        const uid = useAuthStore.getState().user?.uid;
        if (!uid || _disableFirestoreSyncForTesting) return;

        const updated = get().tasks.find((t) => t.id === taskId);
        if (!updated || updated.workspaceId !== null) return;

        const partialUpdate = { timeline: updated.timeline, lastUpdate: updated.lastUpdate };
        retryFirestoreWrite(() => tasksService.update(uid, taskId, partialUpdate), {
          onFinalFailure: () => showToast(`Couldn't save the update to "${updated.name}" — check your connection and try again`, 'error'),
        });
        (updated.sharedToWsIds ?? []).forEach((wsId) =>
          wsTaskService.update(wsId, taskId, partialUpdate).catch(console.error)
        );
      },

      // ⚠️ نفس تصحيح addTimelineEntry بالضبط — تحديث جزئي (timeline + lastUpdate)
      // بدل حفظ كامل، للسبب نفسه.
      updateTimelineEntry: (taskId, entryId, newText, newDate) => {
        set((state) => ({
          tasks: state.tasks.map((t) => {
            if (t.id !== taskId) return t;
            const newTimeline = t.timeline.map((e) => (e.id === entryId ? { ...e, text: newText, date: newDate } : e));
            const maxDate = newTimeline.reduce((max, e) => (e.date > max ? e.date : max), '');
            return { ...t, timeline: newTimeline, lastUpdate: maxDate || t.lastUpdate };
          }),
        }));

        const uid = useAuthStore.getState().user?.uid;
        if (!uid || _disableFirestoreSyncForTesting) return;

        const task = get().tasks.find((t) => t.id === taskId);
        if (!task || task.workspaceId !== null) return;

        const partialUpdate = { timeline: task.timeline, lastUpdate: task.lastUpdate };
        retryFirestoreWrite(() => tasksService.update(uid, taskId, partialUpdate), {
          onFinalFailure: () => showToast(`Couldn't save the correction to "${task.name}" — check your connection and try again`, 'error'),
        });
        (task.sharedToWsIds ?? []).forEach((wsId) =>
          wsTaskService.update(wsId, taskId, partialUpdate).catch(console.error)
        );
      },

      // ⚠️ نفس تصحيح addTimelineEntry بالضبط — تحديث جزئي (timeline فقط) بدل حفظ كامل.
      deleteTimelineEntry: (taskId, entryId) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId ? { ...t, timeline: t.timeline.filter((e) => e.id !== entryId) } : t
          ),
        }));

        const uid = useAuthStore.getState().user?.uid;
        if (!uid || _disableFirestoreSyncForTesting) return;

        const task = get().tasks.find((t) => t.id === taskId);
        if (!task || task.workspaceId !== null) return;

        const partialUpdate = { timeline: task.timeline };
        retryFirestoreWrite(() => tasksService.update(uid, taskId, partialUpdate), {
          onFinalFailure: () => showToast(`Couldn't delete the note on "${task.name}" — check your connection and try again`, 'error'),
        });
        (task.sharedToWsIds ?? []).forEach((wsId) =>
          wsTaskService.update(wsId, taskId, partialUpdate).catch(console.error)
        );
      },
    }),
    {
      name: buildStorageKey('tasks'),
      storage: createJSONStorage(() => localStorage),
    }
  )
);
