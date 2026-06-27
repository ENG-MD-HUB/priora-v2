// useViewportHeight.js
// يرجع ارتفاع نافذة المتصفح "بوحدات ما-قبل-الزووم" (CSS px) — عن طريق قسمة
// window.innerHeight الفعلي على مستوى الزووم الحالي. يُستخدم بدل CSS 100vh
// بالأماكن اللي تتأثر بـ zoom.
//
// ⚠️ السبب: window.innerHeight يرجع بكسلات الشاشة الفعلية (ثابتة، لا تتأثر بـzoom).
// أي قيمة px نكتبها بالكود (مثل --topbar-h: 50px) تُفسَّر كـ"قبل الزووم"، وتُعرض
// فعلياً مضروبة بمستوى الزووم. تأكدنا رياضياً: لو حسبنا (window.innerHeight / zoom)
// كـ"الارتفاع الكلي بوحدات-قبل-الزووم"، وطرحنا منها أي ارتفاع ثابت آخر بنفس
// الوحدات (--topbar-h)، فالنتيجة النهائية معروضة بصرياً تساوي دائماً ارتفاع
// الشاشة الفعلي بالضبط — بغض النظر عن مستوى الزووم، لأن كل العناصر (السايد بار
// والتوب بار) تتقلّص/تتمدد بنفس النسبة معاً بشكل متناسق.

import { useState, useEffect } from 'react';

const SCALE_STORAGE_KEY = 'priora_font_scale';

function getCurrentScale() {
  if (typeof localStorage === 'undefined') return 1;
  const stored = parseFloat(localStorage.getItem(SCALE_STORAGE_KEY));
  return Number.isFinite(stored) && stored > 0 ? stored : 1;
}

export function useViewportHeight() {
  const [height, setHeight] = useState(() => (typeof window !== 'undefined' ? window.innerHeight / getCurrentScale() : 0));

  useEffect(() => {
    function recompute() {
      setHeight(window.innerHeight / getCurrentScale());
    }
    window.addEventListener('resize', recompute);
    // الزووم يتغيّر بنقرة زر (مش بحدث resize طبيعي) — نستمع لحدث مخصص يُطلَق من
    // useFontScale عند كل تغيير، عشان يُعاد الحساب فوراً بدون انتظار resize.
    window.addEventListener('priora-font-scale-change', recompute);
    return () => {
      window.removeEventListener('resize', recompute);
      window.removeEventListener('priora-font-scale-change', recompute);
    };
  }, []);

  return height;
}
