// userScopedCrud.js
// أدوات عامة (generic) لقراءة/كتابة/حذف بيانات محفوظة تحت مسار users/{uid}/{collection}.
// نسخة مُعاد كتابتها بوضوح من 3 دوال أصلية بالكود المضغوط: fe (حفظ), pe (حذف), me (استماع لحظي).
//
// كل خدمة (tasks, folders, contacts, trash, wsrefs) تُبنى فوق هذي الدوال الثلاث —
// هذا هو السبب الحقيقي لإمكانية فصلها لمديولز بأمان: التكرار البرمجي مُجمّع هنا بالفعل
// في الكود الأصلي، ولم نُضف تجميعاً جديداً، فقط أوضحناه بالاسم.

import { doc, setDoc, deleteDoc, collection, onSnapshot } from 'firebase/firestore';
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
