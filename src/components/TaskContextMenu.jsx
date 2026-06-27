// TaskContextMenu.jsx
// قائمة سياق (right-click) لتاسك بصفحة المجلد — نسخة مُعاد كتابتها بوضوح من المكوّن
// it بالكود الأصلي.
//
// ملاحظات سلوكية محفوظة من الأصل:
// 1. "Mark Complete" و "Mark as Urgent" يظهران فقط لو التاسك غير مُغلق (status !== closed).
// 2. "Share to Workspace" (قائمة فرعية بمربعات اختيار) تظهر فقط لو التاسك شخصي
//    (workspaceId === null) وفيه ورك سبيسات فعلية موجودة — تاسكات الورك سبيس نفسها
//    لا تُشارك (لأنها بالأساس جزء من ورك سبيس، مش شخصية).
// 3. الموضع (x, y) يُصحَّح تلقائياً عشان القائمة ما تطلع خارج حدود الشاشة.

import { useEffect, useRef, useState } from 'react';
import { useTasksStore } from '../store/tasksStore';
import { useWorkspacesStore } from '../store/workspacesStore';

function MenuItem({ icon, label, danger, action, onClose }) {
  return (
    <button className={`ctx-item${danger ? ' danger' : ''}`} onClick={() => { action(); onClose(); }}>
      {icon}
      {label}
    </button>
  );
}

export function TaskContextMenu({ x, y, taskId, onClose, onUpdate, onDetail, onEdit, onToggleUrgent, onComplete, onDelete, onReport, onMove }) {
  const tasks = useTasksStore((s) => s.tasks);
  const shareTaskToWs = useTasksStore((s) => s.shareTaskToWs);
  const unshareTaskFromWs = useTasksStore((s) => s.unshareTaskFromWs);
  const workspaces = useWorkspacesStore((s) => s.workspaces);

  const task = tasks.find((t) => t.id === taskId);
  const containerRef = useRef(null);
  const [showShareSubmenu, setShowShareSubmenu] = useState(false);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) onClose();
    }
    function handleEscape(e) {
      if (e.key === 'Escape') onClose();
    }
    const timeoutId = setTimeout(() => document.addEventListener('mousedown', handleClickOutside), 0);
    document.addEventListener('keydown', handleEscape);
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  if (!task) return null;

  const adjustedX = Math.min(x, window.innerWidth - 210);
  const adjustedY = Math.min(y, window.innerHeight - 280);
  const isClosed = task.status === 'closed';
  const isUrgent = task.priority === 'urgent';
  const isPersonalTask = task.workspaceId === null;
  const sharedToWsIds = task.sharedToWsIds ?? [];

  function toggleShareToWorkspace(wsId) {
    if (sharedToWsIds.includes(wsId)) unshareTaskFromWs(taskId, wsId);
    else shareTaskToWs(taskId, wsId);
  }

  return (
    <div ref={containerRef} className="ctx-menu" style={{ left: adjustedX, top: adjustedY }}>
      <MenuItem
        onClose={onClose}
        action={onDetail}
        label="View Details"
        icon={
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        }
      />
      <MenuItem
        onClose={onClose}
        action={onEdit}
        label="Edit Task"
        icon={
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        }
      />
      {isPersonalTask && onMove && (
        <MenuItem
          onClose={onClose}
          action={onMove}
          label="Move to Folder…"
          icon={
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              <line x1="12" y1="11" x2="12" y2="17" />
              <polyline points="9 14 12 11 15 14" />
            </svg>
          }
        />
      )}

      {!isClosed && (
        <>
          <MenuItem
            onClose={onClose}
            action={onUpdate}
            label="Add Update"
            icon={
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            }
          />
          <MenuItem
            onClose={onClose}
            action={onComplete}
            label="Mark Complete"
            icon={
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            }
          />
          <div className="ctx-sep" />
          <MenuItem
            onClose={onClose}
            action={onToggleUrgent}
            label={isUrgent ? 'Remove Urgent' : 'Mark as Urgent'}
            icon={
              <svg width="12" height="12" viewBox="0 0 14 14" fill={isUrgent ? 'var(--red)' : 'var(--text3)'}>
                <polygon points="7,1 13,13 1,13" />
              </svg>
            }
          />
        </>
      )}

      {isPersonalTask && workspaces.length > 0 && (
        <>
          <div className="ctx-sep" />
          <div style={{ position: 'relative' }}>
            <button className="ctx-item" onClick={() => setShowShareSubmenu((v) => !v)}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
              </svg>
              Share to Workspace
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginInlineStart: 'auto', transform: showShareSubmenu ? 'rotate(180deg)' : 'none', transition: '.12s' }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {showShareSubmenu && (
              <div style={{ padding: '4px 0 4px 16px', background: 'var(--surface2)', borderTop: '1px solid var(--border)' }}>
                {workspaces.map((ws) => {
                  const isShared = sharedToWsIds.includes(ws.id);
                  return (
                    <button
                      key={ws.id}
                      onClick={() => toggleShareToWorkspace(ws.id)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px 7px 0',
                        background: 'none', border: 'none', cursor: 'pointer', textAlign: 'start', fontFamily: 'var(--font)',
                        fontSize: 12, color: isShared ? 'var(--accent)' : 'var(--text2)', transition: 'color .1s',
                      }}
                    >
                      <div style={{ width: 14, height: 14, borderRadius: 3, flexShrink: 0, border: `1.5px solid ${isShared ? 'var(--accent)' : 'var(--border2)'}`, background: isShared ? 'var(--accent)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {isShared && (
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ws.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      <div className="ctx-sep" />
      <MenuItem
        onClose={onClose}
        action={onReport}
        label="Generate Report"
        icon={
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        }
      />
      <div className="ctx-sep" />
      <MenuItem
        onClose={onClose}
        action={onDelete}
        label="Delete Task"
        danger
        icon={
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        }
      />
    </div>
  );
}
