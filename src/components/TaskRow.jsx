// TaskRow.jsx
// صف تاسك واحد بجدول التاسكات — نسخة مُعاد كتابتها بوضوح من المكوّن Qe بالكود الأصلي.
//
// منطق نقطة الحالة (status dot) محفوظ بدقة من الأصل، بترتيب أولوية صريح:
// 1. لو priority === 'urgent' -> نقطة حمراء (sdot-urgent) بغض النظر عن أي شي آخر
// 2. وإلا لو تم التحديث اليوم (wasUpdatedToday) -> نقطة "اليوم" (sdot-today)
// 3. وإلا -> نقطة بلون الحالة نفسها (sdot-active/waiting/ontrack/closed)

import { isTaskOverdue, daysSince, wasUpdatedToday, formatDateForDisplay, isToday } from '../utils/taskDateLogic';
import { getDaysSinceColor, getFollowupDateColor } from '../utils/taskColors';

const STATUS_LABELS = {
  active: 'Action Required',
  waiting: 'Waiting',
  ontrack: 'On Track',
  closed: 'Closed',
};

export const TASK_ROW_GRID_COLUMNS = 'minmax(180px,2.5fr) minmax(160px,3fr) 120px 130px 150px 110px';

export function TaskRow({ task, onDetail, onUpdate, onNavigate }) {
  const latestNote = task.timeline?.[0]?.text ?? '—';
  const overdue = isTaskOverdue(task);
  const days = daysSince(task.lastUpdate);
  const daysColor = getDaysSinceColor(days);
  const updatedToday = wasUpdatedToday(task);
  const dotClass = task._conflictPending
    ? 'sdot sdot-conflict'
    : task.priority === 'urgent'
    ? 'sdot sdot-urgent'
    : updatedToday
    ? 'sdot sdot-today'
    : `sdot sdot-${task.status}`;
  const lastUpdateColor = task._conflictPending ? 'var(--orange)' : daysColor;

  return (
    <div
      className={`task-row${overdue ? ' overdue' : ''}`}
      style={{ gridTemplateColumns: TASK_ROW_GRID_COLUMNS, cursor: 'pointer' }}
      onClick={() => {
        onNavigate();
        onDetail();
      }}
    >
      <div style={{ padding: '9px 12px', display: 'flex', alignItems: 'center', gap: 7, overflow: 'hidden', minWidth: 0 }}>
        <div className={dotClass} style={{ flexShrink: 0 }} />
        <span className="task-name-text" style={{ fontWeight: 500, color: 'var(--text)', fontSize: 13 }}>
          {task.name}
        </span>
      </div>

      <div className="task-note-text" style={{ padding: '9px 12px', fontSize: 13, color: 'var(--text2)' }}>
        {latestNote}
      </div>

      <div style={{ padding: '9px 12px', display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
        <span title={task._conflictPending ? 'Pending change — could not sync yet, staying on this device only' : undefined} style={{ fontSize: 13, color: lastUpdateColor, fontFamily: 'var(--mono)' }}>
          {formatDateForDisplay(task.lastUpdate)}
        </span>
        {days > 0 && days < 9999 && (
          <span
            style={{
              fontSize: 10, fontFamily: 'var(--mono)', fontWeight: 600, color: daysColor,
              background: `color-mix(in srgb,${daysColor} 12%,var(--surface2))`,
              border: `1px solid color-mix(in srgb,${daysColor} 25%,var(--border))`,
              borderRadius: 4, padding: '1px 4px',
            }}
          >
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
        <span className={`badge badge-${task.status}`} style={{ fontSize: 11 }}>
          {STATUS_LABELS[task.status]}
        </span>
      </div>

      <div style={{ padding: '7px 10px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onUpdate();
          }}
          style={{
            padding: '4px 10px', background: 'var(--accent-light)', color: 'var(--accent-text)',
            border: '1px solid color-mix(in srgb,var(--accent) 25%,var(--border))', borderRadius: 5,
            fontFamily: 'var(--font)', fontSize: 11, cursor: 'pointer', fontWeight: 500,
          }}
        >
          Update
        </button>
      </div>
    </div>
  );
}
