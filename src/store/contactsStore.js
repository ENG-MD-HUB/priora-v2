// contactsStore.js
// مخزن جهات الاتصال (Zustand + persist) — نسخة مُعاد كتابتها بوضوح من المتغير `H`
// بالكود الأصلي.
//
// نمط مهم محفوظ من الأصل بدقة: "تحديث محلي فوري، ثم مزامنة Firestore بالخلفية":
// 1. كل عملية (إضافة/تعديل/حذف) تُحدّث الحالة المحلية فوراً (يعني الواجهة تستجيب
//    لحظياً، بدون انتظار الشبكة).
// 2. بعدها، وبشكل غير متزامن (fire-and-forget)، تُحفظ بـ Firestore عن طريق
//    contactsService — وأي فشل بهذي الخطوة يُسجَّل بـ console.error فقط
//    (catch(console.error))، ولا يُعرض للمستخدم ولا يُلغي التحديث المحلي.
//
// مفتاح localStorage يُبنى ديناميكياً عن طريق buildStorageKey (نفس انتظام
// anonUserTracking) — يعني المفتاح يتغيّر تلقائياً حسب المستخدم الحالي (anon أو uid حقيقي).

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useAuthStore } from './authStore';
import { contactsService } from '../services/contactsService';
import { generateId } from '../utils/generateId';
import { buildStorageKey } from '../utils/anonUserTracking';

// ⚠️ علم اختباري فقط (مو موجود بالكود الأصلي): يسمح لصفحة الاختبار (TestHarness)
// بتعطيل مزامنة Firestore الفعلية، لتفادي نفس مشكلة "التعليق" المكتشفة بقسم
// Workspaces (اتصال حقيقي بمفاتيح Firebase فاضية يتعلّق للأبد بدل أن يفشل بسرعة).
// القيمة الافتراضية false يعني الإنتاج يعمل بالسلوك الأصلي 100% بدون أي تغيير.
let _disableFirestoreSyncForTesting = false;
export function setDisableFirestoreSyncForTesting(value) {
  _disableFirestoreSyncForTesting = value;
}

export const useContactsStore = create(
  persist(
    (set, get) => ({
      contacts: [],

      addContact: (data) => {
        const newContact = {
          id: generateId(),
          createdAt: new Date().toISOString(),
          ownerId: useAuthStore.getState().user?.uid ?? '',
          ...data,
        };

        set((state) => ({ contacts: [...state.contacts, newContact] }));

        const uid = useAuthStore.getState().user?.uid;
        if (uid && !_disableFirestoreSyncForTesting) {
          contactsService.save(uid, newContact).catch(console.error);
        }

        return newContact;
      },

      updateContact: (id, partialData) => {
        set((state) => ({
          contacts: state.contacts.map((c) => (c.id === id ? { ...c, ...partialData } : c)),
        }));

        const uid = useAuthStore.getState().user?.uid;
        if (uid && !_disableFirestoreSyncForTesting) {
          const merged = get().contacts.find((c) => c.id === id);
          if (merged) contactsService.save(uid, merged).catch(console.error);
        }
      },

      deleteContact: (id) => {
        set((state) => ({ contacts: state.contacts.filter((c) => c.id !== id) }));

        const uid = useAuthStore.getState().user?.uid;
        if (uid && !_disableFirestoreSyncForTesting) {
          contactsService.delete(uid, id).catch(console.error);
        }
      },
    }),
    {
      name: buildStorageKey('contacts'),
      storage: createJSONStorage(() => localStorage),
    }
  )
);
