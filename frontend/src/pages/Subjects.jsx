/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable no-unused-vars */

// управление предметами и назначением учителей
import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import { canViewAllSubjects, can } from '../utils/auth';
import { NoAccess, PermGuard } from '../components/ui/PermGuard';
import { Plus, Trash2, Edit2, X, Check, Users, BookMarked } from 'lucide-react';

// ─── SubjectRow ──────────────────────────────────────────────────────────────

function SubjectRow({ subject, teachers, onRefresh }) {
  const [expanded, setExpanded] = useState(false);
  const [subjectTeachers, setSubjectTeachers] = useState([]);
  const [editing, setEditing]   = useState(false);
  const [form, setForm]         = useState({ name: subject.name, description: subject.description || '' });

  const loadTeachers = useCallback(async () => {
    if (!expanded) return;
    const r = await api.get(`/api/subjects/${subject.ID}/teachers`);
    setSubjectTeachers(r.data);
  }, [subject.ID, expanded]);

  useEffect(() => { loadTeachers(); }, [loadTeachers]);

  const handleSave = async () => {
    await api.put(`/api/subjects/${subject.ID}`, form);
    setEditing(false);
    onRefresh();
  };

  const handleDelete = async () => {
    if (!window.confirm(`Удалить предмет «${subject.name}»? Удалятся все темы и связи.`)) return;
    await api.delete(`/api/subjects/${subject.ID}`);
    onRefresh();
  };

  const toggleTeacher = async (teacherId, has) => {
    await api.post('/api/subjects/assign-teacher', {
      teacher_ID: teacherId, subject_ID: subject.ID, action: has ? 'remove' : 'add'
    });
    loadTeachers();
  };

  const assignedIds = new Set(subjectTeachers.map(t => String(t.ID)));

  return (
    <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: '#f8fafc' }}>
        {editing ? (
          <>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              style={{ ...inp, flex: 1 }} autoFocus/>
            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Описание" style={{ ...inp, flex: 2 }}/>
            <button onClick={handleSave} style={btnSuccess}><Check size={14}/></button>
            <button onClick={() => setEditing(false)} style={btnGray}><X size={14}/></button>
          </>
        ) : (
          <>
            <BookMarked size={16} color="#64748b"/>
            <span style={{ fontWeight: 600, fontSize: 15, color: '#0f172a', flex: 1 }}>{subject.name}</span>
            <span style={{ fontSize: 13, color: '#94a3b8', flex: 2 }}>{subject.description}</span>
            <span style={{ fontSize: 12, color: '#64748b' }}>{subject.teacher_count} уч.</span>
            <button onClick={() => { setExpanded(v => !v); }} style={{ ...btnGray, gap: 4 }}>
              <Users size={13}/> {expanded ? 'Скрыть' : 'Учителя'}
            </button>
            <PermGuard perm="users:manage">
              <button onClick={() => setEditing(true)} style={btnGray}><Edit2 size={14}/></button>
              <button onClick={handleDelete} style={btnDanger}><Trash2 size={14}/></button>
            </PermGuard>
          </>
        )}
      </div>

      {expanded && (
        <div style={{ padding: '12px 16px', background: '#fff' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 10 }}>НАЗНАЧЕННЫЕ УЧИТЕЛЯ:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {teachers.map(t => {
              const has = assignedIds.has(String(t.ID));
              return (
                <button key={t.ID} onClick={() => toggleTeacher(t.ID, has)}
                  style={{ padding: '5px 14px', borderRadius: 20, border: `1px solid ${has ? '#10b981' : '#e2e8f0'}`,
                    background: has ? '#ecfdf5' : '#fff', color: has ? '#059669' : '#64748b',
                    cursor: 'pointer', fontSize: 13, fontWeight: has ? 600 : 400 }}>
                  {has ? '✓ ' : ''}{t.name}
                </button>
              );
            })}
            {teachers.length === 0 && <span style={{ fontSize: 13, color: '#94a3b8' }}>Нет учителей в системе</span>}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function SubjectsPage() {
  if (!canViewAllSubjects()) return <NoAccess/>;

  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [creating, setCreating] = useState(false);
  const [form, setForm]         = useState({ name: '', description: '' });

  const loadAll = useCallback(async () => {
    const [s, t] = await Promise.all([api.get('/api/subjects'), api.get('/api/users/by-role/TEACHER')]);
    setSubjects(s.data);
    setTeachers(t.data);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleCreate = async (e) => {
    e.preventDefault();
    await api.post('/api/subjects', form);
    setForm({ name: '', description: '' });
    setCreating(false);
    loadAll();
  };

  return (
    <div style={{ padding: 24, maxWidth: 860, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 10 }}>
          <BookMarked size={22}/> Предметы
        </h2>
        <PermGuard perm="users:manage">
          <button onClick={() => setCreating(v => !v)} style={btnPrimary}>
            <Plus size={16}/> {creating ? 'Отмена' : 'Добавить предмет'}
          </button>
        </PermGuard>
      </div>

      {creating && (
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: 10, background: '#f0fdf4', borderRadius: 10, padding: 16, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Название предмета *" required style={{ ...inp, flex: '1 1 160px' }}/>
          <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Описание (необязательно)" style={{ ...inp, flex: '2 1 250px' }}/>
          <button type="submit" style={btnSuccess}><Check size={15}/> Создать</button>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {subjects.map(s => (
          <SubjectRow key={s.ID} subject={s} teachers={teachers} onRefresh={loadAll}/>
        ))}
        {subjects.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>
            Предметы не созданы. Нажмите «Добавить предмет».
          </div>
        )}
      </div>
    </div>
  );
}

const inp = { padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' };
const btnPrimary = { background: '#3b82f6', color: '#fff', border: 'none', padding: '9px 16px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 };
const btnSuccess = { background: '#10b981', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 13 };
const btnGray    = { background: '#f1f5f9', color: '#475569', border: 'none', padding: '6px 11px', borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: 13 };
const btnDanger  = { background: '#fef2f2', color: '#ef4444', border: 'none', padding: '6px 10px', borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center' };
