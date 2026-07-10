// ScreensaverWarp.jsx
// ⚠️ تصميم جديد كلياً بطلب صريح: تصميم رابع لشاشة التوقف — نجوم تنطلق من
// المنتصف للخارج بشكل مستمر، تحاكي إحساس "التحرك بسرعة عبر الفضاء" (زي مؤثر
// الانتقال بسرعة الضوء بأفلام الخيال العلمي) — بدون أي مركبة أو شكل فعلي، بس
// إحساس الحركة نفسه عبر النجوم المتطايرة للخارج.
//
// ملاحظة تقنية: كل نجم = حاوية خارجية ثابتة الدوران (زاوية عشوائية لكل نجم، لا
// تتحرك) + خط داخلي متحرك (يتحرك بس بمحور X المحلي، اللي بفضل دوران الحاوية
// الخارجية يصير فعلياً "للخارج بزاوية عشوائية" لكل نجم). هذا الفصل ضروري لأن
// CSS animation على transform تستبدل قيمة transform الثابتة بالكامل أثناء
// التحريك (ما تُدمَج تلقائياً) — فصل الدوران الثابت عن الحركة المتحركة بعنصرين
// منفصلين يتفادى هذا التعارض.

import { useMemo } from 'react';

const STAR_COUNT = 160;
const MAX_TRAVEL = 900; // px — يكفي لتغطية أي حجم شاشة معقول

const STAR_COLORS = ['#dce8ff', '#ffffff', '#fff4d9', '#cfe3ff'];

function generateWarpStars() {
  return Array.from({ length: STAR_COUNT }, (_, i) => ({
    id: i,
    angleDeg: Math.random() * 360,
    duration: Math.random() * 2.5 + 2.5, // 2.5–5 ثانية لكل "رحلة" نجم واحد
    delay: -Math.random() * 6, // تأخير سالب = يبدأ التحريك بمنتصف الدورة فوراً، بدل ما كل النجوم "تولد" مع بعض بلحظة الفتح
    length: Math.random() * 30 + 14,
    thickness: Math.random() * 1.3 + 0.6,
    color: STAR_COLORS[i % STAR_COLORS.length],
  }));
}

export function ScreensaverWarp({ onDismiss }) {
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
                position: 'absolute', top: -s.thickness / 2, left: 0,
                width: s.length, height: s.thickness, borderRadius: s.thickness,
                background: `linear-gradient(to right, transparent, ${s.color})`,
                animation: `priora-warp-fly ${s.duration}s cubic-bezier(.4,0,.8,1) ${s.delay}s infinite`,
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
          Move or click to continue
        </p>
      </div>

      <style>{`
        @keyframes priora-warp-fly {
          0% { transform: translateX(0) scaleX(.3); opacity: 0; }
          12% { opacity: 1; }
          85% { opacity: 1; }
          100% { transform: translateX(${MAX_TRAVEL}px) scaleX(1); opacity: 0; }
        }
        @keyframes priora-logo-glow {
          0%, 100% { filter: drop-shadow(0 0 6px rgba(99,140,255,.25)) brightness(.92); }
          50% { filter: drop-shadow(0 0 28px rgba(120,160,255,.75)) brightness(1.15); }
        }
      `}</style>
    </div>
  );
}
