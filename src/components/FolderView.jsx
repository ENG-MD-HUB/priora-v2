// FolderView.jsx
// صفحة عرض تاسكات مجلد معيّن (أو الصفحة "Completed") — نسخة مُعاد كتابتها بوضوح من
// المكوّن ft بالكود الأصلي. هذا أكبر مكوّن بهذا القسم، يجمع: الفلترة، الترتيب، البحث،
// إنشاء/تعديل/حذف تاسك، قائمة السياق، ومودال التقرير.

import { useState } from 'react';
import { useTasksStore } from '../store/tasksStore';
import { useFoldersStore } from '../store/foldersStore';
import { useUIStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';
import { showToast } from '../store/toastStore';
import { isTaskOverdue, getEffectiveToday } from '../utils/taskDateLogic';
import { sortTasks } from '../utils/sortTasks';
import { searchTasks } from '../utils/searchTasks';
import { FILTER_STATUS_OPTIONS, SORT_FIELD_OPTIONS } from '../utils/taskListConstants';
import { FolderTaskRow, FOLDER_TASK_ROW_GRID_COLUMNS } from './FolderTaskRow';
import { NewTaskModal } from './NewTaskModal';
import { EditTaskModal } from './EditTaskModal';
import { TaskContextMenu } from './TaskContextMenu';
import { GenerateReportModal } from './GenerateReportModal';
import { AddUpdateModal } from './AddUpdateModal';
import { TaskDetailModal } from './TaskDetailModal';
import { MoveTaskModal } from './MoveTaskModal';
import { Modal } from './Modal';
import { WindowsFolderIcon } from './WindowsFolderIcon';

const TABLE_HEADERS = ['Name', 'Last Action', 'Updated', 'Follow-up', 'Status', 'Actions'];

export function FolderView({ folderId, type }) {
  const tasks = useTasksStore((s) => s.tasks);
  const updateTask = useTasksStore((s) => s.updateTask);
  const deleteTask = useTasksStore((s) => s.deleteTask);
  const addTask = useTasksStore((s) => s.addTask);
  const addTimelineEntry = useTasksStore((s) => s.addTimelineEntry);
  const folders = useFoldersStore((s) => s.folders);
  const sortConfig = useUIStore((s) => s.sortConfig);
  const setSortConfig = useUIStore((s) => s.setSortConfig);
  const searchQuery = useUIStore((s) => s.searchQuery);
  const user = useAuthStore((s) => s.user);

  const folder = folders.find((f) => f.id === folderId);

  const [statusFilter, setStatusFilter] = useState('all');
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);
  const [detailTaskId, setDetailTaskId] = useState(null);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [reportTaskId, setReportTaskId] = useState(undefined);
  const [showReportModal, setShowReportModal] = useState(false);
  const [ctxMenu, setCtxMenu] = useState(null);
  const [movingTask, setMovingTask] = useState(null);
  const [deletingTaskId, setDeletingTaskId] = useState(null);
  const [showSortMenu, setShowSortMenu] = useState(false);

  let filtered = type === 'completed' ? tasks.filter((t) => t.status === 'closed') : tasks.filter((t) => t.folderId === folderId && t.status !== 'closed');

  if (searchQuery) filtered = searchTasks(filtered, searchQuery);

  if (statusFilter === 'overdue') filtered = filtered.filter((t) => isTaskOverdue(t));
  else if (statusFilter === 'urgent') filtered = filtered.filter((t) => t.priority === 'urgent');
  else if (statusFilter !== 'all') filtered = filtered.filter((t) => t.status === statusFilter);

  const sorted = sortTasks(filtered, sortConfig);

  function handleSortClick(field) {
    setSortConfig(sortConfig.field === field ? { ...sortConfig, dir: sortConfig.dir === 'desc' ? 'asc' : 'desc' } : { field, dir: 'desc' });
    setShowSortMenu(false);
  }

  function handleMarkComplete(taskId) {
    updateTask(taskId, { status: 'closed' });
    showToast('Task completed');
  }

  function handleReopen(taskId) {
    updateTask(taskId, { status: 'active' });
    showToast('Task reopened');
  }

  function handleToggleUrgent(taskId) {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    updateTask(taskId, { priority: task.priority === 'urgent' ? 'normal' : 'urgent' });
    showToast(task.priority === 'urgent' ? 'Urgent removed' : 'Marked urgent');
  }

  function handleConfirmDelete(taskId) {
    setDeletingTaskId(null);
    deleteTask(taskId);
    showToast('Moved to trash');
  }

  return (
    <div style={{ animation: 'fade-in .2s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', flex: 1, display: 'flex', alignItems: 'center', gap: 7 }}>
          {type === 'completed' ? (
            'Completed'
          ) : (
            <>
              <span style={{ display: 'flex' }}>
                <WindowsFolderIcon color={folder?.color ?? '#3b82f6'} size={16} />
              </span>
              {folder?.name ?? 'Folder'}
            </>
          )}
          <span style={{ fontFamily: 'var(--mono)', opacity: 0.45 }}>({sorted.length})</span>
        </div>

        <button
          onClick={() => { setReportTaskId(undefined); setShowReportModal(true); }}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text2)', cursor: 'pointer' }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          Report
        </button>

        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowSortMenu((v) => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text2)', cursor: 'pointer' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="15" y2="12" /><line x1="3" y1="18" x2="9" y2="18" />
            </svg>
            {SORT_FIELD_OPTIONS.find((o) => o.id === sortConfig.field)?.label}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: sortConfig.dir === 'asc' ? 'rotate(180deg)' : 'none', transition: '.15s' }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {showSortMenu && (
            <div style={{ position: 'absolute', top: '100%', insetInlineEnd: 0, zIndex: 500, marginTop: 4, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, boxShadow: 'var(--shadow-lg)', minWidth: 158, overflow: 'hidden' }}>
              {SORT_FIELD_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => handleSortClick(opt.id)}
                  style={{ width: '100%', padding: '8px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, background: sortConfig.field === opt.id ? 'var(--accent-light)' : 'none', color: sortConfig.field === opt.id ? 'var(--accent-text)' : 'var(--text2)', border: 'none', fontFamily: 'var(--font)', fontSize: 13, cursor: 'pointer', textAlign: 'start', transition: 'background .1s' }}
                >
                  {opt.label}
                  {sortConfig.field === opt.id && <span style={{ fontSize: 11 }}>{sortConfig.dir === 'desc' ? '↓' : '↑'}</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        {type !== 'completed' && (
          <button
            onClick={() => setShowNewTaskModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 13px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 6, fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Task
          </button>
        )}
      </div>

      {type !== 'completed' && (
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 12 }}>
          {FILTER_STATUS_OPTIONS.map((opt) => (
            <button key={opt.id} onClick={() => setStatusFilter(opt.id)} className={`fchip${statusFilter === opt.id ? ' on' : ''}`} style={{ flexShrink: 0 }}>
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="empty-state">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <p>{searchQuery ? `No results for "${searchQuery}"` : 'No tasks yet.'}</p>
          {!searchQuery && type !== 'completed' && (
            <button
              onClick={() => setShowNewTaskModal(true)}
              style={{ marginTop: 8, padding: '6px 16px', background: 'var(--accent-light)', color: 'var(--accent-text)', border: '1px solid var(--border)', borderRadius: 6, fontFamily: 'var(--font)', fontSize: 13, cursor: 'pointer' }}
            >
              + Add Task
            </button>
          )}
        </div>
      ) : (
        <div className="task-table-wrap" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
          <div className="task-table-head" style={{ display: 'grid', gridTemplateColumns: FOLDER_TASK_ROW_GRID_COLUMNS, background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
            {TABLE_HEADERS.map((h, i) => (
              <div key={i} style={{ padding: '8px 12px', fontSize: 11, fontWeight: 500, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</div>
            ))}
          </div>
          {sorted.map((task) => (
            <FolderTaskRow
              key={task.id}
              task={task}
              searchQuery={searchQuery}
              onCtx={(e) => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY, taskId: task.id }); }}
              onUpdate={() => setUpdatingTaskId(task.id)}
              onDetail={() => setDetailTaskId(task.id)}
              onComplete={() => handleMarkComplete(task.id)}
              showComplete={type !== 'completed'}
              showReopen={type === 'completed'}
              onReopen={() => handleReopen(task.id)}
            />
          ))}
        </div>
      )}

      {showNewTaskModal && (
        <NewTaskModal
          folderId={folderId}
          onClose={() => setShowNewTaskModal(false)}
          onSave={(data) => {
            const { firstUpdate, ...taskData } = data;
            const created = addTask(taskData);
            if (firstUpdate?.trim() && user) {
              addTimelineEntry(created.id, firstUpdate.trim(), taskData.lastUpdate ?? getEffectiveToday(), user.uid, user.displayName ?? 'Me', user.photoURL);
            }
            setShowNewTaskModal(false);
            showToast('Task created');
          }}
        />
      )}

      {updatingTaskId && <AddUpdateModal taskId={updatingTaskId} onClose={() => setUpdatingTaskId(null)} />}
      {detailTaskId && <TaskDetailModal taskId={detailTaskId} onClose={() => setDetailTaskId(null)} />}
      {editingTaskId &&
        (() => {
          const task = tasks.find((t) => t.id === editingTaskId);
          return task ? <EditTaskModal task={task} onClose={() => setEditingTaskId(null)} /> : null;
        })()}
      {showReportModal && <GenerateReportModal taskId={reportTaskId} onClose={() => setShowReportModal(false)} />}
      {showSortMenu && <div style={{ position: 'fixed', inset: 0, zIndex: 499 }} onClick={() => setShowSortMenu(false)} />}

      {ctxMenu && (
        <TaskContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          taskId={ctxMenu.taskId}
          onClose={() => setCtxMenu(null)}
          onUpdate={() => { setUpdatingTaskId(ctxMenu.taskId); setCtxMenu(null); }}
          onDetail={() => { setDetailTaskId(ctxMenu.taskId); setCtxMenu(null); }}
          onEdit={() => { setEditingTaskId(ctxMenu.taskId); setCtxMenu(null); }}
          onToggleUrgent={() => { handleToggleUrgent(ctxMenu.taskId); setCtxMenu(null); }}
          onComplete={() => { handleMarkComplete(ctxMenu.taskId); setCtxMenu(null); }}
          onDelete={() => { setDeletingTaskId(ctxMenu.taskId); setCtxMenu(null); }}
          onReport={() => { setReportTaskId(ctxMenu.taskId); setShowReportModal(true); setCtxMenu(null); }}
          onMove={() => {
            const taskToMove = tasks.find((t) => t.id === ctxMenu.taskId);
            if (taskToMove) setMovingTask(taskToMove);
            setCtxMenu(null);
          }}
        />
      )}

      {movingTask && <MoveTaskModal task={movingTask} onClose={() => setMovingTask(null)} />}

      {deletingTaskId && (
        <Modal title="Confirm Delete" onClose={() => setDeletingTaskId(null)} maxWidth={360} closeOnOutsideClick>
          <div className="modal-body">
            <p style={{ fontSize: 13, color: 'var(--text2)' }}>This will move the task to trash. You can restore it within 2 months.</p>
          </div>
          <div className="modal-footer">
            <button
              onClick={() => handleConfirmDelete(deletingTaskId)}
              style={{ padding: '7px 18px', background: 'var(--red)', color: '#fff', border: 'none', borderRadius: 6, fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
            >
              Delete
            </button>
            <button onClick={() => setDeletingTaskId(null)} className="btn-cancel">Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
