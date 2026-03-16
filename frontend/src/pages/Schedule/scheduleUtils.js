// Утилиты и хуки для страниц расписания.
// Все хуки экспортируются отдельно — каждый делает одно дело.
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import api from '../../api/axios';

export const DAY_NAMES = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

// ── Утилиты для дат ──────────────────────────────────────────────────────────

/** Возвращает дату понедельника недели, в которую попадает dateStr */
export function getWeekStart(dateStr) {
  const d   = new Date(dateStr);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}

/** Прибавляет n дней к dateStr */
export function addDays(dateStr, n) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

/** Форматирует дату в краткий русский вид: «12 янв.» */
export function fmtDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

// ── Хук: текущая неделя + навигация ─────────────────────────────────────────

export function useWeek() {
  const [weekStart, setWeekStart] = useState(
    getWeekStart(new Date().toISOString().split('T')[0])
  );
  const weekDates = useMemo(
    () => Array.from({ length: 6 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );
  const prev = () => setWeekStart(s => addDays(s, -7));
  const next = () => setWeekStart(s => addDays(s, +7));
  return { weekStart, weekDates, prev, next };
}

// ── Хук: метаданные расписания (предметы, учителя, классы, конфиг) ───────────

export function useMeta() {
  const [meta, setMeta] = useState({ subjects: [], teachers: [], classes: [], config: {} });
  useEffect(() => {
    api.get('/api/schedule/metadata').then(r => setMeta(r.data)).catch(() => {});
  }, []);
  return meta;
}

// ── Хук: уроки класса на неделю ──────────────────────────────────────────────

export function useClassLessons(classId, weekDates) {
  const [lessons, setLessons] = useState([]);

  const load = useCallback(async () => {
    if (!classId || !weekDates.length) return;
    const r = await api.get('/api/schedule', {
      params: { class_id: classId, startDate: weekDates[0], endDate: weekDates[5] },
    });
    setLessons(r.data);
  }, [classId, weekDates]);

  useEffect(() => { load(); }, [load]);
  return { lessons, reload: load };
}

// ── Хук: уроки учителя на неделю ─────────────────────────────────────────────

export function useTeacherLessons(weekDates) {
  const [lessons, setLessons] = useState([]);

  const load = useCallback(async () => {
    if (!weekDates.length) return;
    const r = await api.get('/api/schedule/teacher-view', {
      params: { startDate: weekDates[0], endDate: weekDates[5] },
    });
    setLessons(r.data);
  }, [weekDates]);

  useEffect(() => { load(); }, [load]);
  return { lessons, reload: load };
}

// ── Хук: кэш тем (предмет + уровень класса) ──────────────────────────────────
// БАГ-ФИX: раньше `cache` был в зависимостях useCallback, что вызывало
// пересоздание fetchTopics при каждом добавлении темы.
// Теперь используем ref как стабильное хранилище, а state — только для ре-рендера.

export function useTopics() {
  const cacheRef  = useRef({});
  const [, forceUpdate] = useState(0); // триггер ре-рендера при обновлении кэша

  const fetchTopics = useCallback(async (subjectId, gradeLevel) => {
    if (!subjectId || !gradeLevel) return;
    const key = `${subjectId}_${gradeLevel}`;
    if (cacheRef.current[key]) return; // уже загружено
    const r = await api.get('/api/schedule/topics', {
      params: { subject_id: subjectId, grade_level: gradeLevel },
    });
    cacheRef.current[key] = r.data;
    forceUpdate(n => n + 1); // вызываем ре-рендер после записи в ref
  }, []); // стабильная функция — нет зависимостей

  const getTopics = (subjectId, gradeLevel) =>
    cacheRef.current[`${subjectId}_${gradeLevel}`] || [];

  return { fetchTopics, getTopics };
}
