// AnimatedBackground.jsx
// خلفية متحركة (canvas) لشاشة تسجيل الدخول — نقاط متصلة + توهجات لونية + شعاع متحرك.
// نسخة مُعاد كتابتها بوضوح من المكوّن `Ht` بالكود الأصلي. منطق الرسم نُسخ 1:1
// (نفس الألوان، نفس السرعات، نفس نسب الشفافية) — هذا مكوّن بصري بحت، أي تغيير بالأرقام
// يغيّر شكل الأنيميشن، فتم الحفاظ عليها حرفياً.

import { useEffect, useRef } from 'react';

const PARTICLE_COLORS = [
  [59, 130, 246],
  [99, 102, 241],
  [16, 185, 129],
  [139, 92, 246],
];

const GLOW_SPOTS = [
  { x: 0.12, y: 0.15, r: 0.55, color: [20, 60, 180], a: 0.28 },
  { x: 0.82, y: 0.72, r: 0.5, color: [80, 40, 180], a: 0.22 },
  { x: 0.48, y: 0.55, r: 0.4, color: [0, 80, 140], a: 0.18 },
  { x: 0.15, y: 0.82, r: 0.38, color: [0, 130, 100], a: 0.2 },
  { x: 0.7, y: 0.1, r: 0.3, color: [120, 60, 200], a: 0.14 },
];

export function AnimatedBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width = 0;
    let height = 0;
    let animationFrameId = 0;
    let particles = [];
    let beamOffset = 0;

    function resize() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    }

    function initParticles() {
      resize();
      const count = Math.max(14, Math.floor((width * height) / 14000));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r: Math.random() * 1.6 + 0.5,
        color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
        alpha: Math.random() * 0.5 + 0.2,
      }));
    }
    initParticles();

    function drawBackground() {
      ctx.fillStyle = '#010409';
      ctx.fillRect(0, 0, width, height);

      GLOW_SPOTS.forEach((spot) => {
        const cx = spot.x * width;
        const cy = spot.y * height;
        const radius = spot.r * Math.min(width, height);
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        const [r, g, b] = spot.color;
        gradient.addColorStop(0, `rgba(${r},${g},${b},${spot.a})`);
        gradient.addColorStop(0.45, `rgba(${r},${g},${b},${(spot.a * 0.3).toFixed(2)})`);
        gradient.addColorStop(1, `rgba(${r},${g},${b},0)`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.strokeStyle = 'rgba(120,160,255,0.04)';
      ctx.lineWidth = 0.5;
      for (let x = 0; x <= width + 60; x += 60) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y <= height + 60; y += 60) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }

    function drawBeam() {
      beamOffset = (beamOffset + 0.6) % (height + 200);
      const gradient = ctx.createLinearGradient(0, beamOffset - 150, 0, beamOffset + 150);
      gradient.addColorStop(0, 'rgba(80,140,255,0)');
      gradient.addColorStop(0.35, 'rgba(80,140,255,.04)');
      gradient.addColorStop(0.5, 'rgba(100,170,255,.08)');
      gradient.addColorStop(0.65, 'rgba(80,140,255,.04)');
      gradient.addColorStop(1, 'rgba(80,140,255,0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, beamOffset - 150, width, 300);
    }

    function drawParticles() {
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -30) p.x = width + 30;
        if (p.x > width + 30) p.x = -30;
        if (p.y < -30) p.y = height + 30;
        if (p.y > height + 30) p.y = -30;
      });

      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.strokeStyle = `rgba(80,150,255,${(1 - dist / 150) * 0.18})`;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      particles.forEach((p) => {
        const [r, g, b] = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 1.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${Math.min(p.alpha * 1.6, 1)})`;
        ctx.fill();
      });
    }

    function frame() {
      drawBackground();
      drawBeam();
      drawParticles();
      animationFrameId = requestAnimationFrame(frame);
    }

    animationFrameId = requestAnimationFrame(frame);
    window.addEventListener('resize', initParticles);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', initParticles);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, zIndex: 0 }}
    />
  );
}
