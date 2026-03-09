/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../../api/axios';

export const DAY_NAMES = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

export function getWeekStart(dateStr) {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}

export function addDays(dateStr, n) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

export function fmtDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

/** Хук: текущая неделя + навигация */
export function useWeek() {
  const [weekStart, setWeekStart] = useState(
    getWeekStart(new Date().toISOString().split('T')[0])
  );
  const weekDates = useMemo(
    () => Array.from({ length: 6 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );
  const prev = () => setWeekStart(s => addDays(s, -7));
  const next = () => setWeekStart(s => addDays(s, 7));
  return { weekStart, weekDates, prev, next };
}

/** Хук: метаданные для расписания */
export function useMeta() {
  const [meta, setMeta] = useState({ subjects: [], teachers: [], classes: [], config: {} });
  useEffect(() => {
    api.get('/api/schedule/metadata').then(r => setMeta(r.data)).catch(() => {});
  }, []);
  return meta;
}

/** Хук: уроки класса на неделю */
export function useClassLessons(classId, weekDates) {
  const [lessons, setLessons] = useState([]);
  const load = useCallback(async () => {
    if (!classId || !weekDates.length) return;
    const r = await api.get('/api/schedule', {
      params: { class_id: classId, startDate: weekDates[0], endDate: weekDates[5] }
    });
    setLessons(r.data);
  }, [classId, weekDates]);
  useEffect(() => { load(); }, [load]);
  return { lessons, reload: load };
}

/** Хук: уроки учителя на неделю */
export function useTeacherLessons(weekDates) {
  const [lessons, setLessons] = useState([]);
  const load = useCallback(async () => {
    if (!weekDates.length) return;
    const r = await api.get('/api/schedule/teacher-view', {
      params: { startDate: weekDates[0], endDate: weekDates[5] }
    });
    setLessons(r.data);
  }, [weekDates]);
  useEffect(() => { load(); }, [load]);
  return { lessons, reload: load };
}

/** Хук: темы предмета+уровня (кэш) */
export function useTopics() {
  const [cache, setCache] = useState({});
  const fetch = useCallback(async (subjectId, gradeLevel) => {
    if (!subjectId || !gradeLevel) return;
    const key = `${subjectId}_${gradeLevel}`;
    if (cache[key]) return;
    const r = await api.get('/api/schedule/topics', {
      params: { subject_id: subjectId, grade_level: gradeLevel }
    });
    setCache(c => ({ ...c, [key]: r.data }));
  }, [cache]);
  const get = (subjectId, gradeLevel) => cache[`${subjectId}_${gradeLevel}`] || [];
  return { fetchTopics: fetch, getTopics: get };
}
