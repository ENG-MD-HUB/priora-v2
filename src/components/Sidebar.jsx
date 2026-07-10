// Sidebar.jsx
// الشريط الجانبي الكامل للتطبيق — نسخة مُعاد كتابتها بوضوح من المكوّن Re بالكود
// الأصلي. يجمع: ساعة مباشرة + تاريخ هجري حقيقي، التنقل الرئيسي، قائمة المجلدات
// (رئيسية وفرعية) مع CRUD كامل، وملف المستخدم بالأسفل.
//
// ⚠️ ميزات جديدة بطلب صريح (غير موجودة بالكود الأصلي):
// 1. مجلدات فرعية (مستوى واحد فقط) — تظهر متداخلة بصرياً تحت المجلد الرئيسي،
//    قابلة للطي/البسط لكل مجلد رئيسي على حدة.
// 2. حذف ناعم (Soft Delete) مع تحذير واضح: حذف مجلد (رئيسي أو فرعي) ينقل كل
//    تاسكاته المباشرة لسلة المهملات (قابلة للاستعادة، والمجلد يرجع معها تلقائياً
//    عند استعادة أي تاسك منه). حذف مجلد رئيسي له فروع يحذف الفروع معه بنفس الطريقة.
// 3. لون متكيّف مع الوضع الداكن/النهاري (getAdaptiveFolderColor).
//
// ملاحظات سلوكية محفوظة من الأصل:
// 1. الساعة تتحدّث كل ثانية فعلياً (setInterval 1000ms).
// 2. عدد "Active" بجانب Dashboard يحسب التاسكات المتأخرة غير المغلقة فقط.
// 3. لا يمكن حذف آخر مجلد رئيسي متبقي بالنظام.
// 4. حذف مجلد نشط (تتصفحه حالياً) يرجّعك تلقائياً لـ dashboard.

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { useTasksStore } from '../store/tasksStore';
import { useFoldersStore } from '../store/foldersStore';
import { authService } from '../services/authService';
import { showToast } from '../store/toastStore';
import { isTaskOverdue } from '../utils/taskDateLogic';
import { useHijriDate } from '../utils/useHijriDate';
import { getAdaptiveFolderColor } from '../utils/folderColors';
import { Icon } from './Icon';
import { WindowsFolderIcon } from './WindowsFolderIcon';
import { SidebarNavItem } from './SidebarNavItem';
import { FolderContextMenu } from './FolderContextMenu';
import { Modal } from './Modal';
import { AboutModal } from './AboutModal';
import { SettingsModal } from './SettingsModal';

const FOLDER_COLOR_OPTIONS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#6b7280', '#ffffff'];

