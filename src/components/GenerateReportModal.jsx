// GenerateReportModal.jsx
// مودال "إنشاء تقرير" — نسخة مُعاد كتابتها بوضوح من المكوّن ct بالكود الأصلي.
// يفتح تقرير HTML كامل بتبويب جديد (للطباعة/حفظ PDF عن طريق المتصفح مباشرة).

import { useState } from 'react';
import { Modal } from './Modal';
import { useTasksStore } from '../store/tasksStore';
import { useFoldersStore } from '../store/foldersStore';
import { useContactsStore } from '../store/contactsStore';
import { generateReportHTML } from '../utils/generateReportHTML';

export function GenerateReportModal({ taskId, onClose }) {
  const tasks = useTasksStore((s) => s.tasks);
  const folders = useFoldersStore((s) => s.folders);
  const contacts = useContactsStore((s) => s.contacts);

  const [reportType, setReportType] = useState(taskId ? 'single' : 'active');
  const [selectedFolderId, setSelectedFolderId] = useState('');
  const [includeCompletedInFolder, setIncludeCompletedInFolder] = useState(false);

  function getFilteredTasks() {
    switch (reportType) {
      case 'single':
        return tasks.filter((t) => t.id === taskId);
      case 'active':
        return tasks.filter((t) => t.status !== 'closed');
      case 'completed':
        return tasks.filter((t) => t.status === 'closed');
      case 'folder':
        return tasks.filter((t) => t.folderId === selectedFolderId && (includeCompletedInFolder || t.status !== 'closed'));
      case 'all':
        return [...tasks];
      default:
        return [];
    }
  }

  function handleGenerate() {
    const titlesByType = {
      single: tasks.find((t) => t.id === taskId)?.name ?? 'Task Report',
      active: 'All Active Tasks',
      completed: 'Completed Tasks',
      folder: folders.find((f) => f.id === selectedFolderId)?.name ?? 'Folder Report',
      all: 'All Tasks',
    };
    const html = generateReportHTML(getFilteredTasks(), titlesByType[reportType], contacts);
    const reportWindow = window.open('', '_blank');
    if (reportWindow) {
      reportWindow.document.write(html);
      reportWindow.document.close();
    }
    onClose();
  }

  const matchingCount = getFilteredTasks().length;
  const canGenerate = matchingCount > 0 && (reportType !== 'folder' || selectedFolderId);

  return (
    <Modal title="Generate Report" onClose={onClose} maxWidth={440}>
      <div className="modal-body">
        <div className="field">
          <label className="label">Report Type</label>
          <select className="select" value={reportType} onChange={(e) => setReportType(e.target.value)}>
            {taskId && <option value="single">This Task Only</option>}
            <option value="active">All Active Tasks</option>
            <option value="completed">Completed Tasks</option>
            <option value="folder">Tasks in a Folder</option>
            <option value="all">All Tasks (Everything)</option>
          </select>
        </div>

        {reportType === 'folder' && (
          <>
            <div className="field">
              <label className="label">Folder</label>
              <select className="select" value={selectedFolderId} onChange={(e) => setSelectedFolderId(e.target.value)}>
                <option value="">— Select folder —</option>
                {folders.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text2)', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={includeCompletedInFolder}
                  onChange={(e) => setIncludeCompletedInFolder(e.target.checked)}
                  style={{ accentColor: 'var(--accent)', width: 14, height: 14 }}
                />
                Include completed tasks
              </label>
            </div>
          </>
        )}

        <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 12px', fontSize: 12, color: 'var(--text3)' }}>
          <span style={{ color: 'var(--accent)', fontWeight: 600, fontFamily: 'var(--mono)' }}>{matchingCount}</span>
          {' '}task{matchingCount === 1 ? '' : 's'} will be included in the report.
          <br />
          The report opens in a new tab — use <strong style={{ color: 'var(--text2)' }}>Print / Save PDF</strong> to export.
        </div>
      </div>

      <div className="modal-footer">
        <button
          onClick={handleGenerate}
          disabled={!canGenerate}
          style={{
            padding: '7px 20px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 6,
            fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500,
            cursor: canGenerate ? 'pointer' : 'not-allowed', opacity: canGenerate ? 1 : 0.5,
          }}
        >
          Generate Report
        </button>
        <button onClick={onClose} className="btn-cancel">Cancel</button>
      </div>
    </Modal>
  );
}
