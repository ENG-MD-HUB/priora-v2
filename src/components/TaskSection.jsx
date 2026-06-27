// TaskSection.jsx
// مجموعة تاسكات بعنوان (مثل Urgent, Overdue) — نسخة مُعاد كتابتها بوضوح من المكوّن
// $e بالكود الأصلي. لا يُعرض شي إطلاقاً لو القائمة فاضية (يرجع null).

import { TaskRow, TASK_ROW_GRID_COLUMNS } from './TaskRow';

const TABLE_HEADERS = ['Name', 'Last Action', 'Updated', 'Follow-up', 'Status', ''];

export function TaskSection({ tasks, title, titleColor, onDetail, onUpdate, setActiveView }) {
  if (tasks.length === 0) return null;

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: titleColor, textTransform: 'uppercase', letterSpacing: '.06em' }}>
          {title}
        </span>
        <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>{tasks.length}</span>
      </div>

      <div
        className="task-table-wrap"
        style={{
          background: 'var(--surface)',
          border: `1px solid color-mix(in srgb,${titleColor} 20%,var(--border))`,
          borderRadius: 'var(--r)',
          overflow: 'hidden',
          boxShadow: 'var(--shadow)',
        }}
      >
        <div
          className="task-table-head"
          style={{ display: 'grid', gridTemplateColumns: TASK_ROW_GRID_COLUMNS, background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}
        >
          {TABLE_HEADERS.map((header, i) => (
            <div key={i} style={{ padding: '7px 12px', fontSize: 11, fontWeight: 500, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
              {header}
            </div>
          ))}
        </div>

        {tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            onDetail={() => onDetail(task.id)}
            onUpdate={() => onUpdate(task.id)}
            onNavigate={() => {
              if (task.folderId && !task.folderId.startsWith('ws:')) setActiveView(`folder:${task.folderId}`);
            }}
          />
        ))}
      </div>
    </div>
  );
}
