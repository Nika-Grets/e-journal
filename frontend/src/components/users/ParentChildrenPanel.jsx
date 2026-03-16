// Панель управления связями «родитель — ребёнок».
import React, { useState, useEffect, useCallback } from 'react';
import { X, Link, Check } from 'lucide-react';
import api from '../../api/axios';
import { inp, btnSuccess, btnGray } from '../../styles/shared';

export default function ParentChildrenPanel({ parentId, allStudents }) {
  const [children,         setChildren]         = useState([]);
  const [adding,           setAdding]           = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');

  const loadChildren = useCallback(async () => {
    const r = await api.get(`/api/classes/parent-children/${parentId}`);
    setChildren(r.data);
  }, [parentId]);

  useEffect(() => { loadChildren(); }, [loadChildren]);

  const handleLink = async () => {
    if (!selectedStudentId) return;
    await api.post('/api/classes/link-parent', {
      parent_ID: parentId, student_ID: selectedStudentId, action: 'add',
    });
    setAdding(false);
    setSelectedStudentId('');
    loadChildren();
  };

  const handleUnlink = async (studentId) => {
    await api.post('/api/classes/link-parent', {
      parent_ID: parentId, student_ID: studentId, action: 'remove',
    });
    loadChildren();
  };

  // Исключаем уже привязанных детей из списка выбора
  const linkedIds  = new Set(children.map(c => String(c.ID)));
  const available  = allStudents.filter(s => !linkedIds.has(String(s.ID)));

  return (
    <div style={{ marginTop: 8, paddingLeft: 12, borderLeft: '3px solid #e2e8f0' }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>ДЕТИ:</div>

      {children.length === 0 && (
        <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>Нет привязанных детей</div>
      )}

      {children.map(ch => (
        <div key={ch.ID} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 13, color: '#1e293b' }}>{ch.last_name} {ch.first_name}</span>
          {ch.class_name && (
            <span style={{ fontSize: 11, color: '#64748b' }}>({ch.class_name})</span>
          )}
          <button
            onClick={() => handleUnlink(ch.ID)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
          >
            <X size={12}/>
          </button>
        </div>
      ))}

      {adding ? (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4 }}>
          <select
            value={selectedStudentId}
            onChange={e => setSelectedStudentId(e.target.value)}
            style={{ ...inp, flex: 1, fontSize: 12 }}
          >
            <option value="">Выберите ученика</option>
            {available.map(s => (
              <option key={s.ID} value={s.ID}>
                {s.last_name} {s.first_name} {s.class_name ? `(${s.class_name})` : ''}
              </option>
            ))}
          </select>
          <button onClick={handleLink} style={{ ...btnSuccess, padding: '6px 10px' }}>
            <Check size={14}/>
          </button>
          <button onClick={() => setAdding(false)} style={{ ...btnGray, padding: '6px 10px' }}>
            <X size={14}/>
          </button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          style={{
            fontSize: 12, background: 'none', border: '1px dashed #cbd5e1',
            borderRadius: 6, padding: '3px 10px', cursor: 'pointer', color: '#64748b',
            display: 'flex', alignItems: 'center', gap: 4, marginTop: 4,
          }}
        >
          <Link size={12}/> Добавить ребёнка
        </button>
      )}
    </div>
  );
}
