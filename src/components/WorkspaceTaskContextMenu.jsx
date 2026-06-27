// WorkspaceTaskContextMenu.jsx
// قائمة سياق (right-click) لتاسك بصفحة تفاصيل الورك سبيس — نسخة مُعاد كتابتها بوضوح
// من المكوّن xt بالكود الأصلي.
//
// ملاحظة صلاحيات مهمة محفوظة من الأصل: isOwner هنا تعني "صاحب التاسك الفردي"
// (task.ownerId === currentUser.uid) — وليس "مالك الورك سبيس". خيارات Edit/Complete/
// Urgent/Delete تظهر فقط لصاحب التاسك، أي عضو آخر بالورك سبيس يشوف فقط
// View Details و Add Update.

import { useEffect, useRef } from 'react';

function MenuItem({ icon, label, danger, action, onClose }) {
  return (
    <button className={`ctx-item${danger ? ' danger' : ''}`} onClick={() => { action(); onClose(); }}>
      {icon}
      {label}
    </button>
  );
}

export function WorkspaceTaskContextMenu({ x, y, task, isOwner, onClose, onUpdate, onEdit, onDetail, onToggleUrgent, onComplete, onDelete }) {
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) onClose();
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

  const adjustedX = Math.min(x, window.innerWidth - 200);
  const adjustedY = Math.min(y, window.innerHeight - 250);

  return (
    <div ref={containerRef} className="ctx-menu" style={{ position: 'fixed', left: adjustedX, top: adjustedY, zIndex: 9999 }}>
      <MenuItem
        onClose={onClose}
        action={onDetail}
        label="View Details"
        icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>}
      />
      <MenuItem
        onClose={onClose}
        action={onUpdate}
        label="Add Update"
        icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>}
      />

      {isOwner && task.status !== 'closed' && (
        <>
          <MenuItem
            onClose={onClose}
            action={onEdit}
            label="Edit Task"
            icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>}
          />
          <MenuItem
            onClose={onClose}
            action={onComplete}
            label="Mark Complete"
            icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>}
          />
          <div className="ctx-sep" />
          <MenuItem
            onClose={onClose}
            action={onToggleUrgent}
            label={task.priority === 'urgent' ? 'Remove Urgent' : 'Mark Urgent'}
            icon={<svg width="12" height="12" viewBox="0 0 14 14" fill={task.priority === 'urgent' ? 'var(--red)' : 'var(--text3)'}><polygon points="7,1 13,13 1,13" /></svg>}
          />
        </>
      )}

      {isOwner && (
        <>
          <div className="ctx-sep" />
          <MenuItem
            onClose={onClose}
            action={onDelete}
            label="Delete Task"
            danger
            icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>}
          />
        </>
      )}
    </div>
  );
}
