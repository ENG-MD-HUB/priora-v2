// ScreensaverGalaxy.jsx
// ⚠️ تصميم جديد كلياً بطلب صريح ("شكل مميز يبهر المستخدمين"): مجرة حلزونية
// دوّارة — أذرع من النجوم ملتفة حول مركز متوهج، تدور المجرة كاملة ببطء شديد
// كوحدة واحدة، والشعار بمنتصف التوهج. تصميم مختلف كلياً عن الأربعة السابقة —
// مو نقاط عشوائية ولا كتل ضبابية ولا حلقات، مجرة حقيقية الشكل.
//
// طريقة البناء: كل نجم له زاوية + مسافة عن المركز محسوبة رياضياً على مسار
// حلزوني (Archimedean-ish spiral) لكل ذراع من 4 أذرع، مع اهتزاز عشوائي بسيط
// لطبيعية أكثر. كل النجوم بداخل حاوية واحدة تدور كوحدة واحدة (100 ثانية للدورة
// الكاملة) — بطيء جداً وهادئ. كل نجم يومض لحاله (opacity بس، ما يصادم دوران
// الحاوية لأنه خاصية مختلفة تماماً عن transform).

import { useMemo } from 'react';

const ARM_COUNT = 4;
const STARS_PER_ARM = 42;
const SPIRAL_TWIST_DEG = 250;
const MAX_RADIUS = 230;
const STAR_COLORS = ['#ffffff', '#dce8ff', '#c9a8ff', '#fff4d9', '#cfe3ff'];

function generateGalaxyStars() {
  const stars = [];
  for (let arm = 0; arm < ARM_COUNT; arm++) {
    const baseAngle = (360 / ARM_COUNT) * arm;
    for (let i = 0; i < STARS_PER_ARM; i++) {
      const t = i / STARS_PER_ARM + Math.random() * 0.035;
      const angle = baseAngle + t * SPIRAL_TWIST_DEG + (Math.random() - 0.5) * 16;
      const radius = t * MAX_RADIUS + (Math.random() - 0.5) * 12;
      stars.push({
        id: `${arm}-${i}`,
        angle,
        radius: Math.max(radius, 6),
        size: Math.random() * 1.9 + 0.6,
        duration: Math.random() * 4 + 2.5,
        delay: Math.random() * 5,
        color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
      });
    }
  }
  return stars;
}

export function ScreensaverGalaxy({ onDismiss, caption, brand }) {
  const stars = useMemo(generateGalaxyStars, []);

  return (
    <div
      onClick={onDismiss}
      style={{
        position: 'fixed', inset: 0, zIndex: 99999, background: '#020308',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', overflow: 'hidden', animation: 'fade-in .6s ease',
      }}
    >
      <div style={{ position: 'relative', width: 560, height: 560, maxWidth: '90vw', maxHeight: '90vw', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {/* توهج المركز */}
        <div style={{ position: 'absolute', width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, rgba(140,170,255,.5), transparent 70%)', filter: 'blur(18px)', animation: 'priora-galaxy-pulse 5s ease-in-out infinite' }} />

        {/* المجرة الدوّارة (كل النجوم تدور مع بعض كوحدة واحدة) */}
        <div style={{ position: 'absolute', inset: 0, animation: 'priora-galaxy-spin 100s linear infinite' }}>
          {stars.map((s) => (
            <div
              key={s.id}
              style={{
                position: 'absolute', top: '50%', left: '50%', width: s.size, height: s.size, borderRadius: '50%',
                background: s.color, boxShadow: `0 0 ${s.size * 2}px ${s.color}`,
                transform: `translate(-50%,-50%) rotate(${s.angle}deg) translateX(${s.radius}px)`,
                animation: `priora-galaxy-twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
              }}
            />
          ))}
        </div>

        {/* الشعار بالمنتصف، فوق كل شي */}
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, zIndex: 1 }}>
          <img
            src="/logo-night.png"
            alt="Priora"
            style={{ height: 54, objectFit: 'contain', animation: 'priora-logo-glow 4s ease-in-out infinite' }}
          />
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', letterSpacing: '.08em', textTransform: 'uppercase' }}>
            Click to continue
          </p>
        </div>
      </div>

      {(caption || brand) && (
        <div style={{ position: 'absolute', bottom: '6%', textAlign: 'center', padding: '0 20px' }}>
          {caption && (
            <p style={{ fontSize: 13, fontWeight: 300, color: 'rgba(255,255,255,.85)', letterSpacing: '.06em', fontFamily: "'Exo 2', sans-serif", margin: 0, textShadow: '0 0 14px rgba(120,160,255,.3)' }}>
              {caption}
            </p>
          )}
          {brand && (
            <p style={{ fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,.28)', letterSpacing: '.14em', textTransform: 'uppercase', fontFamily: "'Exo 2', sans-serif", margin: '7px 0 0' }}>
              {brand}
            </p>
          )}
        </div>
      )}

      <style>{`
        @keyframes priora-galaxy-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes priora-galaxy-twinkle { 0%, 100% { opacity: .35; } 50% { opacity: 1; } }
        @keyframes priora-galaxy-pulse { 0%, 100% { opacity: .5; transform: scale(1); } 50% { opacity: .8; transform: scale(1.15); } }
        @keyframes priora-logo-glow {
          0%, 100% { filter: drop-shadow(0 0 6px rgba(99,140,255,.25)) brightness(.92); }
          50% { filter: drop-shadow(0 0 28px rgba(120,160,255,.75)) brightness(1.15); }
        }
      `}</style>
    </div>
  );
}
