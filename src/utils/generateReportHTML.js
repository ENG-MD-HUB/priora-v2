// generateReportHTML.js
// مولّد تقرير HTML قابل للطباعة/التحويل لـ PDF — نسخة مُعاد كتابتها بوضوح من الدالة
// st بالكود الأصلي. يرجع صفحة HTML كاملة مستقلة (تُفتح بنافذة جديدة وتُطبع من المتصفح
// مباشرة — لا توجد مكتبة PDF خارجية، الاعتماد بالكامل على ميزة الطباعة بالمتصفح).
//
// ملاحظة: الألوان هنا مكتوبة كقيم HEX ثابتة (مش متغيرات CSS)، لأن هذا تقرير مستقل
// يُفتح بنافذة/تبويب منفصل عن التطبيق، فمايعتمد على متغيرات الثيم الحالي للتطبيق.

import { formatDateForDisplay } from './taskDateLogic';

const STATUS_LABELS = {
  active: 'Action Required',
  waiting: 'Waiting Feedback',
  ontrack: 'On Track',
  closed: 'Completed',
};

function getStatusReportColors(status) {
  const bg = status === 'closed' ? '#d1fae5' : status === 'waiting' ? '#dbeafe' : status === 'ontrack' ? '#d1fae5' : '#fef3c7';
  const text = status === 'closed' ? '#065f46' : status === 'waiting' ? '#1e40af' : status === 'ontrack' ? '#065f46' : '#92400e';
  return { bg, text };
}

function renderTaskTimelineHTML(task) {
  if (task.timeline.length === 0) {
    return '<p style="color:#999;font-style:italic;margin:0">No updates.</p>';
  }
  return task.timeline
    .map(
      (entry) => `
        <div style="display:flex;gap:12px;padding:8px 0;border-bottom:1px solid #e5e7eb">
          <div style="min-width:100px;font-size:11px;color:#6b7280;font-family:monospace">${formatDateForDisplay(entry.date)}</div>
          <div style="flex:1">
            <div style="font-size:11px;font-weight:600;color:#374151;margin-bottom:2px">${entry.authorName}</div>
            <div style="font-size:12px;color:#4b5563;line-height:1.5;white-space:pre-wrap">${entry.text}</div>
          </div>
        </div>`
    )
    .join('');
}

function renderTaskCardHTML(task, contacts) {
  const involvedNames = (task.involvedIds ?? [])
    .map((id) => contacts.find((c) => c.id === id)?.name)
    .filter(Boolean)
    .join(', ');
  const { bg, text } = getStatusReportColors(task.status);

  return `
    <div style="page-break-inside:avoid;background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:16px 20px;margin-bottom:16px">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:10px;gap:12px">
        <h2 style="font-size:14px;font-weight:700;color:#111827;margin:0;flex:1">${task.name}</h2>
        <span style="font-size:11px;padding:2px 10px;border-radius:99px;background:${bg};color:${text};white-space:nowrap;flex-shrink:0">
          ${STATUS_LABELS[task.status]}
        </span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px">
        <div style="background:#f9fafb;border-radius:4px;padding:6px 9px">
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:#9ca3af;margin-bottom:2px">Created</div>
          <div style="font-size:12px;color:#374151;font-family:monospace">${formatDateForDisplay(task.createdAt.split('T')[0])}</div>
        </div>
        <div style="background:#f9fafb;border-radius:4px;padding:6px 9px">
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:#9ca3af;margin-bottom:2px">Last Update</div>
          <div style="font-size:12px;color:#374151;font-family:monospace">${formatDateForDisplay(task.lastUpdate)}</div>
        </div>
        <div style="background:#f9fafb;border-radius:4px;padding:6px 9px">
          <div style="font-size:10px;text-transform:uppercase;letter-spacing:.05em;color:#9ca3af;margin-bottom:2px">Follow-up</div>
          <div style="font-size:12px;color:#374151;font-family:monospace">${formatDateForDisplay(task.nextFollowup)}</div>
        </div>
      </div>
      ${task.desc ? `<div style="background:#f9fafb;border-radius:4px;padding:8px 10px;margin-bottom:12px;font-size:12px;color:#4b5563;line-height:1.5">${task.desc}</div>` : ''}
      ${involvedNames ? `<div style="margin-bottom:10px;font-size:12px;color:#374151"><strong>Involved:</strong> ${involvedNames}</div>` : ''}
      <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:#9ca3af;margin-bottom:6px">Update Log (${task.timeline.length})</div>
      ${renderTaskTimelineHTML(task)}
    </div>`;
}

/**
 * يولّد صفحة HTML كاملة (مستقلة، بدون اعتماد على ملفات CSS خارجية) لتقرير تاسكات.
 * @param {Array} tasks - التاسكات المطلوب تضمينها بالتقرير
 * @param {string} reportTitle - عنوان التقرير (يظهر بأعلى الصفحة)
 * @param {Array} contacts - قائمة جهات الاتصال (لعرض أسماء "Involved")
 */
export function generateReportHTML(tasks, reportTitle, contacts) {
  const generatedDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const taskCardsHTML = tasks.map((t) => renderTaskCardHTML(t, contacts)).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${reportTitle}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0 }
  body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #111827; background: #fff; padding: 32px; max-width: 900px; margin: 0 auto }
  @media print {
    body { padding: 16px }
    .no-print { display: none !important }
    @page { margin: 20mm }
  }
</style>
</head>
<body>
  <div class="no-print" style="margin-bottom:24px;display:flex;gap:10px">
    <button onclick="window.print()" style="padding:8px 20px;background:#2563eb;color:#fff;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer">🖨 Print / Save PDF</button>
    <button onclick="window.close()" style="padding:8px 16px;background:#f3f4f6;border:1px solid #d1d5db;border-radius:6px;font-size:13px;cursor:pointer">Close</button>
  </div>
  <div style="border-bottom:2px solid #111827;padding-bottom:16px;margin-bottom:24px">
    <div style="display:flex;align-items:flex-end;justify-content:space-between">
      <div>
        <h1 style="font-size:22px;font-weight:800;color:#111827;margin-bottom:4px">Priora Report</h1>
        <p style="font-size:13px;color:#6b7280">${reportTitle}</p>
      </div>
      <div style="text-align:right">
        <div style="font-size:12px;color:#6b7280">Generated</div>
        <div style="font-size:12px;font-family:monospace;color:#374151">${generatedDate}</div>
        <div style="font-size:11px;color:#9ca3af;margin-top:2px">${tasks.length} task${tasks.length === 1 ? '' : 's'}</div>
      </div>
    </div>
  </div>
  ${taskCardsHTML || '<p style="color:#9ca3af;text-align:center;padding:32px">No tasks to report.</p>'}
</body>
</html>`;
}
