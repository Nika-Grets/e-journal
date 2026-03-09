/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-refresh/only-export-components */
// src/components/ui/PermGuard.jsx
import React, { useState, useEffect } from 'react';
import { can, canAny, getUser } from '../../utils/auth';
import api from '../../api/axios';

// Загружает имя/фамилию текущего пользователя один раз и кэширует в модуле
let _cache = null;
const _listeners = new Set();

export function useCurrentUser() {
  const [user, setUser] = useState(_cache);

  useEffect(() => {
    if (_cache) { setUser(_cache); return; }
    const jwt = getUser();
    if (!jwt) return;

    api.get(`/api/users/`).then(res => {
      const me = res.data.find(u => u.ID === jwt.id);
      if (me) {
        _cache = { ...jwt, first_name: me.first_name, last_name: me.last_name, role_name: me.role_name };
        setUser(_cache);
        _listeners.forEach(fn => fn(_cache));
      }
    }).catch(() => {});
  }, []);

  // Подписка на обновления из других компонентов
  useEffect(() => {
    _listeners.add(setUser);
    return () => _listeners.delete(setUser);
  }, []);

  return user || getUser();
}

// ── PermGuard ───────────────────────────────────────────────────────────────
/**
 * Рендерит children только если у пользователя есть нужное право.
 * @param {string}   perm   - одно право
 * @param {string[]} any    - массив прав (достаточно одного)
 * @param {React.Node} fallback - что показать если нет прав (по умолчанию null)
 */
export function PermGuard({ perm, any: anyPerms, fallback = null, children }) {
  const allowed = perm ? can(perm) : anyPerms ? canAny(...anyPerms) : false;
  return allowed ? <>{children}</> : <>{fallback}</>;
}

// ── NoAccess ────────────────────────────────────────────────────────────────
export function NoAccess({ message = 'Нет доступа к этому разделу' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '60vh', gap: 12, color: '#94a3b8' }}>
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/>
      </svg>
      <p style={{ fontSize: 16, margin: 0 }}>{message}</p>
    </div>
  );
}
