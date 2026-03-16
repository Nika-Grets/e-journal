// Отчёт по посещаемости: пропуски и процент прогулов по классам.
import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { useReportData } from '../../hooks/useReportData';
import { exportCsv } from '../../utils/exportCsv';
import { exportPdf } from '../../utils/exportPdf';
import { FileText } from 'lucide-react';
import { useRef } from 'react';
import { filterBar, inp, btnBlue, btnGray, tableWrap, tbl, theadRow, th, td } from '../../styles/shared';

// Цвет процента прогулов: красный / жёлтый / зелёный
function absenceColor(pct) {
  const v = Number(pct);
  if (v > 20) return '#ef4444';
  if (v > 10) return '#f59e0b';
  return '#10b981';
}

export default function AttendanceReport({ classes }) {
  const [filters, setFilters] = useState({ class_id: '', startDate: '', endDate: '' });
  const { data, loading, load } = useReportData('/api/users/reports/attendance');
  const tableRef = useRef(null);
  const setFilter = (key, value) => setFilters(f => ({ ...f, [key]: value }));

const handlePdf = () => exportPdf('Отчёт по посещаемости', tableRef.current, 'attendance_report');

  return (
    <>
      <div style={filterBar}>
        <select value={filters.class_id} onChange={e => setFilter('class_id', e.target.value)} style={inp}>
          <option value="">Все классы</option>
          {classes.map(c => <option key={c.ID} value={c.ID}>{c.level}{c.letter}</option>)}
        </select>
        <input type="date" value={filters.startDate} onChange={e => setFilter('startDate', e.target.value)} style={inp}/>
        <input type="date" value={filters.endDate}   onChange={e => setFilter('endDate',   e.target.value)} style={inp}/>
        <button onClick={() => load(filters)} disabled={loading} style={btnBlue}>
          {loading ? 'Загрузка...' : 'Применить'}
        </button>
        <button
          onClick={() => exportCsv(data, 'attendance_report.csv')}
          disabled={data.length === 0}
          style={btnGray}
        >
          <Download size={15}/> CSV
        </button>

        <button onClick={handlePdf} disabled={data.length === 0} style={btnGray}>
          <FileText size={15}/> PDF
        </button>
      </div>

      <div style={tableWrap} ref={tableRef}>
        <table style={tbl}>
          <thead>
            <tr style={theadRow}>
              <th style={th}>Ученик</th>
              <th style={th}>Класс</th>
              <th style={th}>Всего уроков</th>
              <th style={th}>Пропусков</th>
              <th style={th}>% прогулов</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={td}>{row.student_name}</td>
                <td style={td}>{row.class_name}</td>
                <td style={{ ...td, textAlign: 'center' }}>{row.total_lessons}</td>
                <td style={{ ...td, textAlign: 'center' }}>{row.absences || 0}</td>
                <td style={{ ...td, textAlign: 'center' }}>
                  <span style={{ fontWeight: 600, color: absenceColor(row.absence_pct) }}>
                    {row.absence_pct || 0}%
                  </span>
                </td>
              </tr>
            ))}
            {data.length === 0 && !loading && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
                  Нажмите «Применить» для загрузки
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
