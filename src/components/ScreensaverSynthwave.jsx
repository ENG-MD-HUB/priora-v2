// ScreensaverSynthwave.jsx
// ⚠️ تصميم جديد كلياً بطلب صريح: "ستايل مميز بحجم النافذة" — أفق Synthwave
// (استلهام من جماليات الثمانينات الرقمية): أرضية شبكية بمنظور تمتد للأفق
// وتتحرك للأمام باستمرار، شمس متوهجة بخطوط أفقية كلاسيكية عند الأفق، وسماء
// بتدرّج بنفسجي/وردي/برتقالي — يملأ النافذة كاملة بعكس التصاميم السابقة (اللي
// كانت كلها تركيبة مركزية صغيرة وسط شاشة داكنة).

import { useMemo } from 'react';

const STAR_COUNT = 50;

function generateStars() {
  return Array.from({ length: STAR_COUNT }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 55, // بس بالنص العلوي من الشاشة (السماء، فوق خط الأفق)
    size: Math.random() * 1.6 + 0.6,
    duration: Math.random() * 4 + 2.5,
    delay: Math.random() * 4,
  }));
}

export function ScreensaverSynthwave({ onDismiss, caption, brand }) {
  const stars = useMemo(generateStars, []);

  return (
    <div
      onClick={onDismiss}
      style={{
        position: 'fixed', inset: 0, zIndex: 99999, overflow: 'hidden', cursor: 'pointer',
        background: 'linear-gradient(to bottom, #0a0318 0%, #170a3a 30%, #3d1258 52%, #7a1f5e 68%, #2a0a3d 100%)',
        animation: 'fade-in .6s ease',
      }}
    >
      {stars.map((s) => (
        <div
          key={s.id}
          style={{
            position: 'absolute', left: `${s.left}%`, top: `${s.top}%`,
            width: s.size, height: s.size, borderRadius: '50%', background: '#fff',
            animation: `priora-synth-star ${s.duration}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}

      <div
        style={{
          position: 'absolute', bottom: '44%', left: '50%', transform: 'translateX(-50%)',
          width: 240, height: 240, borderRadius: '50%', overflow: 'hidden',
          background: 'linear-gradient(180deg, #ffe28a 0%, #ffb15e 30%, #ff7a8a 55%, #e34fc9 80%, #a730c9 100%)',
          boxShadow: '0 0 100px 26px rgba(255,120,190,.45)',
        }}
      >
        <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(to bottom, transparent 0 10%, #170a3a 10% 14%)', opacity: .85 }} />
      </div>

      <div style={{ position: 'absolute', bottom: '44%', left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, transparent, rgba(255,150,220,.8), transparent)', filter: 'blur(2px)' }} />

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '46%', overflow: 'hidden', perspective: '260px', perspectiveOrigin: '50% 0%' }}>
        <div
          style={{
            position: 'absolute', inset: '0 -50% -100% -50%',
            backgroundImage: `
              repeating-linear-gradient(90deg, rgba(255,90,200,.55) 0, rgba(255,90,200,.55) 1px, transparent 1px, transparent 64px),
              repeating-linear-gradient(0deg, rgba(255,90,200,.55) 0, rgba(255,90,200,.55) 1px, transparent 1px, transparent 64px)
            `,
            transform: 'rotateX(82deg)',
            animation: 'priora-synth-grid-move 2.4s linear infinite',
          }}
        />
      </div>

      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '30%', background: 'linear-gradient(to top, #0a0318, transparent)' }} />

      <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, zIndex: 1 }}>
        <img
          src="/logo-night.png"
          alt="Priora"
          style={{ height: 54, objectFit: 'contain', animation: 'priora-logo-glow 4s ease-in-out infinite' }}
        />
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', letterSpacing: '.08em', textTransform: 'uppercase', fontFamily: "'Exo 2', sans-serif" }}>
          Click to continue
        </p>
      </div>

      {(caption || brand) && (
        <div style={{ position: 'absolute', bottom: '4%', left: 0, right: 0, textAlign: 'center', padding: '0 20px', zIndex: 1 }}>
          {caption && (
            <p style={{ fontSize: 13, fontWeight: 300, color: 'rgba(255,255,255,.85)', letterSpacing: '.06em', fontFamily: "'Exo 2', sans-serif", margin: 0, textShadow: '0 0 14px rgba(255,120,190,.4)' }}>
              {caption}
            </p>
          )}
          {brand && (
            <p style={{ fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,.32)', letterSpacing: '.14em', textTransform: 'uppercase', fontFamily: "'Exo 2', sans-serif", margin: '7px 0 0' }}>
              {brand}
            </p>
          )}
        </div>
      )}

      <style>{`
        @keyframes priora-synth-grid-move { 0% { background-position: 0 0, 0 0; } 100% { background-position: 0 64px, 0 64px; } }
        @keyframes priora-synth-star { 0%, 100% { opacity: .2; } 50% { opacity: .9; } }
        @keyframes priora-logo-glow {
          0%, 100% { filter: drop-shadow(0 0 6px rgba(255,150,220,.3)) brightness(.92); }
          50% { filter: drop-shadow(0 0 28px rgba(255,150,220,.8)) brightness(1.15); }
        }
      `}</style>
    </div>
  );
}
