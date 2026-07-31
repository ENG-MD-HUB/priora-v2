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
       * تعديل تاسك. لو التاسك شخصي (workspaceId === null)، يُحفظ كامل بالخدمة الشخصية.
       * بالتوازي، لو التاسك مشترك مع ورك سبيس واحد أو أكثر، فقط الحقول الموجودة فعلياً
       * بـ partialData (من SHARED_UPDATE_FIELDS) تُنشر لكل ورك سبيس مشترك معه.
       */
      updateTask: (id, partialData) => {
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...partialData } : t)),
        }));

        const uid = useAuthStore.getState().user?.uid;
        if (!uid) return;

        const original = get().tasks.find((t) => t.id === id);
        if (!original) return;
        const merged = { ...original, ...partialData };

        if (original.workspaceId === null && !_disableFirestoreSyncForTesting) {
          tasksService.save(uid, merged).catch(console.error);
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
          tasksService.delete(uid, id).catch(console.error);
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
          tasksService.save(uid, restoredTask).catch(console.error);
          trashService.delete(uid, id).catch(console.error);
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
          trashService.delete(uid, id).catch(console.error);
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

      shareTaskToWs: (taskId, wsId) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId ? { ...t, sharedToWsIds: [...new Set([...(t.sharedToWsIds ?? []), wsId])] } : t
          ),
        }));

        const updated = get().tasks.find((t) => t.id === taskId);
        if (updated && !_disableFirestoreSyncForTesting) {
          wsTaskService.save(wsId, updated).catch(console.error);
        }
      },

      unshareTaskFromWs: (taskId, wsId) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId ? { ...t, sharedToWsIds: (t.sharedToWsIds ?? []).filter((id) => id !== wsId) } : t
          ),
        }));

        if (!_disableFirestoreSyncForTesting) {
          wsTaskService.delete(wsId, taskId).catch(console.error);
        }
      },

      /**
       * يضيف ملاحظة (timeline entry) لتاسك. lastUpdate يُعاد حسابه دائماً كأقصى تاريخ
       * بين كل عناصر التايملاين (بما فيها العنصر الجديد) والتاريخ المُمرَّر مباشرة.
       *
       * فرق مهم عن updateTask: المزامنة مع الورك سبيس هنا تحفظ التاسك كامل
       * (wsTaskService.save) لا تنشر حقول جزئية فقط (wsTaskService.update).
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

        tasksService.save(uid, updated).catch(console.error);
        (updated.sharedToWsIds ?? []).forEach((wsId) => {
          const latest = get().tasks.find((t) => t.id === taskId);
          if (latest) wsTaskService.save(wsId, latest).catch(console.error);
        });
      },

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

        tasksService.save(uid, task).catch(console.error);
        (task.sharedToWsIds ?? []).forEach((wsId) => {
          const latest = get().tasks.find((t) => t.id === taskId);
          if (latest) wsTaskService.save(wsId, latest).catch(console.error);
        });
      },

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

        tasksService.save(uid, task).catch(console.error);
        (task.sharedToWsIds ?? []).forEach((wsId) => {
          const latest = get().tasks.find((t) => t.id === taskId);
          if (latest) wsTaskService.save(wsId, latest).catch(console.error);
        });
      },
    }),
    {
      name: buildStorageKey('tasks'),
      storage: createJSONStorage(() => localStorage),
    }
  )
);
