import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { BarChart2, Download, Users, BookOpen, Calendar, RefreshCw } from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'grades',    label: 'Успеваемость',    icon: <BookOpen size={16}/> },
  { key: 'attendance', label: 'Посещаемость',   icon: <Users size={16}/> },
  { key: 'load',      label: 'Нагрузка учителей', icon: <BarChart2 size={16}/> },
];

function exportCsv(data, filename) {
  if (!data || data.length === 0) return;
  const keys = Object.keys(data[0]);
  const csv = [keys.join(','), ...data.map(row => keys.map(k => `"${(row[k] ?? '').toString().replace(/"/g, '""')}"`).join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}

// ─── Grades Report ───────────────────────────────────────────────────────────

function GradesReport({ classes, subjects }) {
  const [filters, setFilters] = useState({ class_id: '', subject_id: '', startDate: '', endDate: '' });
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.class_id)   params.class_id   = filters.class_id;
      if (filters.subject_id) params.subject_id  = filters.subject_id;
      if (filters.startDate)  params.startDate   = filters.startDate;
      if (filters.endDate)    params.endDate     = filters.endDate;
      const r = await api.get('/api/users/reports/grades', { params });
      setData(r.data);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const avgColor = (avg) => {
    if (!avg) return '#94a3b8';
    const v = Number(avg);
    if (v >= 4.5) return '#10b981';
    if (v >= 3.5) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <>
      <div style={filterBar}>
        <select value={filters.class_id} onChange={e => setFilters(f => ({ ...f, class_id: e.target.value }))} style={sel}>
          <option value="">Все классы</option>
          {classes.map(c => <option key={c.ID} value={c.ID}>{c.level}{c.letter}</option>)}
        </select>
        <select value={filters.subject_id} onChange={e => setFilters(f => ({ ...f, subject_id: e.target.value }))} style={sel}>
          <option value="">Все предметы</option>
          {subjects.map(s => <option key={s.ID} value={s.ID}>{s.name}</option>)}
        </select>
        <input type="date" value={filters.startDate} onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))} style={inp} placeholder="Начало"/>
        <input type="date" value={filters.endDate} onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))} style={inp} placeholder="Конец"/>
        <button onClick={load} disabled={loading} style={btnBlue}>
          {loading ? <RefreshCw size={15} className="spin"/> : 'Применить'}
        </button>
        <button onClick={() => exportCsv(data, 'grades_report.csv')} style={btnGray} disabled={data.length === 0}>
          <Download size={15}/> CSV
        </button>
      </div>

      <div style={tableWrap}>
        <table style={tbl}>
          <thead>
            <tr style={thead}>
              <th style={th}>Ученик</th>
              <th style={th}>Класс</th>
              <th style={th}>Предмет</th>
              <th style={th}>Оценок</th>
              <th style={th}>Средний балл</th>
              <th style={th}>Пропусков</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={td}>{row.student_name}</td>
                <td style={td}>{row.class_name}</td>
                <td style={td}>{row.subject_name}</td>
                <td style={{ ...td, textAlign: 'center' }}>{row.grade_count}</td>
                <td style={{ ...td, textAlign: 'center' }}>
                  <span style={{ fontWeight: 700, color: avgColor(row.avg_grade) }}>
                    {row.avg_grade ? Number(row.avg_grade).toFixed(2) : '—'}
                  </span>
                </td>
                <td style={{ ...td, textAlign: 'center', color: row.absences > 5 ? '#ef4444' : '#1e293b' }}>
                  {row.absences || 0}
                </td>
              </tr>
            ))}
            {data.length === 0 && !loading && (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Нет данных. Нажмите «Применить» для загрузки.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ─── Attendance Report ────────────────────────────────────────────────────────

function AttendanceReport({ classes }) {
  const [filters, setFilters] = useState({ class_id: '', startDate: '', endDate: '' });
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.class_id)  params.class_id  = filters.class_id;
      if (filters.startDate) params.startDate  = filters.startDate;
      if (filters.endDate)   params.endDate    = filters.endDate;
      const r = await api.get('/api/users/reports/attendance', { params });
      setData(r.data);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  return (
    <>
      <div style={filterBar}>
        <select value={filters.class_id} onChange={e => setFilters(f => ({ ...f, class_id: e.target.value }))} style={sel}>
          <option value="">Все классы</option>
          {classes.map(c => <option key={c.ID} value={c.ID}>{c.level}{c.letter}</option>)}
        </select>
        <input type="date" value={filters.startDate} onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))} style={inp}/>
        <input type="date" value={filters.endDate} onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))} style={inp}/>
        <button onClick={load} disabled={loading} style={btnBlue}>{loading ? 'Загрузка...' : 'Применить'}</button>
        <button onClick={() => exportCsv(data, 'attendance_report.csv')} style={btnGray} disabled={data.length === 0}>
          <Download size={15}/> CSV
        </button>
      </div>

      <div style={tableWrap}>
        <table style={tbl}>
          <thead>
            <tr style={thead}>
              <th style={th}>Ученик</th>
              <th style={th}>Класс</th>
              <th style={th}>Всего уроков</th>
              <th style={th}>Пропусков</th>
              <th style={th}>% прогулов</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={td}>{row.student_name}</td>
                <td style={td}>{row.class_name}</td>
                <td style={{ ...td, textAlign: 'center' }}>{row.total_lessons}</td>
                <td style={{ ...td, textAlign: 'center' }}>{row.absences || 0}</td>
                <td style={{ ...td, textAlign: 'center' }}>
                  <span style={{ fontWeight: 600, color: Number(row.absence_pct) > 20 ? '#ef4444' : Number(row.absence_pct) > 10 ? '#f59e0b' : '#10b981' }}>
                    {row.absence_pct || 0}%
                  </span>
                </td>
              </tr>
            ))}
            {data.length === 0 && !loading && (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Нажмите «Применить» для загрузки</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ─── Teacher Load Report ──────────────────────────────────────────────────────

function TeacherLoadReport() {
  const [filters, setFilters] = useState({ startDate: '', endDate: '' });
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate)   params.endDate   = filters.endDate;
      const r = await api.get('/api/users/reports/teacher-load', { params });
      setData(r.data);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  return (
    <>
      <div style={filterBar}>
        <input type="date" value={filters.startDate} onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))} style={inp}/>
        <input type="date" value={filters.endDate} onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))} style={inp}/>
        <button onClick={load} disabled={loading} style={btnBlue}>{loading ? 'Загрузка...' : 'Применить'}</button>
        <button onClick={() => exportCsv(data, 'teacher_load_report.csv')} style={btnGray} disabled={data.length === 0}>
          <Download size={15}/> CSV
        </button>
      </div>

      <div style={tableWrap}>
        <table style={tbl}>
          <thead>
            <tr style={thead}>
              <th style={th}>Учитель</th>
              <th style={th}>Предмет</th>
              <th style={th}>Уроков</th>
              <th style={th}>Классов</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={td}>{row.teacher_name}</td>
                <td style={td}>{row.subject_name}</td>
                <td style={{ ...td, textAlign: 'center', fontWeight: 600 }}>{row.lesson_count}</td>
                <td style={{ ...td, textAlign: 'center' }}>{row.class_count}</td>
              </tr>
            ))}
            {data.length === 0 && !loading && (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Нажмите «Применить» для загрузки</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [tab, setTab] = useState('grades');
  const [classes, setClasses] = useState([]);
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

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: '2px solid #e2e8f0' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer',
              borderBottom: tab === t.key ? '2px solid #3b82f6' : '2px solid transparent',
              color: tab === t.key ? '#3b82f6' : '#64748b',
              fontWeight: tab === t.key ? 600 : 400, fontSize: 14,
              display: 'flex', alignItems: 'center', gap: 6, marginBottom: -2 }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'grades'     && <GradesReport classes={classes} subjects={subjects}/>}
      {tab === 'attendance' && <AttendanceReport classes={classes}/>}
      {tab === 'load'       && <TeacherLoadReport/>}
    </div>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────

const filterBar = { display: 'flex', gap: 10, alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', background: '#f8fafc', padding: 16, borderRadius: 10 };
const sel = { padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none', background: '#fff' };
const inp = { padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none' };
const btnBlue = { background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 };
const btnGray = { background: '#f1f5f9', color: '#475569', border: 'none', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 };
const tableWrap = { background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'auto' };
const tbl = { width: '100%', borderCollapse: 'collapse' };
const thead = { background: '#f8fafc', borderBottom: '2px solid #e2e8f0' };
const th = { padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: .4 };
const td = { padding: '12px 16px', fontSize: 14, color: '#1e293b' };
