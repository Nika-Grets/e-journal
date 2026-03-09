const bcrypt = require('bcrypt');
const { Sequelize } = require('sequelize');

async function userRoutes(fastify, options) {
  const sequelize = options.sequelize;

  // Проверка токена для всех роутов
  fastify.addHook('preHandler', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.code(401).send({ error: 'Необходима авторизация' });
    }
  });

fastify.get('/grade-levels', async (request, reply) => {
  const levels = await sequelize.query(
    'SELECT ID, level FROM level ORDER BY level ASC', 
    { type: Sequelize.QueryTypes.SELECT }
  );
  return levels; 
});

fastify.get('/topics', async (request, reply) => {
  const { subject_id, grade_level } = request.query;
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

// Эндпоинт для создания новой темы
fastify.post('/topics', async (request, reply) => {
  // Достаем данные из тела запроса
  const { subject_id, grade_level, title, description, hours_allocated, order_index } = request.body;
  
  try {
    await sequelize.query(
      `INSERT INTO topics (subject_id, grade_level, title, description, hours_allocated, order_index) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      { 
        replacements: [
          subject_id, 
          grade_level, 
          title, 
          description, 
          Number(hours_allocated), // Превращаем в число для NUMERIC колонки
          order_index
        ],
        type: Sequelize.QueryTypes.INSERT
      }
    );

    return { success: true };
  } catch (err) {
    console.error("Ошибка при вставке темы:", err);
    reply.code(500).send({ error: "Не удалось сохранить тему в базу данных" });
  }
});

// Эндпоинт для редактирования темы
fastify.put('/topics/:id', async (request, reply) => {
  const { id } = request.params;
  const { title, description, hours_allocated } = request.body;

  try {
    await sequelize.query(
      `UPDATE topics 
       SET title = ?, description = ?, hours_allocated = ? 
       WHERE ID = ?`,
      { 
        replacements: [title, description, Number(hours_allocated), id],
        type: Sequelize.QueryTypes.UPDATE
      }
    );
    return { success: true };
  } catch (err) {
    console.error("Ошибка при обновлении темы:", err);
    reply.code(500).send({ error: "Не удалось обновить тему" });
  }
});

fastify.delete('/topics/:id', async (request, reply) => {
  const { id } = request.params;
  await sequelize.query('DELETE FROM topics WHERE ID = ?', { replacements: [id] });
  return { success: true };
});
};

module.exports = userRoutes;