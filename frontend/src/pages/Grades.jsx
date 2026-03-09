/* eslint-disable react-hooks/rules-of-hooks */

// просмотр оценок для ученика и родителя
import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import { canReadOwnGrades, getUser, getRoleName } from '../utils/auth';
import { NoAccess } from '../components/ui/PermGuard';
import { Star, BookOpen } from 'lucide-react';

// Бэкенд: GET /api/grades/student/:studentId
// Возвращает [{ subject_name, lesson_date, value, topic_title }]

function GradeCell({ value }) {
  const color = value >= 5 ? '#166534' : value >= 4 ? '#059669' : value >= 3 ? '#d97706' : '#dc2626';
  const bg    = value >= 5 ? '#dcfce7' : value >= 4 ? '#ecfdf5' : value >= 3 ? '#fffbeb' : '#fef2f2';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 32, height: 32, borderRadius: 8, background: bg, color, fontWeight: 700, fontSize: 15 }}>
      {value}
    </span>
  );
}

function SubjectGrades({ name, grades }) {
  const avg = grades.length ? (grades.reduce((s, g) => s + Number(g.value), 0) / grades.length).toFixed(2) : null;
  const [open, setOpen] = useState(false);

  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden', marginBottom: 10 }}>
      <div onClick={() => setOpen(v => !v)}
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
          background: '#f8fafc', cursor: 'pointer', userSelect: 'none' }}>
        <BookOpen size={15} color="#64748b"/>
        <span style={{ fontWeight: 600, flex: 1, fontSize: 15, color: '#0f172a' }}>{name}</span>
        <span style={{ fontSize: 13, color: '#64748b' }}>{grades.length} оц.</span>
        {avg && <GradeCell value={parseFloat(avg)}/>}
        {avg && <span style={{ fontSize: 12, color: '#64748b' }}>avg {avg}</span>}
        <span style={{ fontSize: 12, color: '#94a3b8' }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div style={{ padding: '10px 16px 16px', display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {grades.map((g, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <GradeCell value={g.value}/>
              <div style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', maxWidth: 70 }}>
                {new Date(g.lesson_date || g.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
              </div>
              {g.topic_title && (
                <div style={{ fontSize: 10, color: '#3b82f6', maxWidth: 70, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={g.topic_title}>
                  {g.topic_title}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function GradesPage() {
  if (!canReadOwnGrades()) return <NoAccess/>;

  const user = getUser();
  const isParent = getRoleName() === 'PARENT';

  const [children, setChildren] = useState([]);
  const [studentId, setStudentId] = useState(null);
  const [grouped, setGrouped] = useState({});
  const [loading, setLoading] = useState(false);

  // Для родителя — грузим детей
  useEffect(() => {
    if (isParent) {
      api.get(`/api/classes/parent-children/${user.id}`).then(r => {
        setChildren(r.data);
        if (r.data.length > 0) setStudentId(r.data[0].ID);
      });
    } else {
      setStudentId(user.id);
    }
  }, [isParent, user.id]);

  const loadGrades = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    try {
      const r = await api.get(`/api/grades/student/${studentId}`);
      // Группируем по предмету
      const grp = {};
      for (const g of r.data) {
        if (!grp[g.subject_name]) grp[g.subject_name] = [];
        grp[g.subject_name].push(g);
      }
      setGrouped(grp);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => { loadGrades(); }, [loadGrades]);

  const subjects = Object.keys(grouped).sort();

  return (
    <div style={{ padding: 24, maxWidth: 860, margin: '0 auto' }}>
      <h2 style={{ margin: '0 0 20px', fontSize: 22, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 10 }}>
        <Star size={22}/> Оценки
      </h2>

      {isParent && children.length > 1 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {children.map(ch => (
            <button key={ch.ID} onClick={() => setStudentId(ch.ID)}
              style={{ padding: '8px 18px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 14,
                background: studentId === ch.ID ? '#3b82f6' : '#f1f5f9',
                color: studentId === ch.ID ? '#fff' : '#334155', fontWeight: studentId === ch.ID ? 600 : 400 }}>
              {ch.last_name} {ch.first_name}
            </button>
          ))}
        </div>
      )}

      {loading && <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>Загрузка...</div>}

      {!loading && subjects.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>Оценок пока нет</div>
      )}

      {subjects.map(name => (
        <SubjectGrades key={name} name={name} grades={grouped[name]}/>
      ))}
    </div>
  );
}
