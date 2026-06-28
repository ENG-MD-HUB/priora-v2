// SettingsModal.jsx
// مودال الإعدادات الكامل (5 تبويبات) — نسخة مُعاد كتابتها بوضوح من المكوّن Pe بالكود
// الأصلي.
//
// ملاحظة تناقض حقيقي موجود بالكود الأصلي نفسه (وليس خطأ مني):
// نص الوصف بتبويب "Backup" يقول "Workspaces are excluded" من التصدير، لكن المنطق
// الفعلي لزر "Download Backup" يجمع بيانات الورك سبيسات والأعضاء وتاسكاتها فعلياً
// ويضمّها بالملف المُصدَّر. حافظت على المنطق الفعلي (تضمين الورك سبيسات) والنص كما هو
// حرفياً (يقول العكس) — هذا تناقض بالنص التوضيحي بالواجهة فقط، محفوظ كما هو بالأصل.
//
// ✅ تحديث: يستخدم foldersStore الحقيقي (قسم 7) — لم يعد يستخدم stub.

import { useState, useRef } from 'react';
import { Modal } from './Modal';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { useTasksStore } from '../store/tasksStore';
import { useFoldersStore } from '../store/foldersStore';
import { useContactsStore } from '../store/contactsStore';
import { useWorkspacesStore } from '../store/workspacesStore';
import { authService } from '../services/authService';
import { workspaceService } from '../services/workspaceService';
import { wsTaskService } from '../services/wsTaskService';
import { tasksService } from '../services/tasksService';
import { trashService } from '../services/trashService';
import { contactsService } from '../services/contactsService';
import { showToast } from '../store/toastStore';
import { APP_VERSION } from '../utils/appConstants';
import { getScreensaverEnabled, setScreensaverEnabled } from '../utils/useIdleScreensaver';

const FEATURES_LIST = [
  { icon: '◈', title: 'Team Workspaces', desc: 'Invite your team via secure codes. Collaborate in real-time — every update, every task, visible to all members instantly across all devices.' },
  { icon: '◎', title: 'Smart Follow-up System', desc: 'Never miss a deadline. Set follow-up dates with intelligent color alerts — amber for today, red for overdue — so nothing slips through.' },
  { icon: '◉', title: 'Full Task Timeline', desc: 'Every task carries a complete timestamped history. Who updated it, when, and what changed — full accountability on every item.' },
  { icon: '▣', title: 'Organized Folders', desc: 'Structure your work in custom folders. Drag, rename, color-code, and filter with powerful search across everything.' },
  { icon: '◐', title: 'Cloud Sync', desc: 'Your data lives in the cloud. Sign in from any device, any browser — everything is exactly where you left it.' },
  { icon: '◆', title: 'Priority Dashboard', desc: 'See your urgent tasks, overdue items, and pending follow-ups in one focused view. Act on what matters most.' },
  { icon: '○', title: 'Task Sharing', desc: 'Share personal tasks into shared workspaces seamlessly. Updates sync both ways — personal and team stay in perfect alignment.' },
  { icon: '◇', title: 'Contact Management', desc: 'Link people to tasks as involved parties. Build your network of stakeholders and track who is responsible for what.' },
  { icon: '▷', title: 'Bilingual Interface', desc: 'Full Arabic and English support with native RTL/LTR layout switching. Designed for the region from the ground up.' },
  { icon: '◻', title: 'Backup & Restore', desc: 'Export everything — tasks, folders, workspaces — to a secure JSON file. Restore with one click, no data loss ever.' },
];

const SETTINGS_TABS = [
  { id: 'profile', label: 'Profile' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'backup', label: 'Backup' },
  { id: 'features', label: 'Features' },
  { id: 'about', label: 'About' },
];

