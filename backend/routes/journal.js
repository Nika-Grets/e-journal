const { Sequelize } = require('sequelize');

async function journalRoutes(fastify, options) {
  const sequelize = options.sequelize;

  fastify.addHook('preHandler', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.code(401).send({ error: 'Необходима авторизация' });
    }
  });

  // GET /api/teacher/classes — классы учителя
  fastify.get('/teacher/classes', async (request, reply) => {
    const teacher_id = request.user.id;
    const classes = await sequelize.query(
      `SELECT DISTINCT c.ID, c.level, c.letter
       FROM lessons l
       JOIN classes c ON l.class_ID = c.ID
       WHERE l.teacher_ID = ?`,
      { replacements: [teacher_id], type: Sequelize.QueryTypes.SELECT }
    );
    return classes;
  });

  // GET /api/teacher/subjects?class_id=N — предметы учителя в классе
  fastify.get('/teacher/subjects', async (request, reply) => {
    const { class_id } = request.query;
    const teacher_id = request.user.id;
    const subjects = await sequelize.query(
      `SELECT DISTINCT s.ID, s.name
       FROM lessons l
       JOIN subjects s ON l.subject_ID = s.ID
       WHERE l.teacher_ID = ? AND l.class_ID = ?`,
      { replacements: [teacher_id, class_id], type: Sequelize.QueryTypes.SELECT }
    );
    return subjects;
  });

  // GET /api/lessons/journal?class_id=N&subject_id=N — уроки для журнала
  fastify.get('/lessons/journal', async (request, reply) => {
    const { class_id, subject_id } = request.query;
    const teacher_id = request.user.id;
    try {
      const lessons = await sequelize.query(
        `SELECT l.ID, l.date, l.lesson_num,
                t.title AS topic_title
         FROM lessons l
         LEFT JOIN topics t ON l.topic_ID = t.ID
         WHERE l.class_ID = ? AND l.subject_ID = ? AND l.teacher_ID = ?
         ORDER BY l.date ASC`,
        {
          replacements: [class_id, subject_id, teacher_id],
          type: Sequelize.QueryTypes.SELECT
        }
      );
      return lessons;
    } catch (err) {
      reply.code(500).send({ error: err.message });
    }
  });

  // GET /api/grades?class_id=N&subject_id=N — оценки и посещаемость
  fastify.get('/grades', async (request, reply) => {
    const { class_id, subject_id } = request.query;

    // Проверка права
    const { permissions = [] } = request.user;
    if (!permissions.includes('grades:write') && !permissions.includes('grades:read_all')) {
      return reply.code(403).send({ error: 'Нет прав на просмотр оценок' });
    }

    const data = await sequelize.query(
      `SELECT
         g.student_ID,
         g.lesson_ID,
         g.value     AS grade,
         a.status    AS absence
       FROM lessons l
       LEFT JOIN grades g      ON g.lesson_ID   = l.ID
       LEFT JOIN attandance a  ON a.lesson_ID   = l.ID
                               AND a.student_ID = g.student_ID
       WHERE l.class_ID = ? AND l.subject_ID = ?`,
      { replacements: [class_id, subject_id], type: Sequelize.QueryTypes.SELECT }
    );
    return data;
  });

  // POST /api/grades — сохранить оценку / пропуск
  fastify.post('/grades', async (request, reply) => {
    const { permissions = [] } = request.user;
    if (!permissions.includes('grades:write')) {
      return reply.code(403).send({ error: 'Нет прав на выставление оценок' });
    }

    const { student_id, lesson_id, value } = request.body;
    const val        = value ? String(value).toUpperCase().trim() : '';
    const hasAbsence = val.includes('Н') || val.includes('N');
    const gradeMatch = val.match(/[2-5]/);
    const gradeValue = gradeMatch ? gradeMatch[0] : null;

    const t = await sequelize.transaction();
    try {
      // Посещаемость
      if (hasAbsence) {
        await sequelize.query(
          `INSERT INTO attandance (student_ID, lesson_ID, status)
           VALUES (?, ?, 'Н')
           ON CONFLICT(student_ID, lesson_ID) DO UPDATE SET status = 'Н'`,
          { replacements: [student_id, lesson_id], transaction: t }
        );
      } else {
        await sequelize.query(
          'DELETE FROM attandance WHERE student_ID = ? AND lesson_ID = ?',
          { replacements: [student_id, lesson_id], transaction: t }
        );
      }

      // Оценка
      if (gradeValue) {
        await sequelize.query(
          `INSERT INTO grades (student_ID, lesson_ID, value)
           VALUES (?, ?, ?)
           ON CONFLICT(student_ID, lesson_ID) DO UPDATE SET value = ?`,
          { replacements: [student_id, lesson_id, gradeValue, gradeValue], transaction: t }
        );
      } else {
        await sequelize.query(
          'DELETE FROM grades WHERE student_ID = ? AND lesson_ID = ?',
          { replacements: [student_id, lesson_id], transaction: t }
        );
      }

      await t.commit();
      return { success: true };
    } catch (err) {
      await t.rollback();
      console.error('ОШИБКА ПРИ СОХРАНЕНИИ:', err);
      return reply.code(500).send({ error: err.message });
    }
  });
}

module.exports = journalRoutes;