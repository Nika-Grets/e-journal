/* eslint-disable no-empty */

import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Calendar, Paperclip, Info } from 'lucide-react';
import { getUser } from '../../utils/auth';
import { useWeek, useClassLessons, fmtDate } from './scheduleUtils';
import { WeekNav, DayCard } from './ScheduleUI';

function HomeworkBlock({ lesson }) {
  if (!lesson.homework_content) return null;
  let files = [];
  try { files = JSON.parse(lesson.homework_files || '[]'); } catch {}

  return (
    <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 6, padding: '6px 10px', fontSize: 12, marginTop: 4 }}>
      <strong>ДЗ:</strong> {lesson.homework_content}
      {lesson.homework_deadline && (
        <div style={{ color: '#92400e', marginTop: 2 }}>До: {fmtDate(lesson.homework_deadline)}</div>
      )}
      {files.map((f, i) => (
        <a key={i} href={f.url} target="_blank" rel="noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#3b82f6', marginTop: 2 }}>
          <Paperclip size={10}/> {f.name}
        </a>
      ))}
    </div>
  );
}

function ReadonlyLesson({ lesson }) {
  return (
    <div style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: 3 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={num}>{lesson.lesson_num}</span>
        {lesson.start_time && <span style={{ fontSize: 11, color: '#94a3b8' }}>{lesson.start_time}</span>}
        <span style={{ fontWeight: 600, fontSize: 14 }}>{lesson.subject_name || '—'}</span>
      </div>
      <div style={{ paddingLeft: 26, fontSize: 12, color: '#64748b' }}>
        {lesson.teacher_name}{lesson.room ? ` · каб. ${lesson.room}` : ''}
      </div>
      {lesson.topic_title && (
        <div style={{ paddingLeft: 26, fontSize: 12, color: '#3b82f6' }}>{lesson.topic_title}</div>
      )}
      <div style={{ paddingLeft: 26 }}><HomeworkBlock lesson={lesson}/></div>
    </div>
  );
}

export default function StudentScheduleView() {
  const user = getUser();
  const { weekDates, prev, next } = useWeek();
  const [classId, setClassId] = useState('');
  const [children, setChildren] = useState([]);
  const isParent = user?.role_id === 4;

  // Определяем classId: для ученика из профиля, для родителя из детей
  useEffect(() => {
    if (isParent) {
      api.get(`/api/classes/parent-children/${user.id}`).then(r => {
        setChildren(r.data);
        if (r.data[0]?.class_id) setClassId(String(r.data[0].class_id));
      });
    } else {
      api.get('/api/users').then(r => {
        const me = r.data.find(u => u.ID === user?.id);
        if (me?.class_id) setClassId(String(me.class_id));
      });
    }
  }, [user?.id, isParent]);

  const { lessons } = useClassLessons(classId, weekDates);

  return (
    <div style={{ padding: 24 }}>
      <WeekNav weekDates={weekDates} onPrev={prev} onNext={next}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Calendar size={20}/> Расписание
        </h2>
        {isParent && children.length > 1 && (
          <select value={classId} onChange={e => setClassId(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none' }}>
            {children.map(ch => (
              <option key={ch.ID} value={ch.class_id || ''}>{ch.last_name} {ch.first_name} ({ch.class_name || '?'})</option>
            ))}
          </select>
        )}
      </WeekNav>

      {!classId ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <Info size={40} color="#cbd5e1"/><p>Класс не назначен</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {weekDates.map((date, di) => {
            const dayLessons = lessons.filter(l => l.date === date).sort((a, b) => a.lesson_num - b.lesson_num);
            return (
              <DayCard key={date} date={date} dayIndex={di}>
                {dayLessons.length === 0
                  ? <div style={{ padding: '20px 12px', color: '#cbd5e1', fontSize: 13, textAlign: 'center' }}>—</div>
                  : dayLessons.map(l => <ReadonlyLesson key={l.ID} lesson={l}/>)
                }
              </DayCard>
            );
          })}
        </div>
      )}
    </div>
  );
}

const num = { background: '#f1f5f9', borderRadius: 6, padding: '2px 7px', fontSize: 11, fontWeight: 700, color: '#475569', flexShrink: 0 };
