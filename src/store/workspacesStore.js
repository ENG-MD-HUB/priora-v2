// workspacesStore.js
// مخزن قائمة الورك سبيسات (Zustand) — نسخة مُعاد كتابتها بوضوح من المتغير `G` بالكود الأصلي.
//
// ملاحظة مهمة: بدون `persist` — هذا مقصود بالأصل، يعني قائمة الورك سبيسات لا تُحفظ بـ
// localStorage. مصدر الحقيقة الوحيد هو Firestore (عن طريق workspaceService.getUserWorkspaces
// اللي تُستدعى بعد كل تسجيل دخول، انظر قسم Auth — دالة qt بالكود الأصلي).

import { create } from 'zustand';

export const useWorkspacesStore = create((set) => ({
  workspaces: [],

  /**
   * يضيف ورك سبيس للقائمة، إلا إذا كان موجوداً بالفعل (بمطابقة id) — لا تكرار.
   */
  addWorkspace: (ws) =>
    set((state) => ({
      workspaces: state.workspaces.some((w) => w.id === ws.id)
        ? state.workspaces
        : [...state.workspaces, ws],
    })),

  updateWorkspace: (wsId, partialData) =>
    set((state) => ({
      workspaces: state.workspaces.map((w) => (w.id === wsId ? { ...w, ...partialData } : w)),
    })),

  removeWorkspace: (wsId) =>
    set((state) => ({
      workspaces: state.workspaces.filter((w) => w.id !== wsId),
    })),
}));
