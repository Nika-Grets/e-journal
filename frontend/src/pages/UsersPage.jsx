import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';
import { Trash2, UserPlus, School, Users, Link, Edit2, X, Check, ChevronDown, ChevronUp } from 'lucide-react';
import UserModal from '../components/UserModal';

// ─── Helpers ────────────────────────────────────────────────────────────────

const ROLE_COLORS = { ADMIN: '#fef3c7', TEACHER: '#dbeafe', STUDENT: '#dcfce7', PARENT: '#f3e8ff' };
const ROLE_TEXT = { ADMIN: '#92400e', TEACHER: '#1d4ed8', STUDENT: '#166534', PARENT: '#7e22ce' };

function Badge({ role }) {
  return (
    <span style={{ background: ROLE_COLORS[role] || '#f1f5f9', color: ROLE_TEXT[role] || '#475569',
      padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
      {role}
    </span>
  );
}

// ─── Class Management Panel ─────────────────────────────────────────────────

function ClassesPanel({ teachers, onRefresh }) {
  const [classes, setClasses] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ level: '', letter: '', curator_ID: '' });

  const loadClasses = useCallback(async () => {
    const r = await api.get('/api/classes');
    setClasses(r.data);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadClasses(); }, [loadClasses]);

  const handleCreate = async (e) => {
    e.preventDefault();
    await api.post('/api/classes', form);
    setForm({ level: '', letter: '', curator_ID: '' });
    setCreating(false);
    loadClasses();
    onRefresh();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить класс? Все связи с учениками будут удалены.')) return;
    await api.delete(`/api/classes/${id}`);
    loadClasses();
    onRefresh();
  };

  const handleCurator = async (classId, teacherId) => {
    await api.post('/api/classes/set-curator', { class_ID: classId, teacher_ID: teacherId || null });
    loadClasses();
  };

  return (
    <div style={panel}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 18, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
          <School size={20}/> Классы
        </h3>
        <button onClick={() => setCreating(v => !v)} style={btnPrimary}>
          <UserPlus size={16}/> {creating ? 'Отмена' : 'Создать класс'}
        </button>
      </div>

      {creating && (
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: 10, alignItems: 'center', background: '#f0fdf4', borderRadius: 10, padding: 14, marginBottom: 16, flexWrap: 'wrap' }}>
          <input placeholder="Уровень (5, 6...)" type="number" min={1} max={12} value={form.level}
            onChange={e => setForm({ ...form, level: e.target.value })} required style={{ ...inp, width: 130 }}/>
          <input placeholder="Буква (А, Б...)" maxLength={2} value={form.letter}
            onChange={e => setForm({ ...form, letter: e.target.value })} required style={{ ...inp, width: 100 }}/>
          <select value={form.curator_ID} onChange={e => setForm({ ...form, curator_ID: e.target.value })} style={{ ...inp, width: 200 }}>
            <option value="">Куратор (необязательно)</option>
            {teachers.map(t => <option key={t.ID} value={t.ID}>{t.name}</option>)}
          </select>
          <button type="submit" style={btnSuccess}><Check size={16}/> Создать</button>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {classes.map(cls => (
          <div key={cls.ID} style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#f8fafc' }}>
              <span style={{ fontWeight: 700, fontSize: 16, color: '#0f172a', minWidth: 50 }}>{cls.level}{cls.letter}</span>
              <span style={{ fontSize: 13, color: '#64748b' }}>{cls.student_count} уч.</span>
              <span style={{ fontSize: 13, color: '#475569' }}>
                Куратор:{' '}
                <select value={cls.curator_ID || ''} onChange={e => handleCurator(cls.ID, e.target.value)}
                  style={{ fontSize: 13, border: 'none', background: 'transparent', cursor: 'pointer', color: '#3b82f6', outline: 'none' }}>
                  <option value="">—</option>
                  {teachers.map(t => <option key={t.ID} value={t.ID}>{t.name}</option>)}
                </select>
              </span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                <button onClick={() => setExpanded(e => ({ ...e, [cls.ID]: !e[cls.ID] }))}
                  style={{ ...btnGray, gap: 4 }}>
                  <Users size={14}/> Ученики {expanded[cls.ID] ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                </button>
                <button onClick={() => handleDelete(cls.ID)} style={btnDanger}><Trash2 size={16}/></button>
              </div>
            </div>
            {expanded[cls.ID] && <ClassStudents classId={cls.ID} onRefresh={loadClasses}/>}
          </div>
        ))}
        {classes.length === 0 && <div style={{ textAlign: 'center', padding: 30, color: '#94a3b8' }}>Классы не созданы</div>}
      </div>
    </div>
  );
}

function ClassStudents({ classId, onRefresh }) {
  const [students, setStudents] = useState([]);

  useEffect(() => {
    api.get(`/api/classes/${classId}/students`).then(r => setStudents(r.data));
  }, [classId]);

  const handleRemove = async (studentId) => {
    await api.post('/api/classes/assign-student', { student_ID: studentId, class_ID: null });
    setStudents(prev => prev.filter(s => s.ID !== studentId));
    onRefresh();
  };

  if (students.length === 0) return <div style={{ padding: '12px 16px', color: '#94a3b8', fontSize: 13 }}>В классе нет учеников</div>;

  return (
    <div style={{ padding: '8px 16px 12px' }}>
      {students.map(s => (
        <div key={s.ID} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
          <span style={{ fontSize: 14, color: '#1e293b' }}>{s.last_name} {s.first_name} {s.middle_name || ''}</span>
          <button onClick={() => handleRemove(s.ID)} style={{ marginLeft: 'auto', ...btnGray, color: '#ef4444', fontSize: 12 }}>
            <X size={12}/> Убрать
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── Parent Children Panel ──────────────────────────────────────────────────

function ParentChildrenPanel({ parentId, allStudents }) {
  const [children, setChildren] = useState([]);
  const [adding, setAdding] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');

  const loadChildren = useCallback(async () => {
    const r = await api.get(`/api/classes/parent-children/${parentId}`);
    setChildren(r.data);
  }, [parentId]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadChildren(); }, [loadChildren]);

  const handleLink = async () => {
    if (!selectedStudentId) return;
    await api.post('/api/classes/link-parent', { parent_ID: parentId, student_ID: selectedStudentId, action: 'add' });
    setAdding(false);
    setSelectedStudentId('');
    loadChildren();
  };

  const handleUnlink = async (studentId) => {
    await api.post('/api/classes/link-parent', { parent_ID: parentId, student_ID: studentId, action: 'remove' });
    loadChildren();
  };

  const linkedIds = new Set(children.map(c => String(c.ID)));
  const available = allStudents.filter(s => !linkedIds.has(String(s.ID)));

  return (
    <div style={{ marginTop: 8, paddingLeft: 12, borderLeft: '3px solid #e2e8f0' }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>ДЕТИ:</div>
      {children.length === 0 && <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>Нет привязанных детей</div>}
      {children.map(ch => (
        <div key={ch.ID} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 13, color: '#1e293b' }}>{ch.last_name} {ch.first_name}</span>
          {ch.class_name && <span style={{ fontSize: 11, color: '#64748b' }}>({ch.class_name})</span>}
          <button onClick={() => handleUnlink(ch.ID)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><X size={12}/></button>
        </div>
      ))}
      {adding ? (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4 }}>
          <select value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)} style={{ ...inp, flex: 1, fontSize: 12 }}>
            <option value="">Выберите ученика</option>
            {available.map(s => <option key={s.ID} value={s.ID}>{s.last_name} {s.first_name} {s.class_name ? `(${s.class_name})` : ''}</option>)}
          </select>
          <button onClick={handleLink} style={{ ...btnSuccess, padding: '6px 10px' }}><Check size={14}/></button>
          <button onClick={() => setAdding(false)} style={{ ...btnGray, padding: '6px 10px' }}><X size={14}/></button>
        </div>
      ) : (
        <button onClick={() => setAdding(true)} style={{ fontSize: 12, background: 'none', border: '1px dashed #cbd5e1', borderRadius: 6, padding: '3px 10px', cursor: 'pointer', color: '#64748b', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
          <Link size={12}/> Добавить ребёнка
        </button>
      )}
    </div>
  );
}

// ─── Assign Class to Student ─────────────────────────────────────────────────

function AssignClassCell({ user, classes, onRefresh }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(user.class_id || '');

  const handleSave = async () => {
    await api.post('/api/classes/assign-student', { student_ID: user.ID, class_ID: value || null });
    setEditing(false);
    onRefresh();
  };

  if (!editing) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ fontSize: 13 }}>{user.class_name || '—'}</span>
      <button onClick={() => setEditing(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><Edit2 size={13}/></button>
    </div>
  );

  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      <select value={value} onChange={e => setValue(e.target.value)} style={{ ...inp, fontSize: 12, padding: '4px' }}>
        <option value="">— Без класса —</option>
        {classes.map(c => <option key={c.ID} value={c.ID}>{c.level}{c.letter}</option>)}
      </select>
      <button onClick={handleSave} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#10b981' }}><Check size={14}/></button>
      <button onClick={() => setEditing(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><X size={14}/></button>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

const TAB_LABELS = [
  { key: 'users', label: 'Пользователи', icon: <Users size={16}/> },
  { key: 'classes', label: 'Классы', icon: <School size={16}/> },
];

export default function UsersPage() {
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [roleFilter, setRoleFilter] = useState('');

  const fetchAll = useCallback(async () => {
    const [uRes, tRes, cRes] = await Promise.all([
      api.get('/api/users'),
      api.get('/api/users/by-role/TEACHER'),
      api.get('/api/classes')
    ]);
    setUsers(uRes.data);
    setTeachers(tRes.data);
    setClasses(cRes.data);
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить пользователя?')) return;
    await api.delete(`/api/users/${id}`);
    fetchAll();
  };

  const filtered = roleFilter ? users.filter(u => u.role_name === roleFilter) : users;
  const students = users.filter(u => u.role_name === 'STUDENT');

  return (
    <div style={{ padding: 24 }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '2px solid #e2e8f0', paddingBottom: 0 }}>
        {TAB_LABELS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer', borderBottom: tab === t.key ? '2px solid #3b82f6' : '2px solid transparent',
              color: tab === t.key ? '#3b82f6' : '#64748b', fontWeight: tab === t.key ? 600 : 400, fontSize: 14,
              display: 'flex', alignItems: 'center', gap: 6, marginBottom: -2 }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'classes' ? (
        <ClassesPanel teachers={teachers} onRefresh={fetchAll}/>
      ) : (
        <>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 20, color: '#0f172a' }}>Пользователи ({filtered.length})</h2>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ ...inp, width: 160 }}>
                <option value="">Все роли</option>
                <option value="ADMIN">ADMIN</option>
                <option value="TEACHER">TEACHER</option>
                <option value="STUDENT">STUDENT</option>
                <option value="PARENT">PARENT</option>
              </select>
              <button onClick={() => setIsModalOpen(true)} style={btnPrimary}>
                <UserPlus size={16}/> Добавить
              </button>
            </div>
          </div>

          {/* Table */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={th}>ФИО</th>
                  <th style={th}>Email</th>
                  <th style={th}>Роль</th>
                  <th style={th}>Класс / Дети</th>
                  <th style={th}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.ID} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={td}>{u.last_name} {u.first_name} {u.middle_name || ''}</td>
                    <td style={{ ...td, color: '#64748b', fontSize: 13 }}>{u.email}</td>
                    <td style={td}><Badge role={u.role_name}/></td>
                    <td style={td}>
                      {u.role_name === 'STUDENT' && (
                        <AssignClassCell user={u} classes={classes} onRefresh={fetchAll}/>
                      )}
                      {u.role_name === 'PARENT' && (
                        <ParentChildrenPanel parentId={u.ID} allStudents={students.map(s => ({ ...s, class_name: s.class_name || '' }))}/>
                      )}
                      {u.role_name === 'TEACHER' && u.class_name && (
                        <span style={{ fontSize: 12, color: '#64748b' }}>Кл. рук.: {u.class_name}</span>
                      )}
                    </td>
                    <td style={{ ...td, textAlign: 'right' }}>
                      <button onClick={() => handleDelete(u.ID)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}>
                        <Trash2 size={16}/>
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Пользователи не найдены</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      <UserModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onUserCreated={fetchAll}/>
    </div>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────

const panel = { background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', padding: 20 };
const inp = { padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' };
const btnPrimary = { background: '#3b82f6', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 };
const btnSuccess = { background: '#10b981', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 };
const btnGray = { background: '#f1f5f9', color: '#475569', border: 'none', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 };
const btnDanger = { background: '#fef2f2', color: '#ef4444', border: 'none', padding: '6px 10px', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center' };
const th = { padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: .4 };
const td = { padding: '12px 16px', fontSize: 14, color: '#1e293b', verticalAlign: 'top' };
