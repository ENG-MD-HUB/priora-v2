// useIdleScreensaver.js
// يكتشف خمول المستخدم (بدون أي نقرة/ضغطة مفتاح/تحريك فأرة) لمدة محددة، ويُفعّل
// شاشة توقف (Screensaver) — ميزة جديدة كلياً بطلب صريح، غير موجودة بالكود الأصلي.
//
// مفعّلة افتراضياً (true) — يمكن تعطيلها من الإعدادات (يُحفظ التفضيل بـ localStorage
// مستقل، يستمر بين الجلسات). أي تفاعل (نقرة، حركة فأرة، ضغطة مفتاح، لمس) يلغي
// الشاشة فوراً ويعيد عدّاد الخمول من الصفر.
//
// ⚠️ إضافة بطلب صريح: مدة الخمول قابلة للتخصيص من المستخدم (بدل 20 دقيقة ثابتة) —
// تُحفظ بـ localStorage منفصل، بحد أدنى منطقي (دقيقة واحدة) لمنع قيمة صفرية/سالبة
// تجعل الشاشة "تومض" بلا توقف.

import { useState, useEffect, useRef } from 'react';

const DEFAULT_TIMEOUT_MINUTES = 20;
const MIN_TIMEOUT_MINUTES = 1;
const ENABLED_STORAGE_KEY = 'priora_screensaver_enabled';
const MINUTES_STORAGE_KEY = 'priora_screensaver_minutes';

export function getScreensaverEnabled() {
  if (typeof localStorage === 'undefined') return true;
  const stored = localStorage.getItem(ENABLED_STORAGE_KEY);
  return stored === null ? true : stored === 'true'; // true افتراضياً (لا قيمة محفوظة = مفعّلة)
}

export function setScreensaverEnabled(enabled) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(ENABLED_STORAGE_KEY, String(enabled));
    window.dispatchEvent(new Event('priora-screensaver-setting-change'));
  }
}

export function getScreensaverMinutes() {
  if (typeof localStorage === 'undefined') return DEFAULT_TIMEOUT_MINUTES;
  const stored = parseInt(localStorage.getItem(MINUTES_STORAGE_KEY), 10);
  return Number.isFinite(stored) && stored >= MIN_TIMEOUT_MINUTES ? stored : DEFAULT_TIMEOUT_MINUTES;
}

export function setScreensaverMinutes(minutes) {
  const clamped = Math.max(MIN_TIMEOUT_MINUTES, Math.round(minutes) || DEFAULT_TIMEOUT_MINUTES);
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(MINUTES_STORAGE_KEY, String(clamped));
    window.dispatchEvent(new Event('priora-screensaver-setting-change'));
  }
  return clamped;
}

export function useIdleScreensaver() {
  const [isActive, setIsActive] = useState(false);
  const [enabled, setEnabled] = useState(getScreensaverEnabled);
  const [minutes, setMinutes] = useState(getScreensaverMinutes);
  const timeoutRef = useRef(null);

  // يستمع لتغيير الإعداد من SettingsModal (مودال منفصل، حالة محلية مستقلة) —
  // بدون هذا، تفعيل/تعطيل الميزة أو تغيير المدة بالإعدادات لا ينعكس على هذا
  // الـhook النشط إلا بعد تحديث الصفحة كاملة.
  useEffect(() => {
    function handleSettingChange() {
      setEnabled(getScreensaverEnabled());
      setMinutes(getScreensaverMinutes());
    }
    window.addEventListener('priora-screensaver-setting-change', handleSettingChange);
    return () => window.removeEventListener('priora-screensaver-setting-change', handleSettingChange);
  }, []);

  function resetTimer() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!enabled) return;
    timeoutRef.current = setTimeout(() => setIsActive(true), minutes * 60 * 1000);
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
  }, [enabled, isActive, minutes]);

  function toggleEnabled(value) {
    setEnabled(value);
    setScreensaverEnabled(value);
  }

  function dismiss() {
    setIsActive(false);
    resetTimer();
  }

  return { isActive, enabled, minutes, toggleEnabled, dismiss };
}
