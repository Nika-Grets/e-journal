// Цветной бейдж для отображения роли пользователя.
import React from 'react';

const ROLE_COLORS = {
  ADMIN:   '#fef3c7',
  TEACHER: '#dbeafe',
  STUDENT: '#dcfce7',
  PARENT:  '#f3e8ff',
};
const ROLE_TEXT = {
  ADMIN:   '#92400e',
  TEACHER: '#1d4ed8',
  STUDENT: '#166534',
  PARENT:  '#7e22ce',
};

export default function UserBadge({ role }) {
  return (
    <span style={{
      background: ROLE_COLORS[role] || '#f1f5f9',
      color:      ROLE_TEXT[role]   || '#475569',
      padding: '2px 10px',
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 600,
    }}>
      {role}
    </span>
  );
}
