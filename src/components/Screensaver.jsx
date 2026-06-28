// Screensaver.jsx
// شاشة توقف هادئة — خلفية نجوم متحركة ببطء + شعار بريورا يومض بهدوء بالمنتصف.
// ميزة جديدة كلياً بطلب صريح. أي نقرة/حركة فأرة/ضغطة مفتاح تُغلقها فوراً (يُدار
// هذا من useIdleScreensaver، هنا فقط العرض البصري).

import { useMemo } from 'react';
import { useUIStore } from '../store/uiStore';

const STAR_COUNT = 80;

function generateStars() {
  return Array.from({ length: STAR_COUNT }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: Math.random() * 2 + 1,
    duration: Math.random() * 3 + 2,
    delay: Math.random() * 4,
  }));
}

export function Screensaver({ onDismiss }) {
  const theme = useUIStore((s) => s.theme);
  const stars = useMemo(generateStars, []);

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
            opacity: 0.6, animation: `priora-star-twinkle ${star.duration}s ease-in-out ${star.delay}s infinite`,
          }}
        />
      ))}

      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, animation: 'priora-logo-pulse 3.5s ease-in-out infinite' }}>
        <img
          src={theme === 'dark' ? '/logo-night.png' : '/logo-day.png'}
          alt="Priora"
          style={{ height: 56, objectFit: 'contain', filter: 'drop-shadow(0 0 18px rgba(99,140,255,.35))' }}
        />
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', letterSpacing: '.08em', textTransform: 'uppercase' }}>
          Move or click to continue
        </p>
      </div>

      <style>{`
        @keyframes priora-star-twinkle { 0%, 100% { opacity: .15; } 50% { opacity: .8; } }
        @keyframes priora-logo-pulse { 0%, 100% { opacity: .75; transform: scale(1); } 50% { opacity: 1; transform: scale(1.04); } }
      `}</style>
    </div>
  );
}
