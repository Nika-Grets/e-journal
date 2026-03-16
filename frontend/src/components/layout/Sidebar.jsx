/* eslint-disable no-unused-vars */
// Боковое меню приложения с возможностью свернуть до иконок.
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  LogOut, LayoutDashboard, Calendar, BookOpen,
  Users, BarChart2, Settings, ClipboardList,
  GraduationCap, BookMarked, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useCurrentUser } from '../ui/PermGuard';
import { can, canAny, canManageSchedule } from '../../utils/auth';
import UserBadge from '../users/UserBadge';


function NavItem({ to, icon: Icon, label, collapsed }) {
  const loc    = useLocation();
  const active = loc.pathname === to;
  return (
    <li title={collapsed ? label : undefined}>
      <Link to={to} style={{
        display: 'flex', alignItems: 'center',
        gap: collapsed ? 0 : 10,
        justifyContent: collapsed ? 'center' : 'flex-start',
        padding: collapsed ? '10px 0' : '9px 12px',
        borderRadius: 8, textDecoration: 'none',
        background: active ? '#e0f2fe' : 'transparent',
        color:      active ? '#0284c7' : '#334155',
        fontWeight: active ? 600 : 400,
        fontSize: 14, transition: 'background .15s',
      }}>
        <Icon size={17}/>
        {!collapsed && <span>{label}</span>}
      </Link>
    </li>
  );
}

export default function Sidebar() {
  const navigate   = useNavigate();
  const user       = useCurrentUser();
  const roleName   = user?.role_name || 'USER';
  const [collapsed, setCollapsed] = useState(false);

  const showJournal = can('grades:write') && !canManageSchedule();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
    window.location.reload();
  };

  const width = collapsed ? 64 : 230;

  return (
    <div style={{
      width, minWidth: width, background: '#fff', borderRight: '1px solid #e2e8f0',
      height: '100vh', position: 'sticky', top: 0,
      display: 'flex', flexDirection: 'column',
      padding: '16px 8px', gap: 8, flexShrink: 0,
      transition: 'width 0.2s, min-width 0.2s',
      overflow: 'hidden',
    }}>
      {/* Лого + кнопка свернуть */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        padding: '4px 4px 12px', borderBottom: '1px solid #f1f5f9',
      }}>
        {!collapsed && (
          <span style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', letterSpacing: -1 }}>
            ЭлЖур
          </span>
        )}
        <button
          onClick={() => setCollapsed(v => !v)}
          title={collapsed ? 'Развернуть' : 'Свернуть'}
          style={{
            background: '#f1f5f9', border: 'none', borderRadius: 6,
            cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', padding: '4px', color: '#64748b',
            flexShrink: 0,
          }}
        >
          {collapsed ? <ChevronRight size={16}/> : <ChevronLeft size={16}/>}
        </button>
      </div>

      {/* Информация о пользователе */}
      {!collapsed && (
        <div style={{ padding: '10px 8px', borderRadius: 10, background: '#f8fafc' }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a', marginBottom: 4, marginLeft: 6, }}>
            {user?.last_name} {user?.first_name}
          </div>
          <UserBadge role={roleName}/>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
          </div>
        </div>
      )}
      {collapsed && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', background: '#e0f2fe',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: '#0284c7',
          }} title={`${user?.last_name} ${user?.first_name}`}>
            {(user?.last_name?.[0] || '') + (user?.first_name?.[0] || '')}
          </div>
        </div>
      )}

      {/* Навигация */}
      <nav style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <NavItem to="/"         icon={LayoutDashboard} label="Главная"        collapsed={collapsed}/>

          {canAny('schedule:view', 'schedule:manage') &&
            <NavItem to="/schedule" icon={Calendar}       label="Расписание"     collapsed={collapsed}/>}

          {showJournal &&
            <NavItem to="/journal"  icon={ClipboardList}  label="Журнал"         collapsed={collapsed}/>}

          {can('grades:read_own') &&
            <NavItem to="/grades"   icon={GraduationCap}  label="Оценки"         collapsed={collapsed}/>}

          {canAny('topics:manage_self', 'topics:manage_all') &&
            <NavItem to="/planning" icon={BookOpen}        label="Учебный план"   collapsed={collapsed}/>}

          {canAny('reports:full', 'reports:class') &&
            <NavItem to="/reports"  icon={BarChart2}       label="Отчёты"         collapsed={collapsed}/>}

          {can('users:manage') && <>
            <NavItem to="/users"    icon={Users}           label="Пользователи"   collapsed={collapsed}/>
            <NavItem to="/subjects" icon={BookMarked}      label="Предметы"       collapsed={collapsed}/>
            <NavItem to="/admin"    icon={Settings}        label="Настройки"      collapsed={collapsed}/>
          </>}
        </ul>

        <button
          onClick={handleLogout}
          title={collapsed ? 'Выйти' : undefined}
          style={{
            display: 'flex', gap: collapsed ? 0 : 10,
            justifyContent: collapsed ? 'center' : 'flex-start',
            padding: collapsed ? '10px 0' : '8px 14px',
            marginTop: 8, width: '100%',
            borderRadius: 8, border: 'none', background: 'none',
            cursor: 'pointer', color: '#ef4444',
          }}
        >
          <LogOut size={16}/>
          {!collapsed && <span>Выйти</span>}
        </button>
      </nav>
    </div>
  );
}
