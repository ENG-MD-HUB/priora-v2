// userScopedCrud.js
// أدوات عامة (generic) لقراءة/كتابة/حذف بيانات محفوظة تحت مسار users/{uid}/{collection}.
// نسخة مُعاد كتابتها بوضوح من 3 دوال أصلية بالكود المضغوط: fe (حفظ), pe (حذف), me (استماع لحظي).
//
// كل خدمة (tasks, folders, contacts, trash, wsrefs) تُبنى فوق هذي الدوال الثلاث —
// هذا هو السبب الحقيقي لإمكانية فصلها لمديولز بأمان: التكرار البرمجي مُجمّع هنا بالفعل
// في الكود الأصلي، ولم نُضف تجميعاً جديداً، فقط أوضحناه بالاسم.

import { doc, getDoc, setDoc, deleteDoc, collection, onSnapshot } from 'firebase/firestore';
import { getUserScopedDb } from './firebaseClient';

/**
 * يحفظ مستند واحد تحت users/{uid}/{collectionName}/{docId} — استبدال كامل (setDoc).
 */
export async function saveUserDoc(uid, collectionName, docId, data) {
  const db = await getUserScopedDb();
  await setDoc(doc(db, 'users', uid, collectionName, docId), data);
}

/**
 * ⚠️ إضافة بطلب صريح (بعد حادثة فقدان بيانات حقيقية): تحديث جزئي (الحقول المُمرَّرة
 * فقط) بدل استبدال كامل. يستخدم setDoc مع { merge: true } — أي حقل مو موجود
 * بـpartialData يبقى كما هو بـFirestore، ما يُلمَس إطلاقاً. هذا يمنع فئة كاملة من
 * فقدان البيانات: لو جهاز/جلسة عندها نسخة قديمة من التاسك وسوت تحديث جزئي (حتى لو
 * على حقل تاني)، التحديثات الحديثة بحقول ثانية (زي timeline) ما تُمسح، لأنها أصلاً
 * مو جزء من الكتابة.
 *
 * اخترنا setDoc+merge بدل updateDoc تحديداً: updateDoc يفشل لو المستند مو موجود
 * أصلاً بـFirestore بعد (مثلاً سباق نادر: تعديل فوري جداً بعد إنشاء تاسك جديد،
 * قبل ما تكتمل كتابة setDoc الأولى) — setDoc+merge يتعامل مع الحالتين (موجود/غير
 * موجود) بأمان، بنفس سلوك الدمج الجزئي بالضبط.
 */
export async function updateUserDoc(uid, collectionName, docId, partialData) {
  const db = await getUserScopedDb();
  await setDoc(doc(db, 'users', uid, collectionName, docId), partialData, { merge: true });
}

/**
 * ⚠️ إضافة جديدة بطلب صريح: "آلية آمنة" تقارن آخر تحديث بالسيرفر قبل الكتابة —
 * تحمي من جهاز/كود قديم (زي حادثة الجوال) يكتب فوق نسخة أحدث بدون علمه.
 *
 * ⚠️ تحسين دقة بطلب صريح (النسخة الأولى كانت تقارن بحقل lastUpdate — تاريخ فقط
 * بدون وقت، YYYY-MM-DD). المشكلة: تعديلين حقيقيين متعارضين بنفس اليوم (صباحاً
 * ومساءً مثلاً) ما كانا يُكتشفان إطلاقاً، لأن التاريخين متطابقين نصياً رغم اختلاف
 * الوقت الفعلي بالساعات. الحل: حقل تقني منفصل _syncTs (تاريخ+وقت كامل، ISO
 * datetime بدقة الميلي ثانية) — مخصص للمقارنة التقنية بس، لا علاقة له بـlastUpdate
 * (اللي يبقى للعرض/منطق العمل كما هو، تاريخ فقط بقصد). كل كتابة عبر هذي الدالة
 * تختم _syncTs تلقائياً (new Date().toISOString()) — المستدعي ما يحتاج يمرره
 * بنفسه بالكتابة، بس يمرر آخر قيمة كان يعرفها (expectedSyncTs) للمقارنة.
 *
 * الفكرة: قبل أي كتابة، نقرأ المستند الحالي فعلياً من Firestore أولاً (getDoc)،
 * ونقارن _syncTs فيه مع آخر نسخة كان العميل يعرفها (expectedSyncTs). لو السيرفر
 * عنده _syncTs أحدث من اللي كان العميل يعرفه، معناته صار تعديل بمكان/جهاز ثاني
 * ما وصل لهذا العميل بعد — فنرفض الكتابة (بدل ما تمسحه بصمت)، ونرجّع علامة
 * "متعارض" للمستدعي يقرر وش يسوي.
 *
 * لو المستند غير موجود أصلاً، أو ما فيه _syncTs محفوظ (تاسك قديم من قبل هذي
 * الميزة)، أو expectedSyncTs غير مُمرَّر — نكتب عادي بدون فحص (سلوك متوافق
 * للخلف، ما يكسر أي كود ثاني ولا يرفض كتابات على تاسكات قديمة بدون داعٍ).
 *
 * يرجع: { conflict: false } لو الكتابة تمّت، أو { conflict: true, serverSyncTs }
 * لو رُفضت بسبب تعارض.
 */
export async function updateUserDocIfNotStale(uid, collectionName, docId, partialData, expectedSyncTs) {
  const db = await getUserScopedDb();
  const ref = doc(db, 'users', uid, collectionName, docId);

  if (expectedSyncTs) {
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const serverSyncTs = snap.data()?._syncTs;
      if (serverSyncTs && serverSyncTs > expectedSyncTs) {
        return { conflict: true, serverSyncTs };
      }
    }
  }

  await setDoc(ref, { ...partialData, _syncTs: new Date().toISOString() }, { merge: true });
  return { conflict: false };
}

/**
 * يحذف مستند واحد من users/{uid}/{collectionName}/{docId}
 */
export async function deleteUserDoc(uid, collectionName, docId) {
  const db = await getUserScopedDb();
  await deleteDoc(doc(db, 'users', uid, collectionName, docId));
}

/**
 * يستمع لحظياً (real-time) لكل المستندات تحت users/{uid}/{collectionName}.
 * يرجع دالة لإلغاء الاستماع (unsubscribe).
 *
 * شكل البيانات اللي يستلمها callback: [{ id, data }, ...]
 * (هذا نفس الشكل الأصلي بالضبط — التحويل لشكل نهائي يتم داخل كل خدمة بمفردها)
 */
export function onUserCollection(uid, collectionName, callback) {
  let unsubscribe = () => {};

  getUserScopedDb().then((db) => {
    unsubscribe = onSnapshot(collection(db, 'users', uid, collectionName), (snapshot) => {
      callback(
        snapshot.docs.map((d) => ({
          id: d.id,
          data: d.data(),
        }))
      );
    });
  });

  return () => unsubscribe();
}
