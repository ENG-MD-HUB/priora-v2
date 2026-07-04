// useWorkspaceFollowupNotifications.js
// هوك جديد بطلب صريح (غير موجود بالكود الأصلي): يراقب تاسكات كل الورك سبيسات
// اللي المستخدم عضو فيها، ولو تاريخ متابعة أي تاسك (nextFollowup) هو اليوم،
// يُنشئ:
// 1. إشعار داخل التطبيق (notificationService.add) يظهر لكل أعضاء الورك سبيس.
// 2. إشعار سطح مكتب حقيقي (نفس نمط useFollowupDesktopNotifications للتاسكات
//    الشخصية بالضبط — يطلب صلاحية مرة وحدة فقط لو لسا "default").
//
// ⚠️ نقطة تصميم مهمة: أكثر من عضو بنفس الورك سبيس ممكن يكون تطبيقه مفتوح بنفس
// اللحظة، فأكثر من جهاز ممكن "يكتشف" نفس التاسك المستحق بنفس اليوم. لتفادي
// إشعار مكرر بقائمة الجرس لكل الأعضاء، نستخدم id ثابت محسوب من (taskId + التاريخ)
// بدل id عشوائي — فكل الأجهزة تكتب لنفس المستند بالضبط، ولا يتكرر الإشعار مهما
// تعدد الأجهزة اللي اكتشفته بنفس اليوم.
//
// ⚠️ تحسين كفاءة بطلب صريح: onTasks يُطلق مع أي تغيير على أي تاسك بالورك سبيس
// (مو بس لما يصير الاستحقاق) — فبدون حارس محلي، نفس التاسك المستحق كان يُعاد
// كتابته لـFirestore بكل مرة يتغيّر فيها أي شي ثاني بالورك سبيس (تكلفة كتابة
// زايدة بدون داعٍ، رغم إن الـid الثابت يمنع ظهور تكرار بصري). الحل: نفس حارس
// "priora_ws_notif_sent_{today}" المستخدم أصلاً لإشعار سطح المكتب صار يُطبَّق
// أيضاً قبل الكتابة لـFirestore — يعني كل جهاز يكتب كل تاسك مستحق **مرة وحدة
// بالضبط باليوم**، بدل إعادة الكتابة بكل تحديث.

import { useEffect } from 'react';
import { useWorkspacesStore } from './../store/workspacesStore';
import { wsTaskService } from '../services/wsTaskService';
import { notificationService } from '../services/notificationService';
import { getEffectiveToday } from './taskDateLogic';

export function useWorkspaceFollowupNotifications(uid) {
  const workspaces = useWorkspacesStore((s) => s.workspaces);
  const workspaceIdsKey = workspaces.map((w) => w.id).join(',');

  useEffect(() => {
    if (!uid || workspaces.length === 0) return;

    const unsubscribers = workspaces.map((ws) =>
      wsTaskService.onTasks(ws.id, (tasks) => {
        const today = getEffectiveToday();
        const dueTasks = tasks.filter((t) => t.status !== 'closed' && t.nextFollowup === today);
        if (dueTasks.length === 0) return;

        // حارس محلي واحد (لكل جهاز/يوم) يُبوّب أي تاسك سبق وأُرسِل له إشعار
        // اليوم — يُستخدم لبوابة كتابة Firestore وإشعار سطح المكتب معاً، بدل
        // تكراره لكل واحد لحاله.
        const sentKey = `priora_ws_notif_sent_${today}`;
        let alreadySent;
        try {
          alreadySent = JSON.parse(localStorage.getItem(sentKey) || '[]');
        } catch {
          alreadySent = [];
        }

        const newlyDue = dueTasks.filter((t) => !alreadySent.includes(t.id));
        if (newlyDue.length === 0) return;

        // إشعار داخل التطبيق (id ثابت — راجع الملاحظة أعلى الملف لسبب هذا تحديداً)
        // — الآن مرة وحدة فقط لكل تاسك جديد الاستحقاق، مو بكل تحديث.
        newlyDue.forEach((task) => {
          notificationService
            .add(
              ws.id,
              {
                type: 'followup_due',
                wsId: ws.id,
                wsName: ws.name,
                taskId: task.id,
                taskName: task.name,
                authorId: 'system',
                authorName: 'Priora',
                text: 'Follow-up is due today',
              },
              `followup_${task.id}_${today}`
            )
            .catch((err) => console.warn('followup notif:', err));
        });

        // إشعار سطح مكتب حقيقي — نفس منطق الهوك الشخصي بالضبط.
        if (typeof Notification !== 'undefined') {
          if (Notification.permission === 'default') Notification.requestPermission();
          if (Notification.permission === 'granted') {
            newlyDue.forEach((task) => {
              try {
                new Notification('Priora — Follow-up due', { body: `${task.name} (${ws.name})`, tag: `priora-ws-${task.id}` });
              } catch {
                // فشل إنشاء إشعار واحد لا يوقف الباقي.
              }
            });
          }
        }

        // نسجّل كل تاسك بالحارس المحلي بعد أول مرة يُعالَج فيها — بغض النظر هل
        // نجح إشعار سطح المكتب أو لا (النجاح بالجرس/Firestore هو الأهم هنا).
        try {
          localStorage.setItem(sentKey, JSON.stringify([...alreadySent, ...newlyDue.map((t) => t.id)]));
        } catch {
          // فشل الكتابة بـlocalStorage ليس خطأ حرج هنا.
        }
      })
    );

    return () => unsubscribers.forEach((unsub) => unsub());
  }, [uid, workspaceIdsKey]);
}