export function SettingsModal({ onClose }) {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const lang = useUIStore((s) => s.lang);
  const setLang = useUIStore((s) => s.setLang);
  const tasks = useTasksStore((s) => s.tasks);
  const trash = useTasksStore((s) => s.trash);
  const workspaces = useWorkspacesStore((s) => s.workspaces);
  const folders = useFoldersStore((s) => s.folders);
  const contacts = useContactsStore((s) => s.contacts);

  const [activeTab, setActiveTab] = useState('profile');
  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL ?? '');
  const [screensaverEnabled, setScreensaverEnabledState] = useState(getScreensaverEnabled);

  function handleToggleScreensaver(value) {
    setScreensaverEnabledState(value);
    setScreensaverEnabled(value);
  }
  const [savingProfile, setSavingProfile] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const fileInputRef = useRef(null);

  async function handleSaveProfile(e) {
    e.preventDefault();
    if (!displayName.trim()) return;
    setSavingProfile(true);
    try {
      setUser(await authService.updateProfile(displayName.trim(), photoURL.trim() || null));
      showToast('Profile updated');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleExportBackup() {
    showToast('Preparing backup…');
    const wsTasks = {};
    const wsMembers = {};

    for (const ws of workspaces) {
      try {
        const wsTaskList = await wsTaskService.getAll(ws.id);
        if (wsTaskList.length) wsTasks[ws.id] = wsTaskList;
        const members = await workspaceService.getMembers(ws.id);
        if (members.length) wsMembers[ws.id] = members;
      } catch {
        // فشل جلب بيانات ورك سبيس واحد لا يوقف باقي عملية التصدير — نفس سلوك الأصل.
      }
    }

    const backup = {
      version: APP_VERSION,
      exportedAt: new Date().toISOString(),
      tasks,
      trash,
      folders,
      contacts,
      workspaces,
      wsTasks,
      wsMembers,
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `priora-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(`Backup complete — ${tasks.length} tasks, ${folders.length} folders, ${workspaces.length} workspaces`);
  }

  function handleRestoreFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setRestoring(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result);
        if (!data.tasks && !data.folders) throw new Error('Invalid backup file — no tasks or folders found');

        useTasksStore.setState({ tasks: data.tasks ?? [], trash: data.trash ?? [] });
        useFoldersStore.setState({ folders: data.folders ?? [] });
        useContactsStore.setState({ contacts: data.contacts ?? [] });
        if (data.workspaces?.length) useWorkspacesStore.setState({ workspaces: data.workspaces });

        const uid = useAuthStore.getState().user?.uid;
        if (uid) {
          for (const t of data.tasks ?? []) tasksService.save(uid, t).catch(() => {});
          for (const t of data.trash ?? []) trashService.save(uid, t).catch(() => {});
          for (const c of data.contacts ?? []) contactsService.save(uid, c).catch(() => {});
        }

        if (data.wsTasks) {
          for (const [wsId, wsTaskList] of Object.entries(data.wsTasks)) {
            for (const t of wsTaskList) wsTaskService.save(wsId, t).catch(() => {});
          }
        }

        showToast(`Restored: ${data.tasks?.length ?? 0} tasks · ${data.folders?.length ?? 0} folders · ${data.workspaces?.length ?? 0} workspaces`);
        onClose();
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Invalid backup file');
      } finally {
        setRestoring(false);
      }
    };
    reader.readAsText(file);
  }

  return (
    <Modal title="Settings" onClose={onClose} maxWidth={560}>
      <div style={{ display: 'flex', minHeight: 420 }}>
        <div style={{ width: 130, flexShrink: 0, borderInlineEnd: '1px solid var(--border)', padding: '8px 0', background: 'var(--surface2)', borderBottomLeftRadius: 12 }}>
          {SETTINGS_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                width: '100%', padding: '10px 14px', border: 'none', background: 'none',
                fontFamily: 'var(--font)', fontSize: 13, textAlign: 'start', cursor: 'pointer',
                color: activeTab === tab.id ? 'var(--accent)' : 'var(--text2)',
                fontWeight: activeTab === tab.id ? 600 : 400,
                borderInlineStart: `3px solid ${activeTab === tab.id ? 'var(--accent)' : 'transparent'}`,
                transition: 'all .12s',
              }}
              onMouseEnter={(e) => { if (activeTab !== tab.id) e.currentTarget.style.background = 'var(--surface3)'; }}
              onMouseLeave={(e) => { if (activeTab !== tab.id) e.currentTarget.style.background = 'none'; }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, padding: '20px 22px', overflowY: 'auto', minWidth: 0 }}>
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
                <div style={{ width: 58, height: 58, borderRadius: '50%', flexShrink: 0, background: 'var(--accent-light)', border: '2px solid var(--border)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {photoURL || user?.photoURL ? (
                    <img src={photoURL || user?.photoURL || ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />
                  ) : (
                    <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--accent-text)' }}>{(displayName || '?')[0].toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{displayName || user?.displayName}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>{user?.email}</div>
                </div>
              </div>

              <div className="field">
                <label className="label">Display Name</label>
                <input className="input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
              </div>

              <div className="field">
                <label className="label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  Profile Photo
                  <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 400 }}>(URL link only)</span>
                  <span title="Paste a direct image URL, e.g. from Google or any public image" style={{ cursor: 'help', color: 'var(--text3)' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </span>
                </label>
                <input className="input" value={photoURL} onChange={(e) => setPhotoURL(e.target.value)} placeholder="https://example.com/photo.jpg" />
              </div>

              <button
                type="submit"
                disabled={savingProfile || !displayName.trim()}
                style={{
                  padding: '8px 22px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 6,
                  fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500,
                  cursor: savingProfile ? 'not-allowed' : 'pointer', opacity: savingProfile ? 0.6 : 1,
                }}
              >
                {savingProfile ? 'Saving…' : 'Save Changes'}
              </button>
            </form>
          )}

          {activeTab === 'appearance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Theme</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  {['dark', 'light'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      style={{
                        flex: 1, padding: '14px 12px', border: `2px solid ${theme === t ? 'var(--accent)' : 'var(--border)'}`,
                        borderRadius: 10, background: theme === t ? 'var(--accent-light)' : 'var(--surface2)',
                        cursor: 'pointer', transition: 'all .15s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                      }}
                    >
                      {t === 'dark' ? (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={theme === 'dark' ? 'var(--accent)' : 'var(--text3)'} strokeWidth="2">
                          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                        </svg>
                      ) : (
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={theme === 'light' ? 'var(--accent)' : 'var(--text3)'} strokeWidth="2">
                          <circle cx="12" cy="12" r="5" />
                          <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                          <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                        </svg>
                      )}
                      <span style={{ fontSize: 13, fontWeight: theme === t ? 600 : 400, color: theme === t ? 'var(--accent-text)' : 'var(--text2)' }}>
                        {t === 'dark' ? 'Dark' : 'Light'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Language</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  {[{ id: 'en', label: 'English' }, { id: 'ar', label: 'العربية' }].map((l) => (
                    <button
                      key={l.id}
                      onClick={() => setLang(l.id)}
                      style={{
                        flex: 1, padding: '14px 12px', border: `2px solid ${lang === l.id ? 'var(--accent)' : 'var(--border)'}`,
                        borderRadius: 10, background: lang === l.id ? 'var(--accent-light)' : 'var(--surface2)',
                        cursor: 'pointer', transition: 'all .15s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                      }}
                    >
                      <span style={{ fontSize: 13, fontWeight: lang === l.id ? 600 : 400, color: lang === l.id ? 'var(--accent-text)' : 'var(--text)' }}>
                        {l.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Screensaver</div>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, cursor: 'pointer' }}>
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500 }}>Show after 20 minutes idle</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>A calm starfield with the Priora logo. Any click or key press dismisses it.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={screensaverEnabled}
                    onChange={(e) => handleToggleScreensaver(e.target.checked)}
                    style={{ width: 18, height: 18, accentColor: 'var(--accent)', cursor: 'pointer', flexShrink: 0, marginInlineStart: 12 }}
                  />
                </label>
              </div>
            </div>
          )}

          {activeTab === 'backup' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                {[{ label: 'Tasks', value: tasks.length }, { label: 'Folders', value: folders.length }, { label: 'Contacts', value: contacts.length }].map((stat) => (
                  <div key={stat.label} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--mono)' }}>{stat.value}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.05em', marginTop: 2 }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Export Backup</div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 14, lineHeight: 1.5 }}>
                  Download all your tasks, folders, and contacts as a JSON file. Workspaces are excluded.
                </div>
                <button
                  onClick={handleExportBackup}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 18px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 7, fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Download Backup
                </button>
              </div>

              <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 18px' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Restore from Backup</div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 14, lineHeight: 1.5 }}>
                  Import a backup file. <span style={{ color: 'var(--red)', fontWeight: 500 }}>This will replace all current data.</span>
                </div>
                <input ref={fileInputRef} type="file" accept=".json" onChange={handleRestoreFile} style={{ display: 'none' }} />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={restoring}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7, padding: '8px 18px', background: 'var(--surface)',
                    border: '1px solid var(--border)', borderRadius: 7, fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500,
                    cursor: restoring ? 'not-allowed' : 'pointer', color: 'var(--text2)', opacity: restoring ? 0.6 : 1,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                    <polyline points="17 8 12 3 7 8" />
                  </svg>
                  {restoring ? 'Restoring…' : 'Select Backup File'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'features' && (
            <div>
              <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 12, fontWeight: 500 }}>
                What Priora can do
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 340, overflowY: 'auto' }}>
                {FEATURES_LIST.map((feature) => (
                  <div key={feature.title} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 14, flexShrink: 0, color: 'var(--accent)', fontWeight: 600, width: 18, textAlign: 'center' }}>{feature.icon}</span>
                    <div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{feature.title}</span>
                      <span style={{ fontSize: 12, color: 'var(--text3)' }}> — {feature.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'about' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, paddingTop: 8 }}>
              <div style={{ textAlign: 'center' }}>
                <img src={`/${theme === 'dark' ? 'logo-night.png' : 'logo-day.png'}`} alt="Priora" style={{ height: 44, objectFit: 'contain', display: 'block', margin: '0 auto 10px' }} />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, background: 'var(--accent-light)', color: 'var(--accent-text)', border: '1px solid color-mix(in srgb,var(--accent) 25%,var(--border))', borderRadius: 99, padding: '2px 10px' }}>
                    v{APP_VERSION}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>2026</span>
                </div>
              </div>

              <div style={{ padding: '14px 18px', borderInlineStart: '3px solid var(--accent)', background: 'var(--accent-light)', borderRadius: '0 var(--r) var(--r) 0', width: '100%' }}>
                <p style={{ fontSize: 13, color: 'var(--text2)', fontStyle: 'italic', lineHeight: 1.6, margin: 0 }}>
                  "Where accountability meets simplicity. Your work, always under control."
                </p>
              </div>

              <div style={{ padding: '12px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 'var(--r)', width: '100%' }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>Developed by</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Mohammad M. Alamoudi</div>
                <a href="mailto:md.aisystems@gmail.com" style={{ fontSize: 12, color: 'var(--accent-text)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  md.aisystems@gmail.com
                </a>
              </div>

              <p style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center' }}>All rights reserved © 2026 Priora</p>
            </div>
          )}
        </div>
      </div>

      <div className="modal-footer" style={{ justifyContent: 'flex-end' }}>
        <button onClick={onClose} className="btn-cancel">Close</button>
      </div>
    </Modal>
  );
}
