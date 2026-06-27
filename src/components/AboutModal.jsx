// AboutModal.jsx
// مودال "About Priora" المستقل والأبسط — نسخة مُعاد كتابتها بوضوح من المكوّن Me
// بالكود الأصلي. مختلف عن تبويب "About" بمودال الإعدادات (نفس المحتوى تقريباً، بس
// هذا مودال قائم بذاته بدون تبويبات).

import { useState } from 'react';
import { Modal } from './Modal';
import { useUIStore } from '../store/uiStore';
import { useTasksStore } from '../store/tasksStore';
import { useFoldersStore } from '../store/foldersStore';
import { useContactsStore } from '../store/contactsStore';
import { showToast } from '../store/toastStore';
import { APP_VERSION, APP_TAGLINE } from '../utils/appConstants';

function useBackupExport() {
  const tasks = useTasksStore((s) => s.tasks);
  const trash = useTasksStore((s) => s.trash);
  const folders = useFoldersStore((s) => s.folders);
  const contacts = useContactsStore((s) => s.contacts);

  function exportBackup() {
    const backup = {
      version: APP_VERSION,
      exportedAt: new Date().toISOString(),
      tasks,
      trash,
      folders,
      contacts,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `priora-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('Backup downloaded');
  }

  return { exportBackup };
}

export function AboutModal({ onClose }) {
  const [, setActiveTab] = useState('about');
  const theme = useUIStore((s) => s.theme);
  const { exportBackup } = useBackupExport();

  return (
    <Modal title="About Priora" onClose={onClose} maxWidth={540} closeOnOutsideClick>
      <div className="modal-body" style={{ padding: 0 }}>
        <div style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)', padding: '24px 28px', textAlign: 'center' }}>
          <img src={theme === 'dark' ? '/logo-night.png' : '/logo-day.png'} alt="Priora" style={{ height: 38, objectFit: 'contain', marginBottom: 8 }} />
          <p style={{ fontSize: 12, color: 'var(--text3)', fontStyle: 'italic' }}>{APP_TAGLINE}</p>
          <div style={{ marginTop: 10, display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 11, background: 'var(--accent-light)', color: 'var(--accent-text)', border: '1px solid color-mix(in srgb,var(--accent) 25%,var(--border))', borderRadius: 99, padding: '2px 10px' }}>
              v{APP_VERSION}
            </span>
            <span style={{ fontSize: 11, background: 'var(--surface3)', color: 'var(--text3)', border: '1px solid var(--border)', borderRadius: 99, padding: '2px 10px' }}>
              2026
            </span>
          </div>
        </div>

        <div style={{ padding: '20px 24px' }}>
          <button
            onClick={exportBackup}
            style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '8px 18px', background: 'var(--accent)',
              color: '#fff', border: 'none', borderRadius: 7, fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download Backup
          </button>
        </div>
      </div>

      <div className="modal-footer">
        <button onClick={onClose} className="btn-cancel">Close</button>
      </div>
    </Modal>
  );
}
