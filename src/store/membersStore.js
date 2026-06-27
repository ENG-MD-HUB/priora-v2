// membersStore.js
// مخزن أعضاء كل ورك سبيس (Zustand) — نسخة مُعاد كتابتها بوضوح من المتغير `le` بالكود الأصلي.
// الشكل: membersByWs هو object، المفتاح هو wsId، والقيمة مصفوفة أعضاء ذاك الورك سبيس.
//
// بدون persist (نفس ملاحظة workspacesStore) — يعتمد بالكامل على Firestore.

import { create } from 'zustand';

export const useMembersStore = create((set, get) => ({
  membersByWs: {},

  /**
   * يضيف/يحدّث عضو بورك سبيس معيّن. لو العضو موجود بالفعل (نفس uid)، يُستبدل بالنسخة
   * الجديدة (مش يتكرر) — هذا عن طريق فلترة العضو القديم قبل الإضافة.
   */
  addMember: (wsId, member) =>
    set((state) => ({
      membersByWs: {
        ...state.membersByWs,
        [wsId]: [
          ...(state.membersByWs[wsId] ?? []).filter((m) => m.uid !== member.uid),
          member,
        ],
      },
    })),

  removeMember: (wsId, memberUid) =>
    set((state) => ({
      membersByWs: {
        ...state.membersByWs,
        [wsId]: (state.membersByWs[wsId] ?? []).filter((m) => m.uid !== memberUid),
      },
    })),

  /**
   * قراءة مباشرة (sync) لقائمة أعضاء ورك سبيس معيّن من الحالة الحالية للمخزن.
   */
  getMembers: (wsId) => get().membersByWs[wsId] ?? [],
}));
