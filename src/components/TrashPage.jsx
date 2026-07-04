// TrashPage.jsx
// صفحة سلة المهملات — نسخة مُعاد كتابتها بوضوح من المكوّن ht بالكود الأصلي.
//
// ⚠️ تحديثات بطلب صريح (غير موجودة بالكود الأصلي):
// 1. عمود "Folder" يعرض الآن اسم المجلد الحقيقي (يبحث بقائمتي folders و
//    deletedFolders معاً) — بدل النص الثابت "task" المحفوظ سابقاً من الكود الأصلي.
// 2. المجلدات المحذوفة والتاسكات المحذوفة صارت بقائمة واحدة مدمجة (بدل قسمين
//    منفصلين "Deleted Folders" / "Deleted Tasks")، مرتبة زمنياً حسب تاريخ الحذف
//    (_deletedAt) — الأقدم بالأعلى. صف المجلد يحتفظ بنفس ميزة "توسيع لعرض
//    تاسكاته" وزر استعادة موحّد يرجّع المجلد وكل تاسكاته دفعة واحدة.
//
// ملاحظة محفوظة من الأصل: العناصر منتهية الصلاحية تظهر بشفافية أقل، اسمها يُشطب،
// ويختفي زر "Restore" الفردي (يبقى فقط زر الحذف النهائي).

import { useState } from 'react';
import { useTasksStore } from '../store/tasksStore';
import { useFoldersStore } from '../store/foldersStore';
import { showToast } from '../store/toastStore';
import { formatDateForDisplay } from '../utils/taskDateLogic';
import { TRASH_EXPIRY_MS } from '../utils/trashConstants';
import { WindowsFolderIcon } from './WindowsFolderIcon';
import { Modal } from './Modal';

const TRASH_TABLE_GRID_COLUMNS = 'minmax(180px,2.5fr) minmax(100px,1fr) 120px 130px 130px';
const TRASH_HEADERS = ['Name', 'Type / Folder', 'Deleted', 'Time Left', 'Actions'];

