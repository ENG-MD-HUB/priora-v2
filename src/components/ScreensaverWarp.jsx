// ScreensaverWarp.jsx
// تصميم رابع لشاشة التوقف — نجوم عادية (نقاط، زي Starfield) تنجرف ببطء شديد
// من حول الشعار للخارج، بإحساس "أنا داخل بالفضاء وأطفو ببطء وسطه" — مو سرعة
// ضوء، مو شهب.
//
// ⚠️ تصحيحات حقيقية بطلب صريح (محاولة ثانية):
// 1. السرعة كانت لسا سريعة نسبياً (18-32 ثانية) — الآن أبطأ بكثير (35-60 ثانية
//    للرحلة الكاملة)، بالكاد تُلاحَظ الحركة إلا بعد تركيز فعلي.
// 2. النجوم كانت متشابهة الحجم/السطوع ("حبيبات ملح") — الآن تفاوت حقيقي بالحجم
//    (0.6-3.2px) والسطوع (opacity نهائي مختلف لكل نجم، مو نفس القيمة للكل)،
//    فيصير فيه نجوم خافتة وأخرى واضحة، قريبة من بعض بأحجام مختلفة — زي سماء
//    حقيقية، مو نمط متكرر موحّد.
// 3. النجوم كانت تبدأ بالضبط من نقطة الشعار (نصف قطر=0)، فتبدو "تنفجر من كلمة
//    Priora" بصرياً — الآن تبدأ بعد نصف قطر أدنى (يتجاوز مساحة الشعار)، فتظهر
//    وكأنها موجودة أصلاً بالفضاء المحيط وتتحرك ببطء (إحساس "أنا داخل الفضاء")
//    بدل الانبثاق من النص نفسه.

import { useMemo } from 'react';

const STAR_COUNT = 150;
const MIN_RADIUS = 90; // px — يتجاوز مساحة الشعار، يمنع إحساس "الانبثاق من النص"
const MAX_TRAVEL = 650; // px إضافية بعد نقطة البداية

const STAR_COLORS = ['#ffffff', '#dce8ff', '#fff4d9', '#cfe3ff'];

function generateWarpStars() {
  return Array.from({ length: STAR_COUNT }, (_, i) => ({
    id: i,
    angleDeg: Math.random() * 360,
    duration: Math.random() * 25 + 35, // 35–60 ثانية: بطيء جداً وناعم
    delay: -Math.random() * 55, // سالب = يبدأ منتصف الرحلة فوراً، بدون "ولادة" جماعية بلحظة الفتح
    size: Math.random() * 2.6 + 0.6, // تفاوت حقيقي بالحجم (0.6–3.2px)
    finalOpacity: Math.random() * 0.55 + 0.4, // تفاوت حقيقي بالسطوع (0.4–0.95) — بعض النجوم خافتة، بعضها واضحة
    color: STAR_COLORS[i % STAR_COLORS.length],
  }));
}

export function ScreensaverWarp({ onDismiss, caption }) {
  const stars = useMemo(generateWarpStars, []);

  return (
    <div
      onClick={onDismiss}
      style={{
        position: 'fixed', inset: 0, zIndex: 99999, background: '#03040a',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', overflow: 'hidden', animation: 'fade-in .6s ease',
      }}
    >
      <div style={{ position: 'absolute', top: '50%', left: '50%', width: 0, height: 0 }}>
        {stars.map((s) => (
          <div key={s.id} style={{ position: 'absolute', top: 0, left: 0, width: 0, height: 0, transform: `rotate(${s.angleDeg}deg) translateX(${MIN_RADIUS}px)` }}>
            <div
              style={{
                position: 'absolute', top: -s.size / 2, left: 0,
                width: s.size, height: s.size, borderRadius: '50%',
                background: s.color,
                boxShadow: `0 0 ${s.size * 1.8}px ${s.color}`,
                animation: `priora-warp-drift-${Math.round(s.finalOpacity * 100)} ${s.duration}s linear ${s.delay}s infinite`,
              }}
            />
          </div>
        ))}
      </div>

      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, zIndex: 1 }}>
        <img
          src="/logo-night.png"
          alt="Priora"
          style={{ height: 56, objectFit: 'contain', animation: 'priora-logo-glow 4s ease-in-out infinite' }}
        />
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', letterSpacing: '.08em', textTransform: 'uppercase' }}>
          Click to continue
        </p>
      </div>

      {caption && (
        <p style={{ position: 'absolute', bottom: '6%', fontSize: 12, color: 'rgba(255,255,255,.35)', letterSpacing: '.04em', fontStyle: 'italic', textAlign: 'center', padding: '0 20px', zIndex: 1 }}>
          {caption}
        </p>
      )}

      <style>{`
        /* ⚠️ توليد 56 قاعدة @keyframes ثابتة (مستوى سطوع نهائي لكل 1% من 40 لـ95)
           بدل قراءة متغيّر CSS مخصّص داخل keyframes (دعم غير موحّد بالمتصفحات) —
           كل نجم يختار القاعدة المطابقة لسطوعه النهائي المحسوب مسبقاً بـJavaScript. */
        ${Array.from({ length: 56 }, (_, i) => {
          const op = (40 + i) / 100;
          return `@keyframes priora-warp-drift-${40 + i} {
            0% { transform: translateX(0) scale(.5); opacity: 0; }
            8% { opacity: ${op}; }
            92% { opacity: ${op}; }
            100% { transform: translateX(${MAX_TRAVEL}px) scale(1.2); opacity: 0; }
          }`;
        }).join('\n')}
        @keyframes priora-logo-glow {
          0%, 100% { filter: drop-shadow(0 0 6px rgba(99,140,255,.25)) brightness(.92); }
          50% { filter: drop-shadow(0 0 28px rgba(120,160,255,.75)) brightness(1.15); }
        }
      `}</style>
    </div>
  );
}


