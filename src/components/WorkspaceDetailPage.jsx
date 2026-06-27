// WorkspaceDetailPage.jsx
// صفحة تفاصيل الورك سبيس الكاملة — نسخة مُعاد كتابتها بوضوح من المكوّن Dt بالكود
// الأصلي (الأكبر بكل المشروع، ~719 سطر بالأصل).
//
// ميزة مهمة محفوظة من الأصل: كشف "فقدان الوصول" — لو المستخدم الحالي ما عاد موجود
// بقائمة أعضاء الورك سبيس (مثلاً المالك شاله)، تظهر شاشة "Workspace Unavailable"
// بدل محتوى الورك سبيس، مع خيار "إزالة من القائمة المحلية والرجوع".

import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { useWorkspacesStore } from '../store/workspacesStore';
import { useTasksStore } from '../store/tasksStore';
import { wsTaskService } from '../services/wsTaskService';
import { useWorkspaceTasks } from '../utils/useWorkspaceTasks';
import { useWorkspaceMembers } from '../utils/useWorkspaceMembers';
import { sortTasks } from '../utils/sortTasks';
import { searchTasks } from '../utils/searchTasks';
import { SORT_FIELD_OPTIONS } from '../utils/taskListConstants';
import { Modal } from './Modal';
import { WorkspaceStatsBar } from './WorkspaceStatsBar';
import { WorkspaceTaskRow, WS_TASK_ROW_GRID_COLUMNS } from './WorkspaceTaskRow';
import { WorkspaceTaskContextMenu } from './WorkspaceTaskContextMenu';
import { NewWorkspaceTaskModal } from './NewWorkspaceTaskModal';
import { WorkspaceTaskUpdateModal } from './WorkspaceTaskUpdateModal';
import { WorkspaceTaskDetailModal } from './WorkspaceTaskDetailModal';
import { WorkspaceTaskEditModal } from './WorkspaceTaskEditModal';
import { ActivityLogModal } from './ActivityLogModal';

const TABLE_HEADERS = ['Name', 'Last Action', 'Updated', 'Follow-up', 'Status', 'Actions'];

