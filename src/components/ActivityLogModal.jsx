// ActivityLogModal.jsx
// مودال سجل النشاط الكامل (كل ملاحظات كل التاسكات بالورك سبيس، الأحدث أولاً) — نسخة
// مُعاد كتابتها بوضوح من المكوّن yt بالكود الأصلي. يعرض أحدث 50 نشاط فقط.

import { Modal } from './Modal';
import { formatDateForDisplay } from '../utils/taskDateLogic';

export function ActivityLogModal({ tasks, onClose }) {
  const allActivity = [];
  for (const task of tasks) {
    for (const entry of task.timeline) {
      allActivity.push({ text: entry.text, authorName: entry.authorName, date: entry.date, ts: entry.ts, taskName: task.name });
    }
  }
  allActivity.sort((a, b) => b.ts.localeCompare(a.ts));
  const recentActivity = allActivity.slice(0, 50);

  return (
    <Modal title="Activity Log" onClose={onClose} maxWidth={520} closeOnOutsideClick>
      <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto', padding: '8px 16px' }}>
        {recentActivity.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text3)', textAlign: 'center', padding: '16px 0', fontStyle: 'italic' }}>No activity yet.</p>
        ) : (
          recentActivity.map((item, index) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: index < recentActivity.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'var(--accent-text)' }}>
                {(item.authorName || '?').split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2)}
              </div>
              <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text3)', flexShrink: 0 }}>{item.authorName}</span>
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>→</span>
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--accent-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{item.taskName}</span>
              </div>
              <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)', flexShrink: 0 }}>{formatDateForDisplay(item.date)}</span>
            </div>
          ))
        )}
        {allActivity.length > 50 && (
          <p style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center', paddingTop: 8, fontStyle: 'italic' }}>
            Showing latest 50 of {allActivity.length}
          </p>
        )}
      </div>
      <div className="modal-footer">
        <button onClick={onClose} className="btn-cancel">Close</button>
      </div>
    </Modal>
  );
}
