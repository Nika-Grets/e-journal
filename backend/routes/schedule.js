const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');

async function scheduleRoutes(fastify, options) {
  const sequelize = options.sequelize;

  // JWT check for all routes
  fastify.addHook('preHandler', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.code(401).send({ error: 'Необходима авторизация' });
    }
  });

  // GET /api/schedule/metadata  — предметы, учителя, классы, конфиг
   fastify.get('/schedule/metadata', async (request, reply) => {
    const subjects = await sequelize.query(
      'SELECT ID, name FROM subjects ORDER BY name',
      { type: Sequelize.QueryTypes.SELECT }
    );
    const teachers = await sequelize.query(
      `SELECT u.ID, p.last_name || ' ' || SUBSTR(p.first_name,1,1) || '.' AS name
       FROM users u
       JOIN profiles p ON u.ID = p.ID
       WHERE u.role_id = (SELECT ID FROM roles WHERE name = 'TEACHER')
       ORDER BY p.last_name`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const classes = await sequelize.query(
      `SELECT c.ID, c.level, c.letter, c.curator_ID,
              p.last_name || ' ' || SUBSTR(p.first_name,1,1) || '.' AS curator_name
       FROM classes c
       LEFT JOIN profiles p ON c.curator_ID = p.ID
       ORDER BY c.level, c.letter`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    const config = await sequelize.query(
      'SELECT * FROM school_config',
      { type: Sequelize.QueryTypes.SELECT }
    );
    const configObj = config.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});
    return { subjects, teachers, classes, config: configObj };
  });

  // GET /api/schedule  — расписание класса на неделю
  fastify.get('/schedule', async (request, reply) => {
    const { class_id, startDate, endDate } = request.query;
    const lessons = await sequelize.query(
      `SELECT l.*,
              s.name      AS subject_name,
              p.last_name || ' ' || SUBSTR(p.first_name,1,1) || '.' AS teacher_name,
              t.title     AS topic_title,
              c.level || c.letter AS class_name,
              ls.start_time,
              h.content   AS homework_content,
              h.deadline  AS homework_deadline,
              h.attachments AS homework_files
       FROM lessons l
       LEFT JOIN subjects   s  ON l.subject_ID  = s.ID
       LEFT JOIN profiles   p  ON l.teacher_ID  = p.ID
       LEFT JOIN topics     t  ON l.topic_ID    = t.ID
       LEFT JOIN classes    c  ON l.class_ID    = c.ID
       LEFT JOIN lesson_schedule ls ON ls.lesson_num = l.lesson_num
       LEFT JOIN homeworks  h  ON h.lesson_ID   = l.ID
       WHERE l.class_ID = ? AND l.date BETWEEN ? AND ?
       ORDER BY l.date, l.lesson_num`,
      { replacements: [class_id || null, startDate, endDate], type: Sequelize.QueryTypes.SELECT }
    );
    return lessons;
  });

  // GET /api/schedule/teacher-view  — личное расписание учителя
  fastify.get('/schedule/teacher-view', async (request, reply) => {
    const { startDate, endDate } = request.query;
    const teacher_id = request.user.id;
    const lessons = await sequelize.query(
      `SELECT l.*,
              s.name       AS subject_name,
              c.level || c.letter AS class_name,
              t.title      AS topic_title,
              ls.start_time,
              h.ID         AS homework_id,
              h.content    AS homework_content,
              h.deadline   AS homework_deadline,
              h.attachments AS homework_files
       FROM lessons l
       LEFT JOIN subjects        s  ON l.subject_ID  = s.ID
       LEFT JOIN classes         c  ON l.class_ID    = c.ID
       LEFT JOIN topics          t  ON l.topic_ID    = t.ID
       LEFT JOIN lesson_schedule ls ON ls.lesson_num = l.lesson_num
       LEFT JOIN homeworks       h  ON h.lesson_ID   = l.ID
       WHERE l.teacher_ID = ? AND l.date BETWEEN ? AND ?
       ORDER BY l.date, l.lesson_num`,
      { replacements: [teacher_id, startDate, endDate], type: Sequelize.QueryTypes.SELECT }
    );
    return lessons;
  });

  // GET /api/schedule/topics  — темы по предмету + уровню класса
  fastify.get('/schedule/topics', async (request, reply) => {
    const { subject_id, grade_level } = request.query;
    if (!subject_id || !grade_level) return [];
    const topics = await sequelize.query(
      `SELECT ID, title FROM topics
       WHERE subject_id = ? AND grade_level = ?
       ORDER BY order_index`,
      { replacements: [subject_id, grade_level], type: Sequelize.QueryTypes.SELECT }
    );
    return topics;
  });

  // POST /api/schedule/update  — создать / обновить урок (с проверкой конфликтов)
  fastify.post('/schedule/update', async (request, reply) => {
    const { ID, class_ID, subject_ID, teacher_ID, date, lesson_num, room, topic_ID } = request.body;

    // ── Проверка конфликта учителя ──────────────────────
    if (teacher_ID) {
      const conflicts = await sequelize.query(
        `SELECT l.ID, c.level || c.letter AS class_name
         FROM lessons l
         JOIN classes c ON l.class_ID = c.ID
         WHERE l.teacher_ID = ?
           AND l.date = ?
           AND l.lesson_num = ?
           AND l.ID != ?`,
        {
          replacements: [teacher_ID, date, lesson_num, ID || -1],
          type: Sequelize.QueryTypes.SELECT
        }
      );
      if (conflicts.length > 0) {
        return reply.code(409).send({
          error: `Конфликт! Учитель уже назначен в класс ${conflicts[0].class_name} на урок №${lesson_num} (${date})`
        });
      }
    }

    // ── Конфликт аудитории ──────────────────────────────
    if (room) {
      const roomConflicts = await sequelize.query(
        `SELECT l.ID, c.level || c.letter AS class_name
         FROM lessons l
         JOIN classes c ON l.class_ID = c.ID
         WHERE l.room = ?
           AND l.date = ?
           AND l.lesson_num = ?
           AND l.ID != ?`,
        {
          replacements: [room, date, lesson_num, ID || -1],
          type: Sequelize.QueryTypes.SELECT
        }
      );
      if (roomConflicts.length > 0) {
        return reply.code(409).send({
          error: `Конфликт! Кабинет ${room} уже занят классом ${roomConflicts[0].class_name} на урок №${lesson_num} (${date})`
        });
      }
    }

    try {
      if (ID) {
        await sequelize.query(
          `UPDATE lessons
           SET subject_ID = ?, teacher_ID = ?, room = ?, topic_ID = ?
           WHERE ID = ?`,
          {
            replacements: [subject_ID || null, teacher_ID || null, room || null, topic_ID || null, ID],
            type: Sequelize.QueryTypes.UPDATE
          }
        );
      } else {
        await sequelize.query(
          `INSERT INTO lessons (class_ID, subject_ID, teacher_ID, date, lesson_num, room, topic_ID)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          {
            replacements: [class_ID, subject_ID || null, teacher_ID || null, date, lesson_num, room || null, topic_ID || null],
            type: Sequelize.QueryTypes.INSERT
          }
        );
      }
      return { success: true };
    } catch (err) {
      console.error('SQL Error:', err.message);
      reply.code(500).send({ error: err.message });
    }
  });

  // POST /api/schedule/fill-weeks  — скопировать текущую неделю вперёд
  fastify.post('/schedule/fill-weeks', async (request, reply) => {
    const { class_ID, startDate, weeksCount } = request.body;

    if (!class_ID || !startDate || !weeksCount) {
      return reply.code(400).send({ error: 'Укажите класс, дату начала и количество недель' });
    }

    // Конец текущей недели = startDate + 5 дней (сб)
    const start = new Date(startDate);
    const end = new Date(startDate);
    end.setDate(end.getDate() + 5);
    const endDateStr = end.toISOString().split('T')[0];

    const sourceLessons = await sequelize.query(
      `SELECT * FROM lessons WHERE class_ID = ? AND date BETWEEN ? AND ?`,
      { replacements: [class_ID, startDate, endDateStr], type: Sequelize.QueryTypes.SELECT }
    );

    if (sourceLessons.length === 0) {
      return reply.code(400).send({ error: 'В текущей неделе нет уроков для копирования' });
    }

    const t = await sequelize.transaction();
    let created = 0;
    try {
      for (let week = 1; week <= Number(weeksCount); week++) {
        for (const lesson of sourceLessons) {
          const srcDate = new Date(lesson.date);
          srcDate.setDate(srcDate.getDate() + week * 7);
          const newDateStr = srcDate.toISOString().split('T')[0];

          // Проверяем, существует ли уже урок в этом слоте
          const [existing] = await sequelize.query(
            `SELECT ID FROM lessons WHERE class_ID = ? AND date = ? AND lesson_num = ?`,
            {
              replacements: [class_ID, newDateStr, lesson.lesson_num],
              type: Sequelize.QueryTypes.SELECT,
              transaction: t
            }
          );

          if (!existing) {
            await sequelize.query(
              `INSERT INTO lessons (class_ID, subject_ID, teacher_ID, date, lesson_num, room, topic_ID)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
              {
                replacements: [class_ID, lesson.subject_ID, lesson.teacher_ID, newDateStr, lesson.lesson_num, lesson.room, lesson.topic_ID],
                transaction: t,
                type: Sequelize.QueryTypes.INSERT
              }
            );
            created++;
          }
        }
      }
      await t.commit();
      return { success: true, created, skipped: sourceLessons.length * weeksCount - created };
    } catch (err) {
      await t.rollback();
      reply.code(500).send({ error: err.message });
    }
  });

  // GET /api/schedule/homework/:lessonId
  fastify.get('/schedule/homework/:lessonId', async (request, reply) => {
    const { lessonId } = request.params;
    const rows = await sequelize.query(
      `SELECT * FROM homeworks WHERE lesson_ID = ? LIMIT 1`,
      { replacements: [lessonId], type: Sequelize.QueryTypes.SELECT }
    );
    return rows[0] || null;
  });

  // POST /api/schedule/homework  — сохранить / обновить ДЗ
  fastify.post('/schedule/homework', async (request, reply) => {
    const { lesson_ID, content, deadline, attachments } = request.body;
    try {
      const [existing] = await sequelize.query(
        `SELECT ID FROM homeworks WHERE lesson_ID = ?`,
        { replacements: [lesson_ID], type: Sequelize.QueryTypes.SELECT }
      );
      if (existing) {
        await sequelize.query(
          `UPDATE homeworks SET content = ?, deadline = ?, attachments = ? WHERE lesson_ID = ?`,
          { replacements: [content, deadline, JSON.stringify(attachments || []), lesson_ID] }
        );
      } else {
        await sequelize.query(
          `INSERT INTO homeworks (lesson_ID, content, deadline, attachments) VALUES (?, ?, ?, ?)`,
          { replacements: [lesson_ID, content, deadline, JSON.stringify(attachments || [])], type: Sequelize.QueryTypes.INSERT }
        );
      }
      return { success: true };
    } catch (err) {
      reply.code(500).send({ error: err.message });
    }
  });

  // POST /api/schedule/upload 
  fastify.post('/schedule/upload', async (request, reply) => {
    const { filename, data, mimetype } = request.body; // data = base64
    if (!filename || !data) return reply.code(400).send({ error: 'filename и data обязательны' });

    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    const ext = path.extname(filename);
    const safeName = Date.now() + '_' + Math.random().toString(36).slice(2) + ext;
    const filePath = path.join(uploadsDir, safeName);

    try {
      const buf = Buffer.from(data.replace(/^data:[^;]+;base64,/, ''), 'base64');
      fs.writeFileSync(filePath, buf);
      return { url: `/uploads/${safeName}`, name: filename };
    } catch (err) {
      reply.code(500).send({ error: 'Не удалось сохранить файл' });
    }
  });
}

module.exports = scheduleRoutes;