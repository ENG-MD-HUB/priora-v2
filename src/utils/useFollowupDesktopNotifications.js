// useFollowupDesktopNotifications.js
// هوك يرسل إشعارات سطح المكتب الحقيقية (Notification API بالمتصفح) للتاسكات اللي
// تاريخ متابعتها هو اليوم — نسخة مُعاد كتابتها بوضوح من جزء من useEffect بالمكوّن
// Vt بالكود الأصلي.
//
// ملاحظات سلوكية محفوظة من الأصل:
// 1. يطلب صلاحية الإشعارات تلقائياً لو لسا "default" (لم يُسأل المستخدم من قبل).
// 2. يستخدم اليوم الحقيقي (منتصف الليل) للمطابقة مع nextFollowup — وليس "اليوم
//    الفعلي" (قاعدة الساعة 5 فجراً) المستخدمة بمنطق التأخير بباقي التطبيق.
// 3. يحفظ بـ localStorage قائمة التاسكات اللي تم إرسال إشعار لها اليوم (بمفتاح يومي
//    منفصل priora_notif_sent_{today}) — لمنع تكرار نفس الإشعار عدة مرات بنفس اليوم
//    حتى لو تغيّرت قائمة التاسكات وأعاد المكوّن الرندر.

import { useEffect } from 'react';

export function useFollowupDesktopNotifications(tasks) {
  useEffect(() => {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission === 'default') Notification.requestPermission();
    if (Notification.permission !== 'granted') return;

    const today = new Date().toISOString().slice(0, 10);
    const sentKey = `priora_notif_sent_${today}`;
    let alreadySent;
    try {
      alreadySent = JSON.parse(localStorage.getItem(sentKey) || '[]');
    } catch {
      alreadySent = [];
    }

    const dueTasks = tasks.filter((t) => t.status !== 'closed' && t.nextFollowup === today && !alreadySent.includes(t.id));
    if (dueTasks.length === 0) return;

    dueTasks.forEach((task) => {
      try {
        new Notification('Priora — Follow-up due', { body: task.name, tag: `priora-${task.id}` });
      } catch {
        // فشل إنشاء إشعار واحد (مثلاً صلاحية مسحوبة بنفس اللحظة) لا يوقف الباقي.
      }
    });

    try {
      localStorage.setItem(sentKey, JSON.stringify([...alreadySent, ...dueTasks.map((t) => t.id)]));
    } catch {
      // فشل الكتابة بـ localStorage (مثلاً مساحة ممتلئة) ليس خطأ حرج هنا.
    }
  }, [tasks]);
}
