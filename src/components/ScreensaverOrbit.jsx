// ScreensaverOrbit.jsx
// تصميم بديل ثالث لشاشة التوقف — حلقات رفيعة شفافة تدور ببطء حول الشعار بالمنتصف
// (يشبه مدارات كوكبية هادئة)، مع نجوم خلفية خفيفة. اختيار بديل بطلب صريح
// ("شكلين إضافية") — غير مستخدم حالياً بالتطبيق إلا لو استُبدل Screensaver.jsx به.

import { useMemo } from 'react';
import { useUIStore } from '../store/uiStore';

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

export function ScreensaverOrbit({ onDismiss }) {
  const theme = useUIStore((s) => s.theme);
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
        <div style={{ position: 'absolute', inset: 0, border: '1px solid rgba(120,160,255,.18)', borderRadius: '50%', animation: 'priora-orbit-spin 28s linear infinite' }} />
        <div style={{ position: 'absolute', inset: 28, border: '1px solid rgba(160,130,255,.14)', borderRadius: '50%', animation: 'priora-orbit-spin 20s linear infinite reverse' }} />
        <div style={{ position: 'absolute', inset: 56, border: '1px solid rgba(99,200,220,.16)', borderRadius: '50%', animation: 'priora-orbit-spin 34s linear infinite' }} />

        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <img
            src={theme === 'dark' ? '/logo-night.png' : '/logo-day.png'}
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
