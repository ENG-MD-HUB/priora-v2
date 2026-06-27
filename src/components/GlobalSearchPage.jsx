// GlobalSearchPage.jsx
// صفحة نتائج البحث الشامل (عبر كل التاسكات الشخصية، بكل المجلدات) — نسخة مُعاد
// كتابتها بوضوح من المكوّن gt بالكود الأصلي.
//
// ملاحظة نطاق محفوظة من الأصل: البحث هنا يغطي فقط التاسكات الموجودة بمخزن tasks
// المحلي (يشمل تاسكات مشتركة مع ورك سبيس إذا كانت أصلاً تاسكات شخصية مُشارَكة، لكن
// لا يشمل تاسكات داخلية بورك سبيس لم تُشارك معها المستخدم شخصياً) — نفس نطاق المخزن
// المحلي بالضبط، بدون استعلام منفصل لكل ورك سبيس.

import { useState } from 'react';
import { useTasksStore } from '../store/tasksStore';
import { useFoldersStore } from '../store/foldersStore';
import { useUIStore } from '../store/uiStore';
import { isTaskOverdue, daysSince, wasUpdatedToday, formatDateForDisplay } from '../utils/taskDateLogic';
import { getDaysSinceColor } from '../utils/taskColors';
import { highlightMatch } from '../utils/highlightMatch';
import { AddUpdateModal } from './AddUpdateModal';
import { TaskDetailModal } from './TaskDetailModal';
import { EditTaskModal } from './EditTaskModal';

const SEARCH_GRID_COLUMNS = 'minmax(160px,2.5fr) minmax(120px,2fr) minmax(140px,2.5fr) 90px 130px 90px';
const SEARCH_HEADERS = ['Name', 'Location', 'Last Action', 'Updated', 'Status', 'Action'];
const STATUS_LABELS = { active: 'Action Required', waiting: 'Waiting', ontrack: 'On Track', closed: 'Closed' };

export function GlobalSearchPage() {
  const tasks = useTasksStore((s) => s.tasks);
  const folders = useFoldersStore((s) => s.folders);
  const searchQuery = useUIStore((s) => s.searchQuery);

  const [updatingTaskId, setUpdatingTaskId] = useState(null);
  const [detailTaskId, setDetailTaskId] = useState(null);
  const [editingTaskId, setEditingTaskId] = useState(null);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const results = normalizedQuery
    ? tasks.filter(
        (t) =>
          t.name.toLowerCase().includes(normalizedQuery) ||
          (t.desc ?? '').toLowerCase().includes(normalizedQuery) ||
          t.timeline.some((entry) => entry.text.toLowerCase().includes(normalizedQuery))
      )
    : [];

  function getLocationLabel(task) {
    return task.workspaceId ? 'Workspace' : folders.find((f) => f.id === task.folderId)?.name ?? 'Unknown';
  }

  if (!normalizedQuery) {
    return (
      <div className="empty-state">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <p>Start typing to search all tasks</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="empty-state">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <p>No results for "<strong>{searchQuery}</strong>"</p>
        <p style={{ fontSize: 12, opacity: 0.6 }}>Searched across all folders and workspaces</p>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fade-in .2s ease' }}>
      <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12 }}>
        Search results <span style={{ fontFamily: 'var(--mono)', opacity: 0.5 }}>({results.length} task{results.length === 1 ? '' : 's'} for "{searchQuery}")</span>
      </div>

      <div className="task-table-wrap" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
        <div className="task-table-head" style={{ display: 'grid', gridTemplateColumns: SEARCH_GRID_COLUMNS, background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
          {SEARCH_HEADERS.map((h) => (
            <div key={h} style={{ padding: '8px 12px', fontSize: 11, fontWeight: 500, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</div>
          ))}
        </div>

        {results.map((task) => {
          const overdue = isTaskOverdue(task);
          const days = daysSince(task.lastUpdate);
          const daysColor = getDaysSinceColor(days);
          const updatedToday = wasUpdatedToday(task);
          const latestNote = task.timeline[0]?.text ?? '—';
          const dotClass = task.priority === 'urgent' ? 'sdot sdot-urgent' : updatedToday ? 'sdot sdot-today' : `sdot sdot-${task.status}`;
          const highlightedName = highlightMatch(task.name, searchQuery);
          const highlightedNote = highlightMatch(latestNote, searchQuery);

          return (
            <div key={task.id} className={`task-row${overdue ? ' overdue' : ''}`} style={{ gridTemplateColumns: SEARCH_GRID_COLUMNS }}>
              <div style={{ padding: '9px 12px', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                <div className={dotClass} style={{ flexShrink: 0 }} />
                <span
                  onClick={() => setDetailTaskId(task.id)}
                  title={task.name}
                  style={{ fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13, cursor: 'pointer', flex: 1 }}
                  dangerouslySetInnerHTML={{ __html: highlightedName }}
                />
              </div>

              <div style={{ padding: '9px 12px', fontSize: 11, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  {task.workspaceId ? (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                    </svg>
                  ) : (
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    </svg>
                  )}
                  {getLocationLabel(task)}
                </span>
              </div>

              <div
                style={{ padding: '9px 12px', fontSize: 12, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                dangerouslySetInnerHTML={{ __html: highlightedNote }}
              />

              <div style={{ padding: '9px 12px', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                <span style={{ fontSize: 11, color: daysColor, fontFamily: 'var(--mono)' }}>{formatDateForDisplay(task.lastUpdate)}</span>
              </div>

              <div style={{ padding: '9px 12px' }}>
                <span className={`badge badge-${task.status}`} style={{ fontSize: 10 }}>{STATUS_LABELS[task.status]}</span>
              </div>

              <div style={{ padding: '7px 10px' }}>
                <button
                  onClick={() => setUpdatingTaskId(task.id)}
                  style={{ padding: '4px 10px', background: 'var(--accent-light)', color: 'var(--accent-text)', border: '1px solid var(--border)', borderRadius: 5, fontFamily: 'var(--font)', fontSize: 11, cursor: 'pointer', fontWeight: 500 }}
                >
                  Update
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {updatingTaskId && <AddUpdateModal taskId={updatingTaskId} onClose={() => setUpdatingTaskId(null)} />}
      {detailTaskId && <TaskDetailModal taskId={detailTaskId} onClose={() => setDetailTaskId(null)} onUpdate={() => setUpdatingTaskId(detailTaskId)} />}
      {editingTaskId &&
        (() => {
          const task = tasks.find((t) => t.id === editingTaskId);
          return task ? <EditTaskModal task={task} onClose={() => setEditingTaskId(null)} /> : null;
        })()}
    </div>
  );
}
