// Страница управления пользователями.
import React, { useEffect, useState, useCallback } from 'react';
import { Trash2, UserPlus, School, Users, Pencil, X, Check } from 'lucide-react';
import api from '../api/axios';
import Tabs from '../components/ui/Tabs';
import UserModal from '../components/UserModal';
import UserBadge from '../components/users/UserBadge';
import ClassesPanel from '../components/users/ClassesPanel';
import ParentChildrenPanel from '../components/users/ParentChildrenPanel';
import AssignClassCell from '../components/users/AssignClassCell';
import { panel, inp, btnPrimary, th, td } from '../styles/shared';

const TABS = [
  { key: 'users',   label: 'Пользователи', icon: <Users  size={16}/> },
  { key: 'classes', label: 'Классы',        icon: <School size={16}/> },
];

const ROLE_OPTIONS = ['ADMIN', 'TEACHER', 'STUDENT', 'PARENT'];

// ── Строка редактирования пользователя ────────────────────────────────────────
function EditRow({ user, roles, onSave, onCancel }) {
  const [form, setForm] = useState({
    last_name:   user.last_name   || '',
    first_name:  user.first_name  || '',
    middle_name: user.middle_name || '',
    email:       user.email       || '',
    role_id:     user.role_id     || '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const inputSt = {
    ...inp, padding: '5px 8px', fontSize: 13,
    width: '100%', boxSizing: 'border-box',
  };

  return (
    <tr style={{ background: '#fffbeb', borderBottom: '1px solid #fde68a' }}>
      {/* ФИО */}
      <td style={{ ...td, minWidth: 220 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <input style={inputSt} placeholder="Фамилия"  value={form.last_name}   onChange={e => set('last_name',   e.target.value)}/>
          <div style={{ display: 'flex', gap: 4 }}>
            <input style={inputSt} placeholder="Имя"       value={form.first_name}  onChange={e => set('first_name',  e.target.value)}/>
            <input style={inputSt} placeholder="Отчество"  value={form.middle_name} onChange={e => set('middle_name', e.target.value)}/>
          </div>
        </div>
      </td>
      {/* Email */}
      <td style={td}>
        <input type="email" style={inputSt} value={form.email} onChange={e => set('email', e.target.value)}/>
      </td>
      {/* Роль */}
      <td style={td}>
        <select style={{ ...inputSt, width: 'auto' }} value={form.role_id} onChange={e => set('role_id', e.target.value)}>
          {roles.map(r => <option key={r.ID} value={r.ID}>{r.name}</option>)}
        </select>
      </td>
      <td style={td}></td>
      {/* Кнопки */}
      <td style={{ ...td, textAlign: 'right' }}>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          <button onClick={() => onSave(user.ID, form)}
            style={{ background: '#10b981', border: 'none', borderRadius: 6, cursor: 'pointer', color: '#fff', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
            <Check size={14}/> Сохранить
          </button>
          <button onClick={onCancel}
            style={{ background: '#f1f5f9', border: 'none', borderRadius: 6, cursor: 'pointer', color: '#475569', padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
            <X size={14}/> Отмена
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function UsersPage() {
  const [tab,         setTab]         = useState('users');
  const [users,       setUsers]       = useState([]);
  const [teachers,    setTeachers]    = useState([]);
  const [classes,     setClasses]     = useState([]);
  const [roles,       setRoles]       = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [roleFilter,  setRoleFilter]  = useState('');
  const [editingId,   setEditingId]   = useState(null);
  const [saveError,   setSaveError]   = useState('');

  const fetchAll = useCallback(async () => {
    const [uRes, tRes, cRes, mRes] = await Promise.all([
      api.get('/api/users'),
      api.get('/api/users/by-role/TEACHER'),
      api.get('/api/classes'),
      api.get('/api/users/metadata'),
    ]);
    setUsers(uRes.data);
    setTeachers(tRes.data);
    setClasses(cRes.data);
    setRoles(mRes.data.roles || []);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleDelete = async (id) => {
    if (!window.confirm('Удалить пользователя?')) return;
    await api.delete(`/api/users/${id}`);
    fetchAll();
  };

  const handleSaveEdit = async (id, form) => {
    setSaveError('');
    try {
      await api.put(`/api/users/${id}`, {
        first_name:  form.first_name,
        last_name:   form.last_name,
        middle_name: form.middle_name,
        email:       form.email,
        role_id:     form.role_id,
      });
      setEditingId(null);
      fetchAll();
    } catch (err) {
      setSaveError(err.response?.data?.error || 'Ошибка сохранения');
    }
  };

  const filtered = roleFilter ? users.filter(u => u.role_name === roleFilter) : users;
  const students  = users.filter(u => u.role_name === 'STUDENT');

  return (
    <div style={{ padding: 24 }}>
      <Tabs tabs={TABS} active={tab} onChange={setTab}/>

      {tab === 'classes' ? (
        <ClassesPanel teachers={teachers} onRefresh={fetchAll}/>
      ) : (
        <div style={panel}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <h2 style={{ margin: 0, fontSize: 20, color: '#0f172a' }}>
              Пользователи ({filtered.length})
            </h2>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ ...inp, width: 160 }}>
                <option value="">Все роли</option>
                {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <button onClick={() => setIsModalOpen(true)} style={btnPrimary}>
                <UserPlus size={16}/> Добавить
              </button>
            </div>
          </div>

          {saveError && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#dc2626', marginBottom: 12 }}>
              {saveError}
            </div>
          )}

          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={th}>ФИО</th>
                  <th style={th}>Email</th>
                  <th style={th}>Роль</th>
                  <th style={th}>Класс / Дети</th>
                  <th style={{ ...th, width: 100 }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  editingId === u.ID
                    ? <EditRow key={u.ID} user={u} roles={roles} onSave={handleSaveEdit} onCancel={() => { setEditingId(null); setSaveError(''); }}/>
                    : (
                      <tr key={u.ID} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={td}>{u.last_name} {u.first_name} {u.middle_name || ''}</td>
                        <td style={{ ...td, color: '#64748b', fontSize: 13 }}>{u.email}</td>
                        <td style={td}><UserBadge role={u.role_name}/></td>
                        <td style={td}>
                          {u.role_name === 'STUDENT' && (
                            <AssignClassCell user={u} classes={classes} onRefresh={fetchAll}/>
                          )}
                          {u.role_name === 'PARENT' && (
                            <ParentChildrenPanel
                              parentId={u.ID}
                              allStudents={students.map(s => ({ ...s, class_name: s.class_name || '' }))}
                            />
                          )}
                          {u.role_name === 'TEACHER' && u.class_name && (
                            <span style={{ fontSize: 12, color: '#64748b' }}>Кл. рук.: {u.class_name}</span>
                          )}
                        </td>
                        <td style={{ ...td, textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            <button onClick={() => { setEditingId(u.ID); setSaveError(''); }}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6' }}
                              title="Редактировать">
                              <Pencil size={15}/>
                            </button>
                            <button onClick={() => handleDelete(u.ID)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                              title="Удалить">
                              <Trash2 size={15}/>
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                      Пользователи не найдены
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <UserModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onUserCreated={fetchAll}/>
    </div>
  );
}
