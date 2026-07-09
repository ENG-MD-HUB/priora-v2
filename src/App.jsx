// App.jsx
// المكوّن الجذري للتطبيق — نسخة مُعاد كتابتها بوضوح من المكوّنين Jt (الجذر) و Vt
// (الواجهة الرئيسية بعد تسجيل الدخول) بالكود الأصلي.
//
// ملاحظة حذف مقصود: الكود الأصلي يغلّف التطبيق بـ QueryClientProvider (مكتبة React
// Query، المتغير Gt/s) — لكن بفحص الكود الكامل، ولا استخدام واحد فعلي لـ useQuery
// أو أي API من المكتبة بأي مكان بالتطبيق. كل جلب البيانات يتم يدوياً عبر Zustand +
// استدعاءات Firestore مباشرة. لذلك حذفنا هذا الغلاف (وتبعية react-query بالكامل)
// لتبسيط المشروع، بدون أي تأثير على السلوك الفعلي — هذا تنظيف حقيقي وليس تغيير سلوك،
// لأن الغلاف لم يكن يُستخدم أصلاً.

import { useState, useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { useUIStore } from './store/uiStore';
import { useTasksStore } from './store/tasksStore';
import { useFoldersStore } from './store/foldersStore';
import { useContactsStore } from './store/contactsStore';
import { authService } from './services/authService';
import { showToast } from './store/toastStore';
import { performInitialSync, quickResyncWorkspaces } from './services/initialSyncService';
import { readMigratableAnonData } from './utils/migrateAnonData';
import { setCurrentUserId } from './utils/anonUserTracking';
import { tasksService } from './services/tasksService';
import { foldersService } from './services/foldersService';
import { contactsService } from './services/contactsService';
import { trashService } from './services/trashService';
import { useFollowupDesktopNotifications } from './utils/useFollowupDesktopNotifications';
import { useWorkspaceFollowupNotifications } from './utils/useWorkspaceFollowupNotifications';
import { repairZombieItems } from './utils/repairZombieItems';
import { useFontScale } from './utils/useFontScale';
import { useIdleScreensaver } from './utils/useIdleScreensaver';
import { Screensaver } from './components/Screensaver';
import { ScreensaverAurora } from './components/ScreensaverAurora';
import { ScreensaverOrbit } from './components/ScreensaverOrbit';
import { shouldMigrateFoldersToSubfolders, runFoldersToSubfoldersMigration, markFoldersMigrated } from './utils/migrateFoldersToSubfolders';
import { LoginScreen } from './components/LoginScreen';
import { LoadingScreen } from './components/LoadingScreen';
import { ToastRenderer } from './components/ToastRenderer';
import { TopBar } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { TasksDashboard } from './components/TasksDashboard';
import { ContactsPage } from './components/ContactsPage';
import { FolderView } from './components/FolderView';
import { RootFolderOverview } from './components/RootFolderOverview';
import { TrashPage } from './components/TrashPage';
import { WorkspacesListView } from './components/WorkspacesListView';
import { GlobalSearchPage } from './components/GlobalSearchPage';

// أسماء الصفحات اللي لها محتوى خاص بها دائماً (مش خاضعة لاستبدال نتائج البحث
// الشامل) — نسخة من المتغير Bt بالكود الأصلي.
const VIEWS_WITH_OWN_CONTENT = ['dashboard', 'completed', 'trash', 'contacts', 'workspaces'];
const SCREENSAVER_COMPONENTS = { starfield: Screensaver, aurora: ScreensaverAurora, orbit: ScreensaverOrbit };

function AuthenticatedApp() {
  const activeView = useUIStore((s) => s.activeView);
  const setActiveView = useUIStore((s) => s.setActiveView);
  const searchQuery = useUIStore((s) => s.searchQuery);
  const setSearchQuery = useUIStore((s) => s.setSearchQuery);
  const user = useAuthStore((s) => s.user);
  const tasks = useTasksStore((s) => s.tasks);
  const folders = useFoldersStore((s) => s.folders);
  const addFolder = useFoldersStore((s) => s.addFolder);
  const updateFolder = useFoldersStore((s) => s.updateFolder);

  const [dataLoaded, setDataLoaded] = useState(false);
  const [foldersFetchSucceeded, setFoldersFetchSucceeded] = useState(false);
  useEffect(() => {
    if (!user) {
      setDataLoaded(false);
      return;
    }
    performInitialSync(user.uid).then((result) => {
      setFoldersFetchSucceeded(result.foldersFetchSucceeded);
      setDataLoaded(true);
      // بعد وصول البيانات الحقيقية من Firestore (بما فيها أي عنصر "زومبي" قديم
      // كان عالقاً هناك بسبب الخلل السابق بـexpireTrash/expireDeletedFolders)،
      // نُعيد فحص الانتهاء فوراً — بدل انتظار إعادة تحميل تالية لالتقاطه.
      useTasksStore.getState().expireTrash();
      useFoldersStore.getState().expireDeletedFolders();
      // ⚠️ إضافة بطلب صريح (بعد اكتشاف تراكم فعلي لعناصر زومبي بعد تسجيل خروج/دخول):
      // تنظيف تلقائي لأي عنصر موجود بنفس اللحظة بالمجموعة النشطة والمحذوفة معاً —
      // راجع الشرح المفصّل بـrepairZombieItems.js.
      repairZombieItems(user.uid);
    });
  }, [user?.uid]);

  // ⚠️ إصلاح جذري بطلب صريح: البيانات الشخصية (tasks/folders/contacts/trash) كانت
  // تُجلب مرة واحدة فقط عند تسجيل الدخول (performInitialSync أعلاه، عبر getDocs) —
  // فتحديث يحصل على جهاز آخر لا ينعكس هنا إلا بإعادة تحميل كاملة للتطبيق. هذا
  // مختلف عن تاسكات الورك سبيس، اللي تُستمع لها لحظياً بالفعل (wsTaskService.onTasks،
  // نفس نمط WorkspaceAttentionSection.jsx).
  //
  // البنية التحتية اللازمة (onTasks/onFolders/onContacts/onTrash) كانت موجودة
  // وجاهزة أصلاً بكل خدمة (نفس onUserCollection المستخدم لبيانات الورك سبيس)، لكنها
  // لم تكن موصولة بأي مكان بالتطبيق. هذا الاشتراك اللحظي إضافة فقط، ولا يمس أو
  // يستبدل performInitialSync (يبقى كما هو للإقلاع الأول: dataLoaded، إنشاء مجلد
  // افتراضي، ترحيل البيانات القديمة) — فقط يُبقي البيانات محدّثة تلقائياً بعد ذلك.
  useEffect(() => {
    if (!user) return;

    const unsubTasks = tasksService.onTasks(user.uid, (tasks) =>
      useTasksStore.setState((state) => ({ tasks, trash: state.trash }))
    );
    const unsubTrash = trashService.onTrash(user.uid, (trash) =>
      useTasksStore.setState((state) => ({ tasks: state.tasks, trash }))
    );
    const unsubFolders = foldersService.onFolders(user.uid, (folders) =>
      useFoldersStore.setState((state) => ({ folders, deletedFolders: state.deletedFolders }))
    );
    const unsubContacts = contactsService.onContacts(user.uid, (contacts) =>
      useContactsStore.setState({ contacts })
    );

    return () => {
      unsubTasks();
      unsubTrash();
      unsubFolders();
      unsubContacts();
    };
  }, [user?.uid]);

  // ترقية لمرة واحدة فقط: تحويل المجلدات المسطّحة القديمة لفروع تحت مجلد رئيسي
  // جديد اسمه "General" — راجع migrateFoldersToSubfolders.js للتفاصيل الكاملة
  // وضمانات السلامة (لا تتكرر، ولا تعمل فوق بيانات مُرحَّلة فعلاً من جهاز آخر).
  useEffect(() => {
    if (dataLoaded && foldersFetchSucceeded && user && shouldMigrateFoldersToSubfolders(user.uid, folders)) {
      runFoldersToSubfoldersMigration(addFolder, updateFolder, folders, user.uid);
      markFoldersMigrated(user.uid);
      showToast('Folders organized under "General"');
    }
  }, [dataLoaded, foldersFetchSucceeded, user?.uid]);

  // مستخدم جديد كلياً بدون أي مجلدات — يُنشأ له مجلد افتراضي "My Projects" تلقائياً.
  // ⚠️ شرط أمان مهم: ينشئ فقط لو تأكدنا إن جلب المجلدات من Firestore نجح فعلياً
  // وكانت النتيجة فاضية حقاً — وليس لمجرد folders.length === 0، لأن هذا قد يحصل
  // أيضاً بسبب فشل مؤقت بالشبكة، وكان ينشئ مجلد زائد فوق بيانات حقيقية لم تُحمَّل بعد.
  useEffect(() => {
    if (dataLoaded && foldersFetchSucceeded && folders.length === 0 && user) {
      const defaultFolder = addFolder('My Projects', user.uid, '#3b82f6');
      setActiveView(`folder:${defaultFolder.id}`);
    }
  }, [dataLoaded, foldersFetchSucceeded, user?.uid]);

  useFollowupDesktopNotifications(tasks);
  useWorkspaceFollowupNotifications(user?.uid);

  const isFolderView = activeView.startsWith('folder:');
  const currentFolderId = isFolderView ? activeView.slice(7) : null;
  const currentFolder = currentFolderId ? folders.find((f) => f.id === currentFolderId) : null;
  const isRootWithChildren =
    !!currentFolder &&
    (currentFolder.parentId === null || currentFolder.parentId === undefined) &&
    folders.some((f) => f.parentId === currentFolder.id);
  const childFoldersOfCurrent = isRootWithChildren ? folders.filter((f) => f.parentId === currentFolder.id) : [];
  const hasOwnContent = VIEWS_WITH_OWN_CONTENT.includes(activeView);
  const showGlobalSearchInstead = (!hasOwnContent ? searchQuery : '').trim().length > 0 && isFolderView;

  // عند تغيير الصفحة (لقسم له بحثه الخاص)، نفضّي حقل البحث العام تلقائياً.
  useEffect(() => {
    if (hasOwnContent && searchQuery.trim()) setSearchQuery('');
  }, [activeView]);

  const fontScale = useFontScale();
  const screensaver = useIdleScreensaver();
  const ScreensaverComponent = SCREENSAVER_COMPONENTS[screensaver.design] ?? Screensaver;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingTop: 0 }}>
      {screensaver.isActive && <ScreensaverComponent onDismiss={screensaver.dismiss} />}
      <TopBar />
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        <Sidebar fontScale={fontScale} />
        <main className="app-main" style={{ flex: 1, padding: '18px 22px', overflow: 'auto', minWidth: 0 }}>
          {showGlobalSearchInstead ? (
            <GlobalSearchPage />
          ) : (
            <>
              {activeView === 'dashboard' && <TasksDashboard lang={useUIStore.getState().lang} setActiveView={setActiveView} setFilterStatus={() => {}} />}
              {activeView === 'contacts' && <ContactsPage />}
              {activeView === 'completed' && <FolderView folderId="" type="completed" />}
              {activeView === 'trash' && <TrashPage />}
              {activeView === 'workspaces' && <WorkspacesListView />}
              {isFolderView && currentFolderId && isRootWithChildren && (
                <RootFolderOverview rootFolder={currentFolder} childFolders={childFoldersOfCurrent} />
              )}
              {isFolderView && currentFolderId && !isRootWithChildren && <FolderView folderId={currentFolderId} type="folder" />}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export function App() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const theme = useUIStore((s) => s.theme);
  const lang = useUIStore((s) => s.lang);
  const setTheme = useUIStore((s) => s.setTheme);
  const expireTrash = useTasksStore((s) => s.expireTrash);
  const expireDeletedFolders = useFoldersStore((s) => s.expireDeletedFolders);

  const [authResolved, setAuthResolved] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [theme, lang]);

  useEffect(() => {
    let unsubscribe;
    authService.init().then(() =>
      authService.onAuthChange(async (authUser) => {
        if (authUser) {
          setCurrentUserId(authUser.uid);
          setUser(authUser);
          setAuthResolved(true);

          // دفع غير مشروط لأي بيانات anon محفوظة محلياً — نسخة من سطور ce/he.save/
          // ge.save/_e.save المباشرة بالمكوّن الجذر الأصلي (Jt)، منفصلة عن الفحص
          // الشرطي الموجود بـ performInitialSync (يحدث فقط لو Firestore فاضي).
          // هذا تكرار موجود بالأصل نفسه (غير ضار، لأن الحفظ متكرر الكتابة idempotent)،
          // محفوظ هنا بدون "تنظيفه"، لأن إزالته تُعتبر تغيير سلوك غير مطلوب.
          const legacyAnonData = readMigratableAnonData(authUser.uid);
          legacyAnonData.tasks?.forEach((t) => tasksService.save(authUser.uid, t).catch(() => {}));
          legacyAnonData.folders?.forEach((f) => foldersService.save(authUser.uid, f).catch(() => {}));
          legacyAnonData.contacts?.forEach((c) => contactsService.save(authUser.uid, c).catch(() => {}));

          quickResyncWorkspaces(authUser.uid);
          setTimeout(() => quickResyncWorkspaces(authUser.uid), 3000);
        } else {
          setUser(null);
          setAuthResolved(true);
        }
      }).then((unsub) => { unsubscribe = unsub; })
    );
    return () => unsubscribe?.();
  }, [setUser]);

  useEffect(() => {
    expireTrash();
    expireDeletedFolders();
  }, [expireTrash, expireDeletedFolders]);

  useEffect(() => {
    if (!localStorage.getItem('priora_v2_ui')) {
      setTheme(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    }
  }, [setTheme]);

  return (
    <>
      {!authResolved ? <LoadingScreen /> : user ? <AuthenticatedApp /> : <LoginScreen />}
      <ToastRenderer />
    </>
  );
}
