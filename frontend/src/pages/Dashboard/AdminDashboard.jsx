/* eslint-disable no-unused-vars */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { Users, BookMarked, Calendar, BarChart2, AlertTriangle } from 'lucide-react';

function StatCard({ label, value, icon: Icon, color, to }) {
  const inner = (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
      padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16,
      boxShadow: '0 1px 3px rgba(0,0,0,.04)', transition: 'box-shadow .15s',
      textDecoration: 'none', color: 'inherit' }}>
      <div style={{ background: color + '20', borderRadius: 10, padding: 12 }}>
        <Icon size={22} color={color}/>
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 700, color: '#0f172a' }}>{value ?? '—'}</div>
        <div style={{ fontSize: 13, color: '#64748b' }}>{label}</div>
      </div>
    </div>
  );
  return to ? <Link to={to} style={{ textDecoration: 'none' }}>{inner}</Link> : inner;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({});

  useEffect(() => {
    Promise.all([
      api.get('/api/users'),
      api.get('/api/classes'),
      api.get('/api/subjects'),
    ]).then(([u, c, s]) => setStats({
      users:    u.data.length,
      classes:  c.data.length,
      subjects: s.data.length,
    })).catch(() => {});
  }, []);

  return (
    <div style={{ padding: 28 }}>
      <h2 style={h2}>Добро пожаловать в ЭлЖур</h2>
      <p style={{ color: '#64748b', marginBottom: 28 }}>Панель администратора</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
        <StatCard label="Пользователей" value={stats.users}    icon={Users}       color="#3b82f6" to="/users"/>
        <StatCard label="Классов"       value={stats.classes}  icon={Calendar}    color="#10b981" to="/users"/>
        <StatCard label="Предметов"     value={stats.subjects} icon={BookMarked}  color="#8b5cf6" to="/subjects"/>
        <StatCard label="Отчёты"        value="→"              icon={BarChart2}   color="#f59e0b" to="/reports"/>
      </div>

      <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <AlertTriangle size={18} color="#d97706" style={{ flexShrink: 0, marginTop: 2 }}/>
        <div>
          <div style={{ fontWeight: 600, color: '#92400e', marginBottom: 4 }}>Быстрые действия</div>
          <div style={{ fontSize: 13, color: '#78350f', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <Link to="/users"    style={ql}>Добавить пользователя</Link>
            <Link to="/subjects" style={ql}>Добавить предмет</Link>
            <Link to="/schedule" style={ql}>Составить расписание</Link>
            <Link to="/admin"    style={ql}>Настройки звонков</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

const h2 = { margin: '0 0 8px', fontSize: 24, fontWeight: 700, color: '#0f172a' };
const ql = { color: '#d97706', fontWeight: 600, fontSize: 13 };
