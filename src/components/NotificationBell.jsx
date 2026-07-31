// NotificationBell.jsx
// جرس الإشعارات بالشريط العلوي — نسخة مُعاد كتابتها بوضوح من المكوّن Ge بالكود الأصلي.
//
// ملاحظة سلوكية: يشترك بالاستماع اللحظي لإشعارات غير مقروءة لكل ورك سبيس المستخدم
// عضو فيه (اشتراك منفصل لكل ورك سبيس). الاشتراك بـ "كل الإشعارات" (للعرض بالقائمة
// المنسدلة) لا يبدأ إلا لما تُفتح القائمة فعلياً (n=true) — توفيراً بعدم الاستماع
// المستمر لبيانات غير مطلوبة قبل ما يحتاجها المستخدم.

import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { useWorkspacesStore } from '../store/workspacesStore';
import { notificationService } from '../services/notificationService';
import { formatDateForDisplay } from '../utils/taskDateLogic';

// ⚠️ إضافة بطلب صريح: نص مختلف لكل نوع إشعار (تحديث / تاسك جديد / فولو-أب
// مستحق)، لكن بنفس البنية والألوان تماماً (نفس التنسيق البصري) — عشان ما يصير
// تشتت بصري بين الأنواع، الفرق الوحيد هو النص نفسه.
function renderNotificationLine(n) {
  if (n.type === 'new_task') {
    return (
      <>
        <span style={{ fontWeight: 600, color: 'var(--text)' }}>{n.authorName}</span> added a new task{' '}
        <span style={{ fontWeight: 500, color: 'var(--text)' }}>{n.taskName}</span>
      </>
    );
  }
  if (n.type === 'followup_due') {
    return (
      <>
        Follow-up due today: <span style={{ fontWeight: 500, color: 'var(--text)' }}>{n.taskName}</span>
      </>
    );
  }
  // 'update' (الافتراضي — يشمل إشعارات قديمة بدون حقل type أصلاً)
  return (
    <>
      <span style={{ fontWeight: 600, color: 'var(--text)' }}>{n.authorName}</span> updated{' '}
      <span style={{ fontWeight: 500, color: 'var(--text)' }}>{n.taskName}</span>
    </>
  );
}

