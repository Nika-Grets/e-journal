/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import api from '../../api/axios';
import { Calendar, Copy, Info } from 'lucide-react';
import { useWeek, useMeta, useClassLessons, useTopics } from './scheduleUtils';
import { WeekNav, DayCard, Toast, FillWeeksModal, navBtn } from './ScheduleUI';

const cellSel = { fontSize: 12, padding: '3px 5px', borderRadius: 4, border: '1px solid #e2e8f0', width: '100%', outline: 'none', background: '#fafafa' };
const numBadge = { fontSize: 11, color: '#94a3b8', width: 18, textAlign: 'center', flexShrink: 0 };

function LessonSlot({ lesson, num, date, classId, gradeLevel, meta, onSave, fetchTopics, getTopics }) {
  const subjectId = lesson?.subject_ID || '';
  const topics = getTopics(subjectId, gradeLevel);

  const update = (field, value) => onSave(date, num, field, value, lesson);

  return (
    <div style={{ display: 'flex', padding: '7px 12px', borderBottom: '1px solid #f1f5f9', alignItems: 'flex-start', gap: 8 }}>
      <span style={numBadge}>{num}</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
        <select value={lesson?.subject_ID || ''} style={cellSel}
          onChange={e => { update('subject_ID', e.target.value); if (e.target.value && gradeLevel) fetchTopics(e.target.value, gradeLevel); }}>
          <option value="">— Предмет —</option>
          {meta.subjects.map(s => <option key={s.ID} value={s.ID}>{s.name}</option>)}
        </select>
        <select value={lesson?.teacher_ID || ''} style={cellSel} onChange={e => update('teacher_ID', e.target.value)}>
          <option value="">— Учитель —</option>
          {meta.teachers.map(t => <option key={t.ID} value={t.ID}>{t.name}</option>)}
        </select>
        <div style={{ display: 'flex', gap: 4 }}>
          <input placeholder="Каб." defaultValue={lesson?.room || ''} style={{ ...cellSel, flex: '0 0 55px' }}
            onBlur={e => update('room', e.target.value)}/>
          {subjectId && gradeLevel && (
            <select value={lesson?.topic_ID || ''} style={{ ...cellSel, flex: 1 }}
              onFocus={() => fetchTopics(subjectId, gradeLevel)}
              onChange={e => update('topic_ID', e.target.value)}>
              <option value="">— Тема —</option>
              {topics.map(t => <option key={t.ID} value={t.ID}>{t.title}</option>)}
            </select>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminScheduleView() {
  const { weekStart, weekDates, prev, next } = useWeek();
  const meta = useMeta();
  const [classId, setClassId] = useState('');
  const { lessons, reload } = useClassLessons(classId, weekDates);
  const { fetchTopics, getTopics } = useTopics();
  const [toast, setToast] = useState(null);
  const [showFill, setShowFill] = useState(false);

  const maxLessons = Number(meta.config.max_lessons || 8);
  const selectedClass = meta.classes.find(c => String(c.ID) === String(classId));
  const gradeLevel = selectedClass?.level;
  const getLesson = (date, num) => lessons.find(l => l.date === date && l.lesson_num === num);

  const handleSave = async (date, num, field, value, current = {}) => {
    const payload = {
      ID: current.ID || null, class_ID: classId, date, lesson_num: num,
      subject_ID: field === 'subject_ID' ? (value || null) : (current.subject_ID || null),
      teacher_ID: field === 'teacher_ID' ? (value || null) : (current.teacher_ID || null),
      room:       field === 'room'       ? (value || null) : (current.room || null),
      topic_ID:   field === 'topic_ID'   ? (value || null) : (current.topic_ID || null),
    };
    try {
      await api.post('/api/schedule/update', payload);
      reload();
    } catch (e) {
      setToast({ text: e.response?.data?.error || 'Ошибка', type: 'error' });
    }
  };

  return (
    <div style={{ padding: 24 }}>
      {toast && <Toast message={toast.text} type={toast.type} onClose={() => setToast(null)}/>}
      {showFill && classId && (
        <FillWeeksModal classId={classId} weekStart={weekStart} onClose={() => setShowFill(false)}
          onDone={(msg, type) => { setToast({ text: msg, type }); reload(); }}/>
      )}

      <WeekNav weekDates={weekDates} onPrev={prev} onNext={next}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Calendar size={20}/> Расписание
        </h2>
        <select value={classId} onChange={e => setClassId(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none' }}>
          <option value="">Выберите класс</option>
          {meta.classes.map(c => <option key={c.ID} value={c.ID}>{c.level}{c.letter}</option>)}
        </select>
        {classId && (
          <button onClick={() => setShowFill(true)} style={{ ...navBtn, background: '#dbeafe', color: '#1d4ed8', padding: '6px 14px', gap: 6 }}>
            <Copy size={14}/> Продублировать на следующие недели
          </button>
        )}
      </WeekNav>

      {!classId ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#94a3b8', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <Info size={40} color="#cbd5e1"/>
          <p>Выберите класс для редактирования расписания</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {weekDates.map((date, di) => (
            <DayCard key={date} date={date} dayIndex={di}>
              {Array.from({ length: maxLessons }, (_, i) => {
                const num = i + 1;
                const lesson = getLesson(date, num);
                return <LessonSlot key={num} lesson={lesson} num={num} date={date} classId={classId}
                  gradeLevel={gradeLevel} meta={meta} onSave={handleSave} fetchTopics={fetchTopics} getTopics={getTopics}/>;
              })}
            </DayCard>
          ))}
        </div>
      )}
    </div>
  );
}
