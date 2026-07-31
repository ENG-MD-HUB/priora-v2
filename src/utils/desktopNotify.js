// desktopNotify.js
// إرسال إشعار سطح مكتب حقيقي عبر Service Worker (يظهر بـ Action Center على Windows).
// إذا SW غير متاح (بيئة تطوير بدون HTTPS مثلاً)، يرجع لـ new Notification() العادية.

let swRegistration = null;

async function getSwRegistration() {
  if (swRegistration) return swRegistration;
  if (!('serviceWorker' in navigator)) return null;
  try {
    // نحاول نجد SW المسجّل أولاً (بدون إعادة تسجيل غير ضرورية)
    const existing = await navigator.serviceWorker.getRegistration('/');
    if (existing) {
      swRegistration = existing;
      return swRegistration;
    }
    // إذا ما في SW مسجّل، نسجّله
    swRegistration = await navigator.serviceWorker.register('/sw-notifications.js', { scope: '/' });
    return swRegistration;
  } catch (err) {
    console.warn('SW registration failed, falling back to Notification API:', err);
    return null;
  }
}

/**
 * يعرض إشعار سطح مكتب — عبر SW إذا متاح (أفضل على Windows)، وإلا مباشرة.
 * @param {string} title
 * @param {string} body
 * @param {string} [tag]
 */
export async function desktopNotify(title, body, tag) {
  if (typeof Notification === 'undefined') return;
  if (Notification.permission === 'default') await Notification.requestPermission();
  if (Notification.permission !== 'granted') return;

  const sw = await getSwRegistration();

  if (sw) {
    // طريق الـ Service Worker — يظهر في Action Center على Windows
    const controller = await navigator.serviceWorker.ready;
    controller.active?.postMessage({ type: 'SHOW_NOTIFICATION', title, body, tag });
  } else {
    // fallback مباشر (Chromium/Firefox بدون SW)
    try { new Notification(title, { body, tag }); } catch { /* ignored */ }
  }
}
