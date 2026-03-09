import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { Calendar, Star, ClipboardList } from 'lucide-react';
import { getUser } from '../../utils/auth';

function todayStr() { return new Date().toISOString().split('T')[0]; }

export default function StudentDashboard() {
  const [todayLessons, setTodayLessons] = useState([]);
  const [recentGrades, setRecentGrades] = useState([]);
  const [classId, setClassId] = useState(null);
  const user = getUser();
  const today = todayStr();

  useEffect(() => {
    // Получаем класс студента
    api.get('/api/users').then(r => {
      const me = r.data.find(u => u.ID === user?.id);
      if (me?.class_id) {
        setClassId(me.class_id);
      }
    }).catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    if (!classId) return;
    api.get('/api/schedule', { params: { class_id: classId, startDate: today, endDate: today } })
      .then(r => setTodayLessons(r.data))
      .catch(() => {});
    // Последние оценки
    api.get('/api/grades/recent', { params: { student_id: user?.id } })
      .then(r => setRecentGrades(r.data || []))
      .catch(() => {});
  }, [classId, today, user?.id]);

  return (
    <div style={{ padding: 28 }}>
      <h2 style={h2}>Привет!</h2>
      <p style={{ color: '#64748b', marginBottom: 28 }}>
        {new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Уроки сегодня */}
        <div style={card}>
          <div style={cardHead}><Calendar size={16}/> Расписание на сегодня</div>
          {todayLessons.length === 0
            ? <div style={empty}>Уроков нет</div>
            : todayLessons.map(l => (
              <div key={l.ID} style={row}>
                <span style={num}>{l.lesson_num}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{l.subject_name || '—'}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    {l.teacher_name} · {l.room ? `каб. ${l.room}` : ''}
                  </div>
                  {l.homework_content && (
                    <div style={{ marginTop: 4, fontSize: 12, color: '#059669', background: '#ecfdf5', borderRadius: 5, padding: '3px 8px' }}>
                      ДЗ: {l.homework_content.slice(0, 50)}{l.homework_content.length > 50 ? '...' : ''}
                    </div>
                  )}
                </div>
              </div>
            ))
          }
          <Link to="/schedule" style={seeAll}>Всё расписание →</Link>
        </div>

        {/* Последние оценки */}
        <div style={card}>
          <div style={cardHead}><Star size={16}/> Последние оценки</div>
          {recentGrades.length === 0
            ? <div style={empty}>Оценок пока нет</div>
            : recentGrades.slice(0, 8).map((g, i) => (
              <div key={i} style={row}>
                <span style={{
                  ...num,
                  background: g.value >= 4 ? '#dcfce7' : g.value >= 3 ? '#fef3c7' : '#fef2f2',
                  color: g.value >= 4 ? '#166534' : g.value >= 3 ? '#92400e' : '#dc2626',
                  minWidth: 32, textAlign: 'center', fontWeight: 700, fontSize: 16,
                }}>{g.value}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{g.subject_name}</div>
                  <div style={{ fontSize: 12, color: '#94a3b8' }}>{new Date(g.date).toLocaleDateString('ru-RU')}</div>
                </div>
              </div>
            ))
          }
          <Link to="/grades" style={seeAll}>Все оценки →</Link>
        </div>
      </div>
    </div>
  );
}

const h2 = { margin: '0 0 8px', fontSize: 24, fontWeight: 700, color: '#0f172a' };
const card = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column' };
const cardHead = { fontWeight: 600, fontSize: 14, color: '#334155', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #f1f5f9' };
const row = { display: 'flex', alignItems: 'flex-start', gap: 12, padding: '8px 0', borderBottom: '1px solid #f9fafb' };
const num = { background: '#f1f5f9', borderRadius: 6, padding: '3px 8px', fontSize: 12, fontWeight: 700, color: '#475569', flexShrink: 0 };
const empty = { padding: '24px 0', textAlign: 'center', color: '#94a3b8', fontSize: 13 };
const seeAll = { marginTop: 10, fontSize: 13, color: '#3b82f6', textDecoration: 'none', fontWeight: 500 };
