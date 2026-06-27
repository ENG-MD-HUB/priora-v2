// useWorkspaceTasks.js
// هوك استماع لحظي لتاسكات ورك سبيس معيّن — نسخة مُعاد كتابتها بوضوح من الدالة _t
// بالكود الأصلي.

import { useState, useEffect } from 'react';
import { wsTaskService } from '../services/wsTaskService';

export function useWorkspaceTasks(wsId) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    return wsTaskService.onTasks(wsId, (newTasks) => {
      setTasks(newTasks);
      setLoading(false);
    });
  }, [wsId]);

  return { tasks, loading };
}
