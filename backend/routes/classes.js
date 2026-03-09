const { Sequelize } = require('sequelize');

async function classesRoutes(fastify, options) {
  const sequelize = options.sequelize;

  fastify.addHook('preHandler', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.code(401).send({ error: 'Необходима авторизация' });
    }
  });

  // GET /api/classes  — все классы с куратором и количеством учеников
  fastify.get('/', async (request, reply) => {
    const classes = await sequelize.query(
      `SELECT c.ID, c.level, c.letter, c.curator_ID,
              p.last_name || ' ' || p.first_name AS curator_name,
              COUNT(sc.student_ID) AS student_count
       FROM classes c
       LEFT JOIN profiles p ON c.curator_ID = p.ID
       LEFT JOIN student_class sc ON c.ID = sc.class_ID
       GROUP BY c.ID
       ORDER BY c.level, c.letter`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    return classes;
  });

  // POST /api/classes  — создать класс
  fastify.post('/', async (request, reply) => {
    const { level, letter, curator_ID } = request.body;
    if (!level || !letter) return reply.code(400).send({ error: 'Укажите уровень и букву' });

    // Добавляем level в таблицу level если нет
    const [lvl] = await sequelize.query(
      `SELECT ID FROM level WHERE level = ?`,
      { replacements: [level], type: Sequelize.QueryTypes.SELECT }
    );
    if (!lvl) {
      await sequelize.query(
        `INSERT INTO level (level) VALUES (?)`,
        { replacements: [level], type: Sequelize.QueryTypes.INSERT }
      );
    }

    try {
      const [classId] = await sequelize.query(
        `INSERT INTO classes (level, letter, curator_ID) VALUES (?, ?, ?)`,
        { replacements: [level, letter.toUpperCase(), curator_ID || null], type: Sequelize.QueryTypes.INSERT }
      );
      return { success: true, id: classId };
    } catch (err) {
      reply.code(500).send({ error: err.message });
    }
  });

  // PUT /api/classes/:id  — обновить класс
  fastify.put('/:id', async (request, reply) => {
    const { id } = request.params;
    const { level, letter, curator_ID } = request.body;
    await sequelize.query(
      `UPDATE classes SET level = ?, letter = ?, curator_ID = ? WHERE ID = ?`,
      { replacements: [level, letter.toUpperCase(), curator_ID || null, id] }
    );
    return { success: true };
  });

  // DELETE /api/classes/:id
  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params;
    const t = await sequelize.transaction();
    try {
      await sequelize.query(`DELETE FROM student_class WHERE class_ID = ?`, { replacements: [id], transaction: t });
      await sequelize.query(`DELETE FROM classes WHERE ID = ?`, { replacements: [id], transaction: t });
      await t.commit();
      return { success: true };
    } catch (err) {
      await t.rollback();
      reply.code(500).send({ error: err.message });
    }
  });

  // GET /api/classes/:id/students  — ученики класса
  fastify.get('/:id/students', async (request, reply) => {
    const { id } = request.params;
    const students = await sequelize.query(
      `SELECT u.ID, p.last_name, p.first_name, p.middle_name
       FROM users u
       JOIN profiles p ON u.ID = p.ID
       JOIN student_class sc ON u.ID = sc.student_ID
       WHERE sc.class_ID = ?
         AND u.role_id = (SELECT ID FROM roles WHERE name = 'STUDENT')
       ORDER BY p.last_name`,
      { replacements: [id], type: Sequelize.QueryTypes.SELECT }
    );
    return students;
  });

  // POST /api/classes/assign-student  — назначить ученика в класс
  fastify.post('/assign-student', async (request, reply) => {
    const { student_ID, class_ID, academic_year } = request.body;

    // Убираем из других классов (один ученик — один класс)
    await sequelize.query(
      `DELETE FROM student_class WHERE student_ID = ?`,
      { replacements: [student_ID] }
    );

    if (class_ID) {
      await sequelize.query(
        `INSERT INTO student_class (student_ID, class_ID, academic_year) VALUES (?, ?, ?)`,
        { replacements: [student_ID, class_ID, academic_year || new Date().getFullYear() + '-' + (new Date().getFullYear() + 1)], type: Sequelize.QueryTypes.INSERT }
      );
    }
    return { success: true };
  });

  // POST /api/classes/set-curator  — назначить учителя куратором класса
  fastify.post('/set-curator', async (request, reply) => {
    const { teacher_ID, class_ID } = request.body;
    await sequelize.query(
      `UPDATE classes SET curator_ID = ? WHERE ID = ?`,
      { replacements: [teacher_ID || null, class_ID] }
    );
    return { success: true };
  });

  // GET /api/classes/parent-children/:parentId  — дети родителя
  fastify.get('/parent-children/:parentId', async (request, reply) => {
    const { parentId } = request.params;
    const children = await sequelize.query(
      `SELECT u.ID, p.last_name, p.first_name, p.middle_name,
              c.level || c.letter AS class_name, c.ID AS class_id
       FROM parents_students ps
       JOIN users u ON ps.student_ID = u.ID
       JOIN profiles p ON u.ID = p.ID
       LEFT JOIN student_class sc ON u.ID = sc.student_ID
       LEFT JOIN classes c ON sc.class_ID = c.ID
       WHERE ps.parent_ID = ?`,
      { replacements: [parentId], type: Sequelize.QueryTypes.SELECT }
    );
    return children;
  });

  // POST /api/classes/link-parent  — привязать/отвязать ребёнка к родителю
  fastify.post('/link-parent', async (request, reply) => {
    const { parent_ID, student_ID, action } = request.body; // action: 'add' | 'remove'
    if (action === 'remove') {
      await sequelize.query(
        `DELETE FROM parents_students WHERE parent_ID = ? AND student_ID = ?`,
        { replacements: [parent_ID, student_ID] }
      );
    } else {
      // Проверяем дубликат
      const [exists] = await sequelize.query(
        `SELECT 1 FROM parents_students WHERE parent_ID = ? AND student_ID = ?`,
        { replacements: [parent_ID, student_ID], type: Sequelize.QueryTypes.SELECT }
      );
      if (!exists) {
        await sequelize.query(
          `INSERT INTO parents_students (parent_ID, student_ID) VALUES (?, ?)`,
          { replacements: [parent_ID, student_ID], type: Sequelize.QueryTypes.INSERT }
        );
      }
    }
    return { success: true };
  });

  // GET /api/classes/students/unassigned  — ученики без класса
  fastify.get('/students/unassigned', async (request, reply) => {
    const students = await sequelize.query(
      `SELECT u.ID, p.last_name, p.first_name, p.middle_name
       FROM users u
       JOIN profiles p ON u.ID = p.ID
       WHERE u.role_id = (SELECT ID FROM roles WHERE name = 'STUDENT')
         AND u.ID NOT IN (SELECT student_ID FROM student_class)
       ORDER BY p.last_name`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    return students;
  });
}

module.exports = classesRoutes;