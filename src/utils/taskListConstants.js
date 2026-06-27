// taskListConstants.js
// قوائم الخيارات الثابتة لفلترة وترتيب التاسكات بصفحة المجلد — نسخة من المتغيرات
// ut (خيارات الفلترة) و dt (خيارات الترتيب) بالكود الأصلي.

export const FILTER_STATUS_OPTIONS = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Action Required' },
  { id: 'waiting', label: 'Waiting' },
  { id: 'ontrack', label: 'On Track' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'urgent', label: 'Urgent' },
];

export const SORT_FIELD_OPTIONS = [
  { id: 'lastUpdate', label: 'Last Update' },
  { id: 'nextFollowup', label: 'Follow-up' },
  { id: 'createdAt', label: 'Created' },
  { id: 'status', label: 'Status' },
  { id: 'priority', label: 'Priority' },
  { id: 'name', label: 'Name' },
];
