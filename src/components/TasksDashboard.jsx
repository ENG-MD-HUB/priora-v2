// TasksDashboard.jsx
// لوحة تحكم التاسكات الرئيسية — نسخة مُعاد كتابتها بوضوح من المكوّن et بالكود الأصلي.
//
// ⚠️ تعريف "Overdue" مُعدَّل بطلب صريح (يختلف عن منطق الأصل الموثّق سابقاً):
// تاسك يصير "متأخر" فقط لو عنده تاريخ متابعة (nextFollowup) محدد وفات عليه، ولم
// يتم تحديثه (lastUpdate) بعد ذاك التاريخ — بدون أي علاقة بعدد الأيام منذ آخر
// تحديث. يعني: أول ما تحدّث التاسك بتاريخ يقع على/بعد تاريخ المتابعة، يخرج فوراً
// من Overdue (حتى لو مرّت عليه أيام كثيرة بعد ذلك بدون تحديث جديد) — إلا لو حدّدت
// له تاريخ متابعة جديد ومرّ عليه هو أيضاً بدون تحديث لاحق.
//
// المنطق الأصلي القديم (daysSince(lastUpdate) > 7 كشرط بديل) أُزيل بالكامل من هذا
// الحساب — لم يعد له أي تأثير على تصنيف Overdue باللوحة.

import { useState } from 'react';
import { useTasksStore } from '../store/tasksStore';
import { getEffectiveToday } from '../utils/taskDateLogic';
import { getDashboardLabel } from '../utils/dashboardLabels';
import { StatCard } from './StatCard';
import { TaskSection } from './TaskSection';
import { TaskDetailModal } from './TaskDetailModal';
import { AddUpdateModal } from './AddUpdateModal';
import { WorkspaceAttentionSection } from './WorkspaceAttentionSection';

export function TasksDashboard({ lang = 'en', setActiveView = () => {}, setFilterStatus = () => {} }) {
  const tasks = useTasksStore((s) => s.tasks);
  const [updatingTaskId, setUpdatingTaskId] = useState(null);
  const [detailTaskId, setDetailTaskId] = useState(null);

  const today = getEffectiveToday();

  const personalTasks = tasks.filter((t) => t.workspaceId === null);
  const openTasks = personalTasks.filter((t) => t.status !== 'closed');
  const urgent = openTasks.filter((t) => t.priority === 'urgent');
  const waiting = openTasks.filter((t) => t.status === 'waiting');
  const completed = personalTasks.filter((t) => t.status === 'closed');

  /**
   * متأخر = فيه follow-up محدد وفات تاريخه، ولم يحصل أي تحديث (lastUpdate) بتاريخ
   * يساوي أو بعد تاريخ ذاك follow-up. هذا يعني التحديث "يصفّي" التأخير تلقائياً —
   * حتى لو التحديث نفسه قديم نسبياً، المهم إنه وقع على/بعد تاريخ المتابعة المحدد.
   */
  const overdue = openTasks.filter(
    (t) => !!(t.priority !== 'urgent' && t.nextFollowup && t.nextFollowup < today && !(t.lastUpdate && t.lastUpdate >= t.nextFollowup))
  );
  const followupDue = openTasks.filter(
    (t) =>
      t.priority !== 'urgent' &&
      t.nextFollowup &&
      t.nextFollowup <= today &&
      !overdue.find((o) => o.id === t.id)
  );

  const hasAnyAttentionItems = urgent.length > 0 || overdue.length > 0 || followupDue.length > 0;

  return (
    <div style={{ animation: 'fade-in .2s ease' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 22 }}>
        <StatCard
          label={getDashboardLabel(lang, 'urgentTasks')}
          value={urgent.length}
          color="var(--red)"
          icon={
            <svg width="16" height="16" viewBox="0 0 14 14" fill="currentColor">
              <polygon points="7,1 13,13 1,13" />
            </svg>
          }
        />
        <StatCard
          label={getDashboardLabel(lang, 'overdueItems')}
          value={overdue.length}
          color="var(--orange)"
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          }
        />
        <StatCard
          label={getDashboardLabel(lang, 'activeTasks')}
          value={openTasks.length}
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          }
        />
        <StatCard
          label={getDashboardLabel(lang, 'waitingFeedback')}
          value={waiting.length}
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          }
        />
        <StatCard
          label={getDashboardLabel(lang, 'completedItems')}
          value={completed.length}
          icon={
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          }
        />
      </div>

      {hasAnyAttentionItems ? (
        <>
          <TaskSection tasks={urgent} title="⚠ Urgent" titleColor="var(--red)" onDetail={setDetailTaskId} onUpdate={setUpdatingTaskId} setActiveView={setActiveView} />
          <TaskSection tasks={overdue} title="Follow-up Overdue" titleColor="var(--orange)" onDetail={setDetailTaskId} onUpdate={setUpdatingTaskId} setActiveView={setActiveView} />
          <TaskSection tasks={followupDue} title="Follow-up Due" titleColor="var(--amber)" onDetail={setDetailTaskId} onUpdate={setUpdatingTaskId} setActiveView={setActiveView} />
        </>
      ) : (
        <div className="empty-state" style={{ marginTop: 32 }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          <p style={{ fontSize: 14, fontWeight: 500 }}>All caught up!</p>
          <p style={{ fontSize: 12, opacity: 0.6 }}>No urgent, overdue, or follow-up tasks.</p>
        </div>
      )}

      {detailTaskId && <TaskDetailModal taskId={detailTaskId} onClose={() => setDetailTaskId(null)} />}
      {updatingTaskId && (
        <AddUpdateModal
          taskId={updatingTaskId}
          onClose={() => setUpdatingTaskId(null)}
        />
      )}

      <WorkspaceAttentionSection />
    </div>
  );
}
