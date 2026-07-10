// useIdleScreensaver.js
// يكتشف خمول المستخدم (بدون أي نقرة/ضغطة مفتاح/تحريك فأرة) لمدة محددة، ويُفعّل
// شاشة توقف (Screensaver) — ميزة جديدة كلياً بطلب صريح، غير موجودة بالكود الأصلي.
//
// مفعّلة افتراضياً (true) — يمكن تعطيلها من الإعدادات (يُحفظ التفضيل بـ localStorage
// مستقل، يستمر بين الجلسات).
//
// ⚠️ تصحيح سلوك مهم بطلب صريح: قبل هذا التعديل، أي حركة فأرة بأي مكان بالصفحة
// (بما فيها فوق الشاشة نفسها وهي معروضة) كانت تُغلقها فوراً — لأن الاستماع العام
// لأحداث النشاط (المُستخدَم لإعادة عدّاد الخمول قبل ظهور الشاشة) ما كان يتوقف وقت
// عرضها. الآن: وقت عرض الشاشة، نوقف الاستماع لـmousemove/mousedown/keydown/scroll
// تماماً — الإغلاق يحصل فقط بنقرة صريحة (onClick) على الشاشة نفسها.
//
// ⚠️ مدة الخمول الافتراضية صارت 5 دقائق (كانت 20) — قابلة للتخصيص من الإعدادات.
//
// ⚠️ التصميم البصري نفسه قابل للاختيار أيضاً (starfield الافتراضي، aurora، orbit) —
// محفوظ بـ localStorage مستقل، يتزامن لحظياً مع الإعدادات بدون تحديث الصفحة.

import { useState, useEffect, useRef } from 'react';

const DEFAULT_TIMEOUT_MINUTES = 5;
const MIN_TIMEOUT_MINUTES = 1;
const DEFAULT_DESIGN = 'starfield';
const VALID_DESIGNS = ['starfield', 'aurora', 'orbit', 'warp'];

const ENABLED_STORAGE_KEY = 'priora_screensaver_enabled';
const MINUTES_STORAGE_KEY = 'priora_screensaver_minutes';
const DESIGN_STORAGE_KEY = 'priora_screensaver_design';
const SETTING_CHANGE_EVENT = 'priora-screensaver-setting-change';

export function getScreensaverEnabled() {
  if (typeof localStorage === 'undefined') return true;
  const stored = localStorage.getItem(ENABLED_STORAGE_KEY);
  return stored === null ? true : stored === 'true'; // true افتراضياً (لا قيمة محفوظة = مفعّلة)
}

export function setScreensaverEnabled(enabled) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(ENABLED_STORAGE_KEY, String(enabled));
    window.dispatchEvent(new Event(SETTING_CHANGE_EVENT));
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
    window.dispatchEvent(new Event(SETTING_CHANGE_EVENT));
  }
  return clamped;
}

export function getScreensaverDesign() {
  if (typeof localStorage === 'undefined') return DEFAULT_DESIGN;
  const stored = localStorage.getItem(DESIGN_STORAGE_KEY);
  return VALID_DESIGNS.includes(stored) ? stored : DEFAULT_DESIGN;
}

export function setScreensaverDesign(design) {
  const safeDesign = VALID_DESIGNS.includes(design) ? design : DEFAULT_DESIGN;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(DESIGN_STORAGE_KEY, safeDesign);
    window.dispatchEvent(new Event(SETTING_CHANGE_EVENT));
  }
  return safeDesign;
}

export function useIdleScreensaver() {
  const [isActive, setIsActive] = useState(false);
  const [enabled, setEnabled] = useState(getScreensaverEnabled);
  const [minutes, setMinutes] = useState(getScreensaverMinutes);
  const [design, setDesign] = useState(getScreensaverDesign);
  const timeoutRef = useRef(null);
  const isActiveRef = useRef(false); // مرجع فوري (بدون تأخير closure) يُستخدم داخل مستمعي الأحداث

  // يستمع لتغيير الإعداد من SettingsModal (مودال منفصل، حالة محلية مستقلة) —
  // بدون هذا، أي تغيير بالإعدادات (تفعيل/تعطيل، المدة، التصميم) لا ينعكس على هذا
  // الـhook النشط إلا بعد تحديث الصفحة كاملة.
  useEffect(() => {
    function handleSettingChange() {
      setEnabled(getScreensaverEnabled());
      setMinutes(getScreensaverMinutes());
      setDesign(getScreensaverDesign());
    }
    window.addEventListener(SETTING_CHANGE_EVENT, handleSettingChange);
    return () => window.removeEventListener(SETTING_CHANGE_EVENT, handleSettingChange);
  }, []);

  function resetTimer() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!enabled) return;
    timeoutRef.current = setTimeout(() => {
      isActiveRef.current = true;
      setIsActive(true);
    }, minutes * 60 * 1000);
  }

  useEffect(() => {
    if (!enabled) {
      isActiveRef.current = false;
      setIsActive(false);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      return;
    }

    const events = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll'];
    function handleActivity() {
      // ⚠️ الإصلاح الأساسي: لو الشاشة معروضة حالياً، نتجاهل هذا الحدث تماماً —
      // لا نغلقها ولا نعيد المؤقّت. الإغلاق الوحيد المسموح وقت العرض هو نقرة
      // صريحة على الشاشة نفسها (دالة dismiss أدناه، تُستدعى من onClick بالمكوّن).
      if (isActiveRef.current) return;
      resetTimer();
    }

    events.forEach((event) => window.addEventListener(event, handleActivity));
    resetTimer();

    return () => {
      events.forEach((event) => window.removeEventListener(event, handleActivity));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [enabled, minutes]);

  function toggleEnabled(value) {
    setEnabled(value);
    setScreensaverEnabled(value);
  }

  function dismiss() {
    isActiveRef.current = false;
    setIsActive(false);
    resetTimer();
  }

  return { isActive, enabled, minutes, design, toggleEnabled, dismiss };
}
