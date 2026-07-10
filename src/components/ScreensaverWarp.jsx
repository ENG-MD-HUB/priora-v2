// ScreensaverWarp.jsx
// تصميم رابع لشاشة التوقف — نجوم عادية (نقاط، زي Starfield بالضبط) لكن تنجرف
// ببطء شديد من المنتصف للخارج، بإحساس ناعم هادئ (مو سرعة ضوء ولا شهب) — يشبه
// إنك تطفو ببطء وسط حقل نجوم، مو تنطلق بسرعة عبره.
//
// ⚠️ تصحيح خلل حقيقي بطلب صريح: النسخة الأولى كانت خطوط ممطوطة (streaks) بمدة
// 2.5-5 ثانية بس — يعطي إحساس شهب/نيازك سريعة، مو نجوم هادئة. الآن: نقاط دائرية
// عادية (بدون أي مط)، بمدة 18-32 ثانية للرحلة الكاملة من المركز للحافة —
// حركة بطيئة جداً بالكاد تُلاحَظ إلا بعد تركيز، تماماً زي المطلوب.

import { useMemo } from 'react';

const STAR_COUNT = 130;
const MAX_TRAVEL = 700; // px

const STAR_COLORS = ['#ffffff', '#dce8ff', '#fff4d9', '#cfe3ff'];

function generateWarpStars() {
  return Array.from({ length: STAR_COUNT }, (_, i) => ({
    id: i,
    angleDeg: Math.random() * 360,
    duration: Math.random() * 14 + 18, // 18–32 ثانية: بطيء جداً وناعم
    delay: -Math.random() * 30, // سالب = يبدأ منتصف الرحلة فوراً، بدون "ولادة" جماعية بلحظة الفتح
    size: Math.random() * 2 + 1,
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
          <div key={s.id} style={{ position: 'absolute', top: 0, left: 0, width: 0, height: 0, transform: `rotate(${s.angleDeg}deg)` }}>
            <div
              style={{
                position: 'absolute', top: -s.size / 2, left: 0,
                width: s.size, height: s.size, borderRadius: '50%',
                background: s.color,
                boxShadow: `0 0 ${s.size * 2}px ${s.color}`,
                animation: `priora-warp-drift ${s.duration}s linear ${s.delay}s infinite`,
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
        @keyframes priora-warp-drift {
          0% { transform: translateX(0) scale(.4); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateX(${MAX_TRAVEL}px) scale(1.3); opacity: 0; }
        }
        @keyframes priora-logo-glow {
          0%, 100% { filter: drop-shadow(0 0 6px rgba(99,140,255,.25)) brightness(.92); }
          50% { filter: drop-shadow(0 0 28px rgba(120,160,255,.75)) brightness(1.15); }
        }
      `}</style>
    </div>
  );
}

