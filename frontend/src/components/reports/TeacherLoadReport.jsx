// Отчёт по нагрузке учителей: количество уроков и классов за период.
import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { useReportData } from '../../hooks/useReportData';
import { exportCsv } from '../../utils/exportCsv';
import { exportPdf } from '../../utils/exportPdf';
import { FileText } from 'lucide-react';
import { useRef } from 'react';
import { filterBar, inp, btnBlue, btnGray, tableWrap, tbl, theadRow, th, td } from '../../styles/shared';

export default function TeacherLoadReport() {
  const [filters, setFilters] = useState({ startDate: '', endDate: '' });
  const { data, loading, load } = useReportData('/api/users/reports/teacher-load');

  const setFilter = (key, value) => setFilters(f => ({ ...f, [key]: value }));

  const tableRef = useRef(null);

const handlePdf = () => exportPdf('Нагрузка учителей', tableRef.current, 'teacher_load_report');

  return (
    <>
      <div style={filterBar}>
        <input type="date" value={filters.startDate} onChange={e => setFilter('startDate', e.target.value)} style={inp}/>
        <input type="date" value={filters.endDate}   onChange={e => setFilter('endDate',   e.target.value)} style={inp}/>
        <button onClick={() => load(filters)} disabled={loading} style={btnBlue}>
          {loading ? 'Загрузка...' : 'Применить'}
        </button>
        <button
          onClick={() => exportCsv(data, 'teacher_load_report.csv')}
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
              <th style={th}>Учитель</th>
              <th style={th}>Предмет</th>
              <th style={th}>Уроков</th>
              <th style={th}>Классов</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={td}>{row.teacher_name}</td>
                <td style={td}>{row.subject_name}</td>
                <td style={{ ...td, textAlign: 'center', fontWeight: 600 }}>{row.lesson_count}</td>
                <td style={{ ...td, textAlign: 'center' }}>{row.class_count}</td>
              </tr>
            ))}
            {data.length === 0 && !loading && (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>
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
