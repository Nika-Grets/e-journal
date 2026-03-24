/* eslint-disable no-unused-vars */
// Вид расписания для администратора: редактирование уроков по классам.
import React, { useState, useEffect } from 'react';
import { Calendar, Copy, Info, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import api from '../../api/axios';
import { useWeek, useMeta, useClassLessons, useTopics, useTopicUsage } from './scheduleUtils';
import { WeekNav, DayCard, Toast, FillWeeksModal, navBtn } from './ScheduleUI';

const cellSel = {
  fontSize: 12, padding: '3px 5px', borderRadius: 4,
  border: '1px solid #e2e8f0', width: '100%',
  outline: 'none', background: '#fafafa',
};
const numBadge = { fontSize: 11, color: '#94a3b8', width: 18, textAlign: 'center', flexShrink: 0 };

// ── Хинт прогресса часов по теме ─────────────────────────────────────────────

function TopicHint({ usage, lessonDurationMin }) {
  if (!usage) return null;

  const { hours_allocated, hours_done, hours_scheduled } = usage;
  // Длительность текущего урока в часах (45 = 1ч, 90 = 2ч)
  const thisLessonHours = lessonDurationMin ? lessonDurationMin / 45 : 1;

  if (!hours_allocated) return null;

  const pct         = Math.min(100, Math.round((hours_done / hours_allocated) * 100));
  const remaining   = hours_allocated - hours_done;
  const afterThis   = hours_scheduled / 45; // уже запланировано (включая будущие)
  const isDone      = hours_done >= hours_allocated;
  const willExceed  = !isDone && (hours_scheduled / 45) > hours_allocated;

  // Цвет прогресс-бара
  const barColor = isDone ? '#10b981' : pct >= 60 ? '#f59e0b' : '#3b82f6';

  return (
    <div style={{ marginTop: 3, padding: '4px 6px', borderRadius: 5,
      background: isDone ? '#f0fdf4' : willExceed ? '#fff7ed' : '#f8fafc',
      border: `1px solid ${isDone ? '#bbf7d0' : willExceed ? '#fed7aa' : '#e2e8f0'}` }}>

      {/* Прогресс-бар */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
        <div style={{ flex: 1, height: 4, background: '#e2e8f0', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: 2 }}/>
        </div>
        <span style={{ fontSize: 10, color: barColor, fontWeight: 700, whiteSpace: 'nowrap' }}>
          {hours_done % 1 === 0 ? hours_done : hours_done.toFixed(1)} / {hours_allocated} ч
        </span>
      </div>

      {/* Статусная строка */}
      {isDone ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: '#16a34a', fontWeight: 600 }}>
          <CheckCircle size={10}/> Тема завершена — часов достаточно
        </div>
      ) : willExceed ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: '#ea580c', fontWeight: 600 }}>
          <AlertTriangle size={10}/>
          Запланировано больше плана (осталось {remaining % 1 === 0 ? remaining : remaining.toFixed(1)} ч)
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: '#64748b' }}>
          <Clock size={10}/>
          Осталось {remaining % 1 === 0 ? remaining : remaining.toFixed(1)} ч по теме
        </div>
      )}
    </div>
  );
}

// ── Слот одного урока в сетке расписания ─────────────────────────────────────

