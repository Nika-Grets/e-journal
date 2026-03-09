import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { Trash2, Plus, Clock, BookOpen, Edit2, X, Check, Info } from 'lucide-react';

const TopicsPage = () => {
  // Данные из БД
  const [topics, setTopics] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [gradeLevels, setGradeLevels] = useState([]);

  // Состояние фильтров
  const [filters, setFilters] = useState({ subject_id: '', grade_level: '' });

  // Состояние добавления новой темы
  const [isAdding, setIsAdding] = useState(false);
  const [newTopic, setNewTopic] = useState({ title: '', description: '', hours_allocated: 1 });

  // Состояние редактирования существующей темы
  const [editingId, setEditingId] = useState(null);
  const [editFormData, setEditFormData] = useState({ title: '', description: '', hours_allocated: 1 });

  // Загрузка справочников (предметы и классы) при старте
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [subs, levels] = await Promise.all([
          api.get('/api/subjects'),
          api.get('/api/grade-levels')
        ]);
        setSubjects(subs.data);
        setGradeLevels(levels.data);
      } catch (err) {
        console.error("Ошибка загрузки справочников", err);
      }
    };
    loadInitialData();
  }, []);

  const fetchTopics = useCallback(async () => {
    if (!filters.subject_id || !filters.grade_level) {
      setTopics([]);
      return;
    }
    try {
      const res = await api.get('/api/topics', { params: filters });
      setTopics(res.data);
    } catch (err) {
      console.error("Ошибка при загрузке тем", err);
    }
  }, [filters]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchTopics();
  }, [fetchTopics]);

  // Добавление новой темы
  const handleSaveNew = async (e) => {
    e.preventDefault();
    const payload = {
      ...newTopic,
      subject_id: filters.subject_id,
      grade_level: filters.grade_level,
      order_index: topics.length + 1
    };

    try {
      await api.post('/api/topics', payload);
      setNewTopic({ title: '', description: '', hours_allocated: 1 });
      setIsAdding(false);
      fetchTopics();
    } catch (err) {
      alert("Не удалось сохранить тему", err);
    }
  };

  // Редактирование: вход в режим
  const startEdit = (topic) => {
    setEditingId(topic.ID); // В базе ID заглавными
    setEditFormData({
      title: topic.title,
      description: topic.description,
      hours_allocated: topic.hours_allocated
    });
  };

  // Редактирование: сохранение
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/api/topics/${editingId}`, editFormData);
      setEditingId(null);
      fetchTopics();
    } catch (err) {
      alert("Ошибка при обновлении темы", err);
    }
  };

  // Удаление
  const handleDelete = async (id) => {
    if (!window.confirm("Удалить эту тему из учебного плана?")) return;
    try {
      await api.delete(`/api/topics/${id}`);
      fetchTopics();
    } catch (err) {
      alert("Ошибка при удалении", err);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}><BookOpen /> Учебный план</h2>

      {/* Панель фильтров */}
      <div style={styles.filterBar}>
        <select 
          value={filters.subject_id} 
          onChange={e => setFilters({...filters, subject_id: e.target.value})}
          style={styles.select}
        >
          <option value="">Выберите предмет</option>
          {subjects.map(s => <option key={s.ID} value={s.ID}>{s.name}</option>)}
        </select>

        <select 
          value={filters.grade_level} 
          onChange={e => setFilters({...filters, grade_level: e.target.value})}
          style={styles.select}
        >
          <option value="">Выберите класс</option>
          {gradeLevels.map(l => <option key={l.ID} value={l.ID}>{l.level} класс/курс</option>)}
        </select>
      </div>

            {!filters.grade_level || !filters.subject_id ? (
        <div style={styles.emptyState}>
          <Info size={40} color="#cbd5e1" />
          <p>Выберите класс и предмет для начала работы</p>
        </div>
      ) : (

<div style={styles.list}>
        {topics.map((topic, index) => (
          <div key={topic.ID}>
            {editingId === topic.ID ? (
              /* ФОРМА РЕДАКТИРОВАНИЯ */
              <form onSubmit={handleUpdate} style={styles.addForm}>
                <input 
                  value={editFormData.title}
                  onChange={e => setEditFormData({...editFormData, title: e.target.value})}
                  style={styles.input} required placeholder="Название темы"
                />
                <textarea 
                  value={editFormData.description}
                  onChange={e => setEditFormData({...editFormData, description: e.target.value})}
                  style={styles.input} placeholder="Описание"
                />
                <input 
                  type="number"
                  value={editFormData.hours_allocated}
                  onChange={e => setEditFormData({...editFormData, hours_allocated: e.target.value})}
                  style={{ ...styles.input, width: '100px' }}
                />
                <div style={styles.btnGroup}>
                  <button type="submit" style={styles.btnSave}><Check size={16}/> Обновить</button>
                  <button type="button" onClick={() => setEditingId(null)} style={styles.btnCancel}><X size={16}/> Отмена</button>
                </div>
              </form>
            ) : (
              /* КАРТОЧКА ТЕМЫ */
              <div style={styles.card}>
                <div style={styles.cardHeader}>
                  <span style={styles.badge}>Тема №{index + 1}</span>
                  <span style={styles.hours}><Clock size={14}/> {topic.hours_allocated} ч.</span>
                  <div style={styles.actions}>
                    <Edit2 size={18} color="#3b82f6" style={{cursor: 'pointer'}} onClick={() => startEdit(topic)} />
                    <Trash2 size={18} color="#ef4444" style={{cursor: 'pointer'}} onClick={() => handleDelete(topic.ID)} />
                  </div>
                </div>
                <h3 style={styles.cardTitle}>{topic.title}</h3>
                <p style={styles.cardDesc}>{topic.description}</p>
              </div>
            )}
          </div>
        ))}

        {/* Добавление новой темы */}
        {isAdding ? (
          <form onSubmit={handleSaveNew} style={styles.addForm}>
            <h4>Новая тема</h4>
            <input 
              placeholder="Название темы" value={newTopic.title}
              onChange={e => setNewTopic({...newTopic, title: e.target.value})} 
              required style={styles.input}
            />
            <textarea 
              placeholder="Описание темы" value={newTopic.description}
              onChange={e => setNewTopic({...newTopic, description: e.target.value})}
              style={styles.input}
            />
            <input 
              type="number" value={newTopic.hours_allocated}
              onChange={e => setNewTopic({...newTopic, hours_allocated: e.target.value})}
              style={{ ...styles.input, width: '100px' }}
            />
            <div style={styles.btnGroup}>
              <button type="submit" style={styles.btnSave}>Сохранить</button>
              <button type="button" onClick={() => setIsAdding(false)} style={styles.btnCancel}>Отмена</button>
            </div>
          </form>
        ) : (
          filters.subject_id && filters.grade_level && (
            <button onClick={() => setIsAdding(true)} style={styles.btnAdd}>
              <Plus size={20} /> Добавить новую тему
            </button>
          )
        )}
      </div>
      )}
    </div>
  );
};


const styles = {
  container: { padding: '24px', maxWidth: '900px', margin: '0 auto' },
  title: { display: 'flex', alignItems: 'center', gap: '12px', color: '#1e293b' },

filterBar: { display: 'flex', gap: '12px', marginBottom: '30px', background: '#f8fafc', padding: '15px', borderRadius: '12px' },
  select: { padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', flex: 1, outline: 'none' },
  list: { display: 'flex', flexDirection: 'column', gap: '16px' },
  card: { padding: '20px', borderRadius: '12px', background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
  cardHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' },
  actions: { marginLeft: 'auto', display: 'flex', gap: '12px' },
  badge: { background: '#f1f5f9', color: '#475569', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' },
  hours: { fontSize: '13px', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '5px' },
  cardTitle: { margin: '0 0 8px 0', fontSize: '18px', color: '#1e293b' },
  cardDesc: { color: '#64748b', margin: 0, fontSize: '14px', lineHeight: '1.5' },
  btnAdd: { padding: '20px', border: '2px dashed #e2e8f0', borderRadius: '12px', background: '#fff', cursor: 'pointer', color: '#94a3b8', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', transition: 'all 0.2s' },
  addForm: { display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #3b82f6' },
  input: { padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' },
  btnGroup: { display: 'flex', gap: '10px', marginTop: '10px' },
  btnSave: { background: '#3b82f6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' },
  btnCancel: { background: '#e2e8f0', color: '#475569', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' },
  emptyState: { textAlign: 'center', padding: '100px 0', color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px'}
};

export default TopicsPage;
