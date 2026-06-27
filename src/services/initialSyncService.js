// initialSyncService.js
// خدمة المزامنة الأولى عند تسجيل الدخول — نسخة مُعاد كتابتها بوضوح من الدوال
// Pt (الهوك)، Ft، It، Lt، Rt، zt بالكود الأصلي.
//
// ⚠️ ملاحظة معمارية مهمة جداً: البيانات الشخصية (tasks, folders, contacts, trash)
// تُجلب مرة واحدة فقط عند تسجيل الدخول عن طريق getDocs (قراءة لمرة واحدة) — وليس
// onSnapshot (استماع لحظي). يعني التغييرات من جهاز/تبويب آخر لنفس الحساب لا تظهر
// تلقائياً بدون تحديث الصفحة. هذا يختلف عن بيانات الورك سبيس، اللي تُستمع لها
// لحظياً (onSnapshot) عبر wsTaskService.onTasks. هذا فرق حقيقي بالكود الأصلي،
// محفوظ هنا بدون "تحسينه" لاستماع لحظي شامل، لأن هذا يُعتبر تغيير سلوك غير مطلوب.

import { getDocs, getDoc, doc, collection } from 'firebase/firestore';
import { getUserScopedDb } from './firebaseClient';
import { getWorkspaceScopedDb } from './firebaseClient';
import { useTasksStore } from '../store/tasksStore';
import { useFoldersStore } from '../store/foldersStore';
import { useContactsStore } from '../store/contactsStore';
import { useWorkspacesStore } from '../store/workspacesStore';
import { useMembersStore } from '../store/membersStore';
import { tasksService } from './tasksService';
import { foldersService } from './foldersService';
import { contactsService } from './contactsService';
import { trashService } from './trashService';
import { wsRefsService } from './wsRefsService';
import { workspaceService } from './workspaceService';
import { STORAGE_KEY_PREFIX } from '../utils/appConstants';

/**
 * قراءة لمرة واحدة لكل مستندات users/{uid}/{collectionName}.
 *
 * ⚠️ تصحيح خلل حقيقي: النسخة السابقة كانت ترجع [] بصمت عند أي فشل (شبكة بطيئة، خطأ
 * مؤقت..) — وهذا يُعامَل بالكود بعدها كـ"المستخدم ما عنده بيانات فعلياً"، فيمسح
 * البيانات المحلية الصحيحة ويستبدلها بفراغ خاطئ (سبب ظهور/اختفاء عناصر بشكل غير
 * متوقع بين الأجهزة). الحل: نرمي الخطأ بدل إخفائه، ونتعامل معه بمستوى أعلى بدون
 * لمس الحالة المحلية الموجودة أصلاً.
 */
