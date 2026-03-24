const { Sequelize } = require('sequelize');

async function curriculumRoutes(fastify, options) {
  const sequelize = options.sequelize;

  fastify.addHook('preHandler', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.code(401).send({ error: 'Необходима авторизация' });
    }
  });

  // GET /api/grade-levels
  fastify.get('/grade-levels', async (request, reply) => {
    const levels = await sequelize.query(
      'SELECT ID, level FROM level ORDER BY level ASC',
      { type: Sequelize.QueryTypes.SELECT }
    );
    return levels;
  });

  // GET /api/topics?subject_id=N&grade_level=N
  // grade_level здесь — это level.ID (FK), именно так хранится в topics.grade_level
  fastify.get('/topics', async (request, reply) => {
    const { subject_id, grade_level } = request.query;
    // grade_level приходит как level.ID из select'а на фронтенде
    const topics = await sequelize.query(
      `SELECT * FROM topics
       WHERE subject_id = ? AND grade_level = ?
       ORDER BY order_index ASC`,
      {
        replacements: [subject_id, grade_level],
        type: Sequelize.QueryTypes.SELECT
      }
    );
    return topics;
  });

  // POST /api/topics
  fastify.post('/topics', async (request, reply) => {
    const { subject_id, grade_level, title, description, hours_allocated, order_index } = request.body;
    try {
      await sequelize.query(
        `INSERT INTO topics (subject_id, grade_level, title, description, hours_allocated, order_index)
         VALUES (?, ?, ?, ?, ?, ?)`,
        {
          replacements: [subject_id, grade_level, title, description, Number(hours_allocated), order_index],
          type: Sequelize.QueryTypes.INSERT
        }
      );
      return { success: true };
    } catch (err) {
      console.error('Ошибка при вставке темы:', err);
      reply.code(500).send({ error: 'Не удалось сохранить тему в базу данных' });
    }
  });

  // PUT /api/topics/:id
  fastify.put('/topics/:id', async (request, reply) => {
    const { id } = request.params;
    const { title, description, hours_allocated } = request.body;
    try {
      await sequelize.query(
        `UPDATE topics SET title = ?, description = ?, hours_allocated = ? WHERE ID = ?`,
        {
          replacements: [title, description, Number(hours_allocated), id],
          type: Sequelize.QueryTypes.UPDATE
        }
      );
      return { success: true };
    } catch (err) {
      console.error('Ошибка при обновлении темы:', err);
      reply.code(500).send({ error: 'Не удалось обновить тему' });
    }
  });

  // DELETE /api/topics/:id
  fastify.delete('/topics/:id', async (request, reply) => {
    const { id } = request.params;
    await sequelize.query('DELETE FROM topics WHERE ID = ?', { replacements: [id] });
    return { success: true };
  });

  // GET /api/topics/usage?class_id=N&subject_id=N&grade_level=N
  // Возвращает для каждой темы: запланировано часов / пройдено часов (только прошедшие уроки)
  // Час = 45 мин. Урок длиной 90 мин = 2 часа.
  fastify.get('/topics/usage', async (request, reply) => {
    const { class_id, subject_id, grade_level } = request.query;
    if (!subject_id || !grade_level) return reply.code(400).send({ error: 'subject_id и grade_level обязательны' });

    const rows = await sequelize.query(
      `SELECT
         t.ID                AS topic_id,
         t.title             AS topic_title,
         t.hours_allocated,
         COUNT(l.ID)         AS lessons_total,
         COALESCE(SUM(CAST(ls.duration AS REAL)) / 45.0, 0)  AS hours_scheduled,
         COALESCE(SUM(CASE WHEN l.date <= date('now') THEN CAST(ls.duration AS REAL) ELSE 0 END) / 45.0, 0) AS hours_done
       FROM topics t
       LEFT JOIN lessons l
         ON l.topic_ID = t.ID
         ${class_id ? 'AND l.class_ID = ?' : ''}
       LEFT JOIN lesson_schedule ls ON ls.lesson_num = l.lesson_num
       WHERE t.subject_id = ? AND t.grade_level = ?
       GROUP BY t.ID`,
      {
        replacements: class_id
          ? [class_id, subject_id, grade_level]
          : [subject_id, grade_level],
        type: Sequelize.QueryTypes.SELECT
      }
    );
    return rows;
  });
}

module.exports = curriculumRoutes;
