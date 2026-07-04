// FolderContextMenu.jsx
// قائمة سياق (right-click) لمجلد بالشريط الجانبي — نسخة مُعاد كتابتها بوضوح من
// المكوّن Ie بالكود الأصلي. خيار "Delete Folder" يُستبدل برسالة توضيحية لو كان هذا
// آخر مجلد رئيسي متبقي (canDelete=false).
//
// ⚠️ إضافة جديدة بطلب صريح: "New Subfolder" يظهر فقط للمجلدات الرئيسية (isRoot=true)
// — المجلد الفرعي لا يقدر يحتوي مجلد فرعي تحته (مستوى واحد فقط).
//
// ملاحظة توقيت محفوظة من الأصل: مستمعي الإغلاق (click خارجي / Escape) يُسجَّلون بعد
// تأخير 10ms (setTimeout) — هذا يمنع نفس حدث الـ right-click اللي فتح القائمة من
// إغلاقها فوراً (لأن click خارجي قد يُسجَّل كجزء من نفس سلسلة الأحداث).

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';

export function FolderContextMenu({ folder, x, y, onClose, onRename, onDelete, onAddSubfolder, canDelete, isRoot }) {
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose();
    }
    function handleEscape(e) {
      if (e.key === 'Escape') onClose();
    }
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside, { capture: true });
      document.addEventListener('keydown', handleEscape);
    }, 10);
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside, { capture: true });
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // ⚠️ إصلاح جذري بطلب صريح: القائمة كانت تُرندر كعنصر عادي داخل <aside
  // className="app-sidebar">، وهذا العنصر عنده position:sticky. أي ancestor عنده
  // sticky/transform/filter/backdrop-filter/will-change يصير "containing block"
  // لأي descendant عنده position:fixed تحته — يعني z-index:9999 هنا كان يُقيَّم
  // محلياً بس داخل نطاق السايد بار، مو مقابل الصفحة كاملة. النتيجة: عناصر من
  // منطقة المحتوى الرئيسي (main) كانت تظهر فوق القائمة رغم z-index العالي.
  //
  // الحل: نفس تقنية Modal.jsx بالضبط (createPortal لـdocument.body) — يهرب كلياً
  // من أي containing block محلي، ويضمن ترتيب طبقات صحيح مقابل الصفحة كاملة.
  return createPortal(
    <div
      ref={menuRef}
      className="ctx-menu"
      style={{ position: 'fixed', left: Math.min(x, window.innerWidth - 200), top: Math.min(y, window.innerHeight - 150), zIndex: 9999 }}
    >
      <button className="ctx-item" onClick={() => { onRename(); onClose(); }}>
        <Icon name="edit2" size={13} /> Edit
      </button>
      {isRoot && (
        <button className="ctx-item" onClick={() => { onAddSubfolder(); onClose(); }}>
          <Icon name="plus" size={13} /> New Subfolder
        </button>
      )}
      <div className="ctx-sep" />
      {canDelete ? (
        <button className="ctx-item danger" onClick={() => { onDelete(); onClose(); }}>
          <Icon name="trash" size={13} /> Delete Folder
        </button>
      ) : (
        <div style={{ padding: '7px 14px', fontSize: 11, color: 'var(--text3)', fontStyle: 'italic' }}>
          Can't delete last main folder
        </div>
      )}
    </div>,
    document.body
  );
}