function LessonSlot({ lesson, num, date, classId, gradeLevel, meta, onSave,
                      fetchTopics, getTopics, fetchUsage, getUsage, invalidateUsage }) {
  const subjectId = lesson?.subject_ID || '';
  const topics    = getTopics(subjectId, gradeLevel);

  const [room, setRoom] = useState(lesson?.room || '');

  useEffect(() => {
    if (subjectId && gradeLevel) {
      fetchTopics(subjectId, gradeLevel);
    }
  }, [subjectId, gradeLevel, fetchTopics]);

  // Длительность этого урока по расписанию звонков
  const lessonDur = meta.config?.lesson_durations?.[num] ?? null;

  const update = async (field, value) => {
    await onSave(date, num, field, value, lesson);
    // После сохранения сбрасываем кэш usage чтобы пересчиталось
    if ((field === 'topic_ID' || field === 'subject_ID') && subjectId && gradeLevel) {
      invalidateUsage(classId, subjectId, gradeLevel);
      if (subjectId) fetchUsage(classId, subjectId, gradeLevel);
    }
  };

  // Загрузить usage при наведении/открытии дропдауна тем
  const onTopicFocus = () => {
    fetchTopics(subjectId, gradeLevel);
    if (classId && subjectId && gradeLevel) fetchUsage(classId, subjectId, gradeLevel);
  };

  const topicId = lesson?.topic_ID;
  const usage   = topicId ? getUsage(classId, subjectId, gradeLevel, topicId) : null;

  return (
    <div style={{ display: 'flex', padding: '7px 12px', borderBottom: '1px solid #f1f5f9', alignItems: 'flex-start', gap: 8 }}>
      <span style={numBadge}>{num}</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, flex: 1 }}>
        <select
          value={lesson?.subject_ID || ''}
          style={cellSel}
          onChange={e => {
            update('subject_ID', e.target.value);
            if (e.target.value && gradeLevel) fetchTopics(e.target.value, gradeLevel);
          }}
        >
          <option value="">— Предмет —</option>
          {meta.subjects.map(s => <option key={s.ID} value={s.ID}>{s.name}</option>)}
        </select>

        <select value={lesson?.teacher_ID || ''} style={cellSel} onChange={e => update('teacher_ID', e.target.value)}>
          <option value="">— Учитель —</option>
          {meta.teachers.map(t => <option key={t.ID} value={t.ID}>{t.name}</option>)}
        </select>

        <div style={{ display: 'flex', gap: 4 }}>
          <input
            placeholder="Каб."
            value={room}
            style={{ ...cellSel, flex: '0 0 55px' }}
            onChange={e => setRoom(e.target.value)}
            onBlur={e => update('room', e.target.value)}
          />
          {subjectId && gradeLevel && (
            <select
              value={lesson?.topic_ID || ''}
              style={{ ...cellSel, flex: 1 }}
              onFocus={onTopicFocus}
              onChange={e => update('topic_ID', e.target.value)}
            >
              <option value="">— Тема —</option>
              {topics.map(t => <option key={t.ID} value={t.ID}>{t.title}</option>)}
            </select>
          )}
        </div>

        {/* Хинт прогресса часов по выбранной теме */}
        {topicId && subjectId && gradeLevel && (
          <TopicHint usage={usage} lessonDurationMin={lessonDur}/>
        )}
      </div>
    </div>
  );
}

// ── Основной компонент ────────────────────────────────────────────────────────

export default function AdminScheduleView() {
  const { weekStart, weekDates, prev, next } = useWeek();
  const meta                                  = useMeta();
  const [classId,   setClassId]               = useState('');
  const { lessons, reload }                   = useClassLessons(classId, weekDates);
  const { fetchTopics, getTopics }            = useTopics();
  const { fetchUsage, getUsage, invalidateUsage } = useTopicUsage();
  const [toast,     setToast]                 = useState(null);
  const [showFill,  setShowFill]              = useState(false);

  const maxLessons    = Number(meta.config.max_lessons || 8);
  const selectedClass = meta.classes.find(c => String(c.ID) === String(classId));
  const gradeLevel    = selectedClass?.level;
  const getLesson     = (date, num) => lessons.find(l => l.date === date && l.lesson_num === num);

  const handleSave = async (date, num, field, value, current = {}) => {
    const payload = {
      ID:         current.ID      || null,
      class_ID:   classId,
      date,
      lesson_num: num,
      subject_ID: field === 'subject_ID' ? (value || null) : (current.subject_ID || null),
      teacher_ID: field === 'teacher_ID' ? (value || null) : (current.teacher_ID || null),
      room:       field === 'room'       ? (value || null) : (current.room       || null),
      topic_ID:   field === 'topic_ID'   ? (value || null) : (current.topic_ID   || null),
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
      {toast    && <Toast message={toast.text} type={toast.type} onClose={() => setToast(null)}/>}
      {showFill && classId && (
        <FillWeeksModal
          classId={classId} weekStart={weekStart}
          onClose={() => setShowFill(false)}
          onDone={(msg, type) => { setToast({ text: msg, type }); reload(); }}
        />
      )}

      <WeekNav weekDates={weekDates} onPrev={prev} onNext={next}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Calendar size={20}/> Расписание
        </h2>
        <select
          value={classId}
          onChange={e => setClassId(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none' }}
        >
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
                const num    = i + 1;
                const lesson = getLesson(date, num);
                return (
                  <LessonSlot
                    key={lesson?.ID ?? `${date}-${num}`}
                    lesson={lesson} num={num} date={date}
                    classId={classId} gradeLevel={gradeLevel}
                    meta={meta} onSave={handleSave}
                    fetchTopics={fetchTopics} getTopics={getTopics}
                    fetchUsage={fetchUsage} getUsage={getUsage} invalidateUsage={invalidateUsage}
                  />
                );
              })}
            </DayCard>
          ))}
        </div>
      )}
    </div>
  );
}
