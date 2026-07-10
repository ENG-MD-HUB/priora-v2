// ScreensaverAurora.jsx
// تصميم بديل لشاشة التوقف — موج ضوئي هادئ متدرّج الألوان (يشبه الشفق القطبي
// Aurora) يتحرك ببطء بالخلفية، والشعار بالمنتصف بنفس وميض التوهج.
//
// ⚠️ تصحيح خلل حقيقي بطلب صريح: الكتل كانت تتحرك بالموضع فقط (translate/scale)،
// لكن ألوانها نفسها (أزرق، بنفسجي، فيروزي) كانت ثابتة تماماً طول الوقت — نفس
// الدرجة من البداية للنهاية، بدون أي تغيّر لوني حقيقي. إضافة hue-rotate متحرك
// (الطريقة الموثوقة لتحريك ألوان تدرّج بكل المتصفحات — تحريك خاصية background
// نفسها بـkeyframes غير مدعوم بثبات) لكل كتلة لحالها بسرعة مختلفة، فتتحول
// الألوان فعلياً بمرور الوقت (أزرق يميل بنفسجي، بنفسجي يميل فيروزي، وهكذا) —
// بدل موضع متحرك بلون جامد.

export function ScreensaverAurora({ onDismiss }) {

  return (
    <div
      onClick={onDismiss}
      style={{
        position: 'fixed', inset: 0, zIndex: 99999, background: '#04050a',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', overflow: 'hidden', animation: 'fade-in .6s ease',
      }}
    >
      <div style={{ position: 'absolute', inset: '-20%', filter: 'blur(60px)', opacity: .35 }}>
        <div style={{ position: 'absolute', width: '60%', height: '60%', left: '5%', top: '10%', borderRadius: '50%', background: 'radial-gradient(circle, #4f7cff, transparent 70%)', animation: 'priora-aurora-drift-1 18s ease-in-out infinite, priora-aurora-hue-1 24s linear infinite' }} />
        <div style={{ position: 'absolute', width: '50%', height: '50%', left: '45%', top: '40%', borderRadius: '50%', background: 'radial-gradient(circle, #7d5fff, transparent 70%)', animation: 'priora-aurora-drift-2 22s ease-in-out infinite, priora-aurora-hue-2 32s linear infinite reverse' }} />
        <div style={{ position: 'absolute', width: '45%', height: '45%', left: '20%', top: '55%', borderRadius: '50%', background: 'radial-gradient(circle, #2fd4c9, transparent 70%)', animation: 'priora-aurora-drift-3 26s ease-in-out infinite, priora-aurora-hue-3 28s linear infinite' }} />
      </div>

      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
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
        @keyframes priora-aurora-drift-1 { 0%, 100% { transform: translate(0,0) scale(1); } 50% { transform: translate(8%,5%) scale(1.15); } }
        @keyframes priora-aurora-drift-2 { 0%, 100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-10%,8%) scale(1.1); } }
        @keyframes priora-aurora-drift-3 { 0%, 100% { transform: translate(0,0) scale(1); } 50% { transform: translate(6%,-8%) scale(1.2); } }
        @keyframes priora-aurora-hue-1 { 0% { filter: hue-rotate(0deg); } 100% { filter: hue-rotate(360deg); } }
        @keyframes priora-aurora-hue-2 { 0% { filter: hue-rotate(0deg); } 100% { filter: hue-rotate(360deg); } }
        @keyframes priora-aurora-hue-3 { 0% { filter: hue-rotate(0deg); } 100% { filter: hue-rotate(360deg); } }
        @keyframes priora-logo-glow {
          0%, 100% { filter: drop-shadow(0 0 6px rgba(99,140,255,.25)) brightness(.92); }
          50% { filter: drop-shadow(0 0 28px rgba(120,160,255,.75)) brightness(1.15); }
        }
      `}</style>
    </div>
  );
}
