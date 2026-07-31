// Screensaver.jsx
// شاشة توقف هادئة — التصميم الافتراضي (variant="starfield"): خلفية نجوم متحركة
// بألوان طبيعية خفيفة + شعار بريورا بحجم ثابت يتوهج بوميض فني واضح. ميزة جديدة
// كلياً بطلب صريح. أي نقرة/حركة فأرة/ضغطة مفتاح تُغلقها فوراً (يُدار هذا من
// useIdleScreensaver، هنا فقط العرض البصري).
//
// ⚠️ تصحيحات بطلب صريح على التصميم الأول:
// 1. الشعار: حجم ثابت تماماً الآن (بدون transform:scale) — الوميض فقط بالسطوع/التوهج
//    (drop-shadow متحرك + opacity)، بتأثير أقوى وأوضح بصرياً من قبل.
// 2. النجوم: تنوّع حقيقي بالحركة (سرعات وأحجام متفاوتة بوضوح أكبر)، وألوان طبيعية
//    خفيفة (تدرجات بيضاء/مزرقة/صفراء فاتحة جداً، تحاكي تنوع ألوان النجوم الحقيقية)
//    بدل الأبيض الموحّد السابق.
//
// تصاميم إضافية: راجع ScreensaverAurora.jsx (موج هادئ متدرّج) و
// ScreensaverOrbit.jsx (دوائر تدور ببطء حول الشعار) — أفكار بديلة بنفس الهدوء.

import { useMemo } from 'react';
import { useUIStore } from '../store/uiStore';

const STAR_COUNT = 90;
const STAR_COLORS = ['#ffffff', '#dce8ff', '#fff4d9', '#cfe3ff', '#ffe9d6']; // أبيض، أزرق فاتح، أصفر فاتح، أزرق سماوي فاتح، عاجي فاتح

const OPACITY_LEVELS = [0.45, 0.6, 0.75, 0.85, 0.95]; // 5 مستويات سطوع ثابتة (تنوّع كافٍ بصرياً، بدون توليد مئات قواعد @keyframes منفصلة)

function generateStars() {
  return Array.from({ length: STAR_COUNT }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: Math.random() * 2.6 + 0.8, // تنوّع أوضح بالحجم (0.8 إلى 3.4px)
    duration: Math.random() * 5 + 1.5, // تنوّع أوضح بالسرعة (1.5 إلى 6.5 ثانية)
    delay: Math.random() * 5,
    color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
    pattern: i % 4,
    opacityLevel: i % OPACITY_LEVELS.length,
  }));
}

// ⚠️ ملاحظة فنية: تجنّبنا قراءة متغيرات CSS مخصّصة (custom properties) من داخل
// @keyframes — الدعم غير موحّد بكل المتصفحات لهذا النمط. بدلاً منه، نولّد عدد محدود
// (4 أنماط حركة × 5 مستويات سطوع = 20 قاعدة @keyframes ثابتة بالضبط) مسبقاً
// بـJavaScript، فيُضمَّن مباشرة بكود الـCSS النهائي — يعمل بثبات بكل المتصفحات،
// وبدون توليد عدد كبير غير ضروري من القواعد.
function buildStarKeyframes() {
  return OPACITY_LEVELS.map((op, i) => `
      @keyframes priora-star-twinkle-0-${i} { 0%, 100% { opacity: .1; } 50% { opacity: ${op}; } }
      @keyframes priora-star-twinkle-1-${i} { 0%, 100% { opacity: ${op}; } 50% { opacity: .15; } }
      @keyframes priora-star-twinkle-2-${i} { 0%, 30%, 100% { opacity: .12; } 15% { opacity: ${op}; } }
      @keyframes priora-star-twinkle-3-${i} { 0%, 60%, 100% { opacity: .08; } 80% { opacity: ${op}; } }
    `).join('\n');
}

export function Screensaver({ onDismiss }) {
  const theme = useUIStore((s) => s.theme);
  const stars = useMemo(generateStars, []);
  const starKeyframesCSS = useMemo(buildStarKeyframes, []);

  return (
    <div
      onClick={onDismiss}
      style={{
        position: 'fixed', inset: 0, zIndex: 99999, background: '#05060a',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', overflow: 'hidden', animation: 'fade-in .6s ease',
      }}
    >
      {stars.map((star) => (
        <div
          key={star.id}
          style={{
            position: 'absolute', left: `${star.left}%`, top: `${star.top}%`,
            width: star.size, height: star.size, borderRadius: '50%', background: star.color,
            boxShadow: `0 0 ${star.size * 2}px ${star.color}`,
            animation: `priora-star-twinkle-${star.pattern}-${star.opacityLevel} ${star.duration}s ease-in-out ${star.delay}s infinite`,
          }}
        />
      ))}

      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <img
          src={theme === 'dark' ? '/logo-night.png' : '/logo-day.png'}
          alt="Priora"
          style={{ height: 56, objectFit: 'contain', animation: 'priora-logo-glow 4s ease-in-out infinite' }}
        />
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', letterSpacing: '.08em', textTransform: 'uppercase' }}>
          Move or click to continue
        </p>
      </div>

      <style>{`
        ${starKeyframesCSS}
        @keyframes priora-logo-glow {
          0%, 100% { filter: drop-shadow(0 0 6px rgba(99,140,255,.25)) brightness(.92); }
          50% { filter: drop-shadow(0 0 28px rgba(120,160,255,.75)) brightness(1.15); }
        }
      `}</style>
    </div>
  );
}
