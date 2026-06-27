// ToastRenderer.jsx
// عارض التنبيهات المؤقتة (toasts) — يُعرض بزاوية الشاشة، نسخة مُعاد كتابتها بوضوح
// من المكوّن Wt بالكود الأصلي.

import { useToastStore } from '../store/toastStore';

export function ToastRenderer() {
  const toasts = useToastStore((s) => s.toasts);
  const remove = useToastStore((s) => s.remove);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-wrap">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type === 'err' ? 'err' : ''}`} onClick={() => remove(t.id)}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}
