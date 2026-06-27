// WorkspaceStatsBar.jsx
// شريط إحصائيات تاسكات الورك سبيس — نسخة مُعاد كتابتها بوضوح من المكوّن bt بالكود
// الأصلي.

import { isTaskOverdue } from '../utils/taskDateLogic';

export function WorkspaceStatsBar({ tasks, onShowLog }) {
  const activeCount = tasks.filter((t) => t.status !== 'closed').length;
  const urgentCount = tasks.filter((t) => t.priority === 'urgent' && t.status !== 'closed').length;
  const waitingCount = tasks.filter((t) => t.status === 'waiting').length;
  const overdueCount = tasks.filter((t) => isTaskOverdue(t)).length;
  const doneCount = tasks.filter((t) => t.status === 'closed').length;

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '8px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'flex', gap: 18, flex: 1, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13 }}>
            <strong style={{ color: 'var(--text)', fontFamily: 'var(--mono)' }}>{activeCount}</strong>
            <span style={{ color: 'var(--text3)', marginInlineStart: 5, fontSize: 11 }}>active</span>
          </span>
          <span style={{ fontSize: 13 }}>
            <strong style={{ color: 'var(--red)', fontFamily: 'var(--mono)' }}>{urgentCount}</strong>
            <span style={{ color: 'var(--text3)', marginInlineStart: 5, fontSize: 11 }}>urgent</span>
          </span>
          <span style={{ fontSize: 13 }}>
            <strong style={{ color: overdueCount > 0 ? 'var(--orange)' : 'var(--text)', fontFamily: 'var(--mono)' }}>{overdueCount}</strong>
            <span style={{ color: 'var(--text3)', marginInlineStart: 5, fontSize: 11 }}>overdue</span>
          </span>
          <span style={{ fontSize: 13 }}>
            <strong style={{ color: 'var(--text)', fontFamily: 'var(--mono)' }}>{waitingCount}</strong>
            <span style={{ color: 'var(--text3)', marginInlineStart: 5, fontSize: 11 }}>waiting</span>
          </span>
          <span style={{ fontSize: 13 }}>
            <strong style={{ color: 'var(--text)', fontFamily: 'var(--mono)' }}>{doneCount}</strong>
            <span style={{ color: 'var(--text3)', marginInlineStart: 5, fontSize: 11 }}>done</span>
          </span>
        </div>

        <button
          onClick={onShowLog}
          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, fontFamily: 'var(--font)', fontSize: 11, color: 'var(--text3)', cursor: 'pointer', transition: 'all .12s', flexShrink: 0 }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface3)'; e.currentTarget.style.color = 'var(--text2)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.color = 'var(--text3)'; }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          Log
        </button>
      </div>
    </div>
  );
}