async function fetchUserCollectionOnce(uid, collectionName) {
  const db = await getUserScopedDb();
  const snapshot = await getDocs(collection(db, 'users', uid, collectionName));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * يبحث عن بيانات anon محفوظة محلياً (localStorage) ويرفعها لحساب المستخدم الحقيقي —
 * فقط لو ما عنده أي بيانات بـ Firestore أصلاً (مستخدم جديد كلياً، أو كان يستخدم
 * التطبيق بدون تسجيل دخول من قبل). نسخة من: zt()
 */
function migrateLegacyAnonDataIfEmpty(uid) {
  for (const namespace of ['tasks', 'folders', 'contacts']) {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}_${uid}_${namespace}`) ?? localStorage.getItem(`${STORAGE_KEY_PREFIX}_anon_${namespace}`);
    if (!raw) continue;
    try {
      const state = JSON.parse(raw)?.state;
      if (!state) continue;

      if (namespace === 'tasks' && state.tasks?.length) {
        useTasksStore.setState({ tasks: state.tasks, trash: state.trash ?? [] });
        state.tasks.forEach((t) => tasksService.save(uid, t).catch(() => {}));
        (state.trash ?? []).forEach((t) => trashService.save(uid, t).catch(() => {}));
      }
      if (namespace === 'folders' && state.folders?.length) {
        useFoldersStore.setState({ folders: state.folders });
        state.folders.forEach((f) => foldersService.save(uid, f).catch(() => {}));
      }
      if (namespace === 'contacts' && state.contacts?.length) {
        useContactsStore.setState({ contacts: state.contacts });
        state.contacts.forEach((c) => contactsService.save(uid, c).catch(() => {}));
      }
    } catch {
      // JSON تالف — نتجاهله بصمت، نفس سلوك الأصل.
    }
  }
}

/**
 * يجلب كل البيانات الشخصية (tasks, folders, contacts, trash) مرة واحدة، ويعبّي
 * المخازن المحلية بها. لو المستخدم جديد كلياً (كل شي فاضي فعلياً، لا فشل بالجلب)،
 * يحاول ترقية أي بيانات anon محفوظة محلياً قبله. نسخة من: It()
 *
 * ⚠️ تصحيح خلل حقيقي: كل قسم (tasks/folders/contacts/trash) يُعالَج بشكل مستقل تماماً.
 * فشل جلب قسم واحد (مثلاً تأخير شبكة) لا يمسح حالته المحلية الموجودة، ولا يُحسب
 * كـ"فاضي فعلياً" — فقط نتيجة ناجحة وفاضية فعلياً تُستبدل بالحالة المحلية وتُحسب
 * بمنطق ترقية البيانات القديمة.
 */
async function syncPersonalDataOnce(uid) {
  const results = await Promise.allSettled([
    fetchUserCollectionOnce(uid, 'tasks'),
    fetchUserCollectionOnce(uid, 'folders'),
    fetchUserCollectionOnce(uid, 'contacts'),
    fetchUserCollectionOnce(uid, 'trash'),
    fetchUserCollectionOnce(uid, 'deletedFolders'),
  ]);

  const [tasksResult, foldersResult, contactsResult, trashResult, deletedFoldersResult] = results;

  if (tasksResult.status === 'fulfilled') {
    useTasksStore.setState((state) => ({ tasks: tasksResult.value, trash: trashResult.status === 'fulfilled' ? trashResult.value : state.trash }));
  } else {
    console.warn('[sync] tasks fetch failed — keeping local data as-is:', tasksResult.reason);
  }

  if (trashResult.status === 'rejected') {
    console.warn('[sync] trash fetch failed — keeping local data as-is:', trashResult.reason);
  }

  if (foldersResult.status === 'fulfilled') {
    useFoldersStore.setState((state) => ({
      folders: foldersResult.value,
      deletedFolders: deletedFoldersResult.status === 'fulfilled' ? deletedFoldersResult.value : state.deletedFolders,
    }));
  } else {
    console.warn('[sync] folders fetch failed — keeping local data as-is:', foldersResult.reason);
  }

  if (deletedFoldersResult.status === 'rejected') {
    console.warn('[sync] deletedFolders fetch failed — keeping local data as-is:', deletedFoldersResult.reason);
  }

  if (contactsResult.status === 'fulfilled') {
    useContactsStore.setState({ contacts: contactsResult.value });
  } else {
    console.warn('[sync] contacts fetch failed — keeping local data as-is:', contactsResult.reason);
  }

  // الترقية لبيانات anon القديمة تحصل فقط لو كل الأقسام نجحت بالجلب فعلياً وكانت
  // كل واحدة فاضية فعلياً — وليس لو أي واحدة فشلت بالجلب (تمييز حقيقي بين
  // "فاضي" و"فشل" كان الخلل الأساسي بالنسخة السابقة).
  const allSucceeded = [tasksResult, foldersResult, contactsResult].every((r) => r.status === 'fulfilled');
  const allGenuinelyEmpty = allSucceeded && tasksResult.value.length === 0 && foldersResult.value.length === 0 && contactsResult.value.length === 0;
  if (allGenuinelyEmpty) {
    migrateLegacyAnonDataIfEmpty(uid);
  }

  return foldersResult.status === 'fulfilled';
}

/**
 * يزامن قائمة الورك سبيسات الخاصة بالمستخدم. يفضّل القراءة من wsrefs (أسرع، فهرس
 * مباشر)، ولو ما فيه (مستخدم قديم قبل وجود wsrefs)، يرجع لطريقة getUserWorkspaces
 * الأبطأ (تفحص كل الورك سبيسات) كخطة احتياطية — وبهذي الحالة كذلك يبني سجلات wsrefs
 * المفقودة للمستقبل. نسخة من: Lt()
 */
async function syncWorkspacesOnce(uid) {
  try {
    const refs = await wsRefsService.getAll(uid);
    const { addWorkspace } = useWorkspacesStore.getState();
    const { addMember } = useMembersStore.getState();

    if (refs.length > 0) {
      const db = await getWorkspaceScopedDb();
      for (const ref of refs) {
        try {
          const snap = await getDoc(doc(db, 'workspaces', ref.wsId));
          if (!snap.exists()) continue;
          const data = snap.data();
          addWorkspace({
            id: snap.id,
            name: data.name,
            description: data.description,
            ownerId: data.ownerId,
            inviteCode: data.inviteCode,
            createdAt: data.createdAt,
          });
          for (const member of data.members ?? []) addMember(snap.id, member);
        } catch {
          // فشل جلب ورك سبيس واحد لا يوقف الباقي.
        }
      }
    } else {
      const results = await workspaceService.getUserWorkspaces(uid);
      for (const { ws, members } of results) {
        addWorkspace(ws);
        for (const member of members) addMember(ws.id, member);
        wsRefsService.save(uid, ws.id, { wsId: ws.id, role: ws.ownerId === uid ? 'owner' : 'member' }).catch(() => {});
      }
    }
  } catch (err) {
    console.warn('[sync] workspaces failed:', err);
  }
}

/**
 * نقطة الدخول الرئيسية — تُستدعى مرة واحدة بعد تأكيد تسجيل الدخول.
 * ترجع { foldersFetchSucceeded } — يستخدمها App.jsx لتقرير إذا كان آمناً إنشاء
 * مجلد افتراضي جديد (فقط لو تأكدنا إن المجلدات فاضية فعلياً، وليس لأن الجلب فشل).
 */
export async function performInitialSync(uid) {
  const [personalResult] = await Promise.allSettled([syncPersonalDataOnce(uid), syncWorkspacesOnce(uid)]);
  return { foldersFetchSucceeded: personalResult.status === 'fulfilled' && personalResult.value === true };
}

/**
 * مزامنة سريعة للورك سبيسات (تُستدعى عند تسجيل الدخول وبعد 3 ثواني) — تتأكد من
 * تطابق القائمة المحلية مع الحقيقية، وتشيل أي ورك سبيس محلي لم يعد المستخدم عضو
 * فيه فعلياً (مثلاً أُزيل من طرف آخر). نسخة من: qt()
 */
export async function quickResyncWorkspaces(uid) {
  try {
    const results = await workspaceService.getUserWorkspaces(uid);
    const { workspaces, addWorkspace, removeWorkspace } = useWorkspacesStore.getState();
    const { addMember } = useMembersStore.getState();

    for (const { ws, members } of results) {
      if (!workspaces.some((w) => w.id === ws.id)) addWorkspace(ws);
      for (const member of members) addMember(ws.id, member);
    }

    if (results.length > 0) {
      const validIds = new Set(results.map((r) => r.ws.id));
      const currentWorkspaces = useWorkspacesStore.getState().workspaces;
      for (const ws of currentWorkspaces) {
        if (!validIds.has(ws.id)) removeWorkspace(ws.id);
      }
    }
  } catch (err) {
    console.warn('Workspace sync failed:', err);
  }
}
