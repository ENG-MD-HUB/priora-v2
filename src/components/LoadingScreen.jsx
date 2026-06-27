// LoadingScreen.jsx
// شاشة التحميل الأولية (تظهر بينما يتأكد التطبيق من حالة تسجيل الدخول) — نسخة
// مُعاد كتابتها بوضوح من المكوّن Kt بالكود الأصلي.

import { useUIStore } from '../store/uiStore';

export function LoadingScreen() {
  const theme = useUIStore((s) => s.theme);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, zIndex: 9999 }}>
      <img src={theme === 'dark' ? '/logo-night.png' : '/logo-day.png'} alt="Priora" style={{ height: 44, objectFit: 'contain', opacity: 0.9 }} />
      <div style={{ width: 28, height: 28, border: '3px solid color-mix(in srgb, var(--accent) 20%, transparent)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
}
