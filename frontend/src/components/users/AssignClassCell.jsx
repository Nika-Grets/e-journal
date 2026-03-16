// Ячейка таблицы с inline-редактированием назначения ученика в класс.
import React, { useState } from 'react';
import { Edit2, Check, X } from 'lucide-react';
import api from '../../api/axios';
import { inp } from '../../styles/shared';

export default function AssignClassCell({ user, classes, onRefresh }) {
  const [editing, setEditing] = useState(false);
  const [value,   setValue]   = useState(user.class_id || '');

  const handleSave = async () => {
    await api.post('/api/classes/assign-student', { student_ID: user.ID, class_ID: value || null });
    setEditing(false);
    onRefresh();
  };

  // Режим просмотра
  if (!editing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 13 }}>{user.class_name || '—'}</span>
        <button
          onClick={() => setEditing(true)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
        >
          <Edit2 size={13}/>
        </button>
      </div>
    );
  }

  // Режим редактирования
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      <select
        value={value}
        onChange={e => setValue(e.target.value)}
        style={{ ...inp, fontSize: 12, padding: '4px' }}
      >
        <option value="">— Без класса —</option>
        {classes.map(c => (
          <option key={c.ID} value={c.ID}>{c.level}{c.letter}</option>
        ))}
      </select>
      <button
        onClick={handleSave}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#10b981' }}
      >
        <Check size={14}/>
      </button>
      <button
        onClick={() => setEditing(false)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
      >
        <X size={14}/>
      </button>
    </div>
  );
}
