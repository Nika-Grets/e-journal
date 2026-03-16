const bcrypt = require('bcrypt');
const { Sequelize } = require('sequelize');

async function userRoutes(fastify, options) {
  const sequelize = options.sequelize;

  fastify.addHook('preHandler', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.code(401).send({ error: 'Необходима авторизация' });
    }
  });

  // GET /api/users/metadata
  fastify.get('/metadata', async (request, reply) => {
    const roles = await sequelize.query('SELECT ID, name FROM roles', { type: Sequelize.QueryTypes.SELECT });
    const permissions = await sequelize.query('SELECT ID, slug, description FROM permissions', { type: Sequelize.QueryTypes.SELECT });
    return { roles, permissions };
  });

  // GET /api/users  — все пользователи с классами
  fastify.get('/', async (request, reply) => {
    const users = await sequelize.query(
      `SELECT u.ID, u.email, u.role_id, u.is_active,
              p.first_name, p.last_name, p.middle_name,
              r.name AS role_name,
              c.level || c.letter AS class_name,
              c.ID AS class_id
       FROM users u
       LEFT JOIN profiles p ON u.ID = p.ID
       LEFT JOIN roles r ON u.role_id = r.ID
       LEFT JOIN student_class sc ON u.ID = sc.student_ID
       LEFT JOIN classes c ON sc.class_ID = c.ID
       ORDER BY r.name, p.last_name`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    return users;
  });

  // GET /api/users/by-role/:role  — пользователи по роли
  fastify.get('/by-role/:role', async (request, reply) => {
    const { role } = request.params;
    const users = await sequelize.query(
      `SELECT u.ID, p.last_name || ' ' || p.first_name AS name,
              p.first_name, p.last_name, p.middle_name
       FROM users u
       JOIN profiles p ON u.ID = p.ID
       WHERE u.role_id = (SELECT ID FROM roles WHERE name = ?)
       ORDER BY p.last_name`,
      { replacements: [role.toUpperCase()], type: Sequelize.QueryTypes.SELECT }
    );
    return users;
  });

  // GET /api/users/students  — ученики класса
  fastify.get('/students', async (request, reply) => {
    const { class_id } = request.query;
    try {
      const students = await sequelize.query(
        `SELECT u.ID, p.first_name, p.last_name
         FROM users u
         JOIN profiles p ON u.ID = p.ID
         JOIN student_class sc ON u.ID = sc.student_ID
         WHERE sc.class_ID = ?
           AND u.role_id = (SELECT ID FROM roles WHERE name = 'STUDENT')
         ORDER BY p.last_name`,
        { replacements: [class_id], type: Sequelize.QueryTypes.SELECT }
      );
      return students;
    } catch (err) {
      reply.code(500).send({ error: err.message });
    }
  });

  // POST /api/users  — создать пользователя
  fastify.post('/', async (request, reply) => {
    const { email, password, role_id, first_name, last_name, middle_name } = request.body;
    const t = await sequelize.transaction();
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const [userId] = await sequelize.query(
        'INSERT INTO users (email, password, role_id, is_active) VALUES (?, ?, ?, 1)',
        { replacements: [email, hashedPassword, Number(role_id)], transaction: t, type: Sequelize.QueryTypes.INSERT }
      );
      if (!userId) throw new Error('База данных не вернула ID нового пользователя');
      await sequelize.query(
        'INSERT INTO profiles (ID, first_name, last_name, middle_name) VALUES (?, ?, ?, ?)',
        { replacements: [userId, first_name, last_name, middle_name || null], transaction: t }
      );
      await t.commit();
      reply.code(201).send({ message: 'Пользователь успешно создан', id: userId });
    } catch (err) {
      if (t) await t.rollback();
      console.error('ПОЛНАЯ ОШИБКА:', err);
      reply.code(500).send({ error: err.message });
    }
  });

  // PUT /api/users/:id  — обновить пользователя (включая email и ФИО)
  fastify.put('/:id', async (request, reply) => {
    const { id } = request.params;
    const { first_name, last_name, middle_name, role_id, is_active, email } = request.body;
    const t = await sequelize.transaction();
    try {
      await sequelize.query(
        `UPDATE profiles SET first_name = ?, last_name = ?, middle_name = ? WHERE ID = ?`,
        { replacements: [first_name, last_name, middle_name || null, id], transaction: t }
      );
      const setClause = [];
      const vals = [];
      if (role_id   !== undefined) { setClause.push('role_id = ?');  vals.push(role_id); }
      if (is_active !== undefined) { setClause.push('is_active = ?'); vals.push(is_active); }
      if (email     !== undefined && email !== '') { setClause.push('email = ?'); vals.push(email); }
      if (setClause.length > 0) {
        vals.push(id);
        await sequelize.query(
          `UPDATE users SET ${setClause.join(', ')} WHERE ID = ?`,
          { replacements: vals, transaction: t }
        );
      }
      await t.commit();
      return { success: true };
    } catch (err) {
      await t.rollback();
      reply.code(500).send({ error: err.message });
    }
  });

  // DELETE /api/users/:id
  fastify.delete('/:id', {
    preHandler: [fastify.checkPermission('users:manage')]
  }, async (request, reply) => {
    const { id } = request.params;
    await sequelize.query('DELETE FROM student_class WHERE student_ID = ?', { replacements: [id] });
    await sequelize.query('DELETE FROM parents_students WHERE parent_ID = ? OR student_ID = ?', { replacements: [id, id] });
    await sequelize.query('DELETE FROM profiles WHERE ID = ?', { replacements: [id] });
    await sequelize.query('DELETE FROM users WHERE ID = ?', { replacements: [id] });
    return { message: 'Удалено' };
  });

  // GET /api/users/reports/grades  — отчёт по успеваемости
  fastify.get('/reports/grades', {
    preHandler: [fastify.checkPermission('reports:full')]
  }, async (request, reply) => {
    const { class_id, subject_id, startDate, endDate } = request.query;

    let whereConditions = [];
    let replacements = [];

    if (class_id) { whereConditions.push('l.class_ID = ?'); replacements.push(class_id); }
    if (subject_id) { whereConditions.push('l.subject_ID = ?'); replacements.push(subject_id); }
    if (startDate) { whereConditions.push('l.date >= ?'); replacements.push(startDate); }
    if (endDate) { whereConditions.push('l.date <= ?'); replacements.push(endDate); }

    const where = whereConditions.length > 0
      ? 'WHERE g.student_ID IS NOT NULL AND ' + whereConditions.join(' AND ')
      : 'WHERE g.student_ID IS NOT NULL';

    const data = await sequelize.query(
      `SELECT p.last_name || ' ' || p.first_name AS student_name,
              s.name AS subject_name,
              c.level || c.letter AS class_name,
              AVG(CAST(g.value AS FLOAT)) AS avg_grade,
              COUNT(g.ID) AS grade_count,
              COUNT(CASE WHEN a.status = 'Н' THEN 1 END) AS absences
       FROM lessons l
       LEFT JOIN grades g ON g.lesson_ID = l.ID
       LEFT JOIN attandance a ON a.lesson_ID = l.ID AND a.student_ID = g.student_ID
       LEFT JOIN users u ON g.student_ID = u.ID
       LEFT JOIN profiles p ON u.ID = p.ID
       LEFT JOIN subjects s ON l.subject_ID = s.ID
       LEFT JOIN classes c ON l.class_ID = c.ID
       ${where}
       GROUP BY g.student_ID, l.subject_ID
       ORDER BY class_name, student_name, subject_name`,
      { replacements, type: Sequelize.QueryTypes.SELECT }
    );
    return data;
  });

  // GET /api/users/reports/attendance  — отчёт по посещаемости
  fastify.get('/reports/attendance', {
    preHandler: [fastify.checkPermission('reports:full')]
  }, async (request, reply) => {
    const { class_id, startDate, endDate } = request.query;

    const data = await sequelize.query(
      `SELECT p.last_name || ' ' || p.first_name AS student_name,
              c.level || c.letter AS class_name,
              COUNT(l.ID) AS total_lessons,
              COUNT(a.ID) AS absences,
              ROUND(100.0 * COUNT(a.ID) / MAX(COUNT(l.ID), 1), 1) AS absence_pct
       FROM lessons l
       JOIN classes c ON l.class_ID = c.ID
       JOIN student_class sc ON c.ID = sc.class_ID
       JOIN users u ON sc.student_ID = u.ID
       JOIN profiles p ON u.ID = p.ID
       LEFT JOIN attandance a ON a.lesson_ID = l.ID AND a.student_ID = u.ID
       WHERE (? IS NULL OR l.class_ID = ?)
         AND (? IS NULL OR l.date >= ?)
         AND (? IS NULL OR l.date <= ?)
       GROUP BY u.ID
       ORDER BY class_name, student_name`,
      {
        replacements: [class_id || null, class_id || null, startDate || null, startDate || null, endDate || null, endDate || null],
        type: Sequelize.QueryTypes.SELECT
      }
    );
    return data;
  });

  // GET /api/users/reports/teacher-load  — нагрузка учителей
  fastify.get('/reports/teacher-load', {
    preHandler: [fastify.checkPermission('reports:full')]
  }, async (request, reply) => {
    const { startDate, endDate } = request.query;
    const data = await sequelize.query(
      `SELECT p.last_name || ' ' || p.first_name AS teacher_name,
              s.name AS subject_name,
              COUNT(l.ID) AS lesson_count,
              COUNT(DISTINCT l.class_ID) AS class_count
       FROM lessons l
       JOIN profiles p ON l.teacher_ID = p.ID
       JOIN subjects s ON l.subject_ID = s.ID
       WHERE (? IS NULL OR l.date >= ?)
         AND (? IS NULL OR l.date <= ?)
       GROUP BY l.teacher_ID, l.subject_ID
       ORDER BY teacher_name, subject_name`,
      {
        replacements: [startDate || null, startDate || null, endDate || null, endDate || null],
        type: Sequelize.QueryTypes.SELECT
      }
    );
    return data;
  });

  // GET /api/users/reports/curriculum  — отчёт по учебному плану
  fastify.get('/reports/curriculum', {
    preHandler: [fastify.checkPermission('reports:full')]
  }, async (request, reply) => {
    const { class_id } = request.query;
    const classFilter = class_id ? 'AND l.class_ID = ?' : '';
    const replacements = class_id ? [class_id] : [];

    const data = await sequelize.query(
      `SELECT
         c.level || c.letter AS class_name,
         c.level             AS class_level,
         s.name              AS subject_name,
         p.last_name || ' ' || p.first_name AS teacher_name,
         COUNT(DISTINCT l.ID)                                              AS total_lessons,
         COUNT(DISTINCT CASE WHEN l.topic_ID IS NOT NULL THEN l.ID END)   AS covered_lessons,
         COUNT(DISTINCT l.topic_ID)                                        AS covered_topics,
         (SELECT COUNT(*) FROM topics t
          JOIN level lv ON t.grade_level = lv.ID
          WHERE t.subject_id = l.subject_ID AND lv.level = c.level)       AS planned_topics,
         (SELECT COALESCE(SUM(t.hours_allocated),0) FROM topics t
          JOIN level lv ON t.grade_level = lv.ID
          WHERE t.subject_id = l.subject_ID AND lv.level = c.level)       AS planned_hours
       FROM lessons l
       JOIN classes  c ON l.class_ID   = c.ID
       JOIN subjects s ON l.subject_ID = s.ID
       LEFT JOIN profiles p ON l.teacher_ID = p.ID
       WHERE l.teacher_ID IS NOT NULL ${classFilter}
       GROUP BY l.class_ID, l.subject_ID, l.teacher_ID
       ORDER BY class_name, subject_name`,
      { replacements, type: Sequelize.QueryTypes.SELECT }
    );
    return data;
  });
}

module.exports = userRoutes;