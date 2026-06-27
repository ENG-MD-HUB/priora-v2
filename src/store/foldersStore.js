// foldersStore.js
// مخزن المجلدات (Zustand + persist) — نسخة مُعاد كتابتها بوضوح من المتغير U بالكود الأصلي،
// مع إضافات جديدة بطلب صريح (موثّقة بوضوح أدناه، غير موجودة بالكود الأصلي):
//
// 1. مجلدات فرعية (parentId): مستوى واحد فقط — مجلد رئيسي (parentId: null) يقدر
//    يحتوي مجلدات فرعية، والمجلد الفرعي ما يقدر يحتوي مجلدات فرعية تحته.
// 2. حذف ناعم (Soft Delete): حذف مجلد (رئيسي أو فرعي) ينقله لقائمة deletedFolders
//    بدل حذفه نهائياً فوراً — قابل للاستعادة. حذف مجلد رئيسي يحذف فروعه معه بنفس
//    الطريقة (كل واحد يصير عنصر مستقل بـ deletedFolders، يحتفظ بـ parentId الأصلي
//    عشان نقدر نربطهم برجوع الهيكل صحيح عند الاستعادة).
// 3. عند حذف مجلد، كل تاسكاته (المباشرة فقط، وليس تاسكات الفروع تلقائياً من هنا —
//    ذلك يُدار من الطبقة الأعلى بـ App عند استدعاء عملية الحذف الكاملة) تنتقل لسلة
//    المهملات (وليس حذف نهائي) — قابلة للاستعادة بشكل عادي مثل أي تاسك آخر.
// 4. لون متكيّف (adaptiveColor): يُحفظ لون "أساسي" واحد فقط، ونحسب نسخة مناسبة لكل
//    وضع (داكن/نهاري) بدالة getAdaptiveFolderColor (بملف utils/folderColors.js).

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useAuthStore } from './authStore';
import { foldersService } from '../services/foldersService';
import { deletedFoldersService } from '../services/deletedFoldersService';
import { generateId } from '../utils/generateId';
import { buildStorageKey } from '../utils/anonUserTracking';
import { TRASH_EXPIRY_MS } from '../utils/trashConstants';

let _disableFirestoreSyncForTesting = false;
export function setDisableFirestoreSyncForTesting(value) {
  _disableFirestoreSyncForTesting = value;
}

