// authStore.js
// مخزن حالة المصادقة (Zustand) — نسخة مُعاد كتابتها بوضوح من المتغير `V` بالكود الأصلي.
//
// ملاحظة: على عكس باقي المخازن (contacts, folders...) هذا المخزن بدون `persist` —
// لا يُحفظ بـ localStorage، لأن حالة تسجيل الدخول مصدرها الحقيقي هو Firebase Auth
// نفسه (عبر onAuthStateChanged)، فحفظه محلياً غير ضروري ومحفوظ كذا بالأصل.

import { create } from 'zustand';
import { setCurrentUserId } from '../utils/anonUserTracking';

export const useAuthStore = create((set) => ({
  user: null,

  setUser: (user) => {
    if (user) setCurrentUserId(user.uid);
    set({ user });
  },
}));
