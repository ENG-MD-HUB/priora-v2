// wsTaskService.js
// خدمة تاسكات الورك سبيس — مسار التخزين: workspaces/{wsId}/tasks/{taskId}
// نسخة مُعاد كتابتها بوضوح من المتغير `X` بالكود الأصلي المضغوط.
// (مختلفة عن tasksService — هذي خاصة بتاسكات داخل ورك سبيس مشترك، مش تاسكات شخصية)

import { doc, setDoc, updateDoc, deleteDoc, collection, onSnapshot, getDocs } from 'firebase/firestore';
import { getWorkspaceScopedDb } from './firebaseClient';
import { taskToFirestoreShape, firestoreDocToTask } from './taskShape';

export const wsTaskService = {
  async save(wsId, task) {
    const db = await getWorkspaceScopedDb();
    await setDoc(doc(db, 'workspaces', wsId, 'tasks', task.id), taskToFirestoreShape(task));
  },

  // ⚠️ setDoc+merge بدل updateDoc (نفس سبب userScopedCrud.js بالضبط) — يتعامل
  // بأمان حتى لو المستند مو موجود بعد بسباق نادر، بنفس سلوك الدمج الجزئي.
  async update(wsId, taskId, partialData) {
    const db = await getWorkspaceScopedDb();
    await setDoc(doc(db, 'workspaces', wsId, 'tasks', taskId), partialData, { merge: true });
  },

  async delete(wsId, taskId) {
    const db = await getWorkspaceScopedDb();
    await deleteDoc(doc(db, 'workspaces', wsId, 'tasks', taskId));
  },

  /**
   * استماع لحظي لكل تاسكات ورك سبيس معيّن.
   */
  onTasks(wsId, callback) {
    let unsubscribe = () => {};

    getWorkspaceScopedDb().then((db) => {
      unsubscribe = onSnapshot(collection(db, 'workspaces', wsId, 'tasks'), (snapshot) => {
        callback(snapshot.docs.map((d) => firestoreDocToTask(d.id, d.data())));
      });
    });

    return () => unsubscribe();
  },

  /**
   * قراءة لمرة واحدة (وليس استماع لحظي) لكل تاسكات ورك سبيس معيّن.
   */
  async getAll(wsId) {
    const db = await getWorkspaceScopedDb();
    const snapshot = await getDocs(collection(db, 'workspaces', wsId, 'tasks'));
    return snapshot.docs.map((d) => firestoreDocToTask(d.id, d.data()));
  },
};
