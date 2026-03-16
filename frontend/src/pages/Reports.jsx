// Страница отчётов — точка сборки подотчётов.
import React, { useState, useEffect } from 'react';
import { BarChart2, BookOpen, Users, ClipboardList } from 'lucide-react';
import api from '../api/axios';
import Tabs from '../components/ui/Tabs';
import GradesReport      from '../components/reports/GradesReport';
import AttendanceReport  from '../components/reports/AttendanceReport';
import TeacherLoadReport from '../components/reports/TeacherLoadReport';
import CurriculumReport  from '../components/reports/CurriculumReport';

const TABS = [
  { key: 'grades',     label: 'Успеваемость',      icon: <BookOpen      size={16}/> },
  { key: 'attendance', label: 'Посещаемость',       icon: <Users         size={16}/> },
  { key: 'load',       label: 'Нагрузка учителей',  icon: <BarChart2     size={16}/> },
  { key: 'curriculum', label: 'Учебный план',        icon: <ClipboardList size={16}/> },
];

export default function ReportsPage() {
  const [tab,      setTab]      = useState('grades');
  const [classes,  setClasses]  = useState([]);
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    Promise.all([api.get('/api/classes'), api.get('/api/subjects')]).then(([c, s]) => {
      setClasses(c.data);
      setSubjects(s.data);
    });
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h2 style={{ margin: '0 0 20px', fontSize: 22, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 10 }}>
        <BarChart2 size={22}/> Отчёты
      </h2>

      <Tabs tabs={TABS} active={tab} onChange={setTab}/>

      {tab === 'grades'     && <GradesReport      classes={classes} subjects={subjects}/>}
      {tab === 'attendance' && <AttendanceReport  classes={classes}/>}
      {tab === 'load'       && <TeacherLoadReport/>}
      {tab === 'curriculum' && <CurriculumReport  classes={classes}/>}
    </div>
  );
}
