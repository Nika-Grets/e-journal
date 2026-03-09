/* eslint-disable no-unused-vars */

import React, { useState } from 'react';
import { Calendar, BookOpen, ClipboardList } from 'lucide-react';
import { useWeek, useTeacherLessons, fmtDate, DAY_NAMES } from './scheduleUtils';
import { WeekNav, DayCard, Toast, HomeworkModal } from './ScheduleUI';

function TeacherLessonRow({ lesson, onHomework }) {
  return (
    <div style={{ padding: '10px 12px', borderBottom: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={num}>{lesson.lesson_num}</span>
        {lesson.start_time && <span style={{ fontSize: 11, color: '#94a3b8' }}>{lesson.start_time}</span>}
        <span style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{lesson.subject_name}</span>
      </div>
      <div style={{ paddingLeft: 26, fontSize: 13, color: '#475569' }}>
        {lesson.class_name}{lesson.room ? ` · каб. ${lesson.room}` : ''}
      </div>
      {lesson.topic_title && (
        <div style={{ paddingLeft: 26, fontSize: 12, color: '#3b82f6', display: 'flex', alignItems: 'center', gap: 4 }}>
          <BookOpen size={11}/> {lesson.topic_title}
        </div>
      )}
      {lesson.homework_content && (
        <div style={{ paddingLeft: 26, fontSize: 12, color: '#059669', background: '#ecfdf5', borderRadius: 5, padding: '3px 8px', margin: '2px 0 0 26px' }}>
          ДЗ: {lesson.homework_content.slice(0, 70)}{lesson.homework_content.length > 70 ? '...' : ''}
        </div>
      )}
      <div style={{ paddingLeft: 26 }}>
        <button onClick={() => onHomework(lesson)}
          style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 6, padding: '3px 10px', cursor: 'pointer', fontSize: 12, color: '#475569', display: 'flex', alignItems: 'center', gap: 4 }}>
          <ClipboardList size={11}/> {lesson.homework_content ? 'Ред. ДЗ' : '+ ДЗ'}
        </button>
      </div>
    </div>
  );
}

export default function TeacherScheduleView() {
  const { weekDates, prev, next } = useWeek();
  const { lessons, reload } = useTeacherLessons(weekDates);
  const [hwLesson, setHwLesson] = useState(null);
  const [toast, setToast] = useState(null);

  return (
    <div style={{ padding: 24 }}>
      {toast && <Toast message={toast.text} type={toast.type} onClose={() => setToast(null)}/>}
      {hwLesson && (
        <HomeworkModal lesson={hwLesson} onClose={() => setHwLesson(null)}
          onSaved={() => { setToast({ text: 'ДЗ сохранено', type: 'success' }); reload(); }}/>
      )}

      <WeekNav weekDates={weekDates} onPrev={prev} onNext={next}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Calendar size={20}/> Моё расписание
        </h2>
      </WeekNav>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {weekDates.map((date, di) => {
          const dayLessons = lessons.filter(l => l.date === date).sort((a, b) => a.lesson_num - b.lesson_num);
          return (
            <DayCard key={date} date={date} dayIndex={di}>
              {dayLessons.length === 0
                ? <div style={{ padding: '20px 12px', color: '#cbd5e1', fontSize: 13, textAlign: 'center' }}>—</div>
                : dayLessons.map(l => <TeacherLessonRow key={l.ID} lesson={l} onHomework={setHwLesson}/>)
              }
            </DayCard>
          );
        })}
      </div>
    </div>
  );
}

const num = { background: '#f1f5f9', borderRadius: 6, padding: '2px 7px', fontSize: 11, fontWeight: 700, color: '#475569', flexShrink: 0 };
