const { Sequelize } = require('sequelize');

async function gradesRoutes(fastify, options) {
  const sequelize = options.sequelize;

  fastify.addHook('preHandler', async (req, reply) => {
    try { await req.jwtVerify(); }
    catch { reply.code(401).send({ error: 'Необходима авторизация' }); }
  });

  // GET /api/grades/student/:studentId — все оценки ученика
  fastify.get('/student/:studentId', async (req, reply) => {
    const { studentId } = req.params;
    const { id, permissions = [] } = req.user;

    // Проверка прав: смотреть только свои оценки (или читать все)
    const canAll = permissions.includes('grades:read_all');
    const canOwn = permissions.includes('grades:read_own');

    if (!canAll && !canOwn) {
      return reply.code(403).send({ error: 'Нет прав на просмотр оценок' });
    }

    // Если не admin — проверяем что это свой студент или дочерний аккаунт
    if (!canAll) {
      const isOwnStudent = String(studentId) === String(id);
      // Проверяем родитель-ребёнок
      const [link] = await sequelize.query(
        'SELECT 1 FROM parents_students WHERE parent_ID = ? AND student_ID = ?',
        { replacements: [id, studentId], type: Sequelize.QueryTypes.SELECT }
      );
      if (!isOwnStudent && !link) {
        return reply.code(403).send({ error: 'Нет доступа к оценкам этого ученика' });
      }
    }

    const grades = await sequelize.query(
      `SELECT g.value, g.created_at AS lesson_date,
              s.name AS subject_name,
              t.title AS topic_title,
              l.date
       FROM grades g
       JOIN lessons l ON g.lesson_ID = l.ID
       JOIN subjects s ON l.subject_ID = s.ID
       LEFT JOIN topics t ON l.topic_ID = t.ID
       WHERE g.student_ID = ?
       ORDER BY l.date DESC`,
      { replacements: [studentId], type: Sequelize.QueryTypes.SELECT }
    );
    return grades;
  });

  // GET /api/grades/recent?student_id=N — последние 10 оценок для дашборда
  fastify.get('/recent', async (req, reply) => {
    const { student_id } = req.query;
    const { id, permissions = [] } = req.user;
    const canAll = permissions.includes('grades:read_all');
    const canOwn = permissions.includes('grades:read_own');

    if (!canAll && !canOwn) {
      return reply.code(403).send({ error: 'Нет прав' });
    }

    const target = student_id || id;

    if (!canAll) {
      const isOwn = String(target) === String(id);
      const [link] = await sequelize.query(
        'SELECT 1 FROM parents_students WHERE parent_ID = ? AND student_ID = ?',
        { replacements: [id, target], type: Sequelize.QueryTypes.SELECT }
      );
      if (!isOwn && !link) return reply.code(403).send({ error: 'Нет доступа' });
    }

    const grades = await sequelize.query(
      `SELECT g.value, l.date, s.name AS subject_name
       FROM grades g
       JOIN lessons l ON g.lesson_ID = l.ID
       JOIN subjects s ON l.subject_ID = s.ID
       WHERE g.student_ID = ?
       ORDER BY l.date DESC LIMIT 10`,
      { replacements: [target], type: Sequelize.QueryTypes.SELECT }
    );
    return grades;
  });
}

module.exports = gradesRoutes;
