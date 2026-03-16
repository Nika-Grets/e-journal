// Разворачиваемый список учеников класса с возможностью отчислить.
import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '../../api/axios';
import { btnGray } from '../../styles/shared';

export default function ClassStudents({ classId, onRefresh }) {
  const [students, setStudents] = useState([]);

  useEffect(() => {
    api.get(`/api/classes/${classId}/students`).then(r => setStudents(r.data));
  }, [classId]);

  // Убирает ученика из класса (без удаления пользователя)
  const handleRemove = async (studentId) => {
    await api.post('/api/classes/assign-student', { student_ID: studentId, class_ID: null });
    setStudents(prev => prev.filter(s => s.ID !== studentId));
    onRefresh();
  };

  if (students.length === 0) {
    return (
      <div style={{ padding: '12px 16px', color: '#94a3b8', fontSize: 13 }}>
        В классе нет учеников
      </div>
    );
  }

  return (
    <div style={{ padding: '8px 16px 12px' }}>
      {students.map(s => (
        <div key={s.ID} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '6px 0', borderBottom: '1px solid #f1f5f9',
        }}>
          <span style={{ fontSize: 14, color: '#1e293b' }}>
            {s.last_name} {s.first_name} {s.middle_name || ''}
          </span>
          <button
            onClick={() => handleRemove(s.ID)}
            style={{ marginLeft: 'auto', ...btnGray, color: '#ef4444', fontSize: 12 }}
          >
            <X size={12}/> Убрать
          </button>
        </div>
      ))}
    </div>
  );
}
