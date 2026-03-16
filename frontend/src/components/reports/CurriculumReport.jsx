// Отчёт по выполнению учебного плана:
// сколько тем пройдено, сколько часов запланировано / пройдено — по каждому классу, предмету, учителю.
import React, { useState, useRef } from 'react';
import { Download, RefreshCw, FileText } from 'lucide-react';
import { useReportData } from '../../hooks/useReportData';
import { filterBar, inp, btnBlue, btnGray, tableWrap, tbl, theadRow, th, td } from '../../styles/shared';
import { exportPdf } from '../../utils/exportPdf';
import { exportCsv } from '../../utils/exportCsv';

// Цвет прогресса
function pct(covered, planned) {
  if (!planned) return 0;
  return Math.min(100, Math.round((covered / planned) * 100));
}
function ProgressBar({ value }) {
  const color = value >= 80 ? '#10b981' : value >= 50 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, height: '100%', background: color, borderRadius: 4, transition: 'width .3s' }}/>
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color, width: 36, textAlign: 'right' }}>{value}%</span>
    </div>
  );
}

export default function CurriculumReport({ classes }) {
  const [filters, setFilters] = useState({ class_id: '' });
  const { data, loading, load } = useReportData('/api/users/reports/curriculum');
  const tableRef = useRef(null);
const handlePdf = () => exportPdf('Отчёт по учебному плану', tableRef.current, 'curriculum_report');

  return (
    <>
      <div style={filterBar}>
        <select value={filters.class_id} onChange={e => setFilters(f => ({ ...f, class_id: e.target.value }))} style={inp}>
          <option value="">Все классы</option>
          {classes.map(c => <option key={c.ID} value={c.ID}>{c.level}{c.letter}</option>)}
        </select>
        <button onClick={() => load(filters)} disabled={loading} style={btnBlue}>
          {loading ? <RefreshCw size={15}/> : 'Применить'}
        </button>
        <button
          onClick={() => exportCsv(data, 'curriculum_report.csv')}
          disabled={data.length === 0}
          style={btnGray}
        >
          <Download size={15}/> CSV
        </button>
        <button onClick={handlePdf} disabled={data.length === 0} style={{ ...btnGray }}>
          <FileText size={15}/> PDF
        </button>
      </div>

      {data.length === 0 && !loading && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#94a3b8' }}>
          Нажмите «Применить» для формирования отчёта
        </div>
      )}

      {data.length > 0 && (
        <div ref={tableRef}>
          <div style={tableWrap}>
            <table style={tbl}>
              <thead>
                <tr style={theadRow}>
                  <th style={th}>Класс</th>
                  <th style={th}>Предмет</th>
                  <th style={th}>Учитель</th>
                  <th style={{ ...th, textAlign: 'center' }}>Уроков проведено</th>
                  <th style={{ ...th, textAlign: 'center' }}>Тем пройдено</th>
                  <th style={{ ...th, textAlign: 'center' }}>Тем по плану</th>
                  <th style={{ ...th, textAlign: 'center' }}>Часов по плану</th>
                  <th style={{ ...th, minWidth: 150 }}>Выполнение</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => {
                  const p = pct(row.covered_topics, row.planned_topics);
                  const pColor = p >= 80 ? '#10b981' : p >= 50 ? '#f59e0b' : '#ef4444';
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ ...td, fontWeight: 700, color: '#0f172a' }}>{row.class_name}</td>
                      <td style={td}>{row.subject_name}</td>
                      <td style={{ ...td, color: '#64748b', fontSize: 13 }}>{row.teacher_name || '—'}</td>
                      <td style={{ ...td, textAlign: 'center' }}>{row.total_lessons}</td>
                      <td style={{ ...td, textAlign: 'center' }}>
                        <span style={{ fontWeight: 700, color: pColor }}>{row.covered_topics}</span>
                      </td>
                      <td style={{ ...td, textAlign: 'center' }}>{row.planned_topics || '—'}</td>
                      <td style={{ ...td, textAlign: 'center' }}>{row.planned_hours ? `${row.planned_hours} ч.` : '—'}</td>
                      <td style={{ ...td, minWidth: 150 }}>
                        {row.planned_topics > 0
                          ? <ProgressBar value={p}/>
                          : <span style={{ fontSize: 12, color: '#94a3b8' }}>Нет плана</span>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Сводка */}
          <div style={{ marginTop: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {[
              { label: 'Всего записей', value: data.length },
              { label: 'Уроков проведено', value: data.reduce((s, r) => s + (r.total_lessons || 0), 0) },
              { label: 'Тем пройдено', value: data.reduce((s, r) => s + (r.covered_topics || 0), 0) },
              { label: 'Часов по плану', value: data.reduce((s, r) => s + (r.planned_hours || 0), 0) + ' ч.' },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 20px', minWidth: 140 }}>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
