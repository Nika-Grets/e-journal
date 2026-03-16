/* eslint-disable no-unused-vars */
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * @param {string}      title     — заголовок документа
 * @param {HTMLElement} tableEl   — ссылка на DOM-элемент таблицы (ref.current)
 * @param {string}      filename  — имя файла без расширения
 */
export async function exportPdf(title, tableEl, filename) {
  // Временный контейнер с белым фоном чтобы canvas не был прозрачным
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:fixed;top:-9999px;left:-9999px;background:#fff;padding:20px;width:1100px;font-family:Arial,sans-serif';

  const heading = document.createElement('h3');
  heading.textContent = title;
  heading.style.cssText = 'margin:0 0 8px;font-size:16px;color:#0f172a';

  const date = document.createElement('p');
  date.textContent = `Сформирован: ${new Date().toLocaleString('ru-RU')}`;
  date.style.cssText = 'margin:0 0 14px;font-size:11px;color:#94a3b8';

  const clone = tableEl.cloneNode(true);
  // убираем прогресс-бары — в PDF они всё равно плохо выглядят, заменяем текстом
  clone.querySelectorAll('[data-pct]').forEach(el => {
    el.textContent = el.getAttribute('data-pct') + '%';
    el.style.fontWeight = '700';
  });

  wrapper.appendChild(heading);
  wrapper.appendChild(date);
  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  try {
    const canvas = await html2canvas(wrapper, { scale: 2, useCORS: true });
    const imgData = canvas.toDataURL('image/png');

    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();

    const imgW = pageW - 20;
    const imgH = (canvas.height * imgW) / canvas.width;

    // Если таблица длинная — разбиваем на страницы
    let y = 10;
    let remaining = imgH;
    let srcY = 0;

    while (remaining > 0) {
      const sliceH = Math.min(remaining, pageH - 20);
      const sliceCanvas = document.createElement('canvas');
      sliceCanvas.width  = canvas.width;
      sliceCanvas.height = (sliceH / imgW) * canvas.width;
      const ctx = sliceCanvas.getContext('2d');
      ctx.drawImage(canvas, 0, srcY * (canvas.width / imgW), canvas.width, sliceCanvas.height, 0, 0, canvas.width, sliceCanvas.height);

      if (srcY > 0) { pdf.addPage(); y = 10; }
      pdf.addImage(sliceCanvas.toDataURL('image/png'), 'PNG', 10, y, imgW, sliceH);

      srcY      += sliceH;
      remaining -= sliceH;
    }

    pdf.save(`${filename}.pdf`);
  } finally {
    document.body.removeChild(wrapper);
  }
}