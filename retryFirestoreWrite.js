// retryFirestoreWrite.js
// ⚠️ إضافة جديدة بطلب صريح (بعد حادثة حذف فولدر فشل بصمت بـFirestore وبقي "زومبي"
// لأسابيع قبل ما يرجع يظهر). ما موجودة بالكود الأصلي.
//
// المشكلة اللي تحلّها: كل كتابة/حذف بـFirestore بهذا التطبيق كانت "أرسل وانسَ"
// (fire-and-forget) — فشل مؤقت (انقطاع إنترنت لحظي، مشكلة شبكة عابرة) يُسجَّل
// بـconsole فقط، بدون إعادة محاولة، وبدون أي تنبيه للمستخدم. لو الفشل صار بعملية
// حذف تحديداً، المستند يبقى "زومبي" بـFirestore للأبد (يظهر لك محذوف محلياً، لكنه
// حقيقةً لسا موجود) — يرجع يظهر فجأة بأي مزامنة كاملة لاحقة (تسجيل دخول جديد،
// مسح كاش، جهاز آخر).
//
// الحل: محاولات متكررة (3 افتراضياً) بفاصل زمني متصاعد، وإذا فشلت الكل، استدعاء
// onFinalFailure (عادة toast تحذيري) عشان المستخدم يعرف يعيد المحاولة يدوياً،
// بدل فشل صامت تام.

export async function retryFirestoreWrite(writeFn, { attempts = 3, delayMs = 1000, onFinalFailure } = {}) {
  let lastError;
  for (let i = 0; i < attempts; i++) {
    try {
      await writeFn();
      return true;
    } catch (err) {
      lastError = err;
      if (i < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * (i + 1)));
      }
    }
  }
  console.error('retryFirestoreWrite: all attempts failed', lastError);
  onFinalFailure?.(lastError);
  return false;
}
