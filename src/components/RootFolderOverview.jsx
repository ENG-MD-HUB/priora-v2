// RootFolderOverview.jsx
// عرض مجلد رئيسي له فروع — يشبه مستكشف الملفات بويندوز: شبكة أيقونات مجلدات فرعية
// كبيرة بالأعلى، وتحتها جدول التاسكات (نفس شكل الجدول التقليدي، بكل أعمدته) الخاص
// بالتاسكات المرتبطة مباشرة بالمجلد الرئيسي نفسه فقط (وليس تاسكات الفروع). ميزة
// جديدة بطلب صريح، غير موجودة بالكود الأصلي.
//
// النقر العادي على أيقونة فرعية يفتحها (نفس صفحة FolderView التقليدية). الضغط
// بالزر الأيمن يفتح قائمة خيارات (فتح، تعديل، نقل تاسكاتها الظاهرة هنا فقط — أو
// بشكل أدق: نقل التاسك يحصل من داخل الفرع نفسه بقائمة سياق التاسك العادية، هذي
// القائمة هنا خاصة بالمجلد الفرعي ككائن — فتح/تعديل/حذف).

import { useState } from 'react';
import { useTasksStore } from '../store/tasksStore';
import { useFoldersStore } from '../store/foldersStore';
import { useUIStore } from '../store/uiStore';
import { showToast } from '../store/toastStore';
import { isTaskOverdue, daysSince, wasUpdatedToday, formatDateForDisplay, isToday } from '../utils/taskDateLogic';
import { getDaysSinceColor, getFollowupDateColor } from '../utils/taskColors';
import { WindowsFolderIcon } from './WindowsFolderIcon';
import { FolderContextMenu } from './FolderContextMenu';
import { Modal } from './Modal';
import { NewTaskModal } from './NewTaskModal';
import { EditTaskModal } from './EditTaskModal';
import { TaskDetailModal } from './TaskDetailModal';
import { AddUpdateModal } from './AddUpdateModal';
import { TaskContextMenu } from './TaskContextMenu';
import { MoveTaskModal } from './MoveTaskModal';

const TABLE_GRID_COLUMNS = 'minmax(180px,2.5fr) minmax(160px,3fr) 120px 130px 150px 110px';
const TABLE_HEADERS = ['Name', 'Last Action', 'Updated', 'Follow-up', 'Status', 'Actions'];
const STATUS_LABELS = { active: 'Action Required', waiting: 'Waiting', ontrack: 'On Track', closed: 'Closed' };

