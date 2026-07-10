// ScreensaverAurora.jsx
// تصميم بديل لشاشة التوقف — موج ضوئي هادئ متدرّج الألوان (يشبه الشفق القطبي
// Aurora) يتحرك ببطء بالخلفية، والشعار بالمنتصف بنفس وميض التوهج.
//
// ⚠️ تصحيح بطلب صريح (تراجع + تحسين): محاولة سابقة غيّرت الألوان نفسها بمرور
// الوقت (hue-rotate) — لم تعجب المستخدم، يبيها ترجع لألوانها الأساسية الثابتة
// (أزرق/بنفسجي/فيروزي كما كانت أصلاً) بس الحركة نفسها تصير عشوائية وغير منتظمة
// أكتر (مسار متعدد النقاط بدل ذهاب-إياب متماثل بسيط)، والشكل نفسه غير منتظم
// (border-radius متحرك بنسب غير متساوية — تأثير "blob" عضوي، بدل دائرة مثالية
// ثابتة الشكل تكبر/تصغر فقط).

export function ScreensaverAurora({ onDismiss, caption, brand }) {

  return (
    <div
      onClick={onDismiss}
      style={{
        position: 'fixed', inset: 0, zIndex: 99999, background: '#04050a',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', overflow: 'hidden', animation: 'fade-in .6s ease',
      }}
    >
      {/* ⚠️ تصحيح خلل حقيقي بطلب صريح ("متجانسة، ما يبين فيها بقع"): كانت الكتل
          الثلاث واضحة كدوائر منفصلة رغم الـblur — السبب: blur خفيف نسبياً (60px)
          + مساحات تراكب قليلة + خلط ألوان عادي (كل كتلة ترسم فوق الثانية بشكل
          طبيعي، حواف واضحة عند التقاطع). الحل: blur أقوى بكثير (130px) + تراكب
          أكبر بين الكتل (أحجام أكبر ومواضع أقرب من بعض) + mix-blend-mode:screen
          (يخلط الألوان المتراكبة زي الضوء الحقيقي، بدون حواف صلبة) — نفس الألوان
          الأساسية بالضبط (أزرق/بنفسجي/فيروزي)، بس تركيبة مدموجة مو بقع منفصلة. */}
      <div style={{ position: 'absolute', inset: '-30%', filter: 'blur(130px)', opacity: .5 }}>
        <div style={{ position: 'absolute', width: '75%', height: '75%', left: '2%', top: '5%', background: 'radial-gradient(circle, #4f7cff, transparent 70%)', mixBlendMode: 'screen', animation: 'priora-aurora-drift-1 27s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', width: '68%', height: '68%', left: '38%', top: '32%', background: 'radial-gradient(circle, #7d5fff, transparent 70%)', mixBlendMode: 'screen', animation: 'priora-aurora-drift-2 33s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', width: '62%', height: '62%', left: '18%', top: '42%', background: 'radial-gradient(circle, #2fd4c9, transparent 70%)', mixBlendMode: 'screen', animation: 'priora-aurora-drift-3 39s ease-in-out infinite' }} />
      </div>

      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <img
          src="/logo-night.png"
          alt="Priora"
          style={{ height: 56, objectFit: 'contain', animation: 'priora-logo-glow 4s ease-in-out infinite' }}
        />
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,.3)', letterSpacing: '.08em', textTransform: 'uppercase' }}>
          Click to continue
        </p>
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
        /* ⚠️ مسارات غير منتظمة عمداً — نقاط توقف بنسب مختلفة (0/22/41/63/85/100
           مو 0/50/100 المتماثلة)، وكل نقطة توقف لها إزاحة واتجاه وحجم وشكل مختلف
           تماماً عن الثانية (border-radius غير متساوي الأركان بكل خطوة) — يعطي
           إحساس حركة عضوية عشوائية حقيقية، بدل تذبذب آلي متكرر بنمط واحد. */
        @keyframes priora-aurora-drift-1 {
          0%   { transform: translate(0,0) scale(1); border-radius: 42% 58% 65% 35%/45% 40% 60% 55%; }
          22%  { transform: translate(9%,4%) scale(1.12); border-radius: 60% 40% 30% 70%/50% 65% 35% 50%; }
          41%  { transform: translate(4%,11%) scale(0.94); border-radius: 35% 65% 55% 45%/60% 30% 70% 40%; }
          63%  { transform: translate(-7%,6%) scale(1.08); border-radius: 55% 45% 40% 60%/35% 55% 45% 65%; }
          85%  { transform: translate(-3%,-5%) scale(0.97); border-radius: 48% 52% 60% 40%/55% 45% 50% 50%; }
          100% { transform: translate(0,0) scale(1); border-radius: 42% 58% 65% 35%/45% 40% 60% 55%; }
        }
        @keyframes priora-aurora-drift-2 {
          0%   { transform: translate(0,0) scale(1); border-radius: 50% 50% 40% 60%/60% 45% 55% 40%; }
          18%  { transform: translate(-10%,7%) scale(1.15); border-radius: 65% 35% 55% 45%/40% 60% 35% 65%; }
          44%  { transform: translate(-4%,-8%) scale(0.9); border-radius: 38% 62% 45% 55%/55% 35% 65% 40%; }
          70%  { transform: translate(8%,3%) scale(1.1); border-radius: 58% 42% 60% 40%/45% 55% 40% 60%; }
          88%  { transform: translate(3%,9%) scale(0.95); border-radius: 45% 55% 50% 50%/50% 40% 55% 50%; }
          100% { transform: translate(0,0) scale(1); border-radius: 50% 50% 40% 60%/60% 45% 55% 40%; }
        }
        @keyframes priora-aurora-drift-3 {
          0%   { transform: translate(0,0) scale(1); border-radius: 55% 45% 50% 50%/40% 55% 45% 60%; }
          26%  { transform: translate(6%,-9%) scale(1.18); border-radius: 40% 60% 65% 35%/60% 40% 55% 45%; }
          48%  { transform: translate(-9%,-3%) scale(0.92); border-radius: 62% 38% 40% 60%/45% 60% 35% 55%; }
          67%  { transform: translate(-2%,8%) scale(1.05); border-radius: 48% 52% 55% 45%/55% 45% 60% 40%; }
          90%  { transform: translate(5%,2%) scale(0.98); border-radius: 50% 50% 45% 55%/50% 50% 45% 55%; }
          100% { transform: translate(0,0) scale(1); border-radius: 55% 45% 50% 50%/40% 55% 45% 60%; }
        }
        @keyframes priora-logo-glow {
          0%, 100% { filter: drop-shadow(0 0 6px rgba(99,140,255,.25)) brightness(.92); }
          50% { filter: drop-shadow(0 0 28px rgba(120,160,255,.75)) brightness(1.15); }
        }
      `}</style>
    </div>
  );
}