export function NotificationBell() {
  const user = useAuthStore((s) => s.user);
  const workspaces = useWorkspacesStore((s) => s.workspaces);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unread, setUnread] = useState([]);
  const [allNotifications, setAllNotifications] = useState([]);
  const containerRef = useRef(null);
  const workspaceIdsKey = workspaces.map((w) => w.id).join(',');

  useEffect(() => {
    if (!user || workspaces.length === 0) return;
    const unsubscribers = [];
    setUnread([]);
    for (const ws of workspaces) {
      const unsubscribe = notificationService.onUnread(ws.id, user.uid, (items) => {
        setUnread((prev) => [...prev.filter((n) => n.wsId !== ws.id), ...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      });
      unsubscribers.push(unsubscribe);
    }
    return () => unsubscribers.forEach((unsub) => unsub());
  }, [user?.uid, workspaceIdsKey]);

  useEffect(() => {
    if (!showDropdown || !user || workspaces.length === 0) return;
    const unsubscribers = [];
    setAllNotifications([]);
    for (const ws of workspaces) {
      const unsubscribe = notificationService.onAll(ws.id, user.uid, (items) => {
        setAllNotifications((prev) => [...prev.filter((n) => n.wsId !== ws.id), ...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      });
      unsubscribers.push(unsubscribe);
    }
    return () => unsubscribers.forEach((unsub) => unsub());
  }, [showDropdown, user?.uid, workspaceIdsKey]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setShowDropdown(false);
    }
    if (showDropdown) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

  async function handleMarkAllRead() {
    if (!user) return;
    const byWorkspace = {};
    for (const n of unread) {
      byWorkspace[n.wsId] ??= [];
      byWorkspace[n.wsId].push(n);
    }
    for (const [wsId, notifs] of Object.entries(byWorkspace)) {
      await notificationService.markAllRead(wsId, notifs, user.uid);
    }
    setUnread([]);
  }

  async function handleMarkRead(notification) {
    if (!user) return;
    await notificationService.markRead(notification.wsId, notification.id, user.uid);
    setUnread((prev) => prev.filter((n) => n.id !== notification.id));
  }

  const unreadCount = unread.length;

  if (workspaces.length === 0) return null;

  return (
    <div style={{ position: 'relative' }} ref={containerRef}>
      <button
        onClick={() => setShowDropdown((v) => !v)}
        style={{
          position: 'relative', display: 'flex', alignItems: 'center', gap: 5, padding: '0 8px', height: 32,
          background: showDropdown ? 'var(--surface2)' : unreadCount > 0 ? 'color-mix(in srgb,var(--accent) 10%,transparent)' : 'none',
          border: `1px solid ${unreadCount > 0 ? 'color-mix(in srgb,var(--accent) 30%,transparent)' : 'transparent'}`,
          borderRadius: 7, cursor: 'pointer', color: unreadCount > 0 ? 'var(--accent)' : 'var(--text3)', transition: 'all .2s', flexShrink: 0,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface2)')}
        onMouseLeave={(e) => { if (!showDropdown) e.currentTarget.style.background = unreadCount > 0 ? 'color-mix(in srgb,var(--accent) 10%,transparent)' : 'none'; }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill={unreadCount > 0 ? 'color-mix(in srgb,var(--accent) 20%,transparent)' : 'none'} stroke="currentColor" strokeWidth="1.8" style={{ transition: 'all .2s' }}>
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--mono)', lineHeight: 1, transition: 'all .2s' }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div style={{ position: 'absolute', top: 38, insetInlineEnd: 0, width: 320, maxHeight: 420, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, boxShadow: 'var(--shadow-lg)', zIndex: 999, overflow: 'hidden', display: 'flex', flexDirection: 'column', animation: 'fade-in .15s ease' }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
              Notifications {unreadCount > 0 && <span style={{ fontSize: 11, color: 'var(--text3)', fontWeight: 400 }}>({unreadCount} unread)</span>}
            </span>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} style={{ fontSize: 11, color: 'var(--accent-text)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font)' }}>
                Mark all read
              </button>
            )}
          </div>

          <div style={{ overflowY: 'auto', flex: 1 }}>
            {allNotifications.length === 0 ? (
              <div style={{ padding: '28px 14px', textAlign: 'center', color: 'var(--text3)', fontSize: 13 }}>No notifications yet</div>
            ) : (
              allNotifications.map((notification) => {
                const isUnread = unread.some((n) => n.id === notification.id);
                return (
                  <div
                    key={notification.id}
                    onClick={() => isUnread && handleMarkRead(notification)}
                    style={{
                      padding: '10px 14px', borderBottom: '1px solid var(--border)',
                      background: isUnread ? 'color-mix(in srgb,var(--accent) 5%,var(--surface))' : 'transparent',
                      cursor: isUnread ? 'pointer' : 'default', transition: 'background .1s',
                    }}
                    onMouseEnter={(e) => { if (isUnread) e.currentTarget.style.background = 'color-mix(in srgb,var(--accent) 10%,var(--surface))'; }}
                    onMouseLeave={(e) => { if (isUnread) e.currentTarget.style.background = 'color-mix(in srgb,var(--accent) 5%,var(--surface))'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      {isUnread && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0, marginTop: 5 }} />}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 2 }}>
                          {renderNotificationLine(notification)}
                          <span style={{ color: 'var(--text3)', marginInlineStart: 4, fontSize: 11 }}>· {notification.wsName}</span>
                        </div>
                        {notification.text && (
                          <div style={{ fontSize: 12, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{notification.text}</div>
                        )}
                        <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 3, fontFamily: 'var(--mono)' }}>{formatDateForDisplay(notification.createdAt.split('T')[0])}</div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
