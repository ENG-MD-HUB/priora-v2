// migrateFoldersToSubfolders.js
// ترقية تلقائية لمرة واحدة فقط: تحويل بنية المجلدات القديمة (مسطّحة، بدون فروع)
// لبنية جديدة فيها مجلد رئيسي واحد اسمه "General"، وكل المجلدات الموجودة فعلياً
// تصير مجلدات فرعية تحته. ميزة جديدة بطلب صريح، غير موجودة بالكود الأصلي.
//
// ⚠️ شرطين معاً (وليس واحد فقط) قبل الترقية، عشان تكون آمنة بكل الحالات:
// 1. علامة localStorage الصريحة (تمنع تكرار الترقية بنفس الجهاز).
// 2. فحص فعلي للبيانات: لا تُنفَّذ الترقية إطلاقاً لو فيه أي مجلد بالفعل عنده
//    parentId غير null — هذا يعني البيانات مُرحَّلة فعلاً (مثلاً من جهاز آخر سبق
//    وهاجَرها)، حتى لو العلامة المحلية بهذا الجهاز تحديداً غير موجودة (أول مرة
//    يفتح الموقع منه). بدون هذا الفحص الثاني، فتح الموقع من جهاز جديد لأول مرة
//    بعد الترقية كان يُعيد الترقية فوق بيانات مُرحَّلة فعلاً ويكسر الهيكل (يصنع
//    "General" جديد فوق "General" الأصلي).

const MIGRATION_FLAG_PREFIX = 'priora_subfolders_migrated_';

export function shouldMigrateFoldersToSubfolders(uid, folders) {
  if (folders.length === 0) return false;

  // فحص البيانات الفعلية أولاً (الأهم والأكثر موثوقية، يعمل بكل الأجهزة بدون
  // الاعتماد على localStorage المحلي لهذا الجهاز تحديداً).
  const alreadyHasSubfolders = folders.some((f) => f.parentId !== undefined && f.parentId !== null);
  if (alreadyHasSubfolders) {
    markFoldersMigrated(uid); // نزامن العلامة المحلية مع الواقع، تفادياً لتكرار هذا الفحص لاحقاً.
    return false;
  }

  if (typeof localStorage !== 'undefined' && localStorage.getItem(MIGRATION_FLAG_PREFIX + uid)) return false;

  return true;
}

export function markFoldersMigrated(uid) {
  if (typeof localStorage !== 'undefined') localStorage.setItem(MIGRATION_FLAG_PREFIX + uid, '1');
}

/**
 * يُنفّذ الترقية الفعلية: ينشئ مجلد رئيسي جديد اسمه "General"، ويحوّل كل المجلدات
 * الموجودة لفروع تحته. يُستدعى فقط بعد التأكد من shouldMigrateFoldersToSubfolders.
 *
 * @param {Function} addFolder - دالة foldersStore.addFolder
 * @param {Function} updateFolder - دالة foldersStore.updateFolder
 * @param {Array} folders - المجلدات الحالية (المسطّحة) وقت الترقية
 * @param {string} ownerId
 */
export function runFoldersToSubfoldersMigration(addFolder, updateFolder, folders, ownerId) {
  const generalFolder = addFolder('General', ownerId, '#3b82f6', null);
  folders.forEach((folder) => updateFolder(folder.id, { parentId: generalFolder.id }));
  return generalFolder;
}