export function Sidebar({ fontScale }) {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const activeView = useUIStore((s) => s.activeView);
  const setActiveView = useUIStore((s) => s.setActiveView);
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);
  const theme = useUIStore((s) => s.theme);
  const tasks = useTasksStore((s) => s.tasks);
  const trash = useTasksStore((s) => s.trash);
  const deleteTask = useTasksStore((s) => s.deleteTask);
  const folders = useFoldersStore((s) => s.folders);
  const addFolder = useFoldersStore((s) => s.addFolder);
  const updateFolder = useFoldersStore((s) => s.updateFolder);
  const deleteFolderWithCascade = useFoldersStore((s) => s.deleteFolderWithCascade);
  const reorderFolders = useFoldersStore((s) => s.reorderFolders);

  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const intervalId = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(intervalId);
  }, []);
  const hijriDate = useHijriDate(now);

  const [foldersExpanded, setFoldersExpanded] = useState(true);
  const [expandedRootIds, setExpandedRootIds] = useState({});
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderParentId, setNewFolderParentId] = useState(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState(FOLDER_COLOR_OPTIONS[0]);
  const [renamingFolder, setRenamingFolder] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameColor, setRenameColor] = useState(FOLDER_COLOR_OPTIONS[0]);
  const [folderCtxMenu, setFolderCtxMenu] = useState(null);
  const [confirmDeleteFolder, setConfirmDeleteFolder] = useState(null);
  const [showAbout, setShowAbout] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const overdueCount = tasks.filter((t) => t.status !== 'closed' && isTaskOverdue(t)).length;
  const trashCount = trash.length;
  const userInitials = user?.displayName ? user.displayName.split(' ').map((p) => p[0]).join('').toUpperCase().slice(0, 2) : '?';

  // ⚠️ إضافة جديدة بطلب صريح: ترتيب الفولدرات حسب حقل order (سحب وإفلات) —
  // فولدر بدون order بعد (قديم، من قبل هذي الميزة) يترتب تلقائياً بالنهاية
  // حسب تاريخ الإنشاء، حتى ما يقفز لمكان عشوائي أول مرة.
  function sortByOrder(a, b) {
    const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
    const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
    if (orderA !== orderB) return orderA - orderB;
    return (a.createdAt ?? '').localeCompare(b.createdAt ?? '');
  }

  const rootFolders = folders.filter((f) => f.parentId === null || f.parentId === undefined).sort(sortByOrder);
  const getChildFolders = (parentId) => folders.filter((f) => f.parentId === parentId).sort(sortByOrder);

  const [draggedFolderId, setDraggedFolderId] = useState(null);
  const [dragOverFolderId, setDragOverFolderId] = useState(null);

  // ⚠️ إضافة جديدة بطلب صريح: سحب-وإفلات لإعادة ترتيب الفولدرات، مع حفظ فوري
  // بـFirestore. يسمح فقط بإعادة ترتيب فولدرات بنفس المستوى (كلها رئيسية، أو
  // كلها فروع لنفس الأب) — إفلات على مستوى مختلف يُتجاهَل بأمان (fromIdx === -1).
  function handleFolderDrop(targetFolder, isTargetRoot) {
    if (!draggedFolderId || draggedFolderId === targetFolder.id) {
      setDraggedFolderId(null);
      setDragOverFolderId(null);
      return;
    }
    const siblings = isTargetRoot ? rootFolders : getChildFolders(targetFolder.parentId);
    const siblingIds = siblings.map((f) => f.id);
    const fromIdx = siblingIds.indexOf(draggedFolderId);
    const toIdx = siblingIds.indexOf(targetFolder.id);
    if (fromIdx !== -1 && toIdx !== -1) {
      const reordered = [...siblingIds];
      reordered.splice(fromIdx, 1);
      reordered.splice(toIdx, 0, draggedFolderId);
      reorderFolders(reordered);
    }
    setDraggedFolderId(null);
    setDragOverFolderId(null);
  }

  function toggleRootExpanded(id) {
    setExpandedRootIds((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function openNewFolderModal(parentId = null) {
    setNewFolderParentId(parentId);
    setNewFolderName('');
    setNewFolderColor(FOLDER_COLOR_OPTIONS[0]);
    setShowNewFolderModal(true);
  }

  function handleCreateFolder(e) {
    e.preventDefault();
    const name = newFolderName.trim();
    if (!name) return;
    const newFolder = addFolder(name, user?.uid ?? '', newFolderColor, newFolderParentId);
    setShowNewFolderModal(false);
    setActiveView(`folder:${newFolder.id}`);
    if (newFolderParentId) setExpandedRootIds((prev) => ({ ...prev, [newFolderParentId]: true }));
    showToast(`"${name}" created`);
  }

  function handleRenameFolder(e) {
    e.preventDefault();
    if (!renamingFolder || !renameValue.trim()) return;
    updateFolder(renamingFolder.id, { name: renameValue.trim(), color: renameColor });
    setRenamingFolder(null);
    showToast('Folder updated');
  }

  function requestDeleteFolder(folder) {
    const isRoot = folder.parentId === null || folder.parentId === undefined;
    if (isRoot && rootFolders.length <= 1) {
      showToast("Can't delete the last main folder");
      return;
    }
    const childCount = isRoot ? getChildFolders(folder.id).length : 0;
    const directTaskCount = tasks.filter((t) => t.folderId === folder.id && t.status !== 'closed').length;
    const childTaskCount = isRoot
      ? getChildFolders(folder.id).reduce((sum, child) => sum + tasks.filter((t) => t.folderId === child.id && t.status !== 'closed').length, 0)
      : 0;
    setConfirmDeleteFolder({ folder, childCount, taskCount: directTaskCount + childTaskCount });
  }

  function handleConfirmDeleteFolder() {
    if (!confirmDeleteFolder) return;
    const { folder } = confirmDeleteFolder;

    // كل التاسكات (مباشرة بهذا المجلد، وبكل فروعه لو رئيسي) تنتقل لسلة المهملات أولاً.
    const deletedFolderIds = deleteFolderWithCascade(folder.id);
    deletedFolderIds.forEach((folderId) => {
      tasks.filter((t) => t.folderId === folderId && t.status !== 'closed').forEach((t) => deleteTask(t.id));
    });

    if (activeView === `folder:${folder.id}` || deletedFolderIds.some((id) => activeView === `folder:${id}`)) {
      setActiveView('dashboard');
    }

    setConfirmDeleteFolder(null);
    showToast(`"${folder.name}" moved to trash (with its tasks)`);
  }

  const handleFolderContextMenu = useCallback((e, folder) => {
    e.preventDefault();
    e.stopPropagation();
    setFolderCtxMenu({ folder, x: e.clientX, y: e.clientY });
  }, []);

  async function handleSignOut() {
    await authService.signOut();
    setUser(null);
    showToast('Signed out');
  }

  function renderFolderButton(folder, { isChild = false } = {}) {
    const viewId = `folder:${folder.id}`;
    const isActive = activeView === viewId;
    const openTaskCount = tasks.filter((t) => t.folderId === folder.id && t.status !== 'closed').length;
    const displayColor = getAdaptiveFolderColor(folder.color ?? '#3b82f6', theme);
    const isRoot = folder.parentId === null || folder.parentId === undefined;
    const children = isRoot ? getChildFolders(folder.id) : [];
    const hasChildren = children.length > 0;
    const isExpanded = !!expandedRootIds[folder.id];

    return (
      <div key={folder.id}>
        <div
          draggable
          onDragStart={(e) => { setDraggedFolderId(folder.id); e.dataTransfer.effectAllowed = 'move'; }}
          onDragOver={(e) => { e.preventDefault(); if (draggedFolderId && draggedFolderId !== folder.id) setDragOverFolderId(folder.id); }}
          onDragLeave={() => setDragOverFolderId((prev) => (prev === folder.id ? null : prev))}
          onDrop={(e) => { e.preventDefault(); handleFolderDrop(folder, isRoot); }}
          onDragEnd={() => { setDraggedFolderId(null); setDragOverFolderId(null); }}
          style={{
            display: 'flex', alignItems: 'center', cursor: 'grab',
            background: isActive ? 'var(--accent-light)' : dragOverFolderId === folder.id ? 'var(--surface2)' : 'none',
            borderInlineStart: `2px solid ${isActive ? 'var(--accent)' : dragOverFolderId === folder.id ? 'var(--accent)' : 'transparent'}`,
            opacity: draggedFolderId === folder.id ? 0.4 : 1,
            transition: 'background .12s',
          }}
          onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--surface2)'; }}
          onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'none'; }}
        >
          {/* مساحة ثابتة لمكان السهم دائماً (حتى لو فاضية بدون سهم فعلي) — هذا يضمن
              محاذاة متطابقة لكل صفوف المجلدات، بغض النظر عن وجود فروع أو لا، وبغض
              النظر عن كونه مجلد رئيسي أو فرعي. العرض الكامل = نفس مسافة الإزاحة
              للمجلد الفرعي (22px) أو أقل بمقدار عرض السهم نفسه للرئيسي. */}
          <div style={{ width: isChild ? 22 : 22, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', paddingInlineStart: isChild ? 16 : 0 }}>
            {isRoot && hasChildren && (
              <button
                onClick={() => toggleRootExpanded(folder.id)}
                style={{ width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 0 }}
              >
                <span style={{ transition: 'transform .15s', transform: isExpanded ? 'rotate(0)' : 'rotate(-90deg)', display: 'flex' }}>
                  <Icon name="chevron-down" size={9} />
                </span>
              </button>
            )}
          </div>
          <button
            onClick={() => setActiveView(viewId)}
            onContextMenu={(e) => handleFolderContextMenu(e, folder)}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: 7,
              padding: '6px 14px 6px 2px',
              cursor: 'pointer', color: isActive ? 'var(--accent)' : 'var(--text2)', fontSize: 13,
              background: 'none', border: 'none',
              fontFamily: 'var(--font)', fontWeight: isActive ? 500 : 400, transition: 'color .12s', textAlign: 'start',
            }}
          >
            {/* أيقونة المجلد بحجم ثابت دائماً (مجلد رئيسي أو فرعي) — موحّدة بدل
                تصغيرها للفروع، حتى تبدو كل المجلدات بحجم متساوٍ بالشريط الجانبي. */}
            <span style={{ flexShrink: 0, display: 'flex' }}>
              <WindowsFolderIcon color={displayColor} size={15} />
            </span>
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{folder.name}</span>
            {openTaskCount > 0 && (
              <span style={{ fontSize: 11, fontFamily: 'var(--mono)', flexShrink: 0, color: isActive ? 'var(--accent-text)' : 'var(--text3)', opacity: 0.8 }}>
                {openTaskCount}
              </span>
            )}
          </button>
        </div>
        {isRoot && hasChildren && isExpanded && children.map((child) => renderFolderButton(child, { isChild: true }))}
      </div>
    );
  }

  return (
    <>
      <div className={`sidebar-overlay${sidebarOpen ? ' show' : ''}`} onClick={() => setSidebarOpen(false)} />
      <aside
        className={`app-sidebar${sidebarOpen ? ' open' : ''}`}
        style={{
          width: 'var(--sidebar-w)', flexShrink: 0, borderInlineEnd: '1px solid var(--border)',
          // ⚠️ تصحيح خلل حقيقي بطلب صريح (يستبدل محاولة sticky السابقة، اللي ثبت
          // إنها غير موثوقة): كنا نعتمد على position:sticky + تمدد الفليكس التلقائي
          // (بدل حساب ارتفاع يدوي) عشان نتفادى خلل "شريط تمرير على مستوى الصفحة"
          // القديم. لكن sticky اتضح إنها ما تشتغل بثبات مع هذا التصميم تحديداً (حتى
          // بعد إصلاح body/overflow) — على الأغلب بسبب تفاعل معقّد بين تمدد الفليكس
          // وoverflow الذاتي للسايد بار (overflowY:auto) مع صفحة تتمرر على مستوى
          // body. بدل مطاردة تفاعلات CSS دقيقة وهشة، الحل الأقوى والمضمون رياضياً:
          // position:fixed مربوط مباشرة بحواف الشاشة (top/bottom) — يثبت السايد بار
          // بالضبط بمكانه بغض النظر عن أي تعقيد بالتمرير أو طول المحتوى، بدون أي
          // اعتماد على سلوك sticky الحساس للسياق. المحتوى الرئيسي (main بـApp.jsx)
          // يحجز له مساحة عبر margin-inline-start يطابق عرضه، بدل ما يشاركه بالتخطيط
          // كعنصر عادي بالفليكس.
          position: 'fixed', top: 'var(--topbar-h)', bottom: 0, insetInlineStart: 0, zIndex: 10,
          overflowY: 'auto', overflowX: 'hidden', background: 'var(--surface)', display: 'flex', flexDirection: 'column',
        }}
      >
        <div style={{ padding: '14px 16px 14px', borderBottom: '1px solid var(--border)', flexShrink: 0, textAlign: 'center' }}>
          <div style={{ fontSize: 30, fontWeight: 500, color: 'var(--text)', fontFamily: 'var(--mono)', letterSpacing: '.04em', lineHeight: 1, marginBottom: 8 }}>
            {now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true })}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 3 }}>
            {now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          {hijriDate && <div style={{ fontSize: 10, color: 'var(--text3)' }}>{hijriDate}</div>}
        </div>

        <nav style={{ flex: 1, padding: '5px 0', overflowY: 'auto', minHeight: 0 }}>
          <SidebarNavItem viewId="dashboard" icon="grid" label="Dashboard" activeView={activeView} setActiveView={setActiveView} note={overdueCount > 0 ? `${overdueCount}↑` : undefined} />
          <div style={{ margin: '4px 0 2px', borderTop: '1px solid var(--border)' }} />

          <div style={{ display: 'flex', alignItems: 'center', padding: '4px 14px 2px', gap: 4 }}>
            <button
              onClick={() => setFoldersExpanded((v) => !v)}
              style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em', fontFamily: 'var(--font)', fontWeight: 500, padding: '3px 0' }}
            >
              <span style={{ transition: 'transform .15s', transform: foldersExpanded ? 'rotate(0)' : 'rotate(-90deg)', display: 'flex' }}>
                <Icon name="chevron-down" size={11} />
              </span>
              Folders
              <span style={{ fontFamily: 'var(--mono)', opacity: 0.45 }}>({folders.length})</span>
            </button>
            <button
              onClick={() => openNewFolderModal(null)}
              title="New folder"
              style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 5, border: '1px solid var(--border)', background: 'none', color: 'var(--text3)', cursor: 'pointer', transition: 'all .12s', flexShrink: 0 }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-light)'; e.currentTarget.style.color = 'var(--accent)'; e.currentTarget.style.borderColor = 'var(--accent)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text3)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
            >
              <Icon name="plus" size={11} />
            </button>
          </div>

          {foldersExpanded && rootFolders.map((folder) => renderFolderButton(folder))}

          <div style={{ margin: '4px 0 2px', borderTop: '1px solid var(--border)' }} />
          <SidebarNavItem viewId="contacts" icon="user" label="Contacts" activeView={activeView} setActiveView={setActiveView} />
          <SidebarNavItem viewId="completed" icon="check" label="Completed" activeView={activeView} setActiveView={setActiveView} />
          <SidebarNavItem viewId="trash" icon="trash" label="Trash" activeView={activeView} setActiveView={setActiveView} badge={trashCount} />
          <div style={{ margin: '4px 0 2px', borderTop: '1px solid var(--border)' }} />
          <SidebarNavItem viewId="workspaces" icon="users" label="Workspaces" activeView={activeView} setActiveView={setActiveView} />
        </nav>

        <div style={{ borderTop: '1px solid var(--border)', padding: '9px 12px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 6px', borderRadius: 7 }}>
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
            ) : (
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent-light)', border: '2px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--accent-text)', flexShrink: 0 }}>
                {userInitials}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.displayName || 'User'}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 4, marginTop: 5 }}>
            <button
              onClick={handleSignOut}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '5px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface2)', color: 'var(--text2)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font)', transition: 'all .12s' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--red-bg)'; e.currentTarget.style.color = 'var(--red)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.color = 'var(--text2)'; }}
            >
              <Icon name="logout" size={12} /> Sign Out
            </button>
          </div>

          <button
            onClick={() => setShowSettings(true)}
            style={{ width: '100%', marginTop: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '5px 8px', borderRadius: 6, border: '1px solid var(--border)', background: 'none', color: 'var(--text3)', fontSize: 11, cursor: 'pointer', fontFamily: 'var(--font)', transition: 'all .12s' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.color = 'var(--text2)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text3)'; }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            Settings
          </button>
        </div>

        {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
        {showSettings && <SettingsModal onClose={() => setShowSettings(false)} fontScale={fontScale} />}

        {folderCtxMenu && (
          <FolderContextMenu
            folder={folderCtxMenu.folder}
            x={folderCtxMenu.x}
            y={folderCtxMenu.y}
            onClose={() => setFolderCtxMenu(null)}
            canDelete={(folderCtxMenu.folder.parentId === null || folderCtxMenu.folder.parentId === undefined) ? rootFolders.length > 1 : true}
            isRoot={folderCtxMenu.folder.parentId === null || folderCtxMenu.folder.parentId === undefined}
            onRename={() => { setRenameValue(folderCtxMenu.folder.name); setRenameColor(folderCtxMenu.folder.color ?? FOLDER_COLOR_OPTIONS[0]); setRenamingFolder(folderCtxMenu.folder); }}
            onDelete={() => requestDeleteFolder(folderCtxMenu.folder)}
            onAddSubfolder={() => openNewFolderModal(folderCtxMenu.folder.id)}
          />
        )}

        {showNewFolderModal && (
          <Modal title={newFolderParentId ? 'New Subfolder' : 'New Folder'} onClose={() => setShowNewFolderModal(false)}>
            <form onSubmit={handleCreateFolder}>
              <div className="modal-body">
                <div className="field">
                  <label className="label">Folder Name</label>
                  <input className="input" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="e.g. Client Projects, Q4 Tasks…" autoFocus />
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label className="label">Color</label>
                  <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                    {FOLDER_COLOR_OPTIONS.map((color) => {
                      const isWhite = color.toLowerCase() === '#ffffff';
                      const isSelected = newFolderColor === color;
                      return (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setNewFolderColor(color)}
                          title={isWhite ? 'White' : undefined}
                          style={{
                            width: 26, height: 26, borderRadius: '50%', background: color, cursor: 'pointer',
                            border: isSelected ? '2px solid var(--text)' : isWhite ? '2px solid var(--border2)' : '2px solid transparent',
                            boxShadow: isSelected ? '0 0 0 2px var(--surface)' : 'none', transition: 'all .12s',
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="submit" disabled={!newFolderName.trim()} style={{ padding: '7px 20px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 6, fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, cursor: newFolderName.trim() ? 'pointer' : 'not-allowed', opacity: newFolderName.trim() ? 1 : 0.5 }}>
                  Create
                </button>
                <button type="button" onClick={() => setShowNewFolderModal(false)} style={{ padding: '7px 14px', background: 'var(--surface2)', color: 'var(--text2)', border: '1px solid var(--border)', borderRadius: 6, fontFamily: 'var(--font)', fontSize: 13, cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          </Modal>
        )}

        {renamingFolder && (
          <Modal title="Edit Folder" onClose={() => setRenamingFolder(null)}>
            <form onSubmit={handleRenameFolder}>
              <div className="modal-body">
                <div className="field">
                  <label className="label">Name</label>
                  <input className="input" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} autoFocus />
                </div>
                <div className="field" style={{ marginBottom: 0 }}>
                  <label className="label">Color</label>
                  <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                    {FOLDER_COLOR_OPTIONS.map((color) => {
                      const isWhite = color.toLowerCase() === '#ffffff';
                      const isSelected = renameColor === color;
                      return (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setRenameColor(color)}
                          title={isWhite ? 'White' : undefined}
                          style={{
                            width: 26, height: 26, borderRadius: '50%', background: color, cursor: 'pointer',
                            border: isSelected ? '2px solid var(--text)' : isWhite ? '2px solid var(--border2)' : '2px solid transparent',
                            boxShadow: isSelected ? '0 0 0 2px var(--surface)' : 'none', transition: 'all .12s',
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="submit" disabled={!renameValue.trim()} style={{ padding: '7px 20px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 6, fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                  Save
                </button>
                <button type="button" onClick={() => setRenamingFolder(null)} style={{ padding: '7px 14px', background: 'var(--surface2)', color: 'var(--text2)', border: '1px solid var(--border)', borderRadius: 6, fontFamily: 'var(--font)', fontSize: 13, cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          </Modal>
        )}

        {confirmDeleteFolder && (
          <Modal title="Delete Folder" onClose={() => setConfirmDeleteFolder(null)} maxWidth={400} closeOnOutsideClick>
            <div className="modal-body">
              <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
                Delete "<strong style={{ color: 'var(--text)' }}>{confirmDeleteFolder.folder.name}</strong>"?
                {confirmDeleteFolder.childCount > 0 && (
                  <> This will also delete its <strong>{confirmDeleteFolder.childCount}</strong> subfolder{confirmDeleteFolder.childCount === 1 ? '' : 's'}.</>
                )}
                {' '}
                {confirmDeleteFolder.taskCount > 0 ? (
                  <>All <strong>{confirmDeleteFolder.taskCount}</strong> task{confirmDeleteFolder.taskCount === 1 ? '' : 's'} inside will be moved to Trash — you can restore everything later, and the folder will come back automatically.</>
                ) : (
                  'This folder has no active tasks.'
                )}
              </p>
            </div>
            <div className="modal-footer">
              <button
                onClick={handleConfirmDeleteFolder}
                style={{ padding: '7px 18px', background: 'var(--red)', color: '#fff', border: 'none', borderRadius: 6, fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
              >
                Delete
              </button>
              <button onClick={() => setConfirmDeleteFolder(null)} className="btn-cancel">Cancel</button>
            </div>
          </Modal>
        )}
      </aside>
    </>
  );
}
