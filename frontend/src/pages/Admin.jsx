
import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Save, Wand2, Clock, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

const ScheduleSettings = () => {
  const [schedule, setSchedule] = useState([]);
  const [config, setConfig] = useState({ max_lessons: 8, type: '45' });
  const [isSaving, setIsSaving] = useState(false); // Для Варианта 3 (Loading)
  const [message, setMessage] = useState(null);   // Для Варианта 2 (Toast)

  useEffect(() => {
    api.get('/api/settings/all').then(res => {
      const { schedule: sData, config: cData } = res.data;
      if (sData && sData.length > 0) {
        setSchedule(sData);
      } else {
        // Если база пуста, сразу генерируем сетку под дефолтное кол-во уроков
        adjustRows(8, []); 
      }
      if (cData) setConfig(cData);
    }).catch(() => setSchedule([]));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const adjustRows = (newMax, currentData = schedule) => {
    let current = [...currentData];
    if (current.length < newMax) {
      for (let i = current.length + 1; i <= newMax; i++) {
        current.push({ lesson_num: i, start_time: '08:00', duration: config.type, break_after: 10 });
      }
    } else {
      current = current.slice(0, newMax);
    }
    setSchedule(current);
  };

  const handleAutoCalculate = () => {
    if (schedule.length === 0) return;
    let newSchedule = [...schedule];
    let currentTime = newSchedule[0].start_time;

    newSchedule = newSchedule.map((item) => {
      const updated = { ...item, start_time: currentTime, duration: config.type };
      const [h, m] = currentTime.split(':').map(Number);
      const totalMins = h * 60 + m + Number(updated.duration) + Number(updated.break_after);
      currentTime = `${Math.floor(totalMins / 60).toString().padStart(2, '0')}:${(totalMins % 60).toString().padStart(2, '0')}`;
      return updated;
    });
    setSchedule(newSchedule);
  };

  const saveAll = async () => {
    setIsSaving(true);
    try {
      await api.post('/api/settings/save-all', { schedule, config });
      
      // Показываем уведомление об успехе
      setMessage({ text: 'Настройки успешно сохранены!', type: 'success' });
    } catch (err) {
      setMessage({ text: `Ошибка при сохранении в базу данных ${err}`, type: 'error' });
    } finally {
      setIsSaving(false);
      // Скрываем уведомление через 3 секунды
      setTimeout(() => setMessage(null), 3000);
    }
  };

  return (
    <div style={s.container}>
      {/* Всплывающее уведомление (Toast) */}
      {message && (
        <div style={{ ...s.toast, backgroundColor: message.type === 'success' ? '#10b981' : '#ef4444' }}>
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {message.text}
        </div>
      )}

      <div style={s.header}>
        <h3>Настройка звонков</h3>
        <div style={s.controls}>
          <div style={s.inputGroup}>
            <label>Уроков:</label>
            <input type="number" value={config.max_lessons} onChange={e => {
              const val = parseInt(e.target.value) || 1;
              setConfig({...config, max_lessons: val});
              adjustRows(val);
            }} style={s.miniInput} />
          </div>
          
          <select value={config.type} onChange={e => setConfig({...config, type: e.target.value})} style={s.select}>
            <option value="45">Урок (45 мин)</option>
            <option value="90">Пара (90 мин)</option>
          </select>

          <button onClick={handleAutoCalculate} style={s.btnMagic}><Wand2 size={16}/> Рассчитать</button>
          
          <button 
            onClick={saveAll} 
            disabled={isSaving} 
            style={isSaving ? { ...s.btnSave, opacity: 0.7, cursor: 'not-allowed' } : s.btnSave}
          >
            {isSaving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16}/>}
            {isSaving ? ' Сохранение...' : ' Сохранить'}
          </button>
        </div>
      </div>

<table style={s.table}>
        <thead>
          <tr style={s.thRow}>
            <th>№</th>
            <th>Начало</th>
            <th>Длительность</th>
            <th>Перемена (мин)</th>
          </tr>
        </thead>
        <tbody>
          {schedule.map((item, idx) => (
            <tr key={idx} style={s.tr}>
              <td>{item.lesson_num}</td>
              <td>
                <input type="time" value={item.start_time} onChange={e => {
                  const newSch = [...schedule];
                  newSch[idx].start_time = e.target.value;
                  setSchedule(newSch);
                }} style={s.tableInput}/>
              </td>
              <td>{item.duration} мин</td>
              <td>
                <input type="number" value={item.break_after} onChange={e => {
                  const newSch = [...schedule];
                  newSch[idx].break_after = e.target.value;
                  setSchedule(newSch);
                }} style={s.tableInput}/>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const s = {
  toast: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: 'white',
    padding: '12px 24px',
    borderRadius: '10px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    zIndex: 9999,
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.3s ease',
    animation: 'slideIn 0.3s ease-out'
  },
  btnSave: { 
    background: '#10b981', 
    color: '#fff', 
    border: 'none', 
    padding: '10px 20px', 
    borderRadius: '8px', 
    cursor: 'pointer', 
    display: 'flex', 
    alignItems: 'center', 
    gap: '8px',
    transition: 'background 0.2s'
  },
  container: { padding: '24px', background: '#fff', borderRadius: '15px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '20px' },
  controls: { display: 'flex', gap: '20px', alignItems: 'center' },
  inputGroup: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#64748b' },
  miniInput: { width: '50px', padding: '6px', borderRadius: '6px', border: '1px solid #e2e8f0' },
  select: { padding: '6px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f8fafc' },
  btnMagic: { background: '#8b5cf6', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  thRow: { textAlign: 'left', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase' },
  tableInput: { padding: '8px', border: '1px solid #f1f5f9', borderRadius: '4px', outline: 'none' }
};

export default ScheduleSettings;