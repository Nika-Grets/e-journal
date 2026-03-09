const { Sequelize } = require('sequelize');

async function subjectsRoutes(fastify, options) {
  const sequelize = options.sequelize;

  fastify.addHook('preHandler', async (req, reply) => {
    try { await req.jwtVerify(); }
    catch { reply.code(401).send({ error: 'Необходима авторизация' }); }
  });

  // GET /api/subjects — все предметы (фильтр по учителю если нет subjects:view_all)
  fastify.get('/', async (req, reply) => {
    const { id: userId, permissions = [] } = req.user;
    const canViewAll = permissions.includes('subjects:view_all');

    if (canViewAll) {
      const subjects = await sequelize.query(
        `SELECT s.ID, s.name, s.description,
                COUNT(DISTINCT ts.teacher_ID) AS teacher_count
         FROM subjects s
         LEFT JOIN teacher_subjects ts ON s.ID = ts.subject_ID
         GROUP BY s.ID ORDER BY s.name`,
        { type: Sequelize.QueryTypes.SELECT }
      );
      return subjects;
    }

    // Учитель видит только свои предметы
    const subjects = await sequelize.query(
      `SELECT s.ID, s.name, s.description
       FROM subjects s
       JOIN teacher_subjects ts ON s.ID = ts.subject_ID
       WHERE ts.teacher_ID = ?`,
      { replacements: [userId], type: Sequelize.QueryTypes.SELECT }
    );
    return subjects;
  });

  // POST /api/subjects — создать предмет (только subjects:view_all = admin)
  fastify.post('/', {
    preHandler: [fastify.checkPermission('subjects:view_all')]
  }, async (req, reply) => {
    const { name, description } = req.body;
    if (!name) return reply.code(400).send({ error: 'Название обязательно' });
    const [id] = await sequelize.query(
      'INSERT INTO subjects (name, description) VALUES (?, ?)',
      { replacements: [name, description || null], type: Sequelize.QueryTypes.INSERT }
    );
    return { success: true, id };
  });

  // PUT /api/subjects/:id — обновить предмет
  fastify.put('/:id', {
    preHandler: [fastify.checkPermission('subjects:view_all')]
  }, async (req, reply) => {
    const { id } = req.params;
    const { name, description } = req.body;
    await sequelize.query(
      'UPDATE subjects SET name = ?, description = ? WHERE ID = ?',
      { replacements: [name, description || null, id] }
    );
    return { success: true };
  });

  // DELETE /api/subjects/:id
  fastify.delete('/:id', {
    preHandler: [fastify.checkPermission('subjects:view_all')]
  }, async (req, reply) => {
    const { id } = req.params;
    const t = await sequelize.transaction();
    try {
      await sequelize.query('DELETE FROM teacher_subjects WHERE subject_ID = ?', { replacements: [id], transaction: t });
      await sequelize.query('DELETE FROM topics WHERE subject_id = ?', { replacements: [id], transaction: t });
      await sequelize.query('DELETE FROM subjects WHERE ID = ?', { replacements: [id], transaction: t });
      await t.commit();
      return { success: true };
    } catch (err) {
      await t.rollback();
      reply.code(500).send({ error: err.message });
    }
  });

  // GET /api/subjects/:id/teachers — учителя предмета
  fastify.get('/:id/teachers', async (req, reply) => {
    const { id } = req.params;
    return sequelize.query(
      `SELECT u.ID, p.last_name || ' ' || p.first_name AS name
       FROM teacher_subjects ts
       JOIN users u ON ts.teacher_ID = u.ID
       JOIN profiles p ON u.ID = p.ID
       WHERE ts.subject_ID = ?`,
      { replacements: [id], type: Sequelize.QueryTypes.SELECT }
    );
  });

  // POST /api/subjects/assign-teacher — привязать/отвязать учителя от предмета
  fastify.post('/assign-teacher', {
    preHandler: [fastify.checkPermission('users:manage')]
  }, async (req, reply) => {
    const { teacher_ID, subject_ID, action } = req.body; // action: 'add' | 'remove'
    if (action === 'remove') {
      await sequelize.query(
        'DELETE FROM teacher_subjects WHERE teacher_ID = ? AND subject_ID = ?',
        { replacements: [teacher_ID, subject_ID] }
      );
    } else {
      const [exists] = await sequelize.query(
        'SELECT 1 FROM teacher_subjects WHERE teacher_ID = ? AND subject_ID = ?',
        { replacements: [teacher_ID, subject_ID], type: Sequelize.QueryTypes.SELECT }
      );
      if (!exists) {
        await sequelize.query(
          'INSERT INTO teacher_subjects (teacher_ID, subject_ID) VALUES (?, ?)',
          { replacements: [teacher_ID, subject_ID], type: Sequelize.QueryTypes.INSERT }
        );
      }
    }
    return { success: true };
  });

  // GET /api/subjects/teacher/:teacherId — предметы учителя
  fastify.get('/teacher/:teacherId', async (req, reply) => {
    const { teacherId } = req.params;
    return sequelize.query(
      `SELECT s.ID, s.name FROM subjects s
       JOIN teacher_subjects ts ON s.ID = ts.subject_ID
       WHERE ts.teacher_ID = ?`,
      { replacements: [teacherId], type: Sequelize.QueryTypes.SELECT }
    );
  });
}

module.exports = subjectsRoutes;
