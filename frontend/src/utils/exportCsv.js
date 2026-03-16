// Утилита экспорта массива объектов в CSV-файл.
// BOM-заголовок (\uFEFF) нужен для корректного открытия в Excel.

/**
 * @param {Array<Object>} data     — массив строк таблицы
 * @param {string}        filename — имя скачиваемого файла
 */
export function exportCsv(data, filename) {
  if (!data || data.length === 0) return;

  const keys = Object.keys(data[0]);
  const rows = data.map(row =>
    keys.map(k => `"${(row[k] ?? '').toString().replace(/"/g, '""')}"`).join(';')
  );
  const csv = [keys.join(';'), ...rows].join('\n');

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
}
