// Универсальный компонент вкладок (табов).
// Используется на странице пользователей, отчётов и везде, где нужны вкладки.
import React from 'react';

/**
 * @param {Array<{key: string, label: string, icon?: React.Node}>} tabs
 * @param {string} active — ключ активной вкладки
 * @param {function} onChange — вызывается с новым ключом при клике
 */
export default function Tabs({ tabs, active, onChange }) {
  return (
    <div style={{
      display: 'flex',
      gap: 0,
      marginBottom: 24,
      borderBottom: '2px solid #e2e8f0',
    }}>
      {tabs.map(t => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          style={{
            padding: '10px 20px',
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            // Подчёркивание активной вкладки
            borderBottom: active === t.key ? '2px solid #3b82f6' : '2px solid transparent',
            color: active === t.key ? '#3b82f6' : '#64748b',
            fontWeight: active === t.key ? 600 : 400,
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: -2, // перекрывает нижнюю рамку контейнера
          }}
        >
          {t.icon} {t.label}
        </button>
      ))}
    </div>
  );
}
