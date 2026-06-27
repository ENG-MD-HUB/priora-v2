// WorkspaceAttentionSection.jsx
// قسم "Urgent" و"Overdue" الخاص بتاسكات الورك سبيسات — يُعرض بأسفل لوحة التحكم
// الرئيسية، منفصل عن قسم التاسكات الشخصية بالأعلى. ميزة جديدة بطلب صريح، غير
// موجودة بالكود الأصلي.
//
// ملاحظة معمارية مهمة: تاسكات الورك سبيس لا تعيش بمخزن محلي واحد (بعكس التاسكات
// الشخصية) — كل ورك سبيس له اشتراك Firestore لحظي منفصل (useWorkspaceTasks). هذا
// المكوّن يفتح اشتراكاً واحداً لكل ورك سبيس عضو فيها المستخدم، ويجمع نتائجها محلياً
// فقط لعرض هذا الملخص — لا يُخزّن أي شي بشكل دائم، فقط حالة عرض مؤقتة بالمكوّن.
//
// تعريف Overdue هنا نفس التعريف الجديد المستخدم بلوحة التاسكات الشخصية: فيه
// follow-up محدد وفات تاريخه، ولم يحصل تحديث (lastUpdate) بتاريخ يساوي أو بعد
// تاريخ ذاك follow-up.

import { useState, useEffect } from 'react';
import { useWorkspacesStore } from '../store/workspacesStore';
import { useUIStore } from '../store/uiStore';
import { wsTaskService } from '../services/wsTaskService';
import { getEffectiveToday } from '../utils/taskDateLogic';

function isWorkspaceTaskOverdue(task, today) {
  return !!(task.priority !== 'urgent' && task.nextFollowup && task.nextFollowup < today && !(task.lastUpdate && task.lastUpdate >= task.nextFollowup));
}

export function WorkspaceAttentionSection() {
  const workspaces = useWorkspacesStore((s) => s.workspaces);
  const setActiveView = useUIStore((s) => s.setActiveView);
  const setPendingWorkspaceNavigation = useUIStore((s) => s.setPendingWorkspaceNavigation);
  const [tasksByWs, setTasksByWs] = useState({});

  useEffect(() => {
    if (workspaces.length === 0) return;
    const unsubscribers = workspaces.map((ws) =>
      wsTaskService.onTasks(ws.id, (tasks) => {
        setTasksByWs((prev) => ({ ...prev, [ws.id]: tasks }));
      })
    );
    return () => unsubscribers.forEach((unsub) => unsub());
  }, [workspaces.map((w) => w.id).join(',')]);

  if (workspaces.length === 0) return null;

  const today = getEffectiveToday();
  const allWorkspaceTasks = workspaces.flatMap((ws) =>
    (tasksByWs[ws.id] ?? []).filter((t) => t.status !== 'closed').map((t) => ({ ...t, _wsId: ws.id, _wsName: ws.name }))
  );

  const urgent = allWorkspaceTasks.filter((t) => t.priority === 'urgent');
  const overdue = allWorkspaceTasks.filter((t) => isWorkspaceTaskOverdue(t, today));

  if (urgent.length === 0 && overdue.length === 0) return null;

  function goToTask(task) {
    setPendingWorkspaceNavigation({ wsId: task._wsId, taskId: task.id });
    setActiveView('workspaces');
  }

  return (
    <div style={{ marginTop: 28 }}>
      <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 12, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
        Workspaces — needs attention
      </div>

      {urgent.length > 0 && (
        <WorkspaceAttentionGroup title="⚠ Urgent" titleColor="var(--red)" tasks={urgent} onGoTo={goToTask} />
      )}
      {overdue.length > 0 && (
        <WorkspaceAttentionGroup title="Follow-up Overdue" titleColor="var(--orange)" tasks={overdue} onGoTo={goToTask} />
      )}
    </div>
  );
}

function WorkspaceAttentionGroup({ title, titleColor, tasks, onGoTo }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: titleColor, textTransform: 'uppercase', letterSpacing: '.06em' }}>{title}</span>
        <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>{tasks.length}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {tasks.map((task) => (
          <button
            key={`${task._wsId}-${task.id}`}
            onClick={() => onGoTo(task)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', width: '100%', textAlign: 'start',
              background: 'var(--surface)', border: `1px solid color-mix(in srgb,${titleColor} 20%,var(--border))`,
              borderRadius: 6, cursor: 'pointer', fontFamily: 'var(--font)', transition: 'background .12s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface2)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--surface)')}
          >
            <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{task.name}</span>
            <span style={{ fontSize: 11, color: 'var(--text3)', flexShrink: 0 }}>{task._wsName}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
