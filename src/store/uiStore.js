// uiStore.js
// مخزن حالة الواجهة العامة (Zustand + persist) — نسخة مُعاد كتابتها بوضوح من المتغير
// K بالكود الأصلي.
//
// ملاحظة معمارية مهمة محفوظة من الأصل: هذا المخزن يُحفظ بـ localStorage بمفتاح ثابت
// (priora_v2_ui)، وليس مفتاح مرتبط بالمستخدم (anon/uid) كباقي المخازن — يعني تفضيلات
// اللغة/المظهر/الترتيب تبقى محفوظة على مستوى المتصفح نفسه، بغض النظر عن من سجّل دخول.
//
// ملاحظة partialize مهمة: فقط lang, theme, sortConfig تُحفظ بـ localStorage فعلياً.
// sidebarOpen, activeView, searchQuery, filterStatus, syncStatus تُعاد لقيمتها
// الافتراضية بكل تحميل صفحة جديد (لا تُحفظ).
//
// ⚠️ تصحيح بطلب صريح: sidebarOpen كانت true ثابتة بالأصل (بدون فحص عرض الشاشة) —
// هذا لا يؤثر بالديسكتوب (قاعدة .app-sidebar.open غير موجودة أصلاً بقواعد الديسكتوب،
// فالقيمة بلا تأثير هناك)، لكنه يجعل السايد بار يبدأ "مفتوح" بصرياً بوضع الموبايل
// عند أول تحميل، بدل أن يبدأ مغلقاً كما يُتوقع منطقياً بمساحة شاشة صغيرة.

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { STORAGE_KEY_PREFIX } from '../utils/appConstants';

const MOBILE_BREAKPOINT_PX = 880; // يطابق @media (max-width: 880px) بملف real-styles.css

function getInitialSidebarOpen() {
  if (typeof window === 'undefined') return true;
  return window.innerWidth > MOBILE_BREAKPOINT_PX;
}

export const useUIStore = create(
  persist(
    (set) => ({
      lang: 'en',
      theme: 'dark',
      syncStatus: 'hidden',
      sidebarOpen: getInitialSidebarOpen(),
      activeView: 'dashboard',
      searchQuery: '',
      filterStatus: 'all',
      sortConfig: { field: 'lastUpdate', dir: 'desc' },
      // ⚠️ حالة جديدة بطلب صريح (غير موجودة بالأصل): نية انتقال مؤقتة — تُستخدم
      // لما يُضغَط على عنصر بقسم "Workspaces — needs attention" باللوحة الرئيسية،
      // عشان نخبر صفحة Workspaces "افتح هذا الورك سبيس، وبعدها افتح تفاصيل هذا
      // التاسك تلقائياً". لا تُحفظ بـlocalStorage (مؤقتة لجلسة واحدة فقط).
      pendingWorkspaceNavigation: null,

      setLang: (lang) => {
        set({ lang });
        document.documentElement.lang = lang;
        document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      },

      setTheme: (theme) => {
        set({ theme });
        document.documentElement.setAttribute('data-theme', theme);
      },

      setSyncStatus: (syncStatus) => set({ syncStatus }),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      setActiveView: (activeView) => set({ activeView }),
      setSearchQuery: (searchQuery) => set({ searchQuery }),
      setFilterStatus: (filterStatus) => set({ filterStatus }),
      setSortConfig: (sortConfig) => set({ sortConfig }),
      setPendingWorkspaceNavigation: (pendingWorkspaceNavigation) => set({ pendingWorkspaceNavigation }),
      clearPendingWorkspaceNavigation: () => set({ pendingWorkspaceNavigation: null }),
    }),
    {
      name: `${STORAGE_KEY_PREFIX}_ui`,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        lang: state.lang,
        theme: state.theme,
        sortConfig: state.sortConfig,
      }),
    }
  )
);