function DirectTaskRow({ task, onCtx, onDetail, onUpdate }) {
  const overdue = isTaskOverdue(task);
  const days = daysSince(task.lastUpdate);
  const daysColor = getDaysSinceColor(days);
  const updatedToday = wasUpdatedToday(task);
  const latestNote = task.timeline[0]?.text ?? '—';
  const dotClass = task.priority === 'urgent' ? 'sdot sdot-urgent' : updatedToday ? 'sdot sdot-today' : `sdot sdot-${task.status}`;

  return (
    <div className={`task-row${overdue ? ' overdue' : ''}`} style={{ gridTemplateColumns: TABLE_GRID_COLUMNS, cursor: 'pointer' }} onClick={onDetail} onContextMenu={onCtx}>
      <div style={{ padding: '9px 12px', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
        <div className={dotClass} style={{ flexShrink: 0 }} />
        <span className="task-name-text" style={{ fontWeight: 500, color: 'var(--text)', fontSize: 13 }}>{task.name}</span>
      </div>
      <div className="task-note-text" style={{ padding: '9px 12px', fontSize: 12, color: 'var(--text2)' }}>{latestNote}</div>
      <div style={{ padding: '9px 12px', display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
        <span style={{ fontSize: 13, color: daysColor, fontFamily: 'var(--mono)' }}>{formatDateForDisplay(task.lastUpdate)}</span>
        {days > 0 && days < 9999 && (
          <span style={{ fontSize: 10, fontFamily: 'var(--mono)', fontWeight: 600, color: daysColor, background: `color-mix(in srgb,${daysColor} 12%,var(--surface2))`, border: `1px solid color-mix(in srgb,${daysColor} 25%,var(--border))`, borderRadius: 4, padding: '1px 5px' }}>
            +{days}
          </span>
        )}
      </div>
      <div style={{ padding: '9px 12px', fontSize: 13, fontFamily: 'var(--mono)', whiteSpace: 'nowrap' }}>
        <span className={isToday(task.nextFollowup) ? 'fu-today' : ''} style={{ color: getFollowupDateColor(task.nextFollowup) }}>{formatDateForDisplay(task.nextFollowup)}</span>
      </div>
      <div style={{ padding: '9px 12px' }}>
        <span className={`badge badge-${task.status}`} style={{ fontSize: 11 }}>{STATUS_LABELS[task.status]}</span>
      </div>
      <div style={{ padding: '7px 10px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
        <button
          onClick={(e) => { e.stopPropagation(); onUpdate(); }}
          style={{ padding: '4px 10px', background: 'var(--accent-light)', color: 'var(--accent-text)', border: '1px solid var(--border)', borderRadius: 5, fontFamily: 'var(--font)', fontSize: 11, cursor: 'pointer', fontWeight: 500 }}
        >
          Update
        </button>
      </div>
    </div>
  );
}

export function RootFolderOverview({ rootFolder, childFolders }) {
  const tasks = useTasksStore((s) => s.tasks);
  const updateTask = useTasksStore((s) => s.updateTask);
  const deleteTask = useTasksStore((s) => s.deleteTask);
  const addTask = useTasksStore((s) => s.addTask);
  const addTimelineEntry = useTasksStore((s) => s.addTimelineEntry);
  const setActiveView = useUIStore((s) => s.setActiveView);
  const updateFolder = useFoldersStore((s) => s.updateFolder);
  const deleteFolderWithCascade = useFoldersStore((s) => s.deleteFolderWithCascade);

  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);
  const [detailTaskId, setDetailTaskId] = useState(null);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [movingTask, setMovingTask] = useState(null);
  const [deletingTaskId, setDeletingTaskId] = useState(null);
  const [taskCtxMenu, setTaskCtxMenu] = useState(null);
  const [folderCtxMenu, setFolderCtxMenu] = useState(null);
  const [renamingFolder, setRenamingFolder] = useState(null);
  const [confirmDeleteFolder, setConfirmDeleteFolder] = useState(null);

  const directTasks = tasks.filter((t) => t.folderId === rootFolder.id && t.status !== 'closed');

  function handleSaveNewTask(data) {
    const { firstUpdate, ...taskData } = data;
    const created = addTask(taskData);
    if (firstUpdate?.trim()) addTimelineEntry(created.id, firstUpdate.trim(), taskData.lastUpdate, 'me', 'Me');
    setShowNewTaskModal(false);
    showToast('Task created');
  }

  function handleConfirmDeleteFolder() {
    if (!confirmDeleteFolder) return;
    const ids = deleteFolderWithCascade(confirmDeleteFolder.id);
    ids.forEach((fid) => {
      tasks.filter((t) => t.folderId === fid && t.status !== 'closed').forEach((t) => deleteTask(t.id));
    });
    setConfirmDeleteFolder(null);
    showToast(`"${confirmDeleteFolder.name}" moved to trash (with its tasks)`);
  }

  return (
    <div style={{ animation: 'fade-in .2s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
        <WindowsFolderIcon color={rootFolder.color ?? '#3b82f6'} size={22} />
        <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>{rootFolder.name}</span>
      </div>

      {/* شبكة أيقونات المجلدات الفرعية — أسلوب مستكشف الملفات */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 4, marginBottom: 22 }}>
        {childFolders.map((child) => {
          const childTaskCount = tasks.filter((t) => t.folderId === child.id && t.status !== 'closed').length;
          return (
            <div
              key={child.id}
              onClick={() => setActiveView(`folder:${child.id}`)}
              onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setFolderCtxMenu({ folder: child, x: e.clientX, y: e.clientY }); }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '10px 6px', borderRadius: 8, cursor: 'pointer', transition: 'background .12s', minHeight: 108 }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface2)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
            >
              <WindowsFolderIcon color={child.color ?? '#3b82f6'} size={42} />
              <span
                style={{
                  fontSize: 12, color: 'var(--text)', textAlign: 'center', maxWidth: '100%',
                  display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.3, wordBreak: 'break-word',
                }}
              >
                {child.name}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text2)', fontFamily: 'var(--mono)', fontWeight: 500 }}>{childTaskCount} task{childTaskCount === 1 ? '' : 's'}</span>
            </div>
          );
        })}
      </div>

      {/* جدول التاسكات المرتبطة مباشرة بالمجلد الرئيسي فقط */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
          Tasks directly in {rootFolder.name} <span style={{ fontFamily: 'var(--mono)', opacity: 0.5 }}>({directTasks.length})</span>
        </span>
        <button
          onClick={() => setShowNewTaskModal(true)}
          style={{ marginInlineStart: 'auto', display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 6, fontFamily: 'var(--font)', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Add Task
        </button>
      </div>

      {directTasks.length === 0 ? (
        <div className="empty-state">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
          </svg>
          <p>No tasks directly in this folder.</p>
        </div>
      ) : (
        <div className="task-table-wrap" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
          <div className="task-table-head" style={{ display: 'grid', gridTemplateColumns: TABLE_GRID_COLUMNS, background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
            {TABLE_HEADERS.map((h) => (
              <div key={h} style={{ padding: '8px 12px', fontSize: 11, fontWeight: 500, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</div>
            ))}
          </div>
          {directTasks.map((task) => (
            <DirectTaskRow
              key={task.id}
              task={task}
              onCtx={(e) => { e.preventDefault(); setTaskCtxMenu({ x: e.clientX, y: e.clientY, taskId: task.id }); }}
              onDetail={() => setDetailTaskId(task.id)}
              onUpdate={() => setUpdatingTaskId(task.id)}
            />
          ))}
        </div>
      )}

      {showNewTaskModal && <NewTaskModal folderId={rootFolder.id} onClose={() => setShowNewTaskModal(false)} onSave={handleSaveNewTask} />}
      {updatingTaskId && <AddUpdateModal taskId={updatingTaskId} onClose={() => setUpdatingTaskId(null)} />}
      {detailTaskId && <TaskDetailModal taskId={detailTaskId} onClose={() => setDetailTaskId(null)} onUpdate={() => setUpdatingTaskId(detailTaskId)} />}
      {editingTaskId &&
        (() => {
          const task = tasks.find((t) => t.id === editingTaskId);
          return task ? <EditTaskModal task={task} onClose={() => setEditingTaskId(null)} /> : null;
        })()}
      {movingTask && <MoveTaskModal task={movingTask} onClose={() => setMovingTask(null)} />}

      {taskCtxMenu && (
        <TaskContextMenu
          x={taskCtxMenu.x}
          y={taskCtxMenu.y}
          taskId={taskCtxMenu.taskId}
          onClose={() => setTaskCtxMenu(null)}
          onUpdate={() => { setUpdatingTaskId(taskCtxMenu.taskId); setTaskCtxMenu(null); }}
          onDetail={() => { setDetailTaskId(taskCtxMenu.taskId); setTaskCtxMenu(null); }}
          onEdit={() => { setEditingTaskId(taskCtxMenu.taskId); setTaskCtxMenu(null); }}
          onToggleUrgent={() => {
            const task = tasks.find((t) => t.id === taskCtxMenu.taskId);
            if (task) updateTask(task.id, { priority: task.priority === 'urgent' ? 'normal' : 'urgent' });
            setTaskCtxMenu(null);
          }}
          onComplete={() => { updateTask(taskCtxMenu.taskId, { status: 'closed' }); showToast('Task completed'); setTaskCtxMenu(null); }}
          onDelete={() => { setDeletingTaskId(taskCtxMenu.taskId); setTaskCtxMenu(null); }}
          onReport={() => setTaskCtxMenu(null)}
          onMove={() => {
            const task = tasks.find((t) => t.id === taskCtxMenu.taskId);
            if (task) setMovingTask(task);
            setTaskCtxMenu(null);
          }}
        />
      )}

      {folderCtxMenu && (
        <FolderContextMenu
          folder={folderCtxMenu.folder}
          x={folderCtxMenu.x}
          y={folderCtxMenu.y}
          onClose={() => setFolderCtxMenu(null)}
          canDelete
          isRoot={false}
          onRename={() => setRenamingFolder(folderCtxMenu.folder)}
          onDelete={() => setConfirmDeleteFolder(folderCtxMenu.folder)}
          onAddSubfolder={() => {}}
        />
      )}

      {deletingTaskId && (
        <Modal title="Confirm Delete" onClose={() => setDeletingTaskId(null)} maxWidth={360} closeOnOutsideClick>
          <div className="modal-body">
            <p style={{ fontSize: 13, color: 'var(--text2)' }}>This will move the task to trash. You can restore it later.</p>
          </div>
          <div className="modal-footer">
            <button
              onClick={() => { deleteTask(deletingTaskId); setDeletingTaskId(null); showToast('Moved to trash'); }}
              style={{ padding: '7px 18px', background: 'var(--red)', color: '#fff', border: 'none', borderRadius: 6, fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
            >
              Delete
            </button>
            <button onClick={() => setDeletingTaskId(null)} className="btn-cancel">Cancel</button>
          </div>
        </Modal>
      )}

      {confirmDeleteFolder && (
        <Modal title="Delete Folder" onClose={() => setConfirmDeleteFolder(null)} maxWidth={400} closeOnOutsideClick>
          <div className="modal-body">
            <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
              Delete "<strong style={{ color: 'var(--text)' }}>{confirmDeleteFolder.name}</strong>"? All its tasks will be moved to Trash — you can restore everything later, and the folder will come back automatically.
            </p>
          </div>
          <div className="modal-footer">
            <button onClick={handleConfirmDeleteFolder} style={{ padding: '7px 18px', background: 'var(--red)', color: '#fff', border: 'none', borderRadius: 6, fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
              Delete
            </button>
            <button onClick={() => setConfirmDeleteFolder(null)} className="btn-cancel">Cancel</button>
          </div>
        </Modal>
      )}

      {renamingFolder && (
        <RenameSubfolderModal folder={renamingFolder} onClose={() => setRenamingFolder(null)} onSave={(name, color) => { updateFolder(renamingFolder.id, { name, color }); setRenamingFolder(null); showToast('Folder updated'); }} />
      )}
    </div>
  );
}

const FOLDER_COLOR_OPTIONS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#6b7280', '#ffffff'];

function RenameSubfolderModal({ folder, onClose, onSave }) {
  const [name, setName] = useState(folder.name);
  const [color, setColor] = useState(folder.color ?? FOLDER_COLOR_OPTIONS[0]);

  return (
    <Modal title="Edit Folder" onClose={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); if (name.trim()) onSave(name.trim(), color); }}>
        <div className="modal-body">
          <div className="field">
            <label className="label">Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="label">Color</label>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {FOLDER_COLOR_OPTIONS.map((c) => {
                const isWhite = c.toLowerCase() === '#ffffff';
                const isSelected = color === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    style={{
                      width: 26, height: 26, borderRadius: '50%', background: c, cursor: 'pointer',
                      border: isSelected ? '2px solid var(--text)' : isWhite ? '2px solid var(--border2)' : '2px solid transparent',
                      boxShadow: isSelected ? '0 0 0 2px var(--surface)' : 'none', transition: 'all .12s',
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button type="submit" disabled={!name.trim()} style={{ padding: '7px 20px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 6, fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
            Save
          </button>
          <button type="button" onClick={onClose} className="btn-cancel">Cancel</button>
        </div>
      </form>
    </Modal>
  );
}
