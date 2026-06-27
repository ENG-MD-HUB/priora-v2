// useOnlineStatus.js
// هوك يكتشف حالة الاتصال بالإنترنت بدقة أعلى من navigator.onLine وحدها — نسخة مُعاد
// كتابتها بوضوح من الدالة Ve بالكود الأصلي.
//
// السبب: navigator.onLine قد يقول "متصل" حتى لو الاتصال الفعلي بالخادم معطّل (مثلاً
// متصل بشبكة محلية بدون إنترنت فعلي). لذا، بالإضافة لمراقبة أحداث online/offline
// بالمتصفح، الهوك يسوي فحص نشط فعلي كل 30 ثانية (طلب HEAD حقيقي لخادم Firestore،
// بحد أقصى 5 ثواني انتظار) للتأكد من الاتصال الحقيقي.

import { useState, useEffect } from 'react';

export function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    function handleOnline() { setOnline(true); }
    function handleOffline() { setOnline(false); }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const intervalId = setInterval(async () => {
      if (!navigator.onLine) {
        setOnline(false);
        return;
      }
      setChecking(true);
      try {
        await fetch('https://firestore.googleapis.com/', {
          method: 'HEAD',
          mode: 'no-cors',
          cache: 'no-cache',
          signal: AbortSignal.timeout(5000),
        });
        setOnline(true);
      } catch {
        setOnline(false);
      } finally {
        setChecking(false);
      }
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, []);

  return { online, checking };
}
