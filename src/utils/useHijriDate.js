// useHijriDate.js
// هوك يحوّل تاريخ ميلادي لتاريخ هجري بصيغة عربية — نسخة مُعاد كتابتها بوضوح من
// الدالة De بالكود الأصلي (بالإضافة لـ Ee الاحتياطية، Te أسماء الأشهر، we الكاش).
//
// المصدر الأساسي: واجهة برمجية حقيقية (api.aladhan.com) لحساب هجري دقيق.
// عند فشل الاتصال: يتراجع لحساب Intl.DateTimeFormat المدمج بالمتصفح (تقويم أم القرى)،
// وهو أقل دقة بشكل طفيف لكنه يعمل بدون إنترنت.
// نتائج الـ API تُخزَّن بذاكرة كاش بمستوى الموديول (وليس بحالة React) — تبقى محفوظة
// طول الجلسة حتى لو تغيّر التاريخ المعروض ورجع لنفس اليوم مرة ثانية.

import { useState, useEffect } from 'react';

const hijriCache = {};

const HIJRI_MONTH_NAMES_AR = [
  'محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 'جمادى الأولى', 'جمادى الآخرة',
  'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة',
];

function getFallbackHijriDate(date) {
  try {
    return date.toLocaleDateString('ar-SA-u-ca-islamic-umalqura', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return '';
  }
}

export function useHijriDate(date = new Date()) {
  const cacheKey = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
  const [hijriDate, setHijriDate] = useState(hijriCache[cacheKey] ?? getFallbackHijriDate(date));

  useEffect(() => {
    if (hijriCache[cacheKey]) {
      setHijriDate(hijriCache[cacheKey]);
      return;
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    fetch(`https://api.aladhan.com/v1/gToH?date=${day}-${month}-${year}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.code !== 200) return;
        const hijri = data.data.hijri;
        const monthName = HIJRI_MONTH_NAMES_AR[parseInt(hijri.month.number) - 1] ?? hijri.month.ar;
        const formatted = `${hijri.day} ${monthName} ${hijri.year}هـ`;
        hijriCache[cacheKey] = formatted;
        setHijriDate(formatted);
      })
      .catch(() => setHijriDate(getFallbackHijriDate(date)));
  }, [cacheKey]);

  return hijriDate;
}
