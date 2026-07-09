// repairZombieItems.js
// ⚠️ إضافة جديدة بطلب صريح (بعد اكتشاف تراكم فعلي لعناصر "زومبي" — تاسكات
// وفولدرات محذوفة سابقاً، لكن حذفها الفعلي بـFirestore فشل بصمت قبل إصلاح
// إعادة المحاولة). غير موجودة بالكود الأصلي.
//
// الفكرة: أي عنصر (تاسك أو فولدر) موجود بنفس اللحظة بالمجموعة "النشطة"
// (tasks/folders) وبالمجموعة "المحذوفة" (trash/deletedFolders) بنفس الـid هو
// بالتعريف زومبي — كان يفترض ينمحي من النشطة وقت الحذف الأصلي، لكن تلك الكتابة
// فشلت وقتها. نكتشفهم تلقائياً بمقارنة القائمتين (متوفرتين محلياً أصلاً بعد
// المزامنة، بدون أي قراءة إضافية من Firestore)، وننظفهم دفعة وحدة — بإعادة
// محاولة (retryFirestoreWrite) عشان ما يتكرر نفس الفشل.
//
// يُستدعى مرة وحدة بعد كل مزامنة أولى ناجحة (App.jsx)، وآمن يتكرر أي وقت —
// لو ما فيه زومبيز، ما يسوي أي شي.

import { useTasksStore } from '../store/tasksStore';
import { useFoldersStore } from '../store/foldersStore';
import { tasksService } from '../services/tasksService';
import { foldersService } from '../services/foldersService';
import { retryFirestoreWrite } from './retryFirestoreWrite';
import { showToast } from '../store/toastStore';

export async function repairZombieItems(uid) {
  const { tasks, trash } = useTasksStore.getState();
  const { folders, deletedFolders } = useFoldersStore.getState();

  const trashIds = new Set(trash.map((t) => t.id));
  const deletedFolderIds = new Set(deletedFolders.map((f) => f.id));

  const zombieTasks = tasks.filter((t) => trashIds.has(t.id));
  const zombieFolders = folders.filter((f) => deletedFolderIds.has(f.id));

  if (zombieTasks.length === 0 && zombieFolders.length === 0) return;

  if (zombieTasks.length > 0) {
    useTasksStore.setState((state) => ({
      tasks: state.tasks.filter((t) => !trashIds.has(t.id)),
    }));
    zombieTasks.forEach((t) => retryFirestoreWrite(() => tasksService.delete(uid, t.id)));
  }

  if (zombieFolders.length > 0) {
    useFoldersStore.setState((state) => ({
      folders: state.folders.filter((f) => !deletedFolderIds.has(f.id)),
    }));
    zombieFolders.forEach((f) => retryFirestoreWrite(() => foldersService.delete(uid, f.id)));
  }

  const total = zombieTasks.length + zombieFolders.length;
  showToast(`Cleaned up ${total} item${total === 1 ? '' : 's'} that were stuck from a past deletion`);
}
