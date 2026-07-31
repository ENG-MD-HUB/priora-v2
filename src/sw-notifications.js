// sw-notifications.js
// Service Worker خفيف مخصص للإشعارات فقط.
// يستقبل رسائل من التطبيق عبر postMessage ويعرضها كـ System Notification
// حقيقية على Windows (تظهر بـ Action Center وتبقى حتى يغلقها المستخدم).

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

// استقبال رسالة من التطبيق: { type: 'SHOW_NOTIFICATION', title, body, tag }
self.addEventListener('message', (event) => {
  if (!event.data || event.data.type !== 'SHOW_NOTIFICATION') return;
  const { title, body, tag, icon } = event.data;
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      tag: tag || 'priora',
      icon: icon || '/icon-512.png',
      badge: '/icon-512.png',
      requireInteraction: false,  // لا يبقى مفتوحاً إلى الأبد، يُغلق تلقائياً
    })
  );
});

// عند النقر على الإشعار — يفتح/يُركّز نافذة التطبيق
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      return self.clients.openWindow('/');
    })
  );
});
