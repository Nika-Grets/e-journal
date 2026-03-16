// Панель создания и управления классами.
// Отображает список классов с возможностью назначить куратора и посмотреть учеников.
import React, { useState, useEffect, useCallback } from 'react';
import { School, UserPlus, Trash2, Users, ChevronDown, ChevronUp, Check } from 'lucide-react';
import api from '../../api/axios';
import ClassStudents from './ClassStudents';
import { panel, inp, btnPrimary, btnSuccess, btnGray, btnDanger } from '../../styles/shared';

export default function ClassesPanel({ teachers, onRefresh }) {
  const [classes,  setClasses]  = useState([]);
  const [expanded, setExpanded] = useState({});
  const [creating, setCreating] = useState(false);
  const [form,     setForm]     = useState({ level: '', letter: '', curator_ID: '' });

  const loadClasses = useCallback(async () => {
    const r = await api.get('/api/classes');
    setClasses(r.data);
  }, []);

  useEffect(() => { loadClasses(); }, [loadClasses]);

  const handleCreate = async (e) => {
    e.preventDefault();
    await api.post('/api/classes', form);
    setForm({ level: '', letter: '', curator_ID: '' });
    setCreating(false);
    loadClasses();
    onRefresh();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить класс? Все связи с учениками будут удалены.')) return;
    await api.delete(`/api/classes/${id}`);
    loadClasses();
    onRefresh();
  };

  // Сохраняем нового куратора без перезагрузки всей страницы
  const handleCurator = async (classId, teacherId) => {
    await api.post('/api/classes/set-curator', { class_ID: classId, teacher_ID: teacherId || null });
    loadClasses();
  };

  const toggleExpanded = (id) =>
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div style={panel}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 18, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
          <School size={20}/> Классы
        </h3>
        <button onClick={() => setCreating(v => !v)} style={btnPrimary}>
          <UserPlus size={16}/> {creating ? 'Отмена' : 'Создать класс'}
        </button>
      </div>

      {creating && (
        <form
          onSubmit={handleCreate}
          style={{
            display: 'flex', gap: 10, alignItems: 'center',
            background: '#f0fdf4', borderRadius: 10, padding: 14,
            marginBottom: 16, flexWrap: 'wrap',
          }}
        >
          <input
            placeholder="Уровень (5, 6...)" type="number" min={1} max={12}
            value={form.level}
            onChange={e => setForm({ ...form, level: e.target.value })}
            required style={{ ...inp, width: 130 }}
          />
          <input
            placeholder="Буква (А, Б...)" maxLength={2}
            value={form.letter}
            onChange={e => setForm({ ...form, letter: e.target.value })}
            required style={{ ...inp, width: 100 }}
          />
          <select
            value={form.curator_ID}
            onChange={e => setForm({ ...form, curator_ID: e.target.value })}
            style={{ ...inp, width: 200 }}
          >
            <option value="">Куратор (необязательно)</option>
            {teachers.map(t => <option key={t.ID} value={t.ID}>{t.name}</option>)}
          </select>
          <button type="submit" style={btnSuccess}><Check size={16}/> Создать</button>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {classes.map(cls => (
          <div key={cls.ID} style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
            {/* Шапка карточки класса */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#f8fafc' }}>
              <span style={{ fontWeight: 700, fontSize: 16, color: '#0f172a', minWidth: 50 }}>
                {cls.level}{cls.letter}
              </span>
              <span style={{ fontSize: 13, color: '#64748b' }}>{cls.student_count} уч.</span>
              <span style={{ fontSize: 13, color: '#475569' }}>
                Куратор:{' '}
                <select
                  value={cls.curator_ID || ''}
                  onChange={e => handleCurator(cls.ID, e.target.value)}
                  style={{ fontSize: 13, border: 'none', background: 'transparent', cursor: 'pointer', color: '#3b82f6', outline: 'none' }}
                >
                  <option value="">—</option>
                  {teachers.map(t => <option key={t.ID} value={t.ID}>{t.name}</option>)}
                </select>
              </span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                <button onClick={() => toggleExpanded(cls.ID)} style={{ ...btnGray, gap: 4 }}>
                  <Users size={14}/> Ученики
                  {expanded[cls.ID] ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                </button>
                <button onClick={() => handleDelete(cls.ID)} style={btnDanger}>
                  <Trash2 size={16}/>
                </button>
              </div>
            </div>
            {/* Список учеников — раскрывается по кнопке */}
            {expanded[cls.ID] && <ClassStudents classId={cls.ID} onRefresh={loadClasses}/>}
          </div>
        ))}
        {classes.length === 0 && (
          <div style={{ textAlign: 'center', padding: 30, color: '#94a3b8' }}>
            Классы не созданы
          </div>
        )}
      </div>
    </div>
  );
}
