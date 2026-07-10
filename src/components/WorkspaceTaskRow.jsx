// WorkspaceTaskRow.jsx
// صف تاسك بصفحة تفاصيل الورك سبيس — نسخة مُعاد كتابتها بوضوح من المكوّن Et بالكود
// الأصلي. مشابه لـ FolderTaskRow، بفرق مهم: زر "Re-open" يظهر فقط لصاحب التاسك
// الفردي (ownerId === currentUser)، وليس لكل أعضاء الورك سبيس.

import { useAuthStore } from '../store/authStore';
import { isTaskOverdue, daysSince, wasUpdatedToday, formatDateForDisplay, isToday } from '../utils/taskDateLogic';
import { getDaysSinceColor, getFollowupDateColor } from '../utils/taskColors';
import { highlightMatch } from '../utils/highlightMatch';
import { showToast } from '../store/toastStore';
import { applyWsTaskChangeAndSyncPersonal } from '../utils/applyWsTaskChange';

export const WS_TASK_ROW_GRID_COLUMNS = 'minmax(180px,2.5fr) minmax(160px,3fr) 120px 130px 150px 110px';
const STATUS_LABELS = { active: 'Action Required', waiting: 'Waiting', ontrack: 'On Track', closed: 'Closed' };

export function WorkspaceTaskRow({ task, wsId, searchQ, onCtx, onUpdate, onDetail }) {
  const user = useAuthStore((s) => s.user);
  const overdue = isTaskOverdue(task);
  const days = daysSince(task.lastUpdate);
  const daysColor = getDaysSinceColor(days);
  const updatedToday = wasUpdatedToday(task);
  const isOwner = task.ownerId === user?.uid;
  const latestNote = task.timeline[0]?.text ?? '—';
  const dotClass = task.priority === 'urgent' ? 'sdot sdot-urgent' : updatedToday ? 'sdot sdot-today' : `sdot sdot-${task.status}`;
  const highlightedName = searchQ ? highlightMatch(task.name, searchQ) : undefined;
  const highlightedNote = searchQ ? highlightMatch(latestNote, searchQ) : undefined;

  // ⚠️ إضافة بطلب صريح: زر "Complete" ما كان موجود بجدول تاسكات الورك سبيس
  // إطلاقاً (موجود فقط بجدول التاسكات الشخصية عبر FolderTaskRow).
  //
  // ⚠️ تصحيح خلل حقيقي (بعد اكتشاف مسار مكرر — قائمة الزر اليمين وزر Re-open
  // كان عندهم نفس المشكلة الأصلية رغم إصلاحها هنا): الدالة صارت تستخدم
  // applyWsTaskChangeAndSyncPersonal المشتركة (تحديث جزئي + retry + فحص تعارض +
  // مزامنة شخصية) بدل تكرار نفس المنطق يدوياً بكل مكان لحاله.
  function handleComplete() {
    applyWsTaskChangeAndSyncPersonal(task, wsId, { status: 'closed' })
      .then(() => showToast('Task completed'))
      .catch((err) => console.warn('ws complete:', err));
  }

  // ⚠️ نفس تصحيح handleComplete بالضبط — كان يستخدم wsTaskService.save (استبدال
  // كامل، بدون مزامنة شخصية ولا إعادة محاولة) قبل هذا الإصلاح.
  function handleReopen() {
    applyWsTaskChangeAndSyncPersonal(task, wsId, { status: 'active' })
      .then(() => showToast('Reopened'))
      .catch((err) => console.warn('ws reopen:', err));
  }

  return (
    <div className={`task-row${overdue ? ' overdue' : ''}`} style={{ gridTemplateColumns: WS_TASK_ROW_GRID_COLUMNS, cursor: 'pointer' }} onClick={onDetail} onContextMenu={onCtx}>
      <div style={{ padding: '9px 12px', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
        <div className={dotClass} style={{ flexShrink: 0 }} />
        {highlightedName ? (
          <span onClick={onDetail} title={task.name} className="task-name-text" style={{ fontWeight: 500, color: 'var(--text)', fontSize: 13, cursor: 'pointer', flex: 1 }} dangerouslySetInnerHTML={{ __html: highlightedName }} />
        ) : (
          <span onClick={onDetail} title={task.name} className="task-name-text" style={{ fontWeight: 500, color: 'var(--text)', fontSize: 13, cursor: 'pointer', flex: 1 }}>{task.name}</span>
        )}
        {task.workspaceId === null && (task.sharedToWsIds?.length ?? 0) > 0 && (
          <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '.04em', background: 'color-mix(in srgb,var(--accent) 12%,var(--surface2))', color: 'var(--accent-text)', border: '1px solid color-mix(in srgb,var(--accent) 25%,var(--border))', borderRadius: 99, padding: '1px 6px', flexShrink: 0, textTransform: 'uppercase' }}>
            shared
          </span>
        )}
      </div>

      {highlightedNote ? (
        <div className="task-note-text" style={{ padding: '9px 12px', fontSize: 12, color: 'var(--text2)' }} dangerouslySetInnerHTML={{ __html: highlightedNote }} />
      ) : (
        <div className="task-note-text" style={{ padding: '9px 12px', fontSize: 12, color: 'var(--text2)' }}>{latestNote}</div>
      )}

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
        <span className={`badge badge-${task.status}`} style={{ fontSize: 11 }}>{STATUS_LABELS[task.status] ?? task.status}</span>
      </div>

      <div style={{ padding: '7px 10px', display: 'flex', gap: 4, alignItems: 'center', justifyContent: 'flex-end' }}>
        {task.status === 'closed' ? (
          isOwner && (
            <button
              onClick={(e) => { e.stopPropagation(); handleReopen(); }}
              style={{ padding: '4px 9px', background: 'var(--surface2)', color: 'var(--text2)', border: '1px solid var(--border)', borderRadius: 5, fontFamily: 'var(--font)', fontSize: 11, cursor: 'pointer' }}
            >
              Re-open
            </button>
          )
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); onUpdate(); }}
            style={{ padding: '4px 10px', background: 'var(--accent-light)', color: 'var(--accent-text)', border: '1px solid var(--border)', borderRadius: 5, fontFamily: 'var(--font)', fontSize: 11, cursor: 'pointer', fontWeight: 500 }}
          >
            Update
          </button>
        )}
        {task.status !== 'closed' && (
          <button
            onClick={(e) => { e.stopPropagation(); handleComplete(); }}
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
