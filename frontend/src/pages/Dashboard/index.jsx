// src/pages/Dashboard/index.jsx
import React from 'react';
import { getViewMode } from '../../utils/auth';
import AdminDashboard   from './AdminDashboard';
import TeacherDashboard from './TeacherDashboard';
import StudentDashboard from './StudentDashboard';
import ParentDashboard  from './ParentDashboard';

export default function Dashboard() {
  const mode = getViewMode();
  if (mode === 'admin')   return <AdminDashboard/>;
  if (mode === 'teacher') return <TeacherDashboard/>;
  if (mode === 'parent')  return <ParentDashboard/>;
  if (mode === 'student') return <StudentDashboard/>;
  return (
    <div style={{ padding: 28, textAlign: 'center', color: '#94a3b8' }}>
      Войдите в систему для просмотра
    </div>
  );
}
