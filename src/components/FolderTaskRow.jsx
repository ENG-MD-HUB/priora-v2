// FolderTaskRow.jsx
// صف تاسك بصفحة المجلد — نسخة أغنى من TaskRow (قسم 5)، تدعم تمييز نص البحث وشارة
// "shared" للتاسكات المشتركة مع ورك سبيس، وأزرار Complete/Re-open. نسخة مُعاد كتابتها
// بوضوح من المكوّن pt بالكود الأصلي.

import { isTaskOverdue, daysSince, wasUpdatedToday, formatDateForDisplay, isToday } from '../utils/taskDateLogic';
import { getDaysSinceColor, getFollowupDateColor } from '../utils/taskColors';
import { highlightMatch } from '../utils/highlightMatch';

export const FOLDER_TASK_ROW_GRID_COLUMNS = 'minmax(180px,2.5fr) minmax(160px,3fr) 120px 130px 150px 110px';

const STATUS_LABELS = { active: 'Action Required', waiting: 'Waiting', ontrack: 'On Track', closed: 'Closed' };

export function FolderTaskRow({ task, searchQuery, onCtx, onUpdate, onDetail, onComplete, onReopen, showComplete, showReopen }) {
  const overdue = isTaskOverdue(task);
  const days = daysSince(task.lastUpdate);
  const daysColor = getDaysSinceColor(days);
  const updatedToday = wasUpdatedToday(task);
  const latestNote = task.timeline.length > 0 ? task.timeline[0].text : '—';
  const highlightedName = searchQuery ? highlightMatch(task.name, searchQuery) : undefined;
  const highlightedNote = searchQuery ? highlightMatch(latestNote, searchQuery) : undefined;
  const dotClass = task.priority === 'urgent' ? 'sdot sdot-urgent' : updatedToday ? 'sdot sdot-today' : `sdot sdot-${task.status}`;

  return (
    <div
      className={`task-row${overdue ? ' overdue' : ''}`}
      style={{ gridTemplateColumns: FOLDER_TASK_ROW_GRID_COLUMNS, cursor: 'pointer' }}
      onClick={onDetail}
      onContextMenu={onCtx}
    >
      <div style={{ padding: '9px 12px', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
        <div className={dotClass} style={{ flexShrink: 0 }} />
        {highlightedName ? (
          <span title={task.name} className="task-name-text" style={{ fontWeight: 500, color: 'var(--text)', fontSize: 13, flex: 1, minWidth: 0 }} dangerouslySetInnerHTML={{ __html: highlightedName }} />
        ) : (
          <span title={task.name} className="task-name-text" style={{ fontWeight: 500, color: 'var(--text)', fontSize: 13, flex: 1, minWidth: 0 }}>{task.name}</span>
        )}
        {(task.sharedToWsIds?.length ?? 0) > 0 && (
          <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '.04em', background: 'color-mix(in srgb,var(--accent) 12%,var(--surface2))', color: 'var(--accent-text)', border: '1px solid color-mix(in srgb,var(--accent) 25%,var(--border))', borderRadius: 99, padding: '1px 6px', flexShrink: 0, textTransform: 'uppercase' }}>
            shared
          </span>
        )}
      </div>

      {highlightedNote ? (
        <div className="task-note-text" style={{ padding: '9px 12px', fontSize: 12, color: 'var(--text)' }} dangerouslySetInnerHTML={{ __html: highlightedNote }} />
      ) : (
        <div className="task-note-text" style={{ padding: '9px 12px', fontSize: 12, color: 'var(--text)' }}>{latestNote}</div>
      )}

      <div style={{ padding: '9px 12px', display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
        <span style={{ fontSize: 13, color: daysColor, fontFamily: 'var(--mono)' }}>{formatDateForDisplay(task.lastUpdate)}</span>
        {days > 0 && days < 9999 && (
          <span style={{ fontSize: 10, fontFamily: 'var(--mono)', fontWeight: 600, color: daysColor, background: `color-mix(in srgb,${daysColor} 12%,var(--surface2))`, border: `1px solid color-mix(in srgb,${daysColor} 25%,var(--border))`, borderRadius: 4, padding: '1px 5px', flexShrink: 0 }}>
            +{days}
          </span>
        )}
      </div>

      <div style={{ padding: '9px 12px', fontSize: 13, fontFamily: 'var(--mono)', whiteSpace: 'nowrap' }}>
        <span className={isToday(task.nextFollowup) ? 'fu-today' : ''} style={{ color: getFollowupDateColor(task.nextFollowup) }}>
          {formatDateForDisplay(task.nextFollowup)}
        </span>
      </div>

      <div style={{ padding: '9px 12px' }}>
        <span className={`badge badge-${task.status}`} style={{ fontSize: 11 }}>{STATUS_LABELS[task.status]}</span>
      </div>

      <div style={{ padding: '7px 10px', display: 'flex', gap: 4, alignItems: 'center', justifyContent: 'flex-end' }}>
        {showReopen ? (
          <button
            onClick={(e) => { e.stopPropagation(); onReopen?.(); }}
            style={{ padding: '4px 10px', background: 'var(--surface2)', color: 'var(--text2)', border: '1px solid var(--border)', borderRadius: 5, fontFamily: 'var(--font)', fontSize: 11, cursor: 'pointer', fontWeight: 500, transition: 'all .12s' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-light)'; e.currentTarget.style.color = 'var(--accent-text)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.color = 'var(--text2)'; }}
          >
            Re-open
          </button>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); onUpdate(); }}
            style={{ padding: '4px 10px', background: 'var(--accent-light)', color: 'var(--accent-text)', border: '1px solid var(--border)', borderRadius: 5, fontFamily: 'var(--font)', fontSize: 11, cursor: 'pointer', fontWeight: 500, transition: 'background .12s' }}
          >
            Update
          </button>
        )}
        {showComplete && (
          <button
            onClick={(e) => { e.stopPropagation(); onComplete(); }}
            title="Mark complete"
            style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 5, cursor: 'pointer', color: 'var(--text3)', transition: 'all .12s', flexShrink: 0 }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--green-bg)'; e.currentTarget.style.color = 'var(--green)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.color = 'var(--text3)'; }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
