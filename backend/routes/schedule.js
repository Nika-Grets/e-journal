// Роуты расписания.
// SQL-запросы вынесены в helpers/scheduleDb.js — здесь только HTTP-логика.
const path = require('path');
const fs   = require('fs');
const makeScheduleDb = require('../helpers/scheduleDb');

async function scheduleRoutes(fastify, options) {
  const db = makeScheduleDb(options.sequelize);

  // Проверка JWT для всех роутов модуля
  fastify.addHook('preHandler', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch {
      reply.code(401).send({ error: 'Необходима авторизация' });
    }
  });

  // GET /api/schedule/metadata — справочники для формы расписания
  fastify.get('/schedule/metadata', async () => db.getMeta());

  // GET /api/schedule — расписание класса на диапазон дат
  fastify.get('/schedule', async (request) => {
    const { class_id, startDate, endDate } = request.query;
    return db.getLessonsByClass(class_id, startDate, endDate);
  });

  // GET /api/schedule/teacher-view — личное расписание учителя
  fastify.get('/schedule/teacher-view', async (request) => {
    const { startDate, endDate } = request.query;
    return db.getLessonsByTeacher(request.user.id, startDate, endDate);
  });

  // GET /api/schedule/topics — темы предмета для уровня класса
  fastify.get('/schedule/topics', async (request) => {
    const { subject_id, grade_level } = request.query;
    if (!subject_id || !grade_level) return [];
    return db.getTopics(subject_id, grade_level);
  });

  // POST /api/schedule/update — создать / обновить урок с проверкой конфликтов
  fastify.post('/schedule/update', async (request, reply) => {
    const { ID, class_ID, subject_ID, teacher_ID, date, lesson_num, room, topic_ID } = request.body;

    // Проверяем конфликт учителя
    if (teacher_ID) {
      const conflicts = await db.findTeacherConflict(teacher_ID, date, lesson_num, ID);
      if (conflicts.length > 0) {
        return reply.code(409).send({
          error: `Конфликт! Учитель уже назначен в класс ${conflicts[0].class_name} на урок №${lesson_num} (${date})`,
        });
      }
    }

    // Проверяем конфликт кабинета
    if (room) {
      const conflicts = await db.findRoomConflict(room, date, lesson_num, ID);
      if (conflicts.length > 0) {
        return reply.code(409).send({
          error: `Конфликт! Кабинет ${room} уже занят классом ${conflicts[0].class_name} на урок №${lesson_num} (${date})`,
        });
      }
    }

    try {
      await db.upsertLesson({ ID, class_ID, subject_ID, teacher_ID, date, lesson_num, room, topic_ID });
      return { success: true };
    } catch (err) {
      return reply.code(500).send({ error: err.message });
    }
  });

  // POST /api/schedule/fill-weeks — скопировать текущую неделю вперёд
  fastify.post('/schedule/fill-weeks', async (request, reply) => {
    const { class_ID, startDate, weeksCount } = request.body;
    if (!class_ID || !startDate || !weeksCount) {
      return reply.code(400).send({ error: 'Укажите класс, дату начала и количество недель' });
    }

    // Конец недели = startDate + 5 дней (суббота)
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 5);
    const endDateStr = endDate.toISOString().split('T')[0];

    const source = await db.getWeekLessons(class_ID, startDate, endDateStr);
    if (source.length === 0) {
      return reply.code(400).send({ error: 'В текущей неделе нет уроков для копирования' });
    }

    const t = await options.sequelize.transaction();
    let created = 0;
    try {
      for (let week = 1; week <= Number(weeksCount); week++) {
        for (const lesson of source) {
          const newDate = new Date(lesson.date);
          newDate.setDate(newDate.getDate() + week * 7);
          const newDateStr = newDate.toISOString().split('T')[0];

          // Пропускаем слот, если он уже занят
          const exists = await db.slotExists(class_ID, newDateStr, lesson.lesson_num, t);
          if (!exists) {
            await db.insertLesson(lesson, newDateStr, t);
            created++;
          }
        }
      }
      await t.commit();
      return { success: true, created, skipped: source.length * weeksCount - created };
    } catch (err) {
      await t.rollback();
      return reply.code(500).send({ error: err.message });
    }
  });

  // GET /api/schedule/homework/:lessonId — получить ДЗ урока
  fastify.get('/schedule/homework/:lessonId', async (request) => {
    return db.getHomework(request.params.lessonId);
  });

  // POST /api/schedule/homework — сохранить / обновить ДЗ
  fastify.post('/schedule/homework', async (request, reply) => {
    const { lesson_ID, content, deadline, attachments } = request.body;
    try {
      await db.upsertHomework(lesson_ID, content, deadline, attachments);
      return { success: true };
    } catch (err) {
      return reply.code(500).send({ error: err.message });
    }
  });

  // POST /api/schedule/upload — загрузить файл ДЗ (base64)
  fastify.post('/schedule/upload', async (request, reply) => {
    const { filename, data } = request.body;
    if (!filename || !data) {
      return reply.code(400).send({ error: 'filename и data обязательны' });
    }

    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    const ext      = path.extname(filename);
    const safeName = `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
    const filePath = path.join(uploadsDir, safeName);

    try {
      const buf = Buffer.from(data.replace(/^data:[^;]+;base64,/, ''), 'base64');
      fs.writeFileSync(filePath, buf);
      return { url: `/uploads/${safeName}`, name: filename };
    } catch {
      return reply.code(500).send({ error: 'Не удалось сохранить файл' });
    }
  });
}

module.exports = scheduleRoutes;
