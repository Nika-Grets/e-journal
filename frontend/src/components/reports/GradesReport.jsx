// Отчёт по успеваемости: оценки и пропуски по ученику / классу / предмету.
import React, { useState } from 'react';
import { Download, RefreshCw } from 'lucide-react';
import { useReportData } from '../../hooks/useReportData';
import { exportCsv } from '../../utils/exportCsv';
import { exportPdf } from '../../utils/exportPdf';
import { FileText } from 'lucide-react';
import { useRef } from 'react';
import { filterBar, inp, btnBlue, btnGray, tableWrap, tbl, theadRow, th, td } from '../../styles/shared';

// Цвет среднего балла: зелёный / жёлтый / красный
function avgColor(avg) {
  if (!avg) return '#94a3b8';
  const v = Number(avg);
  if (v >= 4.5) return '#10b981';
  if (v >= 3.5) return '#f59e0b';
  return '#ef4444';
}

export default function GradesReport({ classes, subjects }) {
  const [filters, setFilters] = useState({ class_id: '', subject_id: '', startDate: '', endDate: '' });
  const { data, loading, load } = useReportData('/api/users/reports/grades');
  const tableRef = useRef(null);

  const setFilter = (key, value) => setFilters(f => ({ ...f, [key]: value }));

  const handlePdf = () => exportPdf('Отчёт по успеваемости', tableRef.current, 'grades_report');
  
  return (
    <>
      {/* Панель фильтров */}
      <div style={filterBar}>
        <select value={filters.class_id} onChange={e => setFilter('class_id', e.target.value)} style={inp}>
          <option value="">Все классы</option>
          {classes.map(c => <option key={c.ID} value={c.ID}>{c.level}{c.letter}</option>)}
        </select>
        <select value={filters.subject_id} onChange={e => setFilter('subject_id', e.target.value)} style={inp}>
          <option value="">Все предметы</option>
          {subjects.map(s => <option key={s.ID} value={s.ID}>{s.name}</option>)}
        </select>
        <input type="date" value={filters.startDate} onChange={e => setFilter('startDate', e.target.value)} style={inp}/>
        <input type="date" value={filters.endDate}   onChange={e => setFilter('endDate',   e.target.value)} style={inp}/>
        <button onClick={() => load(filters)} disabled={loading} style={btnBlue}>
          {loading ? <RefreshCw size={15}/> : 'Применить'}
        </button>
        <button
          onClick={() => exportCsv(data, 'grades_report.csv')}
          disabled={data.length === 0}
          style={btnGray}
        >
          <Download size={15}/> CSV
        </button>

        <button onClick={handlePdf} disabled={data.length === 0} style={btnGray}>
        <FileText size={15}/> PDF
        </button>
      </div>

      {/* Таблица результатов */}
      <div style={tableWrap} ref={tableRef}>
        <table style={tbl}>
          <thead>
            <tr style={theadRow}>
              <th style={th}>Ученик</th>
              <th style={th}>Класс</th>
              <th style={th}>Предмет</th>
              <th style={th}>Оценок</th>
              <th style={th}>Средний балл</th>
              <th style={th}>Пропусков</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={td}>{row.student_name}</td>
                <td style={td}>{row.class_name}</td>
                <td style={td}>{row.subject_name}</td>
                <td style={{ ...td, textAlign: 'center' }}>{row.grade_count}</td>
                <td style={{ ...td, textAlign: 'center' }}>
                  <span style={{ fontWeight: 700, color: avgColor(row.avg_grade) }}>
                    {row.avg_grade ? Number(row.avg_grade).toFixed(2) : '—'}
                  </span>
                </td>
                <td style={{ ...td, textAlign: 'center', color: row.absences > 5 ? '#ef4444' : '#1e293b' }}>
                  {row.absences || 0}
                </td>
              </tr>
            ))}
            {data.length === 0 && !loading && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                  Нет данных. Нажмите «Применить» для загрузки.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
