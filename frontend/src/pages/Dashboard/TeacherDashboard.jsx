/* eslint-disable no-unused-vars */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { Calendar, ClipboardList, BookOpen } from 'lucide-react';
import { getUser } from '../../utils/auth';

function todayStr() { return new Date().toISOString().split('T')[0]; }

export default function TeacherDashboard() {
  const [todayLessons, setTodayLessons] = useState([]);
  const [recentHomework, setRecentHomework] = useState([]);
  const today = todayStr();

  useEffect(() => {
    // Уроки сегодня
    api.get('/api/schedule/teacher-view', { params: { startDate: today, endDate: today } })
      .then(r => setTodayLessons(r.data))
      .catch(() => {});
  }, [today]);

  return (
    <div style={{ padding: 28 }}>
      <h2 style={h2}>Добрый день!</h2>
      <p style={{ color: '#64748b', marginBottom: 28 }}>Ваше расписание на сегодня — {new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Сегодняшние уроки */}
        <div style={card}>
          <div style={cardHead}><Calendar size={16}/> Уроки сегодня</div>
          {todayLessons.length === 0
            ? <div style={empty}>Уроков нет</div>
            : todayLessons.map(l => (
              <div key={l.ID} style={row}>
                <span style={num}>{l.lesson_num}</span>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{l.subject_name}</div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{l.class_name} · каб. {l.room || '?'}</div>
                  {l.start_time && <div style={{ fontSize: 11, color: '#94a3b8' }}>{l.start_time}</div>}
                </div>
                {!l.homework_content && (
                  <Link to="/schedule" style={{ marginLeft: 'auto', fontSize: 12, color: '#3b82f6' }}>+ ДЗ</Link>
                )}
              </div>
            ))
          }
          <Link to="/schedule" style={seeAll}>Всё расписание →</Link>
        </div>

        {/* Быстрые ссылки */}
        <div style={card}>
          <div style={cardHead}><BookOpen size={16}/> Быстрые действия</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
            <Link to="/journal"  style={actionLink}><ClipboardList size={15}/> Открыть журнал</Link>
            <Link to="/schedule" style={actionLink}><Calendar size={15}/>      Моё расписание</Link>
            <Link to="/planning" style={actionLink}><BookOpen size={15}/>      Учебный план</Link>
            {/* Отчёты только если есть право */}
          </div>
        </div>
      </div>
    </div>
  );
}

const h2 = { margin: '0 0 8px', fontSize: 24, fontWeight: 700, color: '#0f172a' };
const card = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 0 };
const cardHead = { fontWeight: 600, fontSize: 14, color: '#334155', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, paddingBottom: 10, borderBottom: '1px solid #f1f5f9' };
const row = { display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: '1px solid #f9fafb' };
const num = { background: '#f1f5f9', borderRadius: 6, padding: '2px 8px', fontSize: 12, fontWeight: 700, color: '#475569', flexShrink: 0 };
const empty = { padding: '20px 0', textAlign: 'center', color: '#94a3b8', fontSize: 13 };
const seeAll = { marginTop: 10, fontSize: 13, color: '#3b82f6', textDecoration: 'none', fontWeight: 500 };
const actionLink = { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#f8fafc', borderRadius: 8, textDecoration: 'none', color: '#334155', fontWeight: 500, fontSize: 14 };
