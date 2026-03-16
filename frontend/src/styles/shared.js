// Общие стили UI-компонентов.
// Импортируйте нужные константы вместо того, чтобы дублировать их в каждом файле.

// ── Поля ввода ────────────────────────────────────────────────────────────────

export const inp = {
  padding: '8px 12px',
  border: '1px solid #e2e8f0',
  borderRadius: 8,
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
};

// ── Кнопки ────────────────────────────────────────────────────────────────────

export const btnPrimary = {
  background: '#3b82f6', color: '#fff', border: 'none',
  padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
  display: 'flex', alignItems: 'center', gap: 6, fontSize: 14,
};

export const btnSuccess = {
  background: '#10b981', color: '#fff', border: 'none',
  padding: '8px 14px', borderRadius: 8, cursor: 'pointer',
  display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
};

export const btnGray = {
  background: '#f1f5f9', color: '#475569', border: 'none',
  padding: '6px 12px', borderRadius: 6, cursor: 'pointer',
  display: 'flex', alignItems: 'center', gap: 4, fontSize: 13,
};

export const btnDanger = {
  background: '#fef2f2', color: '#ef4444', border: 'none',
  padding: '6px 10px', borderRadius: 6, cursor: 'pointer',
  display: 'flex', alignItems: 'center',
};

export const btnBlue = {
  background: '#3b82f6', color: '#fff', border: 'none',
  padding: '8px 20px', borderRadius: 8, cursor: 'pointer',
  fontWeight: 600, fontSize: 14,
};

// ── Таблицы ───────────────────────────────────────────────────────────────────

export const tableWrap = {
  background: '#fff', borderRadius: 12,
  border: '1px solid #e2e8f0', overflow: 'auto',
};

export const tbl = { width: '100%', borderCollapse: 'collapse' };

export const theadRow = { background: '#f8fafc', borderBottom: '2px solid #e2e8f0' };

export const th = {
  padding: '12px 16px', textAlign: 'left',
  fontSize: 12, fontWeight: 600, color: '#64748b',
  textTransform: 'uppercase', letterSpacing: 0.4,
};

export const td = {
  padding: '12px 16px', fontSize: 14,
  color: '#1e293b', verticalAlign: 'top',
};

// ── Прочее ────────────────────────────────────────────────────────────────────

export const panel = {
  background: '#fff', borderRadius: 12,
  border: '1px solid #e2e8f0', padding: 20,
};

export const filterBar = {
  display: 'flex', gap: 10, alignItems: 'center',
  marginBottom: 20, flexWrap: 'wrap',
  background: '#f8fafc', padding: 16, borderRadius: 10,
};
