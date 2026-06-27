// Modal.jsx
// مكوّن المودال العام (Generic Modal) — يُستخدم بكل مودالز التطبيق.
// نسخة مُعاد كتابتها بوضوح من المكوّن `$` بالكود الأصلي.
//
// ملاحظة سلوكية مهمة محفوظة من الأصل: معالجة مفتاح Escape "تدري" عن المودالز المتداخلة
// (لو فيه أكثر من مودال مفتوح بنفس الوقت، بـ z-index مختلفة) — تتأكد إن هذا المودال هو
// الأعلى (أكبر z-index) قبل ما تغلقه بزر Escape، وإلا تتركه للمودال الأعلى يتصرف.
//
// ⚠️ إضافة جديدة (مو موجودة بالأصل، بطلب صريح): closeOnOutsideClick — يسمح بإغلاق
// المودال بالضغط خارجه. القيمة الافتراضية false (محمي) — أي مودال فيه إدخال/تعديل
// بيانات (نماذج إنشاء/تعديل) يبقى محمي من الإغلاق العرضي بفقدان البيانات المكتوبة.
// المودالز التي تعرض معلومات فقط (تفاصيل، سجل نشاط) تُمرّر closeOnOutsideClick={true}
// صريحاً من المكوّن المستخدم لها.
//
// ملاحظة بنية: يستخدم createPortal لرندر المودال مباشرة بـ document.body (بعيد عن شجرة
// React الأصلية) — هذا يحتاج 'react-dom' (وليس فقط 'react').

import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export function Modal({ title, onClose, children, maxWidth = 480, zIndex = 1000, disableEscape = false, closeOnOutsideClick = false }) {
  useEffect(() => {
    if (disableEscape) return;

    function handleKeyDown(e) {
      if (e.key !== 'Escape') return;

      const overlays = document.querySelectorAll('.modal-overlay');
      const highestZIndex = Array.from(overlays).reduce((max, el) => {
        const z = parseInt(el.style.zIndex || '0', 10);
        return z > max ? z : max;
      }, 0);

      // لو هذا المودال مش الأعلى (فيه مودال آخر فوقه)، نتجاهل Escape — يخليها للمودال الأعلى.
      if (zIndex < highestZIndex) return;

      e.stopPropagation();
      onClose();
    }

    document.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => document.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [onClose, disableEscape, zIndex]);

  /**
   * يغلق المودال فقط لو الضغط كان على الطبقة الخلفية (overlay) نفسها مباشرة —
   * وليس على أي عنصر بداخل صندوق المودال. هذا يتأكد منه onClick بالـ overlay،
   * بالتوازي مع stopPropagation داخل modal-box (يمنع الكليك جوّا يوصل برّا أصلاً) —
   * طبقة حماية مضاعفة بسيطة، نفس النمط الشائع لهذي الميزة.
   */
  function handleOverlayClick(e) {
    if (!closeOnOutsideClick) return;
    if (e.target === e.currentTarget) onClose();
  }

  return createPortal(
    <div className="modal-overlay" style={{ zIndex }} onClick={handleOverlayClick}>
      <div className="modal-box" style={{ maxWidth }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 17,
              cursor: 'pointer',
              color: 'var(--text3)',
              lineHeight: 1,
              padding: '3px 6px',
              borderRadius: 5,
              transition: 'background .12s, color .12s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--surface2)';
              e.currentTarget.style.color = 'var(--text)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'none';
              e.currentTarget.style.color = 'var(--text3)';
            }}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body
  );
}
