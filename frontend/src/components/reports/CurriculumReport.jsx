import React, { useState, useRef, useMemo } from 'react';
import { Download, RefreshCw, FileText, AlertCircle } from 'lucide-react';
import { useReportData } from '../../hooks/useReportData';
import { filterBar, inp, btnBlue, btnGray, tableWrap, tbl, theadRow, th, td } from '../../styles/shared';
import { exportPdf } from '../../utils/exportPdf';
import { exportCsv } from '../../utils/exportCsv';

// --- ВСПОМОГАТЕЛЬНАЯ ЛОГИКА ---

// Считаем, сколько % учебного плана ДОЛЖНО быть выполнено к сегодняшнему дню
const getExpectedProgress = () => {
  const start = new Date(new Date().getFullYear() - (new Date().getMonth() < 8 ? 1 : 0), 8, 1); // 1 сентября
  const end = new Date(start.getFullYear() + 1, 4, 31); // 31 мая
  const today = new Date();
  
  if (today < start) return 0;
  if (today > end) return 100;
  
  const totalDays = (end - start) / (1000 * 60 * 60 * 24);
  const elapsedDays = (today - start) / (1000 * 60 * 60 * 24);
  return Math.round((elapsedDays / totalDays) * 100);
};

const EXPECTED_PROGRESS = getExpectedProgress();

function statusColor(value, isLagging) {
  if (isLagging) return '#ef4444'; // Яркий красный при отставании
  return value >= 80 ? '#10b981' : value >= 50 ? '#f59e0b' : '#ef4444';
}

function pct(covered, planned) {
  if (!planned || planned === 0) return 0;
  return Math.min(100, Math.round((covered / planned) * 100));
}

function ProgressBar({ value, isLagging }) {
  const color = statusColor(value, isLagging);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ 
            width: `${value}%`, 
            height: '100%', 
            background: color, 
            borderRadius: 4, 
            transition: 'width .3s',
            boxShadow: isLagging ? '0 0 4px rgba(239, 68, 68, 0.3)' : 'none'
        }}/>
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color, width: 36, textAlign: 'right' }}>{value}%</span>
    </div>
  );
}

const thC = { ...th, textAlign: 'center' };
const tdC = { ...td, textAlign: 'center' };

export default function CurriculumReport({ classes }) {
  const [filters, setFilters] = useState({ class_id: '' });
  const { data, loading, load } = useReportData('/api/users/reports/curriculum');
  const tableRef = useRef(null);

  const handlePdf = () => exportPdf('Отчёт по учебному плану', tableRef.current, 'curriculum_report');

  // Расчет средних показателей для сводки
  const summary = useMemo(() => {
    if (!data.length) return { avgPct: 0, lagging: 0, totalHours: 0 };
    
    const rowsWithPlan = data.filter(r => r.planned_hours > 0);
    const totalPct = rowsWithPlan.reduce((sum, r) => sum + pct(r.covered_hours, r.planned_hours), 0);
    const laggingCount = rowsWithPlan.filter(r => pct(r.covered_hours, r.planned_hours) < (EXPECTED_PROGRESS - 10)).length;

    return {
      avgPct: rowsWithPlan.length ? Math.round(totalPct / rowsWithPlan.length) : 0,
      lagging: laggingCount,
      totalHours: data.reduce((s, r) => s + (r.covered_hours ?? 0), 0)
    };
  }, [data]);

  return (
    <>
      <div style={filterBar}>
        <select value={filters.class_id} onChange={e => setFilters(f => ({ ...f, class_id: e.target.value }))} style={inp}>
          <option value="">Все классы</option>
          {classes.map(c => <option key={c.ID} value={c.ID}>{c.level}{c.letter}</option>)}
        </select>
        <button onClick={() => load(filters)} disabled={loading} style={btnBlue}>
          {loading ? <RefreshCw size={15} className="animate-spin"/> : 'Применить'}
        </button>
        <button onClick={() => exportCsv(data, 'curriculum_report.csv')} disabled={data.length === 0} style={btnGray}>
          <Download size={15}/> CSV
        </button>
        <button onClick={handlePdf} disabled={data.length === 0} style={btnGray}>
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
                  <th style={thC}>План (ч)</th>
                  <th style={thC}>Факт (ч)</th>
                  <th style={{ ...th, minWidth: 150 }}>Выполнение (по часам)</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => {
                  const donePct = pct(row.covered_hours, row.planned_hours);
                  // Считаем отставание: если текущий % меньше ожидаемого на 10%
                  const isLagging = row.planned_hours > 0 && donePct < (EXPECTED_PROGRESS - 10);

                  return (
                    <tr key={i} style={{ 
                        borderBottom: '1px solid #f1f5f9',
                        backgroundColor: isLagging ? '#fff1f2' : 'transparent' 
                    }}>
                      <td style={{ ...td, fontWeight: 700, color: '#0f172a' }}>{row.class_name}</td>
                      <td style={td}>{row.subject_name}</td>
                      <td style={{ ...td, color: '#64748b', fontSize: 13 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {row.teacher_name || '—'}
                            {isLagging && <AlertCircle size={14} color="#ef4444" title={`Отставание от графика (ожидается ${EXPECTED_PROGRESS}%)`} />}
                        </div>
                      </td>
                      <td style={tdC}>{row.planned_hours || 0}</td>
                      <td style={{ ...tdC, fontWeight: 700 }}>{row.covered_hours || 0}</td>
                      <td style={{ ...td, minWidth: 150 }}>
                        {row.planned_hours > 0
                          ? <ProgressBar value={donePct} isLagging={isLagging}/>
                          : <span style={{ fontSize: 12, color: '#94a3b8' }}>Нет плана</span>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {[
              { label: 'Всего предметов',  value: data.length },
              { label: 'Часов выдано',    value: summary.totalHours + ' ч.' },
              { label: 'Средний % плана', value: summary.avgPct + '%', color: statusColor(summary.avgPct) },
              { label: 'Критическое отставание', value: summary.lagging, color: summary.lagging > 0 ? '#ef4444' : '#10b981' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 20px', minWidth: 160 }}>
                <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 4, textTransform: 'uppercase' }}>{label}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: color || '#0f172a' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
