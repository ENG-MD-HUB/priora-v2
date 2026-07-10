// ScreensaverOrbit.jsx
// تصميم بديل ثالث لشاشة التوقف — حلقات رفيعة شفافة حول الشعار بالمنتصف (يشبه
// مدارات كوكبية هادئة)، مع نجوم خلفية خفيفة.
//
// ⚠️ تصحيح خلل حقيقي بطلب صريح ("الصورة ثابتة"): الحلقات كانت فعلاً تدور
// (animation: rotate موجود ويشتغل)، لكن حلقة دائرية بسيطة متناظرة تماماً
// **تبدو ثابتة بصرياً بغض النظر عن دورانها** — لا فرق مرئي بين 0 درجة و180 درجة
// لخط دائري موحّد السماكة والشفافية. الحل: نضيف نقطة مضيئة صغيرة (كوكب) على
// حافة كل حلقة، تدور معها — الحلقة نفسها تبقى (خفيفة، جمالية)، لكن حركة
// النقطة حول المسار هي اللي تُظهر الدوران فعلياً للعين.

import { useMemo } from 'react';

const FAINT_STAR_COUNT = 40;

function generateFaintStars() {
  return Array.from({ length: FAINT_STAR_COUNT }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: Math.random() * 1.8 + 0.6,
    duration: Math.random() * 4 + 3,
    delay: Math.random() * 4,
  }));
}

const RINGS = [
  { inset: 0, duration: 28, reverse: false, color: '#7d9bff', ringColor: 'rgba(120,160,255,.18)' },
  { inset: 28, duration: 20, reverse: true, color: '#b28cff', ringColor: 'rgba(160,130,255,.14)' },
  { inset: 56, duration: 34, reverse: false, color: '#5fd8e8', ringColor: 'rgba(99,200,220,.16)' },
];

export function ScreensaverOrbit({ onDismiss }) {
  const stars = useMemo(generateFaintStars, []);

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
            width: star.size, height: star.size, borderRadius: '50%', background: '#fff',
            animation: `priora-faint-twinkle ${star.duration}s ease-in-out ${star.delay}s infinite`,
          }}
        />
      ))}

      <div style={{ position: 'relative', width: 260, height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {RINGS.map((ring, i) => (
          <div
            key={i}
            style={{
              position: 'absolute', inset: ring.inset, border: `1px solid ${ring.ringColor}`, borderRadius: '50%',
              animation: `priora-orbit-spin ${ring.duration}s linear infinite ${ring.reverse ? 'reverse' : ''}`,
            }}
          >
            <div
              style={{
                position: 'absolute', top: -3, left: '50%', width: 6, height: 6, borderRadius: '50%',
                background: ring.color, transform: 'translateX(-50%)',
                boxShadow: `0 0 8px 2px ${ring.color}`,
              }}
            />
          </div>
        ))}

        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <img
            src="/logo-night.png"
            alt="Priora"
            style={{ height: 50, objectFit: 'contain', animation: 'priora-logo-glow 4s ease-in-out infinite' }}
          />
        </div>
      </div>

      <p style={{ position: 'absolute', bottom: '12%', fontSize: 11, color: 'rgba(255,255,255,.3)', letterSpacing: '.08em', textTransform: 'uppercase' }}>
        Move or click to continue
      </p>

      <style>{`
        @keyframes priora-orbit-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes priora-faint-twinkle { 0%, 100% { opacity: .08; } 50% { opacity: .4; } }
        @keyframes priora-logo-glow {
          0%, 100% { filter: drop-shadow(0 0 6px rgba(99,140,255,.25)) brightness(.92); }
          50% { filter: drop-shadow(0 0 28px rgba(120,160,255,.75)) brightness(1.15); }
        }
      `}</style>
    </div>
  );
}