function getTimeLeftLabel(deletedAt) {
  if (!deletedAt) return 'expires soon';
  const remainingMs = TRASH_EXPIRY_MS - (Date.now() - new Date(deletedAt).getTime());
  if (remainingMs <= 0) return 'Expired';

  const days = Math.floor(remainingMs / 86400000);
  const hours = Math.floor((remainingMs % 86400000) / 3600000);
  const minutes = Math.floor((remainingMs % 3600000) / 60000);

  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

function isStillValid(deletedAt) {
  return deletedAt ? Date.now() - new Date(deletedAt).getTime() < TRASH_EXPIRY_MS : true;
}

export function TrashPage() {
  const trash = useTasksStore((s) => s.trash);
  const restoreTask = useTasksStore((s) => s.restoreTask);
  const permDeleteTask = useTasksStore((s) => s.permDeleteTask);
  const folders = useFoldersStore((s) => s.folders);
  const deletedFolders = useFoldersStore((s) => s.deletedFolders);
  const restoreFolder = useFoldersStore((s) => s.restoreFolder);
  const permDeleteFolder = useFoldersStore((s) => s.permDeleteFolder);
  const [confirmingDelete, setConfirmingDelete] = useState(null); // { type: 'task'|'folder', id }
  const [expandedDeletedFolderIds, setExpandedDeletedFolderIds] = useState({});

  function toggleDeletedFolderExpanded(folderId) {
    setExpandedDeletedFolderIds((prev) => ({ ...prev, [folderId]: !prev[folderId] }));
  }

  function getFolderName(folderId) {
    if (!folderId) return '—';
    const live = folders.find((f) => f.id === folderId);
    if (live) return live.name;
    const deleted = deletedFolders.find((f) => f.id === folderId);
    if (deleted) return deleted.name;
    return 'Unknown';
  }

  function handleRestoreFolder(folderId) {
    const folder = deletedFolders.find((f) => f.id === folderId);
    if (!folder) return;

    const restored = restoreFolder(folderId);
    if (!restored) return;

    const tasksInFolder = trash.filter((t) => t.folderId === folderId);
    tasksInFolder.forEach((t) => restoreTask(t.id));

    showToast(`"${folder.name}" restored with ${tasksInFolder.length} task${tasksInFolder.length === 1 ? '' : 's'}`);
  }

  const hasNothing = trash.length === 0 && deletedFolders.length === 0;

  // ⚠️ الدمج المطلوب: بدل قسمين منفصلين (Deleted Folders ثم Deleted Tasks)، نبني
  // قائمة واحدة تحتوي النوعين معاً، ومرتبة تصاعدياً حسب _deletedAt (الأقدم أولاً).
  // عنصر بدون _deletedAt (حالة نادرة/قديمة) يُعامَل كـ"الآن" حتى لا يُخل بالترتيب.
  const mergedItems = [
    ...deletedFolders.map((folder) => ({ kind: 'folder', data: folder, _sortTime: folder._deletedAt ? new Date(folder._deletedAt).getTime() : Date.now() })),
    ...trash.map((task) => ({ kind: 'task', data: task, _sortTime: task._deletedAt ? new Date(task._deletedAt).getTime() : Date.now() })),
  ].sort((a, b) => a._sortTime - b._sortTime);

  if (hasNothing) {
    return (
      <div style={{ animation: 'fade-in .2s ease' }}>
        <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 16 }}>Trash</div>
        <div className="empty-state">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
          <p>Trash is empty</p>
          <p style={{ fontSize: 12, opacity: 0.6 }}>Deleted items appear here for 2 months.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fade-in .2s ease' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', flex: 1 }}>
          Trash <span style={{ fontFamily: 'var(--mono)', opacity: 0.5 }}>({mergedItems.length})</span>
        </div>
        <span style={{ fontSize: 12, color: 'var(--text3)' }}>Items are permanently deleted after 2 months</span>
      </div>

      <div className="task-table-wrap" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--r)', overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
        <div className="task-table-head" style={{ display: 'grid', gridTemplateColumns: TRASH_TABLE_GRID_COLUMNS, background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
          {TRASH_HEADERS.map((h) => (
            <div key={h} style={{ padding: '8px 12px', fontSize: 11, fontWeight: 500, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</div>
          ))}
        </div>

        {mergedItems.map(({ kind, data }) => {
          if (kind === 'folder') {
            const folder = data;
            const valid = isStillValid(folder._deletedAt);
            const folderTasks = trash.filter((t) => t.folderId === folder.id);
            const isExpanded = !!expandedDeletedFolderIds[folder.id];
            return (
              <div key={`folder:${folder.id}`} style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface2)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: TRASH_TABLE_GRID_COLUMNS, alignItems: 'center', opacity: valid ? 1 : 0.55 }}>
                  <div style={{ padding: '9px 12px', display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                    <button
                      onClick={() => toggleDeletedFolderExpanded(folder.id)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 16, height: 16, flexShrink: 0, background: 'none', border: 'none', cursor: folderTasks.length > 0 ? 'pointer' : 'default', color: 'var(--text3)', padding: 0 }}
                      disabled={folderTasks.length === 0}
                    >
                      {folderTasks.length > 0 && (
                        <span style={{ transition: 'transform .15s', transform: isExpanded ? 'rotate(0)' : 'rotate(-90deg)', display: 'flex' }}>
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9" /></svg>
                        </span>
                      )}
                    </button>
                    <WindowsFolderIcon color={folder.color ?? '#3b82f6'} size={18} />
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', textDecoration: valid ? 'none' : 'line-through', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{folder.name}</div>
                      {folderTasks.length > 0 && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{folderTasks.length} task{folderTasks.length === 1 ? '' : 's'} inside</div>}
                    </div>
                  </div>

                  <div style={{ padding: '9px 12px' }}>
                    <span style={{ fontSize: 11, color: 'var(--accent-text)', background: 'var(--accent-light)', padding: '2px 7px', borderRadius: 4, display: 'inline-block' }}>Folder</span>
                  </div>

                  <div style={{ padding: '9px 12px', fontSize: 13, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
                    {folder._deletedAt ? formatDateForDisplay(folder._deletedAt.split('T')[0]) : '—'}
                  </div>

                  <div style={{ padding: '9px 12px', fontSize: 13, fontFamily: 'var(--mono)', color: valid ? 'var(--amber)' : 'var(--text3)' }}>
                    {getTimeLeftLabel(folder._deletedAt)}
                  </div>

                  <div style={{ padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                    {valid && (
                      <button
                        onClick={() => handleRestoreFolder(folder.id)}
                        style={{ padding: '4px 12px', background: 'var(--accent-light)', color: 'var(--accent-text)', border: '1px solid color-mix(in srgb,var(--accent) 25%,var(--border))', borderRadius: 5, fontFamily: 'var(--font)', fontSize: 11, cursor: 'pointer', fontWeight: 500 }}
                      >
                        Restore
                      </button>
                    )}
                    <button
                      onClick={() => setConfirmingDelete({ type: 'folder', id: folder.id })}
                      title="Delete permanently"
                      style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: '1px solid transparent', borderRadius: 5, cursor: 'pointer', color: 'var(--text3)', flexShrink: 0 }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--red-bg)'; e.currentTarget.style.color = 'var(--red)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text3)'; }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                      </svg>
                    </button>
                  </div>
                </div>

                {isExpanded && folderTasks.length > 0 && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '6px 12px 8px 50px' }}>
                    {folderTasks.map((task) => (
                      <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '4px 0', fontSize: 12, color: 'var(--text2)' }}>
                        <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--text3)', flexShrink: 0 }} />
                        <span style={{ textDecoration: valid ? 'none' : 'line-through', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          const item = data;
          const valid = isStillValid(item._deletedAt);
          return (
            <div key={`task:${item.id}`} style={{ display: 'grid', gridTemplateColumns: TRASH_TABLE_GRID_COLUMNS, borderBottom: '1px solid var(--border)', alignItems: 'center', opacity: valid ? 1 : 0.55 }}>
              <div style={{ padding: '9px 12px', overflow: 'hidden' }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: valid ? 'none' : 'line-through' }}>
                  {item.name}
                </div>
                {item.desc && (
                  <div style={{ fontSize: 11, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>{item.desc}</div>
                )}
              </div>

              <div style={{ padding: '9px 12px' }}>
                <span style={{ fontSize: 11, color: 'var(--text3)', background: 'var(--surface2)', padding: '2px 7px', borderRadius: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block', maxWidth: '100%' }}>
                  {getFolderName(item.folderId)}
                </span>
              </div>

              <div style={{ padding: '9px 12px', fontSize: 13, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
                {item._deletedAt ? formatDateForDisplay(item._deletedAt.split('T')[0]) : '—'}
              </div>

              <div style={{ padding: '9px 12px', fontSize: 13, fontFamily: 'var(--mono)', color: valid ? 'var(--amber)' : 'var(--text3)' }}>
                {getTimeLeftLabel(item._deletedAt)}
              </div>

              <div style={{ padding: '7px 12px', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
                {valid && (
                  <button
                    onClick={() => { restoreTask(item.id); showToast('Restored'); }}
                    style={{ padding: '4px 12px', background: 'var(--accent-light)', color: 'var(--accent-text)', border: '1px solid color-mix(in srgb,var(--accent) 25%,var(--border))', borderRadius: 5, fontFamily: 'var(--font)', fontSize: 11, cursor: 'pointer', fontWeight: 500 }}
                  >
                    Restore
                  </button>
                )}
                <button
                  onClick={() => setConfirmingDelete({ type: 'task', id: item.id })}
                  title="Delete permanently"
                  style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: '1px solid transparent', borderRadius: 5, cursor: 'pointer', color: 'var(--text3)', transition: 'all .12s', flexShrink: 0 }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--red-bg)'; e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.borderColor = 'color-mix(in srgb,var(--red) 30%,var(--border))'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text3)'; e.currentTarget.style.borderColor = 'transparent'; }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {confirmingDelete?.type === 'task' && (
        <Modal title="Delete Permanently" onClose={() => setConfirmingDelete(null)} maxWidth={360} closeOnOutsideClick>
          <div className="modal-body">
            <p style={{ fontSize: 13, color: 'var(--text2)' }}>
              Permanently delete <strong>{trash.find((t) => t.id === confirmingDelete.id)?.name}</strong>? This cannot be undone.
            </p>
          </div>
          <div className="modal-footer">
            <button
              onClick={() => { permDeleteTask(confirmingDelete.id); setConfirmingDelete(null); showToast('Permanently deleted'); }}
              style={{ padding: '7px 18px', background: 'var(--red)', color: '#fff', border: 'none', borderRadius: 6, fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
            >
              Delete Forever
            </button>
            <button onClick={() => setConfirmingDelete(null)} className="btn-cancel">Cancel</button>
          </div>
        </Modal>
      )}

      {confirmingDelete?.type === 'folder' && (
        <Modal title="Delete Folder Permanently" onClose={() => setConfirmingDelete(null)} maxWidth={380} closeOnOutsideClick>
          <div className="modal-body">
            <p style={{ fontSize: 13, color: 'var(--text2)' }}>
              Permanently delete <strong>{deletedFolders.find((f) => f.id === confirmingDelete.id)?.name}</strong>?
              Its tasks already in Trash will remain there (you can still delete or restore them individually), but the folder
              record itself cannot be recovered after this.
            </p>
          </div>
          <div className="modal-footer">
            <button
              onClick={() => { permDeleteFolder(confirmingDelete.id); setConfirmingDelete(null); showToast('Folder permanently deleted'); }}
              style={{ padding: '7px 18px', background: 'var(--red)', color: '#fff', border: 'none', borderRadius: 6, fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
            >
              Delete Forever
            </button>
            <button onClick={() => setConfirmingDelete(null)} className="btn-cancel">Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
