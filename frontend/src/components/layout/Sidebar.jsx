/* eslint-disable no-unused-vars */

import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, LayoutDashboard, Calendar, BookOpen, Users, BarChart2,
  Settings, ClipboardList, GraduationCap, BookMarked } from 'lucide-react';
import { useCurrentUser } from '../ui/PermGuard';
import { can, canAny, getViewMode } from '../../utils/auth';

const ROLE_LABELS = {
  ADMIN: 'Администратор', TEACHER: 'Учитель',
  STUDENT: 'Ученик',     PARENT:  'Родитель',
};
const ROLE_COLORS = {
  ADMIN: '#fef3c7',  TEACHER: '#dbeafe',
  STUDENT: '#dcfce7', PARENT: '#f3e8ff',
};
const ROLE_TEXT = {
  ADMIN: '#92400e', TEACHER: '#1d4ed8',
  STUDENT: '#166534', PARENT: '#7e22ce',
};

function NavItem({ to, icon: Icon, label }) {
  const loc = useLocation();
  const active = loc.pathname === to;
  return (
    <li>
      <Link to={to} style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
        borderRadius: 8, textDecoration: 'none',
        background: active ? '#e0f2fe' : 'transparent',
        color: active ? '#0284c7' : '#334155',
        fontWeight: active ? 600 : 400, fontSize: 14,
        transition: 'background .15s',
      }}>
        <Icon size={17}/> {label}
      </Link>
    </li>
  );
}

export default function Sidebar() {
  const navigate = useNavigate();
  const user     = useCurrentUser();
  const roleName = user?.role_name || 'USER';
  const mode     = getViewMode();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
    window.location.reload();
  };

  return (
    <div style={{ width: 230, background: '#fff', borderRight: '1px solid #e2e8f0',
      height: '100vh', position: 'sticky', top: 0, display: 'flex',
      flexDirection: 'column', padding: '16px 12px', gap: 8, flexShrink: 0 }}>

      {/* Logo */}
      <div style={{ padding: '4px 8px 12px', borderBottom: '1px solid #f1f5f9' }}>
        <span style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', letterSpacing: -1 }}>ЭлЖур</span>
      </div>

      {/* User info */}
      <div style={{ padding: '10px 8px', borderRadius: 10, background: '#f8fafc' }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a', marginBottom: 4 }}>
          {user?.last_name} {user?.first_name}
        </div>
        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10,
          background: ROLE_COLORS[roleName] || '#f1f5f9',
          color: ROLE_TEXT[roleName] || '#475569', fontWeight: 600 }}>
          {ROLE_LABELS[roleName] || roleName}
        </span>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, overflowY: 'auto' }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>

          <NavItem to="/" icon={LayoutDashboard} label="Главная"/>

          {canAny('schedule:view', 'schedule:manage') &&
            <NavItem to="/schedule" icon={Calendar} label="Расписание"/>}

          {can('grades:write') &&
            <NavItem to="/journal" icon={ClipboardList} label="Журнал"/>}

          {can('grades:read_own') &&
            <NavItem to="/grades" icon={GraduationCap} label="Оценки"/>}

          {canAny('topics:manage_self', 'topics:manage_all') &&
            <NavItem to="/planning" icon={BookOpen} label="Учебный план"/>}

          {canAny('reports:full', 'reports:class') &&
            <NavItem to="/reports" icon={BarChart2} label="Отчёты"/>}

          {can('users:manage') && <>
            <NavItem to="/users"    icon={Users}    label="Пользователи"/>
            <NavItem to="/subjects" icon={BookMarked} label="Предметы"/>
            <NavItem to="/admin" icon={Settings} label="Настройки"/>
          </>}

                  {/* Logout */}
            <button onClick={handleLogout}
            style={{ display: 'flex', gap: 10, padding: '8px 14px',
            borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer',
            color: '#ef4444'}}>
        <LogOut size={16}/> Выйти
      </button>
        </ul>
      </nav>
    </div>
  );
}
