// WorkspacesListView.jsx
// صفحة "Workspaces" الرئيسية بالشريط الجانبي — قائمة بطاقات كل الورك سبيسات + البحث
// الشامل عبر كل ورك سبيس. نسخة مُعاد كتابتها بوضوح من المكوّن At بالكود الأصلي
// (~895 سطر، الأكبر أصلاً — هنا أُعيد استخدام CreateWorkspaceModal/JoinWorkspaceModal/
// MembersModal المبنية مسبقاً بدل تكرار نفس منطق الإنشاء/الانضمام inline كما بالأصل).
//
// عند اختيار ورك سبيس (Enter Workspace أو نتيجة بحث)، تُعرض WorkspaceDetailPage بدلاً
// من هذي القائمة — هذا محفوظ بالضبط من سلوك الأصل (p && <Dt /> بدل القائمة).

import { useState, useEffect, useMemo } from 'react';
import { useWorkspacesStore } from '../store/workspacesStore';
import { useMembersStore } from '../store/membersStore';
import { useAuthStore } from '../store/authStore';
import { useTasksStore } from '../store/tasksStore';
import { useUIStore } from '../store/uiStore';
import { workspaceService } from '../services/workspaceService';
import { wsTaskService } from '../services/wsTaskService';
import { wsRefsService } from '../services/wsRefsService';
import { generateInviteCode } from '../utils/generateInviteCode';
import { showToast } from '../store/toastStore';
import { CreateWorkspaceModal } from './CreateWorkspaceModal';
import { JoinWorkspaceModal } from './JoinWorkspaceModal';
import { MembersModal } from './MembersModal';
import { WorkspaceDetailPage } from './WorkspaceDetailPage';