export function WorkspaceDetailPage({ ws, onBack, onSwitch, initialDetailTaskId, onInitialDetailTaskHandled }) {
  const user = useAuthStore((s) => s.user);
  const workspaces = useWorkspacesStore((s) => s.workspaces);
  const removeWorkspace = useWorkspacesStore((s) => s.removeWorkspace);
  const { tasks, loading } = useWorkspaceTasks(ws.id);
  const members = useWorkspaceMembers(ws.id);

  const [accessLost, setAccessLost] = useState(false);
  useEffect(() => {
    if (members.length !== 0) {
      setAccessLost(!members.some((m) => m.uid === user?.uid));
    }
  }, [members, user?.uid]);

  const [statusFilter, setStatusFilter] = useState('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ field: 'lastUpdate', dir: 'desc' });
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showSwitchMenu, setShowSwitchMenu] = useState(false);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);
  const lastUpdatedTaskRef = useRef(null);
  const [detailTask, setDetailTask] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [ctxMenu, setCtxMenu] = useState(null);

  // ⚠️ ميزة جديدة بطلب صريح: لما نوصل لهذي الصفحة بنية فتح تفاصيل تاسك معيّن تلقائياً
  // (من قسم "Workspaces — needs attention" باللوحة الرئيسية)، نفتح المودال أول ما
  // تتوفر بيانات التاسك فعلياً من الاشتراك اللحظي (تاسكات الورك سبيس تُجلب
  // بشكل غير متزامن، فلازم ننتظر تحميلها قبل أي محاولة فتح).
  useEffect(() => {
    if (!initialDetailTaskId || loading) return;
    const target = tasks.find((t) => t.id === initialDetailTaskId);
    if (target) {
      setDetailTask(target);
      onInitialDetailTaskHandled?.();
    }
  }, [initialDetailTaskId, loading, tasks]);
  const [deletingTask, setDeletingTask] = useState(null);
  const [showActivityLog, setShowActivityLog] = useState(false);

  let filtered = statusFilter === 'closed' ? tasks.filter((t) => t.status === 'closed') : statusFilter === 'active' ? tasks.filter((t) => t.status !== 'closed') : tasks;
  if (searchQuery.trim()) filtered = searchTasks(filtered, searchQuery);
  filtered = sortTasks(filtered, sortConfig);

  const otherWorkspaces = workspaces.filter((w) => w.id !== ws.id);

  function handleSort(field) {
    setSortConfig((prev) => (prev.field === field ? { ...prev, dir: prev.dir === 'desc' ? 'asc' : 'desc' } : { field, dir: 'desc' }));
    setShowSortMenu(false);
  }

  if (accessLost) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '40vh', gap: 16, animation: 'fade-in .2s ease' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'color-mix(in srgb,var(--red) 10%,var(--surface))', border: '1px solid color-mix(in srgb,var(--red) 30%,var(--border))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2">
            <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
          </svg>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>Workspace Unavailable</div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 16, maxWidth: 280 }}>
            You no longer have access to <strong>{ws.name}</strong>. You may have been removed by the owner.
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button onClick={() => { removeWorkspace(ws.id); onBack(); }} style={{ padding: '8px 18px', background: 'var(--red)', color: '#fff', border: 'none', borderRadius: 7, fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
              Remove & Go Back
            </button>
            <button onClick={onBack} style={{ padding: '8px 18px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 7, fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text2)', cursor: 'pointer' }}>
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fade-in .2s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap', padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', boxShadow: 'var(--shadow)' }}>
        <button onClick={onBack} className="btn-cancel" style={{ padding: '5px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          Back
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ws.name}</div>
          {ws.description && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{ws.description}</div>}
        </div>

        {otherWorkspaces.length > 0 && (
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button onClick={() => setShowSwitchMenu((v) => !v)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text2)', cursor: 'pointer' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /></svg>
              Switch
            </button>
            {showSwitchMenu && (
              <>
                <div style={{ position: 'fixed', inset: 0, zIndex: 400 }} onClick={() => setShowSwitchMenu(false)} />
                <div style={{ position: 'absolute', top: '100%', insetInlineEnd: 0, marginTop: 4, zIndex: 500, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, boxShadow: 'var(--shadow-lg)', minWidth: 180, overflow: 'hidden' }}>
                  {otherWorkspaces.map((w) => (
                    <button key={w.id} onClick={() => { setShowSwitchMenu(false); onSwitch?.(w.id); }} style={{ width: '100%', padding: '9px 14px', background: 'none', border: 'none', textAlign: 'start', fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text2)', cursor: 'pointer' }} onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface2)')} onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}>
                      {w.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        <button onClick={() => setShowNewTaskModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 6, fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, cursor: 'pointer', flexShrink: 0 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Add Task
        </button>
      </div>

      <WorkspaceStatsBar tasks={tasks} onShowLog={() => setShowActivityLog(true)} />

      <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap', alignItems: 'center', rowGap: 8 }}>
        <div className="ws-filter-row-search" style={{ position: 'relative' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ position: 'absolute', top: '50%', left: 9, transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none' }}>
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks…"
            style={{ width: '100%', boxSizing: 'border-box', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12, color: 'var(--text)', padding: '6px 10px 6px 30px', outline: 'none', fontFamily: 'var(--font)' }}
            onFocus={(e) => (e.target.style.borderColor = 'var(--accent)')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
          />
        </div>

        <div className="ws-filter-row-chips" style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {[
            { id: 'active', label: `Active (${tasks.filter((t) => t.status !== 'closed').length})` },
            { id: 'all', label: `All (${tasks.length})` },
            { id: 'closed', label: `Done (${tasks.filter((t) => t.status === 'closed').length})` },
          ].map((opt) => (
            <button key={opt.id} onClick={() => setStatusFilter(opt.id)} className={`fchip${statusFilter === opt.id ? ' on' : ''}`} style={{ flexShrink: 0 }}>{opt.label}</button>
          ))}
        </div>

        <div className="ws-filter-row-sort" style={{ position: 'relative' }}>
          <button onClick={() => setShowSortMenu((v) => !v)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text2)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="15" y2="12" /><line x1="3" y1="18" x2="9" y2="18" /></svg>
            {SORT_FIELD_OPTIONS.find((o) => o.id === sortConfig.field)?.label}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: sortConfig.dir === 'asc' ? 'rotate(180deg)' : 'none' }}><polyline points="6 9 12 15 18 9" /></svg>
          </button>
          {showSortMenu && (
            <div style={{ position: 'absolute', top: '100%', insetInlineEnd: 0, zIndex: 500, marginTop: 4, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, boxShadow: 'var(--shadow-lg)', minWidth: 155, overflow: 'hidden' }}>
              {SORT_FIELD_OPTIONS.map((opt) => (
                <button key={opt.id} onClick={() => handleSort(opt.id)} style={{ width: '100%', padding: '8px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, background: sortConfig.field === opt.id ? 'var(--accent-light)' : 'none', color: sortConfig.field === opt.id ? 'var(--accent-text)' : 'var(--text2)', border: 'none', fontFamily: 'var(--font)', fontSize: 13, cursor: 'pointer', textAlign: 'start' }}>
                  {opt.label}
                  {sortConfig.field === opt.id && <span style={{ fontSize: 11 }}>{sortConfig.dir === 'desc' ? '↓' : '↑'}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text3)', fontSize: 13 }}>Loading tasks…</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
          <p>{searchQuery ? `No results for "${searchQuery}"` : statusFilter === 'closed' ? 'No completed tasks.' : 'No tasks yet.'}</p>
          {statusFilter !== 'closed' && !searchQuery && (
            <button onClick={() => setShowNewTaskModal(true)} style={{ marginTop: 8, padding: '6px 16px', background: 'var(--accent-light)', color: 'var(--accent-text)', border: '1px solid var(--border)', borderRadius: 6, fontFamily: 'var(--font)', fontSize: 13, cursor: 'pointer' }}>
              + Add Task
            </button>
          )}
        </div>
      ) : (
        <div className="task-table-wrap" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
          <div className="task-table-head" style={{ display: 'grid', gridTemplateColumns: WS_TASK_ROW_GRID_COLUMNS, background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
            {TABLE_HEADERS.map((h) => (
              <div key={h} style={{ padding: '8px 12px', fontSize: 11, fontWeight: 500, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</div>
            ))}
          </div>
          {filtered.map((task) => (
            <WorkspaceTaskRow
              key={task.id}
              task={task}
              wsId={ws.id}
              searchQ={searchQuery}
              onCtx={(e) => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY, task }); }}
              onUpdate={() => { lastUpdatedTaskRef.current = task; setUpdatingTaskId(task.id); }}
              onDetail={() => setDetailTask(task)}
            />
          ))}
        </div>
      )}

      {showNewTaskModal && <NewWorkspaceTaskModal wsId={ws.id} onClose={() => setShowNewTaskModal(false)} />}

      {updatingTaskId && !detailTask && lastUpdatedTaskRef.current && (
        <WorkspaceTaskUpdateModal task={lastUpdatedTaskRef.current} wsId={ws.id} wsName={ws.name} onClose={() => setUpdatingTaskId(null)} />
      )}

      {editingTask && <WorkspaceTaskEditModal task={editingTask} wsId={ws.id} onClose={() => setEditingTask(null)} />}

      {showActivityLog && <ActivityLogModal tasks={tasks} onClose={() => setShowActivityLog(false)} />}

      {detailTask &&
        (() => {
          const liveTask = tasks.find((t) => t.id === detailTask.id) ?? detailTask;
          return (
            <>
              <WorkspaceTaskDetailModal
                task={liveTask}
                wsId={ws.id}
                onClose={() => setDetailTask(null)}
                onUpdate={() => { lastUpdatedTaskRef.current = liveTask; setUpdatingTaskId(liveTask.id); }}
              />
              {updatingTaskId === liveTask.id && lastUpdatedTaskRef.current && (
                <WorkspaceTaskUpdateModal task={liveTask} wsId={ws.id} wsName={ws.name} onClose={() => setUpdatingTaskId(null)} />
              )}
            </>
          );
        })()}

      {ctxMenu && (
        <WorkspaceTaskContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          task={ctxMenu.task}
          isOwner={ctxMenu.task.ownerId === user?.uid}
          onClose={() => setCtxMenu(null)}
          onUpdate={() => { lastUpdatedTaskRef.current = ctxMenu.task; setUpdatingTaskId(ctxMenu.task.id); setCtxMenu(null); }}
          onEdit={() => { setEditingTask(ctxMenu.task); setCtxMenu(null); }}
          onDetail={() => { setDetailTask(ctxMenu.task); setCtxMenu(null); }}
          onToggleUrgent={async () => {
            const task = ctxMenu.task;
            await wsTaskService.save(ws.id, { ...task, priority: task.priority === 'urgent' ? 'normal' : 'urgent' });
            setCtxMenu(null);
          }}
          onComplete={async () => {
            await wsTaskService.save(ws.id, { ...ctxMenu.task, status: 'closed' });
            setCtxMenu(null);
          }}
          onDelete={() => { setDeletingTask(ctxMenu.task); setCtxMenu(null); }}
        />
      )}

      {deletingTask && (
        <Modal title="Delete Task" onClose={() => setDeletingTask(null)} maxWidth={360} closeOnOutsideClick>
          <div className="modal-body">
            <p style={{ fontSize: 13, color: 'var(--text2)' }}>Delete "<strong>{deletingTask.name}</strong>"? This cannot be undone.</p>
          </div>
          <div className="modal-footer">
            <button
              onClick={async () => { await wsTaskService.delete(ws.id, deletingTask.id); setDeletingTask(null); }}
              style={{ padding: '7px 18px', background: 'var(--red)', color: '#fff', border: 'none', borderRadius: 6, fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
            >
              Delete
            </button>
            <button onClick={() => setDeletingTask(null)} className="btn-cancel">Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
