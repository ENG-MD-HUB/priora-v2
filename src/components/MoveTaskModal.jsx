// MoveTaskModal.jsx
// مودال نقل تاسك من مجلد لمجلد آخر — ميزة جديدة بطلب صريح (غير موجودة بالكود الأصلي).
// يعرض كل المجلدات (الرئيسية وفروعها) بقائمة مسطّحة واحدة، بعلامة بصرية تفرّق
// الفروع عن الرئيسية، ويستثني المجلد الحالي للتاسك من القائمة (لا فائدة من "النقل"
// لنفس المجلد).

import { useState } from 'react';
import { Modal } from './Modal';
import { useFoldersStore } from '../store/foldersStore';
import { useTasksStore } from '../store/tasksStore';
import { showToast } from '../store/toastStore';

export function MoveTaskModal({ task, onClose }) {
  const folders = useFoldersStore((s) => s.folders);
  const updateTask = useTasksStore((s) => s.updateTask);
  const [selectedFolderId, setSelectedFolderId] = useState('');

  const rootFolders = folders.filter((f) => f.parentId === null || f.parentId === undefined);

  function getChildFolders(parentId) {
    return folders.filter((f) => f.parentId === parentId);
  }

  function handleMove(e) {
    e.preventDefault();
    if (!selectedFolderId || selectedFolderId === task.folderId) return;
    updateTask(task.id, { folderId: selectedFolderId });
    const targetFolder = folders.find((f) => f.id === selectedFolderId);
    showToast(`Moved to "${targetFolder?.name ?? 'folder'}"`);
    onClose();
  }

  return (
    <Modal title="Move Task" onClose={onClose} maxWidth={400}>
      <form onSubmit={handleMove}>
        <div className="modal-body">
          <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 12 }}>
            Move "<strong style={{ color: 'var(--text2)' }}>{task.name}</strong>" to:
          </p>
          <div className="field" style={{ marginBottom: 0 }}>
            <label className="label">Destination Folder</label>
            <select className="select" value={selectedFolderId} onChange={(e) => setSelectedFolderId(e.target.value)}>
              <option value="">— Select folder —</option>
              {rootFolders.map((root) => (
                <optgroup key={root.id} label={root.name}>
                  {root.id !== task.folderId && <option value={root.id}>{root.name}</option>}
                  {getChildFolders(root.id)
                    .filter((child) => child.id !== task.folderId)
                    .map((child) => (
                      <option key={child.id} value={child.id}>↳ {child.name}</option>
                    ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button
            type="submit"
            disabled={!selectedFolderId}
            style={{ padding: '7px 20px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 6, fontFamily: 'var(--font)', fontSize: 13, fontWeight: 500, cursor: selectedFolderId ? 'pointer' : 'not-allowed', opacity: selectedFolderId ? 1 : 0.5 }}
          >
            Move
          </button>
          <button type="button" onClick={onClose} className="btn-cancel">Cancel</button>
        </div>
      </form>
    </Modal>
  );
}
