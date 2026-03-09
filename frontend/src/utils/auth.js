export const getUser = () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;

    // JWT использует base64url — нужно привести к стандартному base64
    const base64url = token.split('.')[1];
    const base64 = base64url
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(base64url.length / 4) * 4, '=');

    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
};

// Есть ли конкретное право 
export const can = (perm) => {
  const user = getUser();
  return Array.isArray(user?.permissions) && user.permissions.includes(perm);
};

// Есть ли хотя бы одно из прав 
export const canAny = (...perms) => perms.some(can);

// ── Группы прав ────────────────────────────────────────────────────────────

export const canManageUsers     = () => can('users:manage');
export const canManageSchedule  = () => can('schedule:manage') && can('users:manage');
export const canViewSchedule    = () => canAny('schedule:view', 'schedule:manage');
export const canWriteGrades     = () => can('grades:write');
export const canReadAllGrades   = () => can('grades:read_all');
export const canReadOwnGrades   = () => canAny('grades:read_own', 'grades:read_all');
export const canWriteHomework   = () => can('homework:create');
export const canReadHomework    = () => canAny('homework:read', 'homework:create');
export const canViewReports     = () => canAny('reports:full', 'reports:class');
export const canManageTopics    = () => canAny('topics:manage_self', 'topics:manage_all');
export const canViewAllSubjects = () => can('subjects:view_all');

// ── Хелперы для UI ─────────────────────────────────────────────────────────

// Имя для сайдбара 
export const getUserDisplayName = () => {
  const user = getUser();
  if (!user) return '';
  // Имя хранится в JWT только если мы его туда положили; иначе email
  return user.name || user.email || `User #${user.id}`;
};

// Роль для отображения (берём из role_id — маппинг фиксированный) 
const ROLE_MAP = { 1: 'ADMIN', 2: 'TEACHER', 3: 'STUDENT', 4: 'PARENT' };
export const getRoleName = () => {
  const user = getUser();
  return ROLE_MAP[user?.role_id] || 'USER';
};

// Ярлык для дашборда/навигации 
export const getViewMode = () => {
  if (canManageSchedule())  return 'admin';
  if (canWriteGrades())     return 'teacher';
  if (canReadOwnGrades())   return getRoleName() === 'PARENT' ? 'parent' : 'student';
  //    const user = getUser();
  //  return user?.role_id === 4 ? 'parent' : 'student';
  return 'guest';
};
