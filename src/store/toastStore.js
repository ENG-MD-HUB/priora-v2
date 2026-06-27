// toastStore.js
// مخزن التنبيهات المؤقتة (Toasts) — نسخة مُعاد كتابتها بوضوح من المتغير `Oe` والدالة `Z`
// بالكود الأصلي.
//
// ملاحظة نطاق: هذا نظام التنبيهات بأكمله (تُستخدم بأماكن كثيرة بالتطبيق، مش فقط Auth).
// أعدنا كتابته هنا لأن شاشة تسجيل الدخول (LoginScreen) تعتمد عليه مباشرة، وما نقدر
// نأجله بالكامل لقسم لاحق بدون كسر هذا القسم. لو احتجنا توسيعه مستقبلاً (قسم Notifications)،
// هذا الملف هو نفسه يُستخدم بدون تعديل.

import { create } from 'zustand';

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export const useToastStore = create((set) => ({
  toasts: [],

  push: (msg, type = 'info') => {
    const id = generateId();
    set((state) => ({ toasts: [...state.toasts, { id, msg, type }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 3000);
  },

  remove: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

/**
 * اختصار عام لإظهار تنبيه من أي مكان بالتطبيق بدون الحاجة لاستدعاء useToastStore مباشرة.
 * نسخة من: Z()
 */
export function showToast(msg, type = 'info') {
  useToastStore.getState().push(msg, type);
}
