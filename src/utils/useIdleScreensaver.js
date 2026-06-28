// useIdleScreensaver.js
// يكتشف خمول المستخدم (بدون أي نقرة/ضغطة مفتاح/تحريك فأرة) لمدة محددة، ويُفعّل
// شاشة توقف (Screensaver) — ميزة جديدة كلياً بطلب صريح، غير موجودة بالكود الأصلي.
//
// مفعّلة افتراضياً (true) — يمكن تعطيلها من الإعدادات (يُحفظ التفضيل بـ localStorage
// مستقل، يستمر بين الجلسات). أي تفاعل (نقرة، حركة فأرة، ضغطة مفتاح، لمس) يلغي
// الشاشة فوراً ويعيد عدّاد الخمول من الصفر.

import { useState, useEffect, useRef } from 'react';

const IDLE_TIMEOUT_MS = 20 * 60 * 1000; // 20 دقيقة
const STORAGE_KEY = 'priora_screensaver_enabled';

export function getScreensaverEnabled() {
  if (typeof localStorage === 'undefined') return true;
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === null ? true : stored === 'true'; // true افتراضياً (لا قيمة محفوظة = مفعّلة)
}

export function setScreensaverEnabled(enabled) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, String(enabled));
    window.dispatchEvent(new Event('priora-screensaver-setting-change'));
  }
}

export function useIdleScreensaver() {
  const [isActive, setIsActive] = useState(false);
  const [enabled, setEnabled] = useState(getScreensaverEnabled);
  const timeoutRef = useRef(null);

  // يستمع لتغيير الإعداد من SettingsModal (مودال منفصل، حالة محلية مستقلة) —
  // بدون هذا، تفعيل/تعطيل الميزة بالإعدادات لا ينعكس على هذا الـhook النشط إلا
  // بعد تحديث الصفحة كاملة.
  useEffect(() => {
    function handleSettingChange() {
      setEnabled(getScreensaverEnabled());
    }
    window.addEventListener('priora-screensaver-setting-change', handleSettingChange);
    return () => window.removeEventListener('priora-screensaver-setting-change', handleSettingChange);
  }, []);

  function resetTimer() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!enabled) return;
    timeoutRef.current = setTimeout(() => setIsActive(true), IDLE_TIMEOUT_MS);
  }

  useEffect(() => {
    if (!enabled) {
      setIsActive(false);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      return;
    }

    const events = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll'];
    function handleActivity() {
      if (isActive) setIsActive(false);
      resetTimer();
    }

    events.forEach((event) => window.addEventListener(event, handleActivity));
    resetTimer();

    return () => {
      events.forEach((event) => window.removeEventListener(event, handleActivity));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [enabled, isActive]);

  function toggleEnabled(value) {
    setEnabled(value);
    setScreensaverEnabled(value);
  }

  function dismiss() {
    setIsActive(false);
    resetTimer();
  }

  return { isActive, enabled, toggleEnabled, dismiss };
}
