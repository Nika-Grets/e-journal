// Хук для загрузки данных отчёта с состояниями загрузки и ошибки.
// Устраняет дублирование паттерна loading/try/finally в каждом отчёте.
import { useState, useCallback } from 'react';
import api from '../api/axios';

/**
 * @param {string} url — эндпоинт API
 * @returns {{ data, loading, load }} — данные, флаг загрузки и функция запуска
 */
export function useReportData(url) {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      // Убираем пустые значения из параметров, чтобы не загрязнять URL
      const cleanParams = Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== '' && v != null)
      );
      const r = await api.get(url, { params: cleanParams });
      setData(r.data);
    } finally {
      setLoading(false);
    }
  }, [url]);

  return { data, loading, load };
}
