// окошко создания просто

import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { X } from 'lucide-react';

const UserModal = ({ isOpen, onClose, onUserCreated }) => {
  const [formData, setFormData] = useState({
    email: '', password: '', role_id: '', first_name: '', last_name: '', middle_name: ''
  });
  const [metadata, setMetadata] = useState({ roles: [] });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.get('/api/users/metadata').then(res => setMetadata(res.data));
      setFormData({ email: '', password: '', role_id: '', first_name: '', last_name: '', middle_name: '' });
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/api/users', formData);
      onUserCreated();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка при создании пользователя');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const selectedRole = metadata.roles.find(r => String(r.ID) === String(formData.role_id));
  const roleName = selectedRole?.name || '';

  return (
    <div style={overlay}>
      <div style={modal}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 18, color: '#0f172a' }}>Создать пользователя</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
            <X size={20}/>
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={label}>Фамилия *</label>
              <input placeholder="Иванов" value={formData.last_name}
                onChange={e => setFormData({ ...formData, last_name: e.target.value })} required style={inp}/>
            </div>
            <div>
              <label style={label}>Имя *</label>
              <input placeholder="Иван" value={formData.first_name}
                onChange={e => setFormData({ ...formData, first_name: e.target.value })} required style={inp}/>
            </div>
          </div>

          <div>
            <label style={label}>Отчество</label>
            <input placeholder="Иванович" value={formData.middle_name}
              onChange={e => setFormData({ ...formData, middle_name: e.target.value })} style={inp}/>
          </div>

          <div>
            <label style={label}>Email *</label>
            <input type="email" placeholder="user@school.ru" value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })} required style={inp}/>
          </div>

          <div>
            <label style={label}>Пароль *</label>
            <input type="password" placeholder="Минимум 6 символов" value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })} required minLength={6} style={inp}/>
          </div>

          <div>
            <label style={label}>Роль *</label>
            <select value={formData.role_id} onChange={e => setFormData({ ...formData, role_id: e.target.value })} required style={inp}>
              <option value="">Выберите роль</option>
              {metadata.roles.map(r => <option key={r.ID} value={r.ID}>{r.name}</option>)}
            </select>
          </div>

          {roleName && (
            <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#0369a1' }}>
              {roleName === 'STUDENT' && 'После создания назначьте ученика в класс в разделе «Пользователи»'}
              {roleName === 'PARENT'  && 'После создания привяжите детей к родителю в разделе «Пользователи»'}
              {roleName === 'TEACHER' && 'После создания можно назначить учителя куратором класса в разделе «Классы»'}
              {roleName === 'ADMIN'   && 'Администратор имеет доступ ко всем функциям системы'}
            </div>
          )}

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#dc2626' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" onClick={onClose} style={btnGray}>Отмена</button>
            <button type="submit" disabled={loading} style={btnGreen}>
              {loading ? 'Создание...' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modal = { background: '#fff', borderRadius: 14, padding: 28, width: 480, maxWidth: '95vw', boxShadow: '0 20px 60px rgba(0,0,0,.2)', maxHeight: '90vh', overflowY: 'auto' };
const label = { display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 4 };
const inp = { width: '100%', padding: '10px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' };
const btnGreen = { background: '#10b981', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 };
const btnGray = { background: '#f1f5f9', color: '#475569', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 14 };

export default UserModal;
