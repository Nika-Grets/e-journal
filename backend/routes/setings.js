import { Sequelize } from 'sequelize';

export default async function settingsRoutes(fastify, options) {
  const sequelize = options.sequelize;

 // Получить все настройки (и расписание, и лимиты)
fastify.get('/settings/all', async (request, reply) => {
  const schedule = await sequelize.query('SELECT * FROM lesson_schedule ORDER BY lesson_num ASC', { type: Sequelize.QueryTypes.SELECT });
  const config = await sequelize.query('SELECT * FROM school_config', { type: Sequelize.QueryTypes.SELECT });
  const configObj = config.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});
  
  return { schedule, config: configObj };
});

// Сохранить всё сразу
fastify.post('/settings/save-all', async (request, reply) => {
  const { schedule, config } = request.body;
  const t = await sequelize.transaction();
  try {
    // Сохраняем лимиты
    for (const [key, value] of Object.entries(config)) {
      await sequelize.query('INSERT INTO school_config (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?', 
        { replacements: [key, value, value], transaction: t });
    }
    // Сохраняем строки расписания
    for (const item of schedule) {
      await sequelize.query('INSERT INTO lesson_schedule (lesson_num, start_time, duration, break_after) VALUES (?, ?, ?, ?) ON CONFLICT(lesson_num) DO UPDATE SET start_time=EXCLUDED.start_time, duration=EXCLUDED.duration, break_after=EXCLUDED.break_after',
        { replacements: [item.lesson_num, item.start_time, item.duration, item.break_after], transaction: t });
    }
    await t.commit();
    return { success: true };
  } catch (e) { await t.rollback(); throw e; }
});
}