// useWorkspaceMembers.js
// هوك استماع لحظي لأعضاء ورك سبيس معيّن — نسخة مُعاد كتابتها بوضوح من الدالة vt
// بالكود الأصلي.

import { useState, useEffect } from 'react';
import { workspaceService } from '../services/workspaceService';

export function useWorkspaceMembers(wsId) {
  const [members, setMembers] = useState([]);

  useEffect(() => workspaceService.onMembers(wsId, setMembers), [wsId]);

  return members;
}
