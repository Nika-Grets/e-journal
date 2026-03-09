import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { Users, BookOpen, Calendar, Info, CheckCircle2 } from 'lucide-react';

const TeacherJournal = () => {
  const [filters, setFilters] = useState({ class_id: '', subject_id: '' });
  const [options, setOptions] = useState({ classes: [], subjects: [] });
  const [data, setData] = useState({ students: [], lessons: [], records: [] });
  // eslint-disable-next-line no-unused-vars
  const [loading, setLoading] = useState(false);
  const [savingStatus, setSavingStatus] = useState(null); // 'saving', 'success', null

  // 1. Загрузка классов учителя
  useEffect(() => {
    api.get('/api/teacher/classes').then(res => setOptions(prev => ({ ...prev, classes: res.data })));
  }, []);

  // 2. Загрузка предметов для выбранного класса
  useEffect(() => {
    if (filters.class_id) {
      api.get(`/api/teacher/subjects?class_id=${filters.class_id}`)
        .then(res => setOptions(prev => ({ ...prev, subjects: res.data })));
    }
  }, [filters.class_id]);

  // 3. Загрузка данных журнала (ученики, уроки из расписания, оценки+н)
  const loadJournal = useCallback(async () => {
    if (!filters.class_id || !filters.subject_id) return;
    setLoading(true);
    try {
      const [stRes, lesRes, grRes] = await Promise.all([
        api.get(`/api/users/students?class_id=${filters.class_id}`),
        api.get(`/api/lessons/journal?class_id=${filters.class_id}&subject_id=${filters.subject_id}`),
        api.get(`/api/grades?class_id=${filters.class_id}&subject_id=${filters.subject_id}`)
      ]);
      setData({ students: stRes.data, lessons: lesRes.data, records: grRes.data });
    } catch (err) {
      console.error("Ошибка загрузки журнала", err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { loadJournal(); }, [loadJournal]);

  // 4. Сохранение (Парсинг Н5 на бэкенде)
  const handleSave = async (studentId, lessonId, rawValue) => {
    const value = rawValue.toUpperCase().trim();
    setSavingStatus('saving');
    try {
      await api.post('/api/grades', { 
        student_id: studentId, 
        lesson_id: lessonId, 
        value: value || null 
      });
      setSavingStatus('success');
      setTimeout(() => setSavingStatus(null), 2000);
      loadJournal(); // Обновляем данные, чтобы видеть актуальное состояние
    } catch (err) {
      setSavingStatus(null);
      alert("Ошибка при сохранении", err);
    }
  };

  return (
    <div style={styles.container}>
      {/* Header & Filters */}
      <div style={styles.header}>
        <div style={styles.titleGroup}>
          <h2 style={styles.title}>Классный журнал</h2>
          {savingStatus === 'saving' && <span style={styles.statusInfo}>Сохранение...</span>}
          {savingStatus === 'success' && <span style={styles.statusSuccess}><CheckCircle2 size={16}/> Сохранено</span>}
        </div>
        
        <div style={styles.filterRow}>
          <div style={styles.selectWrapper}>
            <Users size={18} style={styles.icon} />
            <select 
              value={filters.class_id}
              onChange={e => setFilters({ class_id: e.target.value, subject_id: '' })}
              style={styles.select}
            >
              <option value="">Выберите класс</option>
              {options.classes.map(c => <option key={c.ID} value={c.ID}>{c.level}-{c.letter}</option>)}
            </select>
          </div>

          <div style={styles.selectWrapper}>
            <BookOpen size={18} style={styles.icon} />
            <select 
              disabled={!filters.class_id}
              value={filters.subject_id}
              onChange={e => setFilters({ ...filters, subject_id: e.target.value })}
              style={styles.select}
            >
              <option value="">Выберите предмет</option>
              {options.subjects.map(s => <option key={s.ID} value={s.ID}>{s.name}</option>)}
            </select>
          </div>
        </div>
      </div>

{/* Table Section */}
      {!filters.class_id || !filters.subject_id ? (
        <div style={styles.emptyState}>
          <Info size={40} color="#cbd5e1" />
          <p>Выберите класс и предмет для начала работы</p>
        </div>
      ) : (
        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.thName}>Ученик</th>
                {data.lessons.map(lesson => (
                  <th key={lesson.ID} style={styles.thDate}>
                    <div style={styles.dateLabel}>
                      {new Date(lesson.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}
                    </div>
                    {lesson.topic_title && <div style={styles.topicLabel}>{lesson.topic_title}</div>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.students.map(student => (
                <tr key={student.ID} style={styles.tr}>
                  <td style={styles.tdName}>
                    {student.last_name} {student.first_name}
                  </td>
                  {data.lessons.map(lesson => {
                    const record = data.records.find(r => r.student_ID === student.ID && r.lesson_ID === lesson.ID);
                    const displayValue = `${record?.absence || ''}${record?.grade || ''}`;
                    
                    return (
                      <td key={lesson.ID} style={styles.tdGrade}>
                        <input 
                          type="text"
                          defaultValue={displayValue}
                          onBlur={(e) => handleSave(student.ID, lesson.ID, e.target.value)}
                          style={{
                            ...styles.gradeInput,
                            color: record?.absence ? '#ef4444' : '#1e293b',
                            fontWeight: record?.absence ? '700' : '400'
                          }}
                          placeholder="—"
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: { padding: '24px', background: '#f8fafc', minHeight: '100vh' },
  header: { marginBottom: '24px' },
  titleGroup: { display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' },
  title: { fontSize: '24px', fontWeight: '700', color: '#1e293b', margin: 0 },
  statusInfo: { fontSize: '12px', color: '#64748b', animate: 'pulse 2s infinite' },
  statusSuccess: { fontSize: '12px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' },
  filterRow: { display: 'flex', gap: '16px' },
  selectWrapper: { position: 'relative', display: 'flex', alignItems: 'center', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '0 12px' },
  icon: { color: '#94a3b8', marginRight: '8px' },
  select: { border: 'none', padding: '10px 4px', fontSize: '14px', outline: 'none', background: 'transparent', minWidth: '160px', color: '#334155' },
  tableWrapper: { background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'separate', borderSpacing: 0 },
  thName: { position: 'sticky', left: 0, zIndex: 10, background: '#f8fafc', padding: '16px', textAlign: 'left', fontSize: '13px', color: '#64748b', fontWeight: '600', borderBottom: '2px solid #e2e8f0' },
  thDate: { padding: '12px', borderBottom: '2px solid #e2e8f0', background: '#f8fafc', minWidth: '60px' },
  dateLabel: { fontSize: '13px', fontWeight: '700', color: '#1e293b' },

topicLabel: { fontSize: '10px', fontWeight: '400', color: '#94a3b8', marginTop: '4px', maxWidth: '80px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  tr: { transition: 'background 0.2s' },
  tdName: { position: 'sticky', left: 0, zIndex: 5, background: '#fff', padding: '12px 16px', fontSize: '14px', fontWeight: '500', color: '#334155', borderBottom: '1px solid #f1f5f9' },
  tdGrade: { padding: 0, borderBottom: '1px solid #f1f5f9', borderLeft: '1px solid #f1f5f9' },
  gradeInput: { width: '100%', height: '45px', border: 'none', background: 'transparent', textAlign: 'center', fontSize: '15px', outline: 'none', cursor: 'pointer', transition: 'all 0.2s' },
  emptyState: { textAlign: 'center', padding: '100px 0', color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }
};

export default TeacherJournal;