export const useFoldersStore = create(
  persist(
    (set, get) => ({
      folders: [],
      deletedFolders: [],

      /**
       * @param {string} name
       * @param {string} ownerId
       * @param {string} color - اللون الأساسي (بدون أي تعديل/تخفيف يدوي)
       * @param {string|null} parentId - null لمجلد رئيسي، أو id مجلد رئيسي موجود لمجلد فرعي
       */
      addFolder: (name, ownerId, color = '#3b82f6', parentId = null) => {
        const newFolder = {
          id: generateId(),
          name,
          ownerId,
          color,
          parentId,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({ folders: [...state.folders, newFolder] }));

        const uid = useAuthStore.getState().user?.uid;
        if (uid && !_disableFirestoreSyncForTesting) {
          foldersService.save(uid, newFolder).catch(console.error);
        }

        return newFolder;
      },

      updateFolder: (id, partialData) => {
        set((state) => ({
          folders: state.folders.map((f) => (f.id === id ? { ...f, ...partialData } : f)),
        }));

        const uid = useAuthStore.getState().user?.uid;
        if (uid && !_disableFirestoreSyncForTesting) {
          const merged = get().folders.find((f) => f.id === id);
          if (merged) foldersService.save(uid, merged).catch(console.error);
        }
      },

      /**
       * ينقل تاسك لمجلد آخر (نقل بسيط لحقل folderId). لا تلمس Firestore الخاصة
       * بالمجلد نفسه — التاسك يُحدَّث عن طريق tasksStore.updateTask من الطبقة
       * الأعلى (هذا فقط مرجع مساعد يُستخدم بالواجهة، المنطق الفعلي بمكوّن منفصل
       * يستخدم useTasksStore مباشرة، راجع MoveTaskModal.jsx).
       */

      /**
       * يرجع true لو المجلد رئيسي (parentId === null)، false لو فرعي.
       */
      isRootFolder: (folderId) => {
        const folder = get().folders.find((f) => f.id === folderId) ?? get().deletedFolders.find((f) => f.id === folderId);
        return folder ? folder.parentId === null : false;
      },

      /**
       * يرجع كل المجلدات الفرعية التابعة لمجلد رئيسي معيّن.
       */
      getChildFolders: (parentId) => get().folders.filter((f) => f.parentId === parentId),

      /**
       * حذف ناعم (Soft Delete) لمجلد واحد فقط (بدون التعامل مع الفروع أو التاسكات —
       * هذا يُدار من الطبقة الأعلى، راجع deleteFolderWithCascade بنفس هذا الملف).
       * ينقل المجلد من folders إلى deletedFolders.
       */
      softDeleteFolder: (id) => {
        const folder = get().folders.find((f) => f.id === id);
        if (!folder) return;

        const deletedFolder = { ...folder, _deletedAt: new Date().toISOString() };

        set((state) => ({
          folders: state.folders.filter((f) => f.id !== id),
          deletedFolders: [...state.deletedFolders, deletedFolder],
        }));

        const uid = useAuthStore.getState().user?.uid;
        if (uid && !_disableFirestoreSyncForTesting) {
          foldersService.delete(uid, id).catch(console.error);
          deletedFoldersService.save(uid, deletedFolder).catch(console.error);
        }
      },

      /**
       * يسترجع مجلد محذوف واحد فقط (بدون لمس الفروع أو التاسكات — يُدار من الطبقة
       * الأعلى). يرجع المجلد المُسترجَع نفسه (أو undefined لو غير موجود).
       */
      restoreFolder: (id) => {
        const deletedFolder = get().deletedFolders.find((f) => f.id === id);
        if (!deletedFolder) return undefined;

        const { _deletedAt, ...restoredFolder } = deletedFolder;

        set((state) => ({
          deletedFolders: state.deletedFolders.filter((f) => f.id !== id),
          folders: [...state.folders, restoredFolder],
        }));

        const uid = useAuthStore.getState().user?.uid;
        if (uid && !_disableFirestoreSyncForTesting) {
          foldersService.save(uid, restoredFolder).catch(console.error);
          deletedFoldersService.delete(uid, id).catch(console.error);
        }

        return restoredFolder;
      },

      /**
       * حذف نهائي (بدون إمكانية استعادة) لمجلد من deletedFolders.
       */
      permDeleteFolder: (id) => {
        set((state) => ({ deletedFolders: state.deletedFolders.filter((f) => f.id !== id) }));

        const uid = useAuthStore.getState().user?.uid;
        if (uid && !_disableFirestoreSyncForTesting) {
          deletedFoldersService.delete(uid, id).catch(console.error);
        }
      },

      /**
       * ⚠️ الدالة المُستخدمة فعلياً من الواجهة لحذف مجلد (تُستبدل deleteFolder
       * القديمة). تتعامل مع الحالتين:
       * - مجلد فرعي: يُحذف هو فقط (Soft Delete).
       * - مجلد رئيسي له فروع: يُحذف هو وكل فروعه معاً (كل واحد Soft Delete مستقل).
       * ترجع قائمة كل id المجلدات المحذوفة (يستخدمها المستدعي لنقل تاسكاتها للمهملات).
       */
      deleteFolderWithCascade: (id) => {
        const allFolders = get().folders;
        const childFolders = allFolders.filter((f) => f.parentId === id);
        const idsToDelete = [id, ...childFolders.map((f) => f.id)];

        idsToDelete.forEach((folderId) => get().softDeleteFolder(folderId));

        return idsToDelete;
      },

      // محفوظة للتوافق الخلفي فقط — حذف نهائي مباشر بدون إمكانية استعادة. غير
      // مُستخدمة بالواجهة الحالية (استُبدلت بـ deleteFolderWithCascade)، لكن أُبقيت
      // متوفرة لأي استخدام مستقبلي يحتاج حذف فوري حقيقي.
      deleteFolder: (id) => {
        set((state) => ({ folders: state.folders.filter((f) => f.id !== id) }));

        const uid = useAuthStore.getState().user?.uid;
        if (uid && !_disableFirestoreSyncForTesting) {
          foldersService.delete(uid, id).catch(console.error);
        }
      },

      /**
       * يحذف نهائياً (بدون إمكانية استعادة) أي مجلد بـ deletedFolders تجاوز مدة
       * الاحتفاظ (نفس مدة سلة مهملات التاسكات — TRASH_EXPIRY_MS، حالياً شهرين).
       * يُستدعى بنفس توقيت expireTrash بـ tasksStore (راجع App.jsx).
       */
      expireDeletedFolders: () =>
        set((state) => ({
          deletedFolders: state.deletedFolders.filter(
            (f) => !f._deletedAt || Date.now() - new Date(f._deletedAt).getTime() < TRASH_EXPIRY_MS
          ),
        })),
    }),
    {
      name: buildStorageKey('folders'),
      storage: createJSONStorage(() => localStorage),
    }
  )
);
