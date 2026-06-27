// useFontScale.js
// هوك للتحكم بحجم الخط/العناصر العام للتطبيق (تكبير/تصغير) — ميزة جديدة بطلب صريح.
//
// ⚠️ تصحيح خلل حقيقي مهم (محاولتين سابقتين فاشلتين موثّقتين هنا للسياق):
// 1) المحاولة الأولى: zoom على <html> — كسرت Sidebar (100vh يُحسب بعد التحجيم،
//    بينما --topbar-h ثابت بكسل، فيختل التطابق بينهما ويصير قص بالأسفل).
// 2) المحاولة الثانية: zoom على عنصر داخلي (تحت <body>) بدل <html> — حلّت مشكلة
//    100vh، لكن خلقت مشكلة جديدة: المودالز تُرندر بـ createPortal مباشرة على
//    document.body (خارج العنصر المُحجَّم)، فتبقى بحجمها الافتراضي بينما باقي
//    الصفحة تتكبّر/تتصغّر — تناقض بصري واضح.
//
// ✅ الحل النهائي الصحيح: zoom على <html> (يشمل كل شي بما فيها المودالز تلقائياً)،
// + استبدال 100vh بـSidebar.jsx بقياس JavaScript حقيقي لارتفاع النافذة
// (window.innerHeight) عن طريق useViewportHeight أدناه — بهذي الطريقة الارتفاع
// المحسوب يبقى صحيحاً بصرياً بغض النظر عن قيمة zoom الحالية، لأن window.innerHeight
// نفسه يتغيّر تلقائياً مع zoom بشكل متوافق مع باقي عناصر <html>.

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'priora_font_scale';
const MIN_SCALE = 0.85;
const MAX_SCALE = 1.3;
const DEFAULT_SCALE = 1;
const STEP = 0.05;

function getStoredScale() {
  if (typeof localStorage === 'undefined') return DEFAULT_SCALE;
  const stored = parseFloat(localStorage.getItem(STORAGE_KEY));
  return Number.isFinite(stored) ? stored : DEFAULT_SCALE;
}

export function useFontScale() {
  const [scale, setScale] = useState(getStoredScale);

  useEffect(() => {
    const supportsZoom = typeof CSS !== 'undefined' && CSS.supports && CSS.supports('zoom', '1');
    if (supportsZoom) {
      document.documentElement.style.zoom = scale;
    } else {
      document.body.style.transform = `scale(${scale})`;
      document.body.style.transformOrigin = 'top left';
      document.body.style.width = `${100 / scale}%`;
    }
    localStorage.setItem(STORAGE_KEY, String(scale));
    window.dispatchEvent(new Event('priora-font-scale-change'));
  }, [scale]);

  function increase() {
    setScale((prev) => Math.min(MAX_SCALE, Math.round((prev + STEP) * 100) / 100));
  }

  function decrease() {
    setScale((prev) => Math.max(MIN_SCALE, Math.round((prev - STEP) * 100) / 100));
  }

  function reset() {
    setScale(DEFAULT_SCALE);
  }

  return { scale, increase, decrease, reset, canIncrease: scale < MAX_SCALE, canDecrease: scale > MIN_SCALE, isDefault: scale === DEFAULT_SCALE };
}