export function WorkspacesListView() {
  const workspaces = useWorkspacesStore((s) => s.workspaces);
  const updateWorkspace = useWorkspacesStore((s) => s.updateWorkspace);
  const removeWorkspace = useWorkspacesStore((s) => s.removeWorkspace);
  const user = useAuthStore((s) => s.user);
  const tasks = useTasksStore((s) => s.tasks);
  const getMembers = useMembersStore((s) => s.getMembers);
  const searchQuery = useUIStore((s) => s.searchQuery);

  const [crossWsResults, setCrossWsResults] = useState([]);
  useEffect(() => {
    if (!searchQuery.trim()) return;
    Promise.all(
      workspaces.map((ws) => wsTaskService.getAll(ws.id).then((tasksInWs) => tasksInWs.map((task) => ({ task, wsName: ws.name, wsId: ws.id }))))
    ).then((nested) => setCrossWsResults(nested.flat()));
  }, [searchQuery, workspaces.length]);

  const filteredCrossWsResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return crossWsResults.filter(({ task }) => task.name.toLowerCase().includes(q) || (task.desc ?? '').toLowerCase().includes(q) || task.timeline.some((e) => e.text.toLowerCase().includes(q)));
  }, [searchQuery, crossWsResults]);

  const [selectedWs, setSelectedWs] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [membersModalWs, setMembersModalWs] = useState(null);

  // ⚠️ ميزة جديدة بطلب صريح: لو جينا لهذي الصفحة بنية انتقال محفوظة (من قسم
  // "Workspaces — needs attention" باللوحة الرئيسية)، نفتح الورك سبيس المطلوب
  // تلقائياً، ونمرّر معرّف التاسك لـWorkspaceDetailPage عشان يفتح تفاصيله بمجرد
  // ما تتوفر بياناته.
  const pendingNav = useUIStore((s) => s.pendingWorkspaceNavigation);
  const clearPendingWorkspaceNavigation = useUIStore((s) => s.clearPendingWorkspaceNavigation);
  useEffect(() => {
    if (!pendingNav) return;
    const target = workspaces.find((w) => w.id === pendingNav.wsId);
    if (target) setSelectedWs(target);
  }, [pendingNav, workspaces.length]);

  if (selectedWs) {
    return (
      <WorkspaceDetailPage
        ws={workspaces.find((w) => w.id === selectedWs.id) ?? selectedWs}
        onBack={() => setSelectedWs(null)}
        onSwitch={(wsId) => {
          const target = workspaces.find((w) => w.id === wsId);
          if (target) setSelectedWs(target);
        }}
        initialDetailTaskId={pendingNav?.wsId === selectedWs.id ? pendingNav.taskId : null}
        onInitialDetailTaskHandled={clearPendingWorkspaceNavigation}
      />
    );
  }

  return (
    <div style={{ animation: 'fade-in .2s ease' }}>
      {searchQuery.trim() && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>
            Search results across all workspaces
            <span style={{ fontFamily: 'var(--mono)', marginInlineStart: 8, color: 'var(--accent)' }}>"{searchQuery}"</span>
            <span style={{ marginInlineStart: 6, color: 'var(--text3)' }}>— {filteredCrossWsResults.length} results</span>
          </div>

          {filteredCrossWsResults.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--text3)', fontStyle: 'italic' }}>
              {crossWsResults.length === 0 ? 'Loading…' : 'No results found.'}
            </p>
          ) : (
            <div className="task-table-wrap" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
              <div className="task-table-head" style={{ display: 'grid', gridTemplateColumns: 'minmax(160px,2fr) minmax(120px,1.5fr) 100px 140px', background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
                {['Task', 'Workspace', 'Updated', 'Status'].map((h) => (
                  <div key={h} style={{ padding: '7px 12px', fontSize: 11, fontWeight: 500, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</div>
                ))}
              </div>
              {filteredCrossWsResults.map(({ task, wsName, wsId }) => (
                <div
                  key={`${wsId}-${task.id}`}
                  style={{ display: 'grid', gridTemplateColumns: 'minmax(160px,2fr) minmax(120px,1.5fr) 100px 140px', cursor: 'pointer', borderBottom: '1px solid var(--border)', transition: 'background .1s' }}
                  onClick={() => { const ws = workspaces.find((w) => w.id === wsId); if (ws) setSelectedWs(ws); }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface2)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 7, overflow: 'hidden' }}>
                    <div className={`sdot sdot-${task.priority === 'urgent' ? 'urgent' : task.status}`} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: 'var(--text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.name}</span>
                  </div>
                  <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{wsName}</div>
                  <div style={{ padding: '8px 12px', fontSize: 12, color: 'var(--text2)', fontFamily: 'var(--mono)' }}>{task.lastUpdate ? new Date(task.lastUpdate).toLocaleDateString() : '—'}</div>
                  <div style={{ padding: '8px 12px' }}>
                    <span className={`badge badge-${task.status}`} style={{ fontSize: 11 }}>
                      {{ active: 'Action Required', waiting: 'Waiting', ontrack: 'On Track', closed: 'Closed' }[task.status] ?? task.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', flex: 1 }}>
          Workspaces <span style={{ fontFamily: 'var(--mono)', opacity: 0.5 }}>({workspaces.length})</span>
        </div>
        <button onClick={() => setShowJoinModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 13px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, fontFamily: 'var(--font)', fontSize: 13, color: 'var(--text2)', cursor: 'pointer' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>
          Join
        </button>
        <button onClick={() => setShowCreateModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 13px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 6, fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          New Workspace
        </button>
      </div>

      {workspaces.length === 0 ? (
        <div className="empty-state">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
          <p>No workspaces yet</p>
          <p style={{ fontSize: 12, opacity: 0.6 }}>Create one or join with an invite code.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {workspaces.map((ws) => {
            const isOwner = ws.ownerId === user?.uid;
            const activeTaskCount = tasks.filter((t) => (t.workspaceId === ws.id || (t.sharedToWsIds ?? []).includes(ws.id)) && t.status !== 'closed').length;
            const memberCount = getMembers(ws.id).length || (ws.ownerId ? 1 : 0);

            return (
              <div
                key={ws.id}
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', padding: '14px 15px', boxShadow: 'var(--shadow)', transition: 'box-shadow .15s, transform .15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow)'; e.currentTarget.style.transform = 'none'; }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{ws.name}</div>
                    {ws.description && (
                      <div style={{ fontSize: 12, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{ws.description}</div>
                    )}
                  </div>
                  <span className={`badge ${isOwner ? 'badge-active' : 'badge-ontrack'}`} style={{ flexShrink: 0, marginInlineStart: 8 }}>{isOwner ? 'Owner' : 'Member'}</span>
                </div>

                <div style={{ display: 'flex', gap: 12, marginBottom: 12, fontSize: 11, color: 'var(--text3)' }}>
                  <span style={{ cursor: 'pointer', textDecoration: 'underline dotted' }} onClick={() => setMembersModalWs(ws)}>
                    {memberCount} {memberCount === 1 ? 'member' : 'members'}
                  </span>
                  <span style={{ color: activeTaskCount > 0 ? 'var(--accent-text)' : 'var(--text3)', fontWeight: activeTaskCount > 0 ? 500 : 400 }}>
                    {activeTaskCount} active task{activeTaskCount === 1 ? '' : 's'}
                  </span>
                </div>

                {isOwner && (
                  <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, padding: '7px 10px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 2 }}>Invite Code</div>
                      <code style={{ fontSize: 13, fontFamily: 'var(--mono)', color: 'var(--accent)', letterSpacing: '.08em', fontWeight: 500 }}>{ws.inviteCode}</code>
                    </div>
                    <button
                      onClick={() => navigator.clipboard?.writeText(ws.inviteCode).then(() => showToast('Copied!'))}
                      style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer', color: 'var(--text3)', transition: 'all .12s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-light)'; e.currentTarget.style.color = 'var(--accent)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--text3)'; }}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                    </button>
                    <button
                      onClick={async () => {
                        const newCode = generateInviteCode();
                        updateWorkspace(ws.id, { inviteCode: newCode });
                        try { await workspaceService.updateInviteCode(ws.id, newCode); } catch {}
                        showToast('Code regenerated');
                      }}
                      style={{ width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, cursor: 'pointer', color: 'var(--text3)', transition: 'all .12s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-light)'; e.currentTarget.style.color = 'var(--accent)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--text3)'; }}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
                    </button>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => setSelectedWs(ws)}
                    style={{ flex: 2, padding: '7px 0', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 6, fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'opacity .12s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '.88')}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>
                    Enter Workspace
                  </button>
                  <button
                    onClick={() => setMembersModalWs(ws)}
                    style={{ flex: 1, padding: '7px 0', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text2)', cursor: 'pointer', transition: 'background .12s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface3)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--surface2)')}
                  >
                    Members
                  </button>
                  {isOwner ? (
                    <button
                      onClick={async () => {
                        if (!window.confirm(`Delete "${ws.name}"?`)) return;
                        try { await workspaceService.delete(ws.id); } catch {}
                        removeWorkspace(ws.id);
                        showToast('Workspace deleted');
                      }}
                      style={{ padding: '7px 12px', background: 'var(--red-bg)', border: '1px solid color-mix(in srgb,var(--red) 30%,var(--border))', borderRadius: 6, fontFamily: 'var(--font)', fontSize: 12, color: 'var(--red)', cursor: 'pointer' }}
                    >
                      Delete
                    </button>
                  ) : (
                    <button
                      onClick={async () => {
                        if (!window.confirm(`Leave "${ws.name}"?`)) return;
                        try {
                          await workspaceService.removeMember(ws.id, user?.uid ?? '');
                          const ownInternalTasks = (await wsTaskService.getAll(ws.id)).filter((t) => t.ownerId === user?.uid && t.workspaceId === null);
                          await Promise.all(ownInternalTasks.map((t) => wsTaskService.delete(ws.id, t.id)));
                        } catch {}
                        removeWorkspace(ws.id);
                        if (user) wsRefsService.delete(user.uid, ws.id).catch(() => {});
                        showToast('Left workspace');
                      }}
                      style={{ padding: '7px 12px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 6, fontFamily: 'var(--font)', fontSize: 12, color: 'var(--text2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, transition: 'all .12s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--red-bg)'; e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.borderColor = 'color-mix(in srgb,var(--red) 30%,var(--border))'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.color = 'var(--text2)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                      Leave
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {membersModalWs && <MembersModal ws={membersModalWs} onClose={() => setMembersModalWs(null)} />}
      {showCreateModal && <CreateWorkspaceModal onClose={() => setShowCreateModal(false)} />}
      {showJoinModal && <JoinWorkspaceModal onClose={() => setShowJoinModal(false)} onJoined={(ws) => setSelectedWs(ws)} />}
    </div>
  );
}
