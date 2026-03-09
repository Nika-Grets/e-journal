/* eslint-disable react-refresh/only-export-components */
/* eslint-disable no-unused-vars */

import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { ChevronLeft, ChevronRight, AlertTriangle, Check, X, Plus, Paperclip, ClipboardList, Copy } from 'lucide-react';
import { DAY_NAMES, fmtDate, addDays } from './scheduleUtils';

// ── Toast ────────────────────────────────────────────────────────────────────
export function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  const bg = { error: '#ef4444', warn: '#f59e0b', success: '#10b981' }[type] || '#10b981';
  return (
    <div style={{ position: 'fixed', top: 20, right: 20, background: bg, color: '#fff',
      padding: '12px 20px', borderRadius: 10, zIndex: 9999, maxWidth: 380,
      boxShadow: '0 8px 24px rgba(0,0,0,.15)', display: 'flex', alignItems: 'center', gap: 10 }}>
      {type === 'error' ? <AlertTriangle size={16}/> : <Check size={16}/>}
      <span style={{ fontSize: 14 }}>{message}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={14}/></button>
    </div>
  );
}

// ── WeekNav ──────────────────────────────────────────────────────────────────
export function WeekNav({ weekDates, onPrev, onNext, children }) {
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 24, flexWrap: 'wrap' }}>
      {children}
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <button onClick={onPrev} style={navBtn}><ChevronLeft size={16}/></button>
        <span style={{ fontSize: 14, color: '#334155', minWidth: 170, textAlign: 'center' }}>
          {fmtDate(weekDates[0])} — {fmtDate(weekDates[5])}
        </span>
        <button onClick={onNext} style={navBtn}><ChevronRight size={16}/></button>
      </div>
    </div>
  );
}

// ── DayCard ──────────────────────────────────────────────────────────────────
export function DayCard({ date, dayIndex, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,.04)' }}>
      <div style={{ background: '#f8fafc', padding: '10px 14px', fontWeight: 600, fontSize: 13, color: '#334155', borderBottom: '1px solid #e2e8f0' }}>
        {DAY_NAMES[dayIndex]}, {fmtDate(date)}
      </div>
      {children}
    </div>
  );
}

// ── FillWeeksModal ───────────────────────────────────────────────────────────
export function FillWeeksModal({ classId, weekStart, onClose, onDone }) {
  const [weeks, setWeeks] = useState(3);
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setLoading(true);
    try {
      const r = await api.post('/api/schedule/fill-weeks', { class_ID: classId, startDate: weekStart, weeksCount: weeks });
      onDone(`Создано ${r.data.created} уроков, пропущено ${r.data.skipped}`, 'success');
    } catch (e) {
      onDone(e.response?.data?.error || 'Ошибка', 'error');
    } finally { setLoading(false); onClose(); }
  };

  return (
    <div style={overlay}>
      <div style={modal}>
        <h3 style={{ marginTop: 0 }}><Copy size={16} style={{ marginRight: 8 }}/>Заполнить следующие недели</h3>
        <p style={{ color: '#64748b', fontSize: 14 }}>Уроки с {fmtDate(weekStart)} будут скопированы вперёд. Существующие слоты пропустятся.</p>
        <label style={lbl}>Недель вперёд</label>
        <input type="number" min={1} max={20} value={weeks} onChange={e => setWeeks(+e.target.value)} style={{ ...inp, width: 80 }}/>
        <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={btnGray}>Отмена</button>
          <button onClick={handle} disabled={loading} style={btnGreen}>{loading ? 'Копирование...' : 'Копировать'}</button>
        </div>
      </div>
    </div>
  );
}

// ── HomeworkModal ────────────────────────────────────────────────────────────
export function HomeworkModal({ lesson, onClose, onSaved }) {
  const [content, setContent] = useState('');
  const [deadline, setDeadline] = useState('');
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!lesson?.ID) return;
    api.get(`/api/schedule/homework/${lesson.ID}`).then(r => {
      if (!r.data) return;
      setContent(r.data.content || '');
      setDeadline(r.data.deadline || '');
      try { setFiles(JSON.parse(r.data.attachments || '[]')); } catch { setFiles([]); }
    });
  }, [lesson]);

  const uploadFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const r = await api.post('/api/schedule/upload', { filename: file.name, data: ev.target.result });
      setFiles(p => [...p, { name: r.data.name, url: r.data.url }]);
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const save = async () => {
    await api.post('/api/schedule/homework', { lesson_ID: lesson.ID, content, deadline, attachments: files });
    onSaved(); onClose();
  };

  if (!lesson) return null;
  return (
    <div style={overlay}>
      <div style={{ ...modal, width: 520 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}><ClipboardList size={16} style={{ marginRight: 8 }}/>Домашнее задание</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={18}/></button>
        </div>
        <div style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>
          {lesson.subject_name} · {lesson.class_name} · {fmtDate(lesson.date)} · №{lesson.lesson_num}
        </div>
        <label style={lbl}>Задание</label>
        <textarea value={content} onChange={e => setContent(e.target.value)} rows={4}
          placeholder="Опишите задание..." style={{ ...inp, resize: 'vertical', fontFamily: 'inherit' }}/>
        <label style={lbl}>Срок сдачи</label>
        <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} style={inp}/>
        <label style={lbl}>Файлы</label>
        {files.map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <Paperclip size={12} color="#64748b"/>
            <a href={f.url} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: '#3b82f6' }}>{f.name}</a>
            <button onClick={() => setFiles(p => p.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><X size={12}/></button>
          </div>
        ))}
        <label style={{ ...btnGray, display: 'inline-flex', cursor: 'pointer', marginTop: 6 }}>
          <input type="file" style={{ display: 'none' }} onChange={uploadFile}/>
          <Plus size={13}/> {uploading ? 'Загрузка...' : 'Прикрепить файл'}
        </label>
        <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={btnGray}>Отмена</button>
          <button onClick={save} style={btnGreen}>Сохранить</button>
        </div>
      </div>
    </div>
  );
}

// ── Shared styles ────────────────────────────────────────────────────────────
export const navBtn  = { background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#475569' };
export const btnGreen = { background: '#10b981', color: '#fff', border: 'none', padding: '9px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 14 };
export const btnGray  = { background: '#f1f5f9', color: '#475569', border: 'none', padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 5 };
export const overlay  = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
export const modal    = { background: '#fff', borderRadius: 14, padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,.2)', maxWidth: '95vw' };
export const inp      = { width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' };
export const lbl      = { display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 4, marginTop: 12, textTransform: 'uppercase', letterSpacing: .4 };
