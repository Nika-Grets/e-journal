import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { Users, Calendar, Star } from 'lucide-react';
import { getUser } from '../../utils/auth';

function todayStr() { return new Date().toISOString().split('T')[0]; }

export default function ParentDashboard() {
  const user = getUser();
  const today = todayStr();
  const [children, setChildren] = useState([]);
  const [selected, setSelected] = useState(null); // { ID, name, class_id }
  const [todayLessons, setTodayLessons] = useState([]);
  const [recentGrades, setRecentGrades] = useState([]);

  useEffect(() => {
    if (!user?.id) return;
    api.get(`/api/classes/parent-children/${user.id}`).then(r => {
      setChildren(r.data);
      if (r.data.length > 0) setSelected(r.data[0]);
    }).catch(() => {});
  }, [user?.id]);

  useEffect(() => {
    if (!selected?.class_id) return;
    api.get('/api/schedule', { params: { class_id: selected.class_id, startDate: today, endDate: today } })
      .then(r => setTodayLessons(r.data)).catch(() => {});
    api.get('/api/grades/recent', { params: { student_id: selected.ID } })
      .then(r => setRecentGrades(r.data || [])).catch(() => {});
  }, [selected, today]);

  if (children.length === 0) {
    return (
      <div style={{ padding: 28 }}>
        <h2 style={h2}>Личный кабинет родителя</h2>
        <div style={emptyBlock}>
          <Users size={40} color="#cbd5e1"/>
          <p>Дети не привязаны к аккаунту.<br/>Обратитесь к администратору школы.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 28 }}>
      <h2 style={h2}>Личный кабинет родителя</h2>

      {/* Переключатель детей */}
      {children.length > 1 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
          {children.map(ch => (
            <button key={ch.ID} onClick={() => setSelected(ch)}
              style={{ padding: '8px 18px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 14,
                background: selected?.ID === ch.ID ? '#3b82f6' : '#f1f5f9',
                color: selected?.ID === ch.ID ? '#fff' : '#334155', fontWeight: selected?.ID === ch.ID ? 600 : 400 }}>
              {ch.last_name} {ch.first_name} ({ch.class_name || '?'})
            </button>
          ))}
        </div>
      )}

      <p style={{ color: '#64748b', marginBottom: 20 }}>
        {selected?.last_name} {selected?.first_name} · класс {selected?.class_name || '—'} ·{' '}
        {new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={card}>
          <div style={cardHead}><Calendar size={16}/> Уроки сегодня</div>
          {todayLessons.length === 0
            ? <div style={empty}>Уроков нет</div>
            : todayLessons.map(l => (
              <div key={l.ID} style={row}>
                <span style={numStyle}>{l.lesson_num}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{l.subject_name || '—'}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{l.teacher_name}</div>
                  {l.homework_content && (
                    <div style={{ marginTop: 4, fontSize: 12, color: '#059669' }}>
                      ДЗ: {l.homework_content.slice(0, 60)}...
                    </div>
                  )}
                </div>
              </div>
            ))
          }
          <Link to="/schedule" style={seeAll}>Всё расписание →</Link>
        </div>

        <div style={card}>
          <div style={cardHead}><Star size={16}/> Последние оценки</div>
          {recentGrades.length === 0
            ? <div style={empty}>Нет данных</div>
            : recentGrades.slice(0, 8).map((g, i) => (
              <div key={i} style={row}>
                <span style={{
                  ...numStyle, minWidth: 32, textAlign: 'center', fontSize: 16, fontWeight: 700,
                  background: g.value >= 4 ? '#dcfce7' : g.value >= 3 ? '#fef3c7' : '#fef2f2',
                  color: g.value >= 4 ? '#166534' : g.value >= 3 ? '#92400e' : '#dc2626',
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
const numStyle = { background: '#f1f5f9', borderRadius: 6, padding: '3px 8px', fontSize: 12, fontWeight: 700, color: '#475569', flexShrink: 0 };
const empty = { padding: '24px 0', textAlign: 'center', color: '#94a3b8', fontSize: 13 };
const emptyBlock = { textAlign: 'center', padding: '80px 0', color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 };
const seeAll = { marginTop: 10, fontSize: 13, color: '#3b82f6', textDecoration: 'none', fontWeight: 500 };
